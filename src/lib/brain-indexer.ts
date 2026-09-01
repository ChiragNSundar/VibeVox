// Client-side parser, indexer, and RAG coordinator for the localized Brain.
// Runs 100% offline-first; persists parsed state to localStorage/IndexedDB.

import { countSyllables, endRhymeKey } from "./lyrics-analysis";
import { embedMany, resolveEmbedContext } from "./embeddings";
import { scanBrainDirectory } from "./brain.functions";
import type { StyleMemoryEntry } from "./style-memory";
import type { BrainFileRecord } from "./brain.server";

export type BrainPersona = {
  id: string;
  name: string;
  genre?: string;
  vibe?: string;
  attitude?: string[];
  slang?: string[];
  active: boolean;
  guidelines: string;
  sourceFile: string;
};

export type BrainRhymeBank = {
  name: string;
  rhymePairs: Record<string, string[]>;
  slang: string[];
  patterns: string[];
  sourceFile: string;
};

export type BrainNote = {
  id: string;
  title: string;
  rules: string[];
  rawContent: string;
  sourceFile: string;
};

export type BrainStats = {
  totalFiles: number;
  totalChunks: number;
  embeddedChunks: number;
  lastIndexed: number;
};

export type BrainState = {
  lyrics: StyleMemoryEntry[];
  personas: BrainPersona[];
  rhymes: BrainRhymeBank[];
  notes: BrainNote[];
  stats: BrainStats;
  files: { category: string; filename: string; sizeBytes: number; updatedAt: number }[];
};

const BRAIN_STATE_KEY = "voxscript:brain-state";
const BRAIN_ACTIVE_PERSONAS_KEY = "voxscript:brain-active-personas";

// --- Parsers ---

/** Parses frontmatter if present and splits body. */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) {
    return { data: {}, content: raw };
  }
  const endIdx = trimmed.indexOf("---", 3);
  if (endIdx === -1) {
    return { data: {}, content: raw };
  }

  const fmText = trimmed.slice(3, endIdx).trim();
  const content = trimmed.slice(endIdx + 3).trim();
  const data: Record<string, unknown> = {};

  let currentKey = "";
  let inList = false;
  const listItems: string[] = [];

  for (const line of fmText.split("\n")) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    if (trimmedLine.startsWith("- ") && inList && currentKey) {
      const val = trimmedLine.slice(2).trim().replace(/^["']|["']$/g, "");
      listItems.push(val);
      continue;
    }

    if (inList && currentKey) {
      data[currentKey] = [...listItems];
      inList = false;
      listItems.length = 0;
    }

    const colonIdx = trimmedLine.indexOf(":");
    if (colonIdx !== -1) {
      currentKey = trimmedLine.slice(0, colonIdx).trim();
      const rawVal = trimmedLine.slice(colonIdx + 1).trim();

      if (!rawVal) {
        inList = true;
        listItems.length = 0;
      } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
        data[currentKey] = rawVal
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (rawVal.toLowerCase() === "true") {
        data[currentKey] = true;
      } else if (rawVal.toLowerCase() === "false") {
        data[currentKey] = false;
      } else {
        data[currentKey] = rawVal.replace(/^["']|["']$/g, "");
      }
    }
  }

  if (inList && currentKey) {
    data[currentKey] = [...listItems];
  }

  return { data, content };
}

/** Parses a lyric sheet into 4-to-8 bar chunks with metadata. */
export function parseLyricSheet(content: string, filename: string, updatedAt: number): StyleMemoryEntry[] {
  const lines = content.split("\n");
  const meta: { title?: string; genre?: string; vibe?: string; attitude?: string[] } = {};
  const rawBars: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (rawBars.length && rawBars[rawBars.length - 1] !== "") {
        rawBars.push(""); // stanza break separator
      }
      continue;
    }

    if (trimmed.startsWith("#")) {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("# title:")) meta.title = trimmed.slice(8).trim();
      else if (lower.startsWith("# genre:")) meta.genre = trimmed.slice(8).trim();
      else if (lower.startsWith("# vibe:")) meta.vibe = trimmed.slice(7).trim();
      else if (lower.startsWith("# attitude:")) {
        meta.attitude = trimmed
          .slice(11)
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      continue;
    }

    rawBars.push(trimmed);
  }

  // Chunk bars by stanza or groups of 4-8
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (const bar of rawBars) {
    if (bar === "") {
      if (currentChunk.length >= 4) {
        chunks.push([...currentChunk]);
        currentChunk = [];
      }
      continue;
    }
    currentChunk.push(bar);
    if (currentChunk.length >= 8) {
      chunks.push([...currentChunk]);
      currentChunk = [];
    }
  }
  if (currentChunk.length >= 2) {
    chunks.push(currentChunk);
  }

  const baseTitle = meta.title || filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  return chunks.map((bars, idx) => {
    return {
      id: `brain-lyric-${filename.replace(/[^a-zA-Z0-9]/g, "-")}-${idx + 1}`,
      title: chunks.length > 1 ? `${baseTitle} (Part ${idx + 1})` : baseTitle,
      drakeScore: 9.0, // High baseline for user-curated brain references
      vibe: meta.vibe,
      genre: meta.genre,
      attitude: meta.attitude,
      bars,
      createdAt: updatedAt,
      source: "brain" as const,
      sourceUrl: `brain/lyrics/${filename}`,
    };
  });
}

