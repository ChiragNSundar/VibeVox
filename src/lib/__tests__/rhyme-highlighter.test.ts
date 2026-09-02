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

  it("highlights cross-line and multisyllabic rhymes in Romanized Hindi/street lyrics", () => {
    const lines = [
      "kya bolte pasha bhai hogayela nasha",
      "ma bolte nasha lai margayela pasha",
    ];

    const res = highlightLyrics(lines, "standard");
    expect(res.length).toBe(2);

    // Both lines should have 'A' scheme letter
    expect(res[0].schemeLetter).toBe("A");
    expect(res[1].schemeLetter).toBe("A");

    // Both lines should highlight pasha and nasha
    expect(res[0].html).toContain("pasha");
    expect(res[0].html).toContain("nasha");
    expect(res[1].html).toContain("pasha");
    expect(res[1].html).toContain("nasha");

    // Check that rhyme-word classes are applied to rhyming pairs
    expect(res[0].html).toContain("rhyme-word");
    expect(res[1].html).toContain("rhyme-word");

    // Check that hogayela and margayela share rhyme highlights
    expect(res[0].html).toContain("hogay");
    expect(res[1].html).toContain("margay");
  });

  it("highlights complex compound rhymes (do or die vs homicide vs life)", () => {
    const lines = [
      "soch mera do or die",
      "mind pe hai homicide",
      "grind pe na life kare",
    ];

    const res = highlightLyrics(lines, "standard");
    expect(res.length).toBe(3);

    // Both line 1 and line 2 should share 'A' scheme letter
    expect(res[0].schemeLetter).toBe("A");
    expect(res[1].schemeLetter).toBe("A");

    // 'die', 'homicide', and 'life' should be highlighted as rhyming
    expect(res[0].html).toContain("die");
    expect(res[1].html).toContain("homicide");
    expect(res[2].html).toContain("life");

    // 'mind' and 'grind' should be highlighted as rhyming
    expect(res[1].html).toContain("mind");
    expect(res[2].html).toContain("grind");

    // 'pe' and 'pe' should be highlighted as rhyming
    expect(res[1].html).toContain("pe");
    expect(res[2].html).toContain("pe");

    // Compound rhyme: 'do or die' highlights in unison with 'homicide'
    expect(res[0].html).toContain("rhyme-word");
    expect(res[1].html).toContain("rhyme-word");
  });

  it("highlights 5-line complex multi with AABA macro scheme and 4-count internal monorhyme", () => {
    const lines = [
      "soch mera do or die",
      "mind pe hai homicide",
      "grind pe na life kare",
      "par kabhi na side par hai",
      "guys fuys luys buys",
    ];

    const scheme = getStanzaRhymeScheme(lines);
    expect(scheme.lineLetters).toEqual(["A", "A", "B", "A", "C"]);
    expect(scheme.raw).toBe("AABA");

    const res = highlightLyrics(lines, "standard");
    expect(res.length).toBe(5);

    // Scheme letters on lines
    expect(res[0].schemeLetter).toBe("A");
    expect(res[1].schemeLetter).toBe("A");
    expect(res[2].schemeLetter).toBe("B");
    expect(res[3].schemeLetter).toBe("A");
    expect(res[4].schemeLetter).toBe("C");

    // Unified 3-syllable mosaic pills
    expect(res[0].html).toContain("mosaic-pill");
    expect(res[0].html).toContain("do or die");
    expect(res[1].html).toContain("mosaic-pill");
    expect(res[1].html).toContain("homicide");
    expect(res[3].html).toContain("mosaic-pill");
    expect(res[3].html).toContain("side par hai");

    // Channel 2 (Cyan/Blue): mind & grind & guys, buys
    expect(res[1].html).toContain("mind");
    expect(res[2].html).toContain("grind");
    expect(res[4].html).toContain("rhyme-group-2");

    // Line 5 syllable count: 4 single-syllable words
    expect(res[4].syllables).toBe(4);

    // Channel 3 (Red/Pink): pe and par
    expect(res[1].html).toContain("rhyme-group-3"); // pe
    expect(res[3].html).toContain("rhyme-group-3"); // par

    // Channel 4 (Green): mera, na, kabhi, kare
    expect(res[0].html).toContain("rhyme-group-4"); // mera
    expect(res[2].html).toContain("rhyme-group-4"); // na
  });
});
