import { describe, it, expect } from "vitest";
import {
  wordToPhones,
  getRhymingPart,
  phonemeDistance,
  isMultiSyllableRhyme,
  splitWordAtRhyme,
  getStanzaRhymeScheme,
  highlightLyrics,
} from "../rhyme-highlighter";

describe("Rhyme Highlighter Engine", () => {
  it("converts words to phoneme representations and extracts rhyming parts", () => {
    const nightPhones = wordToPhones("night");
    expect(getRhymingPart(nightPhones)).toBe("AY1 T");

    const lightPhones = wordToPhones("light");
    expect(getRhymingPart(lightPhones)).toBe("AY1 T");

    // Exact rhyme should have 0 distance
    expect(phonemeDistance("AY1 T", "AY1 T")).toBe(0);
  });

  it("calculates slant rhyme phoneme distance", () => {
    // night (AY1 T) vs like (AY1 K) -> distance = 1.0 (consonant swap)
    const dist = phonemeDistance("AY1 T", "AY1 K");
    expect(dist).toBeLessThanOrEqual(1.0);
  });

  it("detects multi-syllable rhymes", () => {
    const phones1 = ["K", "IH1", "CH", "AH0", "N"];
    const phones2 = ["M", "IH1", "CH", "AH0", "N"];
    expect(isMultiSyllableRhyme(phones1, phones2)).toBe(true);
  });

  it("splits word at rhyme boundary for sub-word highlighting", () => {
    const phones = wordToPhones("boat");
    const rp = getRhymingPart(phones);
    const [prefix, suffix] = splitWordAtRhyme("boat", phones, rp);
    expect(prefix).toBe("b");
    expect(suffix).toBe("oat");
  });

  it("identifies 4-line stanza rhyme schemes", () => {
    const couplets = [
      "I stepped out in the silent night",
      "Looking up into the glowing light",
      "I know the dream is within my hand",
      "Standing tall across the promised land",
    ];
    const scheme = getStanzaRhymeScheme(couplets);
    expect(scheme.raw).toBe("AABB");
    expect(scheme.name).toContain("Couplets");
  });

  it("highlights lyrics with clean, standard, and deep modes", () => {
    const lines = [
      "walking through the night",
      "guided by the light",
    ];

    // Clean mode returns plain lines
    const clean = highlightLyrics(lines, "clean");
    expect(clean[0].html).toBe(lines[0]);

    // Standard mode highlights perfect end rhymes
    const standard = highlightLyrics(lines, "standard");
    expect(standard[0].html).toContain("rhyme-word");
    expect(standard[1].html).toContain("rhyme-word");
    expect(standard[0].html).toContain("data-sound");
  });
});