/** Parses an artist persona markdown document. */
export function parsePersonaDoc(content: string, filename: string): BrainPersona {
  const { data, content: body } = parseFrontmatter(content);
  const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  return {
    id: `persona-${filename.replace(/[^a-zA-Z0-9]/g, "-")}`,
    name: (data.name as string) || baseName,
    genre: data.genre as string | undefined,
    vibe: data.vibe as string | undefined,
    attitude: Array.isArray(data.attitude) ? (data.attitude as string[]) : undefined,
    slang: Array.isArray(data.slang) ? (data.slang as string[]) : undefined,
    active: typeof data.active === "boolean" ? data.active : true,
    guidelines: body || content,
    sourceFile: filename,
  };
}

/** Parses a rhyme bank JSON or formatted text file. */
export function parseRhymeBank(content: string, filename: string): BrainRhymeBank {
  const trimmed = content.trim();
  const bank: BrainRhymeBank = {
    name: filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
    rhymePairs: {},
    slang: [],
    patterns: [],
    sourceFile: filename,
  };

  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as {
        name?: string;
        rhyme_pairs?: { target: string; rhymes: string[] }[];
        regional_slang?: string[];
        patterns?: string[];
      };
      if (json.name) bank.name = json.name;
      if (Array.isArray(json.rhyme_pairs)) {
        for (const pair of json.rhyme_pairs) {
          if (pair.target && Array.isArray(pair.rhymes)) {
            bank.rhymePairs[pair.target.toLowerCase()] = pair.rhymes.map((r) => r.toLowerCase());
          }
        }
      }
      if (Array.isArray(json.regional_slang)) {
        bank.slang = json.regional_slang.map((s) => s.trim()).filter(Boolean);
      }
      if (Array.isArray(json.patterns)) {
        bank.patterns = json.patterns.map((p) => p.trim()).filter(Boolean);
      }
      return bank;
    } catch {
      // Fall through to text parsing
    }
  }

  // Line-delimited parsing (e.g., "word: rhyme1, rhyme2")
  for (const line of content.split("\n")) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    if (l.includes(":")) {
      const [word, rest] = l.split(":", 2);
      const target = word.trim().toLowerCase();
      const rhymes = rest.split(/[,;]/).map((r) => r.trim().toLowerCase()).filter(Boolean);
      if (target && rhymes.length) bank.rhymePairs[target] = rhymes;
    } else if (l.startsWith("- ") || l.startsWith("* ")) {
      bank.slang.push(l.slice(2).trim());
    } else {
      bank.patterns.push(l);
    }
  }

  return bank;
}

/** Parses notes or guidelines markdown document. */
export function parseNotesDoc(content: string, filename: string): BrainNote {
  const lines = content.split("\n");
  const rules: string[] = [];
  let title = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && title === filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")) {
      title = trimmed.slice(2).trim();
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const rule = trimmed.slice(2).trim();
      if (rule.length > 5) rules.push(rule);
    }
  }

  return {
    id: `note-${filename.replace(/[^a-zA-Z0-9]/g, "-")}`,
    title,
    rules,
    rawContent: content,
    sourceFile: filename,
  };
}

// --- Coordinator & Storage ---

export function loadBrainState(): BrainState {
  if (typeof localStorage === "undefined") {
    return { lyrics: [], personas: [], rhymes: [], notes: [], stats: { totalFiles: 0, totalChunks: 0, embeddedChunks: 0, lastIndexed: 0 }, files: [] };
  }
  try {
    const raw = localStorage.getItem(BRAIN_STATE_KEY);
    if (!raw) return { lyrics: [], personas: [], rhymes: [], notes: [], stats: { totalFiles: 0, totalChunks: 0, embeddedChunks: 0, lastIndexed: 0 }, files: [] };
    return JSON.parse(raw) as BrainState;
  } catch {
    return { lyrics: [], personas: [], rhymes: [], notes: [], stats: { totalFiles: 0, totalChunks: 0, embeddedChunks: 0, lastIndexed: 0 }, files: [] };
  }
}

export function saveBrainState(state: BrainState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(BRAIN_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors if any
  }
}

