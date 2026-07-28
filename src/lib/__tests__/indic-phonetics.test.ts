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

  it("calculates line syllable counts for mixed bars", () => {
    expect(countSyllables("Dhundhla sa aks ab mitaoon main")).toBe(9);
    expect(countSyllables("Yenu macha scene-u sariyaagi sakkat")).toBe(14);
  });

  it("extracts end rhyme keys for Hinglish and Kanglish", () => {
    expect(endRhymeKey("Dhundhla sa aks ab mitaoon")).toBe("aoon");
    expect(endRhymeKey("Jaam mein zeher, naa kho ja tu")).toBe("u");
    expect(endRhymeKey("Yenu macha")).toBe("a");
  });

  it("looks up Indic rhyme suggestions", () => {
    const hinglishRhymes = lookupIndicRhymes("mitaoon");
    expect(hinglishRhymes.some((r) => r.word === "bataoon")).toBe(true);

    const kanglishRhymes = lookupIndicRhymes("macha");
    expect(kanglishRhymes.some((r) => r.word === "locha")).toBe(true);
  });

  it("detects Hinglish and Kanglish clichés", () => {
    const lines = ["apna time aayega main gully ka raja", "kannada gothilla in bengaluru"];
    expect(countCliches(lines)).toBe(3); // apna time aayega, gully ka raja, kannada gothilla
  });
});
