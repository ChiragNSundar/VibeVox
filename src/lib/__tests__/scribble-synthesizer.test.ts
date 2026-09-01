import { describe, it, expect } from "vitest";
import {
  makeSenseOfScribble,
  formatAsBrainLyricSheet,
  formatAsBrainRhymes,
  type ScribbleResult,
} from "../scribble-synthesizer";
import { parseLyricSheet } from "../brain-indexer";

describe("Scribble Synthesizer & Brain Sync", () => {
  it("rejects empty scribble input", async () => {
    await expect(makeSenseOfScribble("   ")).rejects.toThrow("Scribble is empty");
  });

  it("deconstructs raw scribbles into mood, narrative, gems, and cadence-locked sections", async () => {
    const rawScribble = `
late night 3am driving with the windows rolled down
thinking about how fast they change up soon as you touch a little paper
built this from the foundation, nobody gave us a blueprint
never fold never switch up
watching the neon signs reflect on the wet pavement
locked in every single second till the sun come up
`;

    const result = await makeSenseOfScribble(rawScribble, "full-song");
    expect(result.title).toBeTruthy();
    expect(result.analysis.mood).toBeTruthy();
    expect(result.analysis.genre).toBeTruthy();
    expect(result.analysis.vibe).toBeTruthy();
    expect(result.analysis.centralNarrative).toBeTruthy();
    expect(result.analysis.standoutGems.length).toBeGreaterThan(0);
    expect(result.sections.length).toBeGreaterThanOrEqual(1);

    const hook = result.sections.find((s) => s.type === "hook");
    expect(hook).toBeDefined();
    expect(hook?.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("supports hook-anthem mode specifically", async () => {
    const rawScribble = `
can't sleep when the city is loud
we came from the quiet to the center of the crowd
keep your eyes on the prize
`;

    const result = await makeSenseOfScribble(rawScribble, "hook-anthem");
    expect(result.mode).toBe("hook-anthem");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].type).toBe("hook");
    expect(result.sections[0].lines.length).toBeGreaterThanOrEqual(4);
  });

  it("formats synthesized results into a standard brain/lyrics/ sheet", () => {
    const mockResult: ScribbleResult = {
      title: "Neon Highway",
      analysis: {
        mood: "Cold & Reflective",
        genre: "hip-hop",
        vibe: "late night boom-bap",
        centralNarrative: "Driving through rain-slicked city streets reflecting on trust.",
        standoutGems: ["sharpen the pen like a blade in the dark"],
        rhymeClusters: [{ word: "dark", rhymesWith: ["spark", "mark"] }],
        suggestedBpm: 88,
      },
      sections: [
        {
          type: "hook",
          lines: [
            "standing on the corner where the night runs deep",
            "counting all the promises we meant to keep",
          ],
        },
        {
          type: "verse",
          lines: [
            "every notebook holds a winter that I barely got through",
            "pencil smudges on the margin where the truth was drawn through",
            "mama told me keep the faith when the budget got thin",
            "now the stadium seats filled up to the brim",
          ],
        },
      ],
      rawScribble: "some raw thoughts",
      mode: "full-song",
      createdAt: 1700000000000,
    };

    const formatted = formatAsBrainLyricSheet(mockResult);
    expect(formatted).toContain("# Title: Neon Highway");
    expect(formatted).toContain("# Genre: hip-hop");
    expect(formatted).toContain("# Vibe: late night boom-bap");
    expect(formatted).toContain("# Attitude: Cold & Reflective");
    expect(formatted).toContain("[HOOK]");
    expect(formatted).toContain("[VERSE]");

    // Verify round-trip compatibility with the Brain Indexer
    const brainChunks = parseLyricSheet(formatted, "neon-highway.txt", 1700000000000);
    expect(brainChunks.length).toBeGreaterThan(0);
    expect(brainChunks[0].source).toBe("brain");
    expect(brainChunks[0].drakeScore).toBe(9.0);
    expect(brainChunks[0].genre).toBe("hip-hop");
    expect(brainChunks[0].vibe).toBe("late night boom-bap");
  });

  it("formats extracted rhymes and gems into brain/rhymes/ JSON", () => {
    const mockResult: ScribbleResult = {
      title: "Trap Vision",
      analysis: {
        mood: "Defiant",
        genre: "trap",
        vibe: "dark trap",
        centralNarrative: "Financial discipline and keeping the circle small.",
        standoutGems: ["sixty floors up counting up the backend", "circle small"],
        rhymeClusters: [{ word: "hustle", rhymesWith: ["muscle", "struggle"] }],
        suggestedBpm: 140,
      },
      sections: [{ type: "verse", lines: ["sample line"] }],
      rawScribble: "test",
      mode: "verse-16",
      createdAt: 1700000000000,
    };

    const jsonStr = formatAsBrainRhymes(mockResult);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.name).toContain("Trap Vision");
    expect(parsed.rhyme_pairs).toEqual([{ target: "hustle", rhymes: ["muscle", "struggle"] }]);
    expect(parsed.regional_slang).toContain("circle small");
  });
});