/** Indexes an array of raw file records into structured Brain state. */
export async function indexBrainFiles(files: BrainFileRecord[], options: { embed?: boolean } = {}): Promise<BrainState> {
  const lyrics: StyleMemoryEntry[] = [];
  const personas: BrainPersona[] = [];
  const rhymes: BrainRhymeBank[] = [];
  const notes: BrainNote[] = [];

  for (const file of files) {
    switch (file.category) {
      case "lyrics":
        lyrics.push(...parseLyricSheet(file.content, file.filename, file.updatedAt));
        break;
      case "personas":
        personas.push(parsePersonaDoc(file.content, file.filename));
        break;
      case "rhymes":
        rhymes.push(parseRhymeBank(file.content, file.filename));
        break;
      case "notes":
        notes.push(parseNotesDoc(file.content, file.filename));
        break;
    }
  }

  // Restore active status overrides from localStorage if any
  if (typeof localStorage !== "undefined") {
    try {
      const activeMapRaw = localStorage.getItem(BRAIN_ACTIVE_PERSONAS_KEY);
      if (activeMapRaw) {
        const activeMap = JSON.parse(activeMapRaw) as Record<string, boolean>;
        personas.forEach((p) => {
          if (p.id in activeMap) p.active = activeMap[p.id];
        });
      }
    } catch {
      /* ignore */
    }
  }

  let embeddedCount = 0;

  // Optionally embed lyric chunks and notes into local vector cache
  if (options.embed !== false && typeof window !== "undefined") {
    try {
      const embedContext = resolveEmbedContext();
      if (embedContext.supported) {
        const textsToEmbed = lyrics.map((l) => `${l.title}\n${l.bars.join(" / ")}`);
        if (textsToEmbed.length) {
          await embedMany(textsToEmbed, embedContext);
          embeddedCount = textsToEmbed.length;
        }
      }
    } catch {
      // Best-effort embedding; never fail indexing if embedding endpoint is unavailable
    }
  }

  const state: BrainState = {
    lyrics,
    personas,
    rhymes,
    notes,
    stats: {
      totalFiles: files.length,
      totalChunks: lyrics.length + notes.length,
      embeddedChunks: embeddedCount,
      lastIndexed: Date.now(),
    },
    files: files.map((f) => ({
      category: f.category,
      filename: f.filename,
      sizeBytes: f.sizeBytes,
      updatedAt: f.updatedAt,
    })),
  };

  saveBrainState(state);
  return state;
}

/** Scans the server brain/ directory and indexes it into client state. */
export async function reindexBrain(options: { embed?: boolean } = {}): Promise<BrainState> {
  const { files } = await scanBrainDirectory();
  return await indexBrainFiles(files, options);
}

/** Toggles or sets persona active state. */
export function setPersonaActive(personaId: string, active: boolean): void {
  const state = loadBrainState();
  const persona = state.personas.find((p) => p.id === personaId);
  if (persona) {
    persona.active = active;
    saveBrainState(state);
  }
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(BRAIN_ACTIVE_PERSONAS_KEY);
      const activeMap: Record<string, boolean> = raw ? JSON.parse(raw) : {};
      activeMap[personaId] = active;
      localStorage.setItem(BRAIN_ACTIVE_PERSONAS_KEY, JSON.stringify(activeMap));
    } catch {
      /* ignore */
    }
  }
}

/** Extracts prompt directives from active personas and notes for prompt assembly. */
export function getBrainPromptDirectives(brief?: { genre?: string; vibe?: string }): {
  personaBlock: string;
  guidelinesBlock: string;
  slangTokens: string[];
} {
  const state = loadBrainState();
  const activePersonas = state.personas.filter((p) => p.active);

  let personaBlock = "";
  const allSlang: string[] = [];

  if (activePersonas.length > 0) {
    // Pick the most genre/vibe matching persona, or the first active one
    let target = activePersonas[0];
    if (brief?.genre || brief?.vibe) {
      const match = activePersonas.find(
        (p) => (brief.genre && p.genre?.toLowerCase() === brief.genre.toLowerCase()) ||
               (brief.vibe && p.vibe?.toLowerCase() === brief.vibe.toLowerCase()),
      );
      if (match) target = match;
    }

    if (target.slang) allSlang.push(...target.slang);

    const parts = [
      `[ARTIST PERSONA & VOICE: ${target.name}]`,
      target.attitude?.length ? `Attitude: ${target.attitude.join(", ")}` : null,
      target.slang?.length ? `Signature Slang / Phrases: ${target.slang.join(", ")}` : null,
      target.guidelines ? `Voice Guidelines:\n${target.guidelines}` : null,
    ].filter(Boolean);

    personaBlock = parts.join("\n") + "\n\n";
  }

  // Aggregate slang from rhyme banks
  for (const rb of state.rhymes) {
    if (rb.slang) allSlang.push(...rb.slang);
  }

  // Aggregate rules from notes
  let guidelinesBlock = "";
  const allRules: string[] = [];
  for (const note of state.notes) {
    allRules.push(...note.rules);
  }

  if (allRules.length > 0) {
    guidelinesBlock = `[LOCAL BRAIN GUIDELINES & CONSTRAINTS]\n${allRules.map((r) => `- ${r}`).join("\n")}\n\n`;
  }

  return {
    personaBlock,
    guidelinesBlock,
    slangTokens: Array.from(new Set(allSlang)),
  };
}
