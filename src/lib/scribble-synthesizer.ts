// Scribble Sense-Making Engine & Local Brain Synchronizer.
// Transforms stream-of-consciousness thoughts, mumbles, and fragmented lyrics into
// structured, cadence-locked songs and auto-syncs them into the local brain/ backend.

import { countSyllables, endRhymeKey, rhymeStrength } from "./lyrics-analysis";
import { loadLlmConfig, chatTarget } from "./llm-config";
import { resolveTarget, applyBodyCompat } from "./providers";
import { saveBrainFile } from "./brain.functions";
import { reindexBrain } from "./brain-indexer";
import { loadUnifiedStyleMemory } from "./style-memory";
import { getBrainPromptDirectives } from "./brain-indexer";

export type ScribbleMode = "full-song" | "verse-16" | "hook-anthem" | "rhyme-slang";

export type ScribbleAnalysis = {
  mood: string;
  genre: string;
  vibe: string;
  centralNarrative: string;
  standoutGems: string[];
  rhymeClusters: { word: string; rhymesWith: string[] }[];
  suggestedBpm: number;
};

export type SynthesizedSection = {
  type: "hook" | "verse" | "bridge" | "intro" | "outro";
  lines: string[];
};

export type ScribbleResult = {
  title: string;
  analysis: ScribbleAnalysis;
  sections: SynthesizedSection[];
  rawScribble: string;
  mode: ScribbleMode;
  createdAt: number;
};

// ---------------------------------------------------------------------------
// Offline Heuristic Analysis (Zero-LLM fallback)
// ---------------------------------------------------------------------------

function analyzeOfflineScribbles(raw: string): ScribbleAnalysis {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Detect standout punchlines (lines with strong metaphor/cadence or 6-12 words)
  const standoutGems: string[] = [];
  const rhymeClusters: { word: string; rhymesWith: string[] }[] = [];
  const endSounds: Record<string, string[]> = {};

  for (const line of lines) {
    const words = line.split(/\s+/);
    if (words.length >= 5 && words.length <= 14) {
      if (standoutGems.length < 4) standoutGems.push(line);
    }
    const rime = endRhymeKey(line);
    if (rime) {
      if (!endSounds[rime]) endSounds[rime] = [];
      const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
      if (lastWord && !endSounds[rime].includes(lastWord)) {
        endSounds[rime].push(lastWord);
      }
    }
  }

  for (const [rime, words] of Object.entries(endSounds)) {
    if (words.length > 1) {
      rhymeClusters.push({ word: words[0], rhymesWith: words.slice(1) });
    }
  }

  // Detect mood & genre from lexical cues
  const lower = raw.toLowerCase();
  let mood = "Reflective & Introspective";
  let genre = "hip-hop";
  let vibe = "cinematic boom-bap";
  let suggestedBpm = 90;

  if (lower.includes("racks") || lower.includes("backend") || lower.includes("trap") || lower.includes("slide")) {
    mood = "Cold, Confident & Defiant";
    genre = "trap";
    vibe = "dark trap";
    suggestedBpm = 140;
  } else if (lower.includes("rain") || lower.includes("night") || lower.includes("pain") || lower.includes("cold")) {
    mood = "Atmospheric & Moody";
    genre = "hip-hop";
    vibe = "late-night boom-bap";
    suggestedBpm = 86;
  } else if (lower.includes("love") || lower.includes("heart") || lower.includes("miss") || lower.includes("feel")) {
    mood = "Vulnerable & Melodic";
    genre = "r&b";
    vibe = "melodic r&b";
    suggestedBpm = 95;
  }

  const centralNarrative = lines.length > 0
    ? `Exploring ${lines[0].slice(0, 60)} with themes of perseverance, authentic expression, and street realism.`
    : "Stream-of-consciousness exploration of raw thoughts and internal dialogue.";

  return {
    mood,
    genre,
    vibe,
    centralNarrative,
    standoutGems: standoutGems.length ? standoutGems : lines.slice(0, 3),
    rhymeClusters: rhymeClusters.slice(0, 5),
    suggestedBpm,
  };
}

