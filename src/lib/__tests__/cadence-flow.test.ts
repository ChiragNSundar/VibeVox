import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  getEnglishWordStress,
  getIndicWordStress,
  getWordStressPattern,
  getLineStressAnalysis,
  calculateRhythmicScore,
  searchDoppelreim,
} from "../cadence-flow";

describe("Cadence & Flow Studio Engine", () => {
  it("detects language from script and Romanized street keywords", () => {
    expect(detectLanguage("running through the midnight neon")).toBe("en");
    expect(detectLanguage("nanna huduga bengaluru")).toBe("kn");
    expect(detectLanguage("apna time aayega bhai")).toBe("hi");
  });

  it("extracts English stress patterns (stressed '/' vs unstressed 'x')", () => {
    // hello -> 2 syllables (x/ or /x)
    const helloStress = getEnglishWordStress("hello");
    expect(helloStress.length).toBe(2);
    expect(helloStress).toContain("/");

    // single syllable words are stressed
    expect(getEnglishWordStress("night")).toBe("/");
    expect(getEnglishWordStress("flame")).toBe("/");
  });

  it("extracts Indic stress patterns based on Guru (long) and Lagu (short) vowels", () => {
    // bangaara: ba (short x), ngaa (long /), ra (short x) -> x/x
    const knStress = getIndicWordStress("bangaara", "kn");
    expect(knStress).toBe("x/x");

    // sapna: sa (short x), pna (conjunct -> /) or sa-pna
    const hiStress = getIndicWordStress("sapna", "hi");
    expect(hiStress.length).toBeGreaterThanOrEqual(2);
  });

  it("analyzes line stress and ignores parenthetical adlibs", () => {
    const line = "riding through the city (yeah skrrt) windows down";
    const analysis = getLineStressAnalysis(line);

    expect(analysis.syllableCount).toBeGreaterThan(0);
    expect(analysis.chars.length).toBe(analysis.syllableCount);
    expect(analysis.rawPattern).not.toContain("skrrt");
    expect(analysis.rawPattern).not.toContain("yeah");
  });

  it("calculates rhythmic score with syllable and stress alignment", () => {
    // Exact match
    const exact = calculateRhythmicScore(8, "x/x/x/x/", 8, "x/x/x/x/");
    expect(exact).toBe(1.0);

    // Minor syllable difference (8 vs 7)
    const close = calculateRhythmicScore(7, "x/x/x/x", 8, "x/x/x/x/");
    expect(close).toBeGreaterThan(0.7);
    expect(close).toBeLessThan(1.0);

    // Heavy divergence (8 vs 14)
    const distant = calculateRhythmicScore(14, "x/x/x/x/x/x/x/", 8, "x/x/x/x/");
    expect(distant).toBeLessThan(0.4);
  });

  it("searches Doppelreim multisyllable rhymes with flow-aligned ranking", () => {
    const results = searchDoppelreim("action", {
      language: "en",
      flowAligned: true,
      targetSyllables: 2,
      targetStress: "/x",
      maxResults: 10,
    });

    expect(results.length).toBeGreaterThan(0);
    // Top results should match the "-tion" family or multi-syllable rhyme
    expect(results.some((r) => r.word.endsWith("tion") || r.word.endsWith("sion"))).toBe(true);
    expect(results[0].score).toBeGreaterThan(0);
  });
});
