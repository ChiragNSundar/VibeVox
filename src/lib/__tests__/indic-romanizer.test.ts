import { describe, it, expect } from "vitest";
import {
  stripPronunciationMarks,
  kannadaToKanglish,
  devanagariToHinglish,
  romanizeIndic,
  hasIndicScript,
} from "../indic-romanizer";

describe("Indic Romanizer (Kanglish & Hinglish without pronunciation marks)", () => {
  describe("stripPronunciationMarks", () => {
    it("strips macrons and diacritics from IAST/Romanized Indic words", () => {
      expect(stripPronunciationMarks("agarāga")).toBe("agaraga");
      expect(stripPronunciationMarks("namaskāra")).toBe("namaskara");
      expect(stripPronunciationMarks("śānti")).toBe("shanti");
      expect(stripPronunciationMarks("prāṇa")).toBe("prana");
      expect(stripPronunciationMarks("bābū")).toBe("baboo");
    });

    it("cleans dictionary pronunciation artifacts and brackets", () => {
      const raw = "1 úsound û 〈being〉to cry aloud 2 úaskû";
      const cleaned = stripPronunciationMarks(raw);
      expect(cleaned).toContain("sound");
      expect(cleaned).toContain("being");
      expect(cleaned).not.toContain("ú");
      expect(cleaned).not.toContain("û");
      expect(cleaned).not.toContain("〈");
      expect(cleaned).not.toContain("〉");
    });
  });

  describe("kannadaToKanglish", () => {
    it("converts native Kannada script into natural Kanglish without accents", () => {
      expect(kannadaToKanglish("ಕನ್ನಡ")).toBe("kannada");
      expect(kannadaToKanglish("ಗುರು")).toBe("guru");
      expect(kannadaToKanglish("ಮಗ")).toBe("maga");
      expect(kannadaToKanglish("ನೋಡು")).toBe("nodu");
      expect(kannadaToKanglish("ಬೆಂಗಳೂರು")).toBe("bengaluru");
    });

    it("handles complex conjuncts (ottaksharas)", () => {
      expect(kannadaToKanglish("ಹೇಗಿದ್ದೀಯ")).toBe("hegiddiya");
      expect(kannadaToKanglish("ಸ್ತ್ರೀ")).toBe("stree");
    });
  });

  describe("devanagariToHinglish", () => {
    it("converts native Devanagari script into natural Hinglish without accents", () => {
      expect(devanagariToHinglish("अपना")).toBe("apna");
      expect(devanagariToHinglish("टाइम")).toBe("taaim");
      expect(devanagariToHinglish("आएगा")).toBe("aayega");
      expect(devanagariToHinglish("भाई")).toBe("bhaai");
    });

    it("handles colloquial Nukta loan consonants (z, f, q, kh)", () => {
      expect(devanagariToHinglish("जिंदगी")).toBe("jindagi");
      expect(devanagariToHinglish("फ़िक्र")).toBe("fikr");
    });
  });

  describe("romanizeIndic", () => {
    it("handles mixed sentences of English, Kanglish, and Hinglish seamlessly", () => {
      const mixed = "Guru neenu ನೋಡು illi, apna time आएगा bhai";
      const result = romanizeIndic(mixed);

      expect(result).toBe("Guru neenu nodu illi, apna time aayega bhai");
      // Must contain zero pronunciation marks
      expect(result).not.toMatch(/[āīūēōṛḷṇṭḍśṣṃḥ]/);
    });

    it("preserves pure English text unchanged", () => {
      expect(romanizeIndic("locked in the pocket with the mic on")).toBe("locked in the pocket with the mic on");
    });
  });

  describe("hasIndicScript", () => {
    it("detects Kannada and Devanagari characters accurately", () => {
      expect(hasIndicScript("ಕನ್ನಡ")).toBe(true);
      expect(hasIndicScript("हिंदी")).toBe(true);
      expect(hasIndicScript("Clean English only")).toBe(false);
      expect(hasIndicScript("Macha guru ide")).toBe(false);
    });
  });
});
