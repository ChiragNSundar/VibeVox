import { describe, expect, it } from "vitest";
import { recallHybridStyleExamples } from "../style-hybrid-rag";
import { synthesizeMetaphors } from "../metaphor-synthesizer";
import { planRhymeLadders } from "../rhyme-planner";
import type { LocalCadence } from "../local-pipeline";

describe("Artistic Ghostwriter & Multi-Level Hybrid RAG Engine", () => {
  it("recalls style examples using Multi-Level Hybrid RAG with RRF", async () => {
    const examples = await recallHybridStyleExamples("penthouse curtains street rhythm", {
      count: 3,
      targetSyllables: 9,
      vibe: "trap",
    });

    expect(examples.length).toBeGreaterThan(0);
    expect(examples[0].bars.length).toBeGreaterThan(0);
    expect(examples[0].meta).toContain("rrfScore");
  });

  it("synthesizes vivid sensory metaphors and double-entendres", () => {
    const bp = synthesizeMetaphors("night city hustle", ["reflective"], "hinglish");

    expect(bp.sensoryDomains.tactile.length).toBeGreaterThan(0);
    expect(bp.sensoryDomains.visual.length).toBeGreaterThan(0);
    expect(bp.promptInstructions).toContain("ARTISTIC METAPHOR");
  });

  it("plans 2-syllable and 3-syllable multisyllabic rhyme ladders", () => {
    const cadence: LocalCadence = {
      bars: [
        { index: 1, syllables: 9, endSound: "aoon", section: "verse", text: "mitaoon main" },
        { index: 2, syllables: 9, endSound: "aoon", section: "verse", text: "bataoon main" },
        { index: 3, syllables: 9, endSound: "ain", section: "verse", text: "naseeb main" },
        { index: 4, syllables: 9, endSound: "ain", section: "verse", text: "kareeb main" },
      ],
      detectedVibe: "melodic",
    };

    const plan = planRhymeLadders(cadence, "hinglish");
    expect(plan.bars.length).toBe(4);
    expect(plan.bars[0].suggestedWords.length).toBeGreaterThan(0);
    expect(plan.promptInstructions).toContain("PRE-PLANNED MULTISYLLABIC RHYME LADDERS");
  });
});
