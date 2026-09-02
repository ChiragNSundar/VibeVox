import { describe, it, expect } from "vitest";
import { scoreComplexity, detectSemanticDrift } from "../diagnostics";

describe("Real-Time Lyrical Diagnostics Engine", () => {
  it("evaluates empty or single lines gracefully", () => {
    const emptyResult = scoreComplexity([]);
    expect(emptyResult.score).toBe(0);
    expect(emptyResult.grade).toBe("Beginner");
  });

  it("scores multi-line rap lyrics across 7 dimensions", () => {
    const lines = [
      "walking through the silent night searching for the light",
      "heavy is the crown when the pressure hits the chest",
      "different mission spitting with precision and decision",
      "pockets full of vision never sliding in reverse",
    ];

    const res = scoreComplexity(lines);
    expect(res.score).toBeGreaterThan(30);
    expect(["S-Tier", "A-Tier", "B-Tier", "C-Tier", "D-Tier"]).toContain(res.grade);
    expect(res.dimensions.internal_rhyme).toBeGreaterThan(0);
    expect(res.dimensions.multisyllabic).toBeGreaterThan(0);
    expect(res.dimensions.vocabulary).toBeGreaterThan(0);
    expect(res.dimensions.scheme_sophistication).toBeGreaterThan(0);
    expect(res.details.length).toBeGreaterThan(10);
  });

  it("detects semantic drift when verses wander off-topic", () => {
    const focusedVerses = [
      "counting bands in the city skyline sixty floors up",
      "hustle through the pavement stacking paper never stop",
      "quiet in the room full of loud talkers making deals",
      "building up the enterprise reality is real",
      "money on the table corporate contracts getting signed",
      "revenue is climbing every dollar is designed",
    ];

    const stableResult = detectSemanticDrift(focusedVerses, "money hustle corporate business");
    expect(stableResult.status).toBe("stable");
    expect(stableResult.drift_score).toBeLessThan(0.4);

    const driftingVerses = [
      "counting bands in the city skyline sixty floors up",
      "hustle through the pavement stacking paper never stop",
      "quiet in the room full of loud talkers making deals",
      "building up the enterprise reality is real",
      "swimming with dolphins on an island in the pacific",
      "eating coconuts while watching waterfalls in tropical paradise",
      "tropical birds flying over turquoise ocean waves",
      "sand between my toes sleeping in a hammock all day",
    ];

    const driftResult = detectSemanticDrift(driftingVerses, "money hustle corporate business");
    expect(driftResult.status).not.toBe("stable");
    expect(driftResult.drift_score).toBeGreaterThanOrEqual(0.4);
    expect(driftResult.warning.length).toBeGreaterThan(0);
  });
});