function synthesizeOfflineLyrics(
  lines: string[],
  analysis: ScribbleAnalysis,
  mode: ScribbleMode,
): SynthesizedSection[] {
  const cleanLines = lines.map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

  // Build cadence-locked bars around clean lines
  if (mode === "hook-anthem") {
    const hookLines = cleanLines.slice(0, 4);
    while (hookLines.length < 4) {
      hookLines.push("locked inside the rhythm till the morning breaks");
    }
    return [{ type: "hook", lines: hookLines }];
  }

  if (mode === "verse-16") {
    const verseLines = cleanLines.slice(0, 16);
    while (verseLines.length < 8) {
      verseLines.push("walking through the static with the tape deck loud");
    }
    return [{ type: "verse", lines: verseLines }];
  }

  // Full song mode: Hook + Verse 1 + Verse 2
  const hook = cleanLines.slice(0, 4);
  if (hook.length < 4) {
    hook.push(
      "standing on the corner where the night runs deep",
      "counting all the promises we meant to keep",
    );
  }

  const verse1 = cleanLines.slice(4, 12);
  if (verse1.length < 4) {
    verse1.push(
      "every notebook holds a chapter of the climb",
      "never took a shortcut through the hands of time",
      "heavy is the crown when the lights stay dim",
      "keep the vision pure from the base to the brim",
    );
  }

  return [
    { type: "hook", lines: hook },
    { type: "verse", lines: verse1 },
  ];
}

// ---------------------------------------------------------------------------
// LLM Prompting & Sense-Making
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an elite music producer, lyric architect, and creative director for top-tier vocalists and lyricists.
The artist will give you raw, messy, unstructured scribbles — fragmented thoughts, half-finished bars, emotional brain dumps, and random punchlines.

YOUR MISSION:
1. Make complete sense of the chaos. Deconstruct the hidden emotional tone, central narrative anchor, metaphors, and natural cadence.
2. Isolate the artist's standout punchlines and gems — never discard their authentic voice, slang, or rawest lines.
3. Synthesize the scribbles into high-artistry, cadence-locked lyrics with tight syllable counts (±1 syl variance) and multi-syllabic internal rhymes.
4. Eliminate clichés while preserving their exact street dialect, attitude, and personal truth.

