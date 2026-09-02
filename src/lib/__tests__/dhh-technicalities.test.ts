import { describe, it, expect } from "vitest";
import {
  calculateMatra,
  detectFlowMetric,
  detectCaesura,
  detectCodeSwitch,
} from "../cadence-flow";
import {
  highlightLyrics,
  detectRhetoricalFraming,
} from "../rhyme-highlighter";

describe("DHH & Rap Technicality Intelligence Suite", () => {
  describe("Classical Indic Matra (Mātrā) Prosody Engine", () => {
    it("calculates Laghu (1) and Guru (2) weights for Romanized Indic words", () => {
      // 'raasta' -> raa (Guru, 2) + sta (Guru due to conjunct / long a, 2) = 4
      const res = calculateMatra("raasta");
      expect(res.totalMatra).toBeGreaterThanOrEqual(3);
      expect(res.pattern.length).toBeGreaterThan(0);
    });

    it("evaluates short vs long vowels correctly", () => {
      // 'dil' has short 'i' -> Laghu (1)
      const light = calculateMatra("dil");
      // 'pyaar' has long 'aa' -> Guru (2)
      const heavy = calculateMatra("pyaar");
      expect(heavy.totalMatra).toBeGreaterThan(light.totalMatra);
    });
  });

  describe("Polyrhythmic Triplet & Flow Pocket Detector", () => {
    it("flags 3-syllable rolls as Triplet pockets [3:2]", () => {
      // 9-syllable line with rolling triplets
      const flow = detectFlowMetric("pulling up running it keeping it", ["/", "x", "x", "/", "x", "x", "/", "x", "x"]);
      expect(flow.metricType).toBe("triplet");
      expect(flow.badge).toContain("3");
    });

    it("flags short lines as Staccato", () => {
      const flow = detectFlowMetric("never fold", ["/", "x"]);
      expect(flow.metricType).toBe("staccato");
    });

    it("flags standard 8-count lines as Straight 16th Grid", () => {
      const flow = detectFlowMetric("walking down the street at night with money", ["x", "/", "x", "/", "x", "/", "x", "/"]);
      expect(flow.metricType).toBe("straight-16th");
    });
  });

  describe("Micro-Caesura (Breath Pause) Detection", () => {
    it("detects punctuation pauses", () => {
      const res = detectCaesura("pot gungunaate, but you dont see it in my eyes");
      expect(res.hasCaesura).toBe(true);
      expect(res.before).toBe("pot gungunaate,");
    });

    it("detects natural DHH conjunction pauses (but/aur/par)", () => {
      const res = detectCaesura("pot gungunaate but you dont see it in my eyes");
      expect(res.hasCaesura).toBe(true);
      expect(res.before).toContain("but");
    });
  });

  describe("Bilingual Code-Switching Language Ratio", () => {
    it("calculates accurate bilingual balance for mixed DHH lines", () => {
      const res = detectCodeSwitch("pot gungunaate but you dont see it in my eyes");
      expect(res.isCodeSwitched).toBe(true);
      expect(res.hindiPct).toBeGreaterThan(0);
      expect(res.englishPct).toBeGreaterThan(0);
      expect(res.label).toContain("HI");
      expect(res.label).toContain("EN");
    });

    it("flags pure English lines as 100% EN", () => {
      const res = detectCodeSwitch("money in the bank watching all of them fall");
      expect(res.isCodeSwitched).toBe(false);
      expect(res.englishPct).toBe(100);
    });
  });

  describe("Rhetorical Framing (Anaphora & Epistrophe)", () => {
    it("detects parallel framing / Anaphora on lines starting with 'jo'", () => {
      const lines = [
        "jo chahe mujhe woh chahe",
        "jo laye mujhe woh gaaye",
      ];
      const res = detectRhetoricalFraming(lines);
      expect(res.has(0)).toBe(true);
      expect(res.has(1)).toBe(true);
      expect(res.get(0)?.type).toBe("anaphora");
      expect(res.get(0)?.phrase).toBe("jo");
    });

    it("detects Epistrophe on lines ending with identical tokens", () => {
      const lines = [
        "riding through the city into the night",
        "keeping all my demons hidden in the night",
      ];
      const res = detectRhetoricalFraming(lines);
      expect(res.has(0) || res.has(1)).toBe(true);
    });
  });

  describe("Alliteration & Multi-Word Compound Highlighting", () => {
    it("highlights alliteration onset consonants within a bar", () => {
      const lines = ["muskuraate mere hot"];
      const res = highlightLyrics(lines, "standard");
      expect(res[0].html).toContain("allit-char");
      expect(res[0].html).toContain('title="Alliteration (m-)"');
    });

    it("wraps multi-word compounds in mosaic-compound-pill", () => {
      const lines = [
        "because i got quite cries",
        "but you dont see it in my eyes",
      ];
      const res = highlightLyrics(lines, "standard");
      expect(res[0].html).toContain("mosaic-compound-pill");
      expect(res[0].html).toContain("quite cries");
      expect(res[1].html).toContain("mosaic-compound-pill");
      expect(res[1].html).toContain("in my eyes");
    });
  });
});
