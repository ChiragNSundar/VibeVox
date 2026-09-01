import { describe, expect, it } from "vitest";
import { countSyllables, syllablesInWord, endRhymeKey } from "../phonetics";
import { lookupIndicRhymes } from "../rhymes";
import { countCliches } from "../lyrics-analysis";

describe("Indic Phonetics (Hinglish & Kanglish)", () => {
  it("counts syllables accurately for Hinglish words", () => {
    expect(syllablesInWord("mitaoon")).toBe(3);
    expect(syllablesInWord("bataade")).toBe(3);
    expect(syllablesInWord("kannada")).toBe(3);
    expect(syllablesInWord("bengaluru")).toBe(4);
    expect(syllablesInWord("macha")).toBe(2);
  });

  it("calculates line syllable counts for mixed and native script bars", () => {
    expect(countSyllables("Dhundhla sa aks ab mitaoon main")).toBe(9);
    expect(countSyllables("Yenu macha scene-u sariyaagi sakkat")).toBe(14);
    // Native scripts now count accurate syllables via automatic romanization!
    expect(countSyllables("ಕನ್ನಡ")).toBe(3);
    expect(countSyllables("ಬೆಂಗಳೂರು")).toBe(4);
    expect(countSyllables("अपना टाइम आएगा")).toBe(6);
  });

  it("extracts end rhyme keys for Hinglish and Kanglish", () => {
    expect(endRhymeKey("Dhundhla sa aks ab mitaoon")).toBe("aoon");
    expect(endRhymeKey("Jaam mein zeher, naa kho ja tu")).toBe("u");
    expect(endRhymeKey("Yenu macha")).toBe("a");
  });

  it("looks up Indic rhyme suggestions without pronunciation marks", () => {
    const hinglishRhymes = lookupIndicRhymes("mitaoon");
    expect(hinglishRhymes.length).toBeGreaterThan(0);
    expect(hinglishRhymes.some((r) => r.word.includes("bataoon") || r.word.includes("chalaoon"))).toBe(true);

    const kanglishRhymes = lookupIndicRhymes("macha");
    expect(kanglishRhymes.length).toBeGreaterThan(0);

    // Lookups on native script words directly
    const nativeKanglish = lookupIndicRhymes("ಮಗ");
    expect(nativeKanglish.length).toBeGreaterThan(0);

    // Lookups on words with pronunciation marks/macrons
    const accentedRhymes = lookupIndicRhymes("agarāga");
    expect(accentedRhymes.length).toBeGreaterThan(0);

    // All suggested rhyme words must have zero pronunciation marks (no macrons or diacritics)
    for (const r of [...hinglishRhymes, ...kanglishRhymes, ...accentedRhymes].slice(0, 20)) {
      expect(r.word).not.toMatch(/[āīūēōṛḷṇṭḍśṣṃḥúûűȧȥᶃ]/);
    }
  });

  it("detects Hinglish and Kanglish clichés", () => {
    const lines = ["apna time aayega main gully ka raja", "kannada gothilla in bengaluru"];
    expect(countCliches(lines)).toBe(3); // apna time aayega, gully ka raja, kannada gothilla
  });
});
