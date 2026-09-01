import { describe, it, expect, beforeEach } from "vitest";
import {
  parseLyricSheet,
  parsePersonaDoc,
  parseRhymeBank,
  parseNotesDoc,
  indexBrainFiles,
  getBrainPromptDirectives,
  setPersonaActive,
  loadBrainState,
} from "../brain-indexer";
import type { BrainFileRecord } from "../brain.server";

describe("Brain Indexer & RAG Ingestion", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parses lyric sheets into 4-8 bar style memory chunks with metadata", () => {
    const rawContent = `# Title: Midnight Hustle
# Genre: trap
# Vibe: dark
# Attitude: cold, hungry

walking through the darkness with the clock on freeze
counting up the paper in the autumn breeze
got the neighborhood watching every move we make
never show the hand, never hit the brake

mama told me keep the faith when times were tight
now the city skyline shining through the night
built it brick by brick, never skipped a stair
stare into the mirror, ain't no fear in there`;

    const chunks = parseLyricSheet(rawContent, "midnight-hustle.txt", 1700000000);
    expect(chunks.length).toBe(2);
    expect(chunks[0].title).toBe("Midnight Hustle (Part 1)");
    expect(chunks[0].genre).toBe("trap");
    expect(chunks[0].vibe).toBe("dark");
    expect(chunks[0].attitude).toEqual(["cold", "hungry"]);
    expect(chunks[0].drakeScore).toBe(9.0);
    expect(chunks[0].source).toBe("brain");
    expect(chunks[0].bars).toHaveLength(4);
    expect(chunks[0].bars[0]).toBe("walking through the darkness with the clock on freeze");

    expect(chunks[1].title).toBe("Midnight Hustle (Part 2)");
    expect(chunks[1].bars).toHaveLength(4);
  });

  it("parses artist personas from frontmatter and body", () => {
    const personaMd = `---
name: "The Nocturnal Poet"
genre: "hip-hop"
vibe: "cinematic"
attitude:
  - "thoughtful"
  - "sharp"
slang:
  - "concrete gospel"
  - "midnight shift"
active: true
---

# Voice Directives
- Deliver bars with deep pauses.
- Prioritize internal multi-syllabic rhymes.`;

    const persona = parsePersonaDoc(personaMd, "nocturnal.md");
    expect(persona.name).toBe("The Nocturnal Poet");
    expect(persona.genre).toBe("hip-hop");
    expect(persona.vibe).toBe("cinematic");
    expect(persona.attitude).toEqual(["thoughtful", "sharp"]);
    expect(persona.slang).toEqual(["concrete gospel", "midnight shift"]);
    expect(persona.active).toBe(true);
    expect(persona.guidelines).toContain("Deliver bars with deep pauses");
  });

  it("parses JSON rhyme banks with rhyme pairs, slang, and pattern blueprints", () => {
    const rhymeJson = JSON.stringify({
      name: "Street Vocabulary",
      rhyme_pairs: [
        { target: "hustle", rhymes: ["muscle", "struggle", "subtle"] },
      ],
      regional_slang: ["on god", "top tier"],
      patterns: ["counting every blessing while the dial is spinning slow"],
    });

    const bank = parseRhymeBank(rhymeJson, "street.json");
    expect(bank.name).toBe("Street Vocabulary");
    expect(bank.rhymePairs["hustle"]).toEqual(["muscle", "struggle", "subtle"]);
    expect(bank.slang).toContain("on god");
    expect(bank.patterns).toHaveLength(1);
  });

  it("parses plain-text rhyme banks with colon and bullet notation", () => {
    const textBank = `
# Slang & Rhymes
focus: hocus, locus, crocus
power: tower, hour, shower
- no cap
- locked in
walking through the city with the bass down low
`;
    const bank = parseRhymeBank(textBank, "custom.txt");
    expect(bank.rhymePairs["focus"]).toEqual(["hocus", "locus", "crocus"]);
    expect(bank.rhymePairs["power"]).toEqual(["tower", "hour", "shower"]);
    expect(bank.slang).toContain("no cap");
    expect(bank.slang).toContain("locked in");
    expect(bank.patterns).toContain("walking through the city with the bass down low");
  });

  it("parses rule notes with extracted bullet points", () => {
    const notesMd = `# Writing Guidelines
- Never rhyme 'fire' with 'desire'.
- Keep adjacent bar syllables within plus or minus 1.
- Ensure every hook bar ends on a stressed vowel.`;

    const note = parseNotesDoc(notesMd, "guidelines.md");
    expect(note.title).toBe("Writing Guidelines");
    expect(note.rules).toHaveLength(3);
    expect(note.rules[0]).toBe("Never rhyme 'fire' with 'desire'.");
  });

  it("indexes a collection of brain files and formats prompt directives", async () => {
    const files: BrainFileRecord[] = [
      {
        category: "lyrics",
        filename: "late-night.txt",
        relativePath: "lyrics/late-night.txt",
        sizeBytes: 150,
        updatedAt: 1700000000,
        content: `penthouse view but the curtains pulled tight\ncounting up the backend twice through the night\nsixty floors up where the air stay cold\nevery secret in the city bought and sold`,
      },
      {
        category: "personas",
        filename: "trap-boss.md",
        relativePath: "personas/trap-boss.md",
        sizeBytes: 200,
        updatedAt: 1700000000,
        content: `---
name: "Trap Architect"
genre: "trap"
vibe: "dark"
attitude:
  - "cold"
  - "commanding"
slang:
  - "backend"
  - "paper trail"
active: true
---
Speak with clipped cadence and heavy authority.`,
      },
      {
        category: "notes",
        filename: "rules.md",
        relativePath: "notes/rules.md",
        sizeBytes: 100,
        updatedAt: 1700000000,
        content: `# Strict Rules\n- No filler words.\n- Always hit internal rhymes.`,
      },
      {
        category: "rhymes",
        filename: "slang.json",
        relativePath: "rhymes/slang.json",
        sizeBytes: 80,
        updatedAt: 1700000000,
        content: JSON.stringify({
          name: "Trap Slang",
          regional_slang: ["racks", "locked in"],
        }),
      },
    ];

    const state = await indexBrainFiles(files, { embed: false });
    expect(state.stats.totalFiles).toBe(4);
    expect(state.lyrics).toHaveLength(1);
    expect(state.lyrics[0].source).toBe("brain");
    expect(state.personas).toHaveLength(1);
    expect(state.notes).toHaveLength(1);
    expect(state.rhymes).toHaveLength(1);

    const directives = getBrainPromptDirectives({ genre: "trap" });
    expect(directives.personaBlock).toContain("[ARTIST PERSONA & VOICE: Trap Architect]");
    expect(directives.personaBlock).toContain("Attitude: cold, commanding");
    expect(directives.personaBlock).toContain("Signature Slang / Phrases: backend, paper trail");
    expect(directives.guidelinesBlock).toContain("[LOCAL BRAIN GUIDELINES & CONSTRAINTS]");
    expect(directives.guidelinesBlock).toContain("- No filler words.");
    expect(directives.slangTokens).toContain("backend");
    expect(directives.slangTokens).toContain("racks");
  });

  it("persists persona activation state when toggled", async () => {
    const files: BrainFileRecord[] = [
      {
        category: "personas",
        filename: "drill-voice.md",
        relativePath: "personas/drill-voice.md",
        sizeBytes: 120,
        updatedAt: 1700000000,
        content: `---
name: "UK Drill Persona"
active: true
---
Aggressive slides and sliding 808 pockets.`,
      },
    ];

    await indexBrainFiles(files, { embed: false });
    const personaId = loadBrainState().personas[0].id;

    setPersonaActive(personaId, false);
    expect(loadBrainState().personas[0].active).toBe(false);

    // Prompt directives should exclude deactivated personas
    const directives = getBrainPromptDirectives();
    expect(directives.personaBlock).toBe("");
  });
});