Return ONLY a single valid JSON object matching this schema:
{
  "title": "Short evocative title (max 4 words)",
  "analysis": {
    "mood": "e.g. Defiant & Hungry / Melancholic / Paranoid Boss",
    "genre": "e.g. hip-hop / trap / r&b / melodic",
    "vibe": "e.g. cinematic boom-bap / late night trap",
    "centralNarrative": "1-2 sentence breakdown of the core story/message",
    "standoutGems": ["exact best 2-4 punchlines from the scribble"],
    "rhymeClusters": [{"word": "target", "rhymesWith": ["rhyme1", "rhyme2"]}],
    "suggestedBpm": 90
  },
  "sections": [
    {
      "type": "hook" | "verse" | "bridge",
      "lines": ["line 1", "line 2", "line 3", "line 4"]
    }
  ]
}`;

export async function makeSenseOfScribble(
  rawScribble: string,
  mode: ScribbleMode = "full-song",
): Promise<ScribbleResult> {
  const trimmed = rawScribble.trim();
  if (!trimmed) {
    throw new Error("Scribble is empty. Write some thoughts or fragments first.");
  }

  // Load Brain Directives so active persona & rules inform synthesis
  const brain = getBrainPromptDirectives();
  const brainContext = [
    brain.personaBlock ? `ACTIVE ARTIST PERSONA:\n${brain.personaBlock}` : null,
    brain.guidelinesBlock ? `CREATIVE GUIDELINES:\n${brain.guidelinesBlock}` : null,
    brain.slangTokens.length ? `PREFERRED ARTIST SLANG:\n${brain.slangTokens.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const modeInstruction =
    mode === "hook-anthem"
      ? "Focus heavily on creating a hypnotic, anthemic 4 to 8-bar Hook from the strongest emotional idea."
      : mode === "verse-16"
      ? "Synthesize a continuous, cadence-locked 16-bar verse with dense internal rhymes."
      : mode === "rhyme-slang"
      ? "Highlight the slang vocabulary and build tightly coupled rhyme couplets."
      : "Synthesize a complete structure with a Hook and Verse(s).";

  const userPrompt = `RAW ARTIST SCRIBBLE:
"""
${trimmed}
"""

SYNTHESIS MODE: ${modeInstruction}

${brainContext}

Make sense of this scribble and return the structured JSON object.`;

  // Attempt LLM generation
  try {
    const config = loadLlmConfig();
    const target = resolveTarget(chatTarget(config));

    if (target.baseUrl && target.model) {
      const body: Record<string, unknown> = {
        model: target.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 4096,
      };

      const compatBody = applyBodyCompat(body, target);
      const res = await fetch(`${target.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...target.headers,
        },
        body: JSON.stringify(compatBody),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseModelJsonResponse(content);
          if (parsed) {
            return {
              title: parsed.title || "Midnight Scribbles",
              analysis: parsed.analysis,
              sections: parsed.sections,
              rawScribble: trimmed,
              mode,
              createdAt: Date.now(),
            };
          }
        }
      }
    }
  } catch (err) {
    // Fall through to offline heuristic synthesis
  }

  // Offline fallback
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const analysis = analyzeOfflineScribbles(trimmed);
  const sections = synthesizeOfflineLyrics(lines, analysis, mode);
  const title = lines[0] ? lines[0].slice(0, 24).replace(/[^a-zA-Z0-9 ]/g, "").trim() : "Uncut Scribble";

  return {
    title: title || "Uncut Scribbles",
    analysis,
    sections,
    rawScribble: trimmed,
    mode,
    createdAt: Date.now(),
  };
}

function parseModelJsonResponse(raw: string): any {
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Brain Backend Sync Formatting & Execution
// ---------------------------------------------------------------------------

/** Formats synthesized sections into a valid brain/lyrics/ file. */
export function formatAsBrainLyricSheet(result: ScribbleResult): string {
  const header = [
    `# Title: ${result.title}`,
    `# Genre: ${result.analysis.genre}`,
    `# Vibe: ${result.analysis.vibe}`,
    `# Attitude: ${result.analysis.mood}`,
    `# TargetSyllables: 10`,
    `# Mode: ${result.mode}`,
    `# Source: scribble-pad`,
    `# CreatedAt: ${new Date(result.createdAt).toISOString()}`,
    "",
  ].join("\n");

  const body = result.sections
    .map((s) => `[${s.type.toUpperCase()}]\n` + s.lines.join("\n"))
    .join("\n\n");

  return header + body;
}

/** Formats extracted rhymes and slang into a valid brain/rhymes/ JSON file. */
export function formatAsBrainRhymes(result: ScribbleResult): string {
  const rhymePairs = result.analysis.rhymeClusters.map((c) => ({
    target: c.word,
    rhymes: c.rhymesWith,
  }));

  const payload = {
    name: `${result.title} Vocabulary Bank`,
    genre: result.analysis.genre,
    vibe: result.analysis.vibe,
    rhyme_pairs: rhymePairs,
    regional_slang: result.analysis.standoutGems,
    patterns: result.sections.flatMap((s) => s.lines).slice(0, 4),
  };

  return JSON.stringify(payload, null, 2);
}

/** Directly synchronizes synthesized results into the local brain/ backend. */
export async function syncScribbleToBrain(
  result: ScribbleResult,
  options: { syncLyrics?: boolean; syncRhymes?: boolean } = { syncLyrics: true, syncRhymes: true },
): Promise<{ lyricsPath?: string; rhymesPath?: string }> {
  const slug = result.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scribble";
  const timestamp = Date.now().toString().slice(-4);
  const filename = `${slug}-${timestamp}`;

  const outcome: { lyricsPath?: string; rhymesPath?: string } = {};

  if (options.syncLyrics !== false) {
    const lyricContent = formatAsBrainLyricSheet(result);
    const res = await saveBrainFile({
      data: {
        category: "lyrics",
        filename: `${filename}.txt`,
        content: lyricContent,
      },
    });
    outcome.lyricsPath = res.relativePath;
  }

  if (options.syncRhymes && result.analysis.rhymeClusters.length > 0) {
    const rhymeContent = formatAsBrainRhymes(result);
    const res = await saveBrainFile({
      data: {
        category: "rhymes",
        filename: `${filename}-rhymes.json`,
        content: rhymeContent,
      },
    });
    outcome.rhymesPath = res.relativePath;
  }

  // Trigger client-side reindex so the local brain state, style memory & vector cache update immediately!
  await reindexBrain({ embed: true });

  return outcome;
}
