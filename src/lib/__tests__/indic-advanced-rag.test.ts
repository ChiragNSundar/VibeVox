import { describe, expect, it } from "vitest";
import {
  extractDwitiyakshara,
  matchDwitiyakshara,
  findDwitiyaksharaCandidates,
  extractQafiyaRadif,
  matchQafiyaRadif,
  scoreIndicPoetics,
} from "../indic-poetics";
import { HINDI_DICTIONARY } from "../data/hindi-dict";
import { KANNADA_DICTIONARY } from "../data/kannada-dict";
import { findRhymesWithPos, findDwitiyaksharaMatches } from "../indic-dictionary";
import { recallHybridStyleExamples } from "../style-hybrid-rag";
import { synthesizeMetaphors } from "../metaphor-synthesizer";
import { planRhymeLadders } from "../rhyme-planner";
import { generateOfflineRagLyrics } from "../offline-rag-generator";
import type { LocalCadence } from "../local-pipeline";

describe("Indic Advanced RAG & Poetics Engine (Kannada & Hindi)", () => {
  describe("Classical Indic Poetics Engine (Dwitiyakshara Prasa & Qafiya-Radif)", () => {
    it("extracts second consonant clusters (Dwitiyakshara) accurately", () => {
      expect(extractDwitiyakshara("macha")).toBe("ch");
      expect(extractDwitiyakshara("pacha")).toBe("ch");
      expect(extractDwitiyakshara("kastoori")).toBe("st");
      expect(extractDwitiyakshara("nisteja")).toBe("st");
      expect(extractDwitiyakshara("namma")).toBe("mm");
      expect(extractDwitiyakshara("bengaluru")).toBe("ng");
    });

    it("matches Dwitiyakshara Prasa across Kannada bar openings", () => {
      // Bar 1: macha... Bar 2: pacha...
      expect(matchDwitiyakshara("macha", "pacha")).toBe(true);
      // Bar 1: kastoori... Bar 2: nisteja...
      expect(matchDwitiyakshara("kastoori", "nisteja")).toBe(true);
      // Unrelated words should not match
      expect(matchDwitiyakshara("macha", "bengaluru")).toBe(false);
    });

    it("finds Dwitiyakshara prasa candidates from dictionary", () => {
      const hits = findDwitiyaksharaMatches("macha", "kannada");
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.some((h) => h.word === "pacha" || h.word === "locha")).toBe(true);
    });

    it("extracts Qafiya and Radif structures for DHH couplets", () => {
      const line1 = "rootha mera ye naseeb hai yahan pe";
      const line2 = "khada jo mere kareeb hai yahan pe";

      const qr1 = extractQafiyaRadif(line1);
      const qr2 = extractQafiyaRadif(line2);

      expect(qr1.qafiyaWord).toBe("naseeb");
      expect(qr1.qafiyaRime).toBe("eeb");
      expect(qr1.radif).toContain("hai");

      const matchRes = matchQafiyaRadif(line1, line2);
      expect(matchRes.matches).toBe(true);
      expect(matchRes.qafiyaMatch).toBe(true);
      expect(matchRes.radifMatch).toBe(true);
    });

    it("evaluates and scores Indic poetics with diacritic penalties", () => {
      const cleanKannada = scoreIndicPoetics(
        "macha bisi oota guru sariyaagi sakkat",
        "pacha aagi hodha scene-u keli illi mattu",
        "kannada"
      );
      expect(cleanKannada.dwitiyakshara).toBe(true);
      expect(cleanKannada.hasUnwantedDiacritics).toBe(false);
      expect(cleanKannada.overallScore).toBeGreaterThanOrEqual(8.0);

      // Lines with unwanted diacritics / macrons must be penalized
      const withDiacritics = scoreIndicPoetics(
        "macā bisi oota guru",
        "pacā aagi hodha scene-u",
        "kannada"
      );
      expect(withDiacritics.hasUnwantedDiacritics).toBe(true);
      expect(withDiacritics.overallScore).toBeLessThan(cleanKannada.overallScore);
    });
  });

  describe("Lexicon & Dictionary Expansions", () => {
    it("expanded HINDI_DICTIONARY contains 100+ words with zero pronunciation marks", () => {
      expect(HINDI_DICTIONARY.length).toBeGreaterThanOrEqual(100);

      const diacriticRegex = /[āīūēōṛḷṇṭḍśṣṃḥúûűȧȥᶃáéíóú]/;
      for (const entry of HINDI_DICTIONARY) {
        expect(entry.word).not.toMatch(diacriticRegex);
        expect(entry.display_word || "").not.toMatch(diacriticRegex);
      }

      // Verify presence of key DHH street vocabulary
      const words = new Set(HINDI_DICTIONARY.map((e) => e.word));
      expect(words.has("bantai")).toBe(true);
      expect(words.has("wajood")).toBe(true);
      expect(words.has("rooh")).toBe(true);
      expect(words.has("dhadakta")).toBe(true);
      expect(words.has("bawaal")).toBe(true);
    });

    it("KANNADA_DICTIONARY includes curated Bengaluru rap vocabulary", () => {
      const words = new Set(KANNADA_DICTIONARY.slice(0, 50).map((e) => e.word));
      expect(words.has("macha")).toBe(true);
      expect(words.has("bisi")).toBe(true);
      expect(words.has("oota")).toBe(true);
      expect(words.has("sariyaagi")).toBe(true);
      expect(words.has("bengaluru")).toBe(true);
      expect(words.has("sakkat")).toBe(true);
    });

    it("findRhymesWithPos supports single language and blended retrieval", () => {
      const rhymes = findRhymesWithPos("naseeb", "hinglish");
      expect(rhymes.length).toBeGreaterThan(0);
      expect(rhymes.some((r) => r.word === "kareeb" || r.word === "ghareeb")).toBe(true);

      const blended = findRhymesWithPos("macha", "blend");
      expect(blended.length).toBeGreaterThan(0);
      expect(blended.some((r) => r.language === "kannada")).toBe(true);
    });
  });

  describe("Multi-Level Hybrid RAG 2.0 (4 Streams with RRF)", () => {
    it("recalls style examples with Indic Poetics Stream and metadata", async () => {
      const knExamples = await recallHybridStyleExamples("bengaluru streets and rhythm", {
        count: 3,
        targetSyllables: 10,
        language: "kannada",
      });

      expect(knExamples.length).toBeGreaterThan(0);
      expect(knExamples[0].meta).toContain("rrfScore");
      expect(knExamples[0].meta).toContain("poetics: kannada");

      const blendedExamples = await recallHybridStyleExamples("penthouse hustle gully streets", {
        count: 3,
        targetSyllables: 10,
        language: "blend",
      });
      expect(blendedExamples.length).toBeGreaterThan(0);
      expect(blendedExamples[0].meta).toContain("poetics: blend");
    });
  });

  describe("Sensory & Metaphor Synthesizer", () => {
    it("synthesizes authentic Bengaluru street textures for Kanglish", () => {
      const bp = synthesizeMetaphors("urban grind", ["ambition"], "kanglish");
      expect(bp.promptInstructions).toContain("KANNADA RAP METAPHORS");
      expect(bp.sensoryDomains.tactile.some((t) => t.includes("filter coffee") || t.includes("auto"))).toBe(true);
      expect(bp.sensoryDomains.visual.some((v) => v.includes("Majestic") || v.includes("Church Street"))).toBe(true);
    });

    it("synthesizes gritty DHH textures for Hinglish", () => {
      const bp = synthesizeMetaphors("gully life", ["reflective"], "hinglish");
      expect(bp.promptInstructions).toContain("DESI HIP-HOP METAPHORS");
      expect(bp.sensoryDomains.tactile.some((t) => t.includes("local train") || t.includes("cutting chai"))).toBe(true);
      expect(bp.sensoryDomains.cultural.some((c) => c.includes("gully se penthouse"))).toBe(true);
    });

    it("synthesizes dual-language metaphors for bilingual code-switching", () => {
      const bp = synthesizeMetaphors("cross city flow", ["ambition"], "kanglish, hinglish");
      expect(bp.promptInstructions).toContain("BILINGUAL CODE-SWITCH");
      expect(bp.sensoryDomains.cultural.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Rhyme Ladders & Offline RAG Generator", () => {
    it("plans rhyme ladders for Hinglish, Kanglish, and blended modes", () => {
      const cadence: LocalCadence = {
        bars: [
          { index: 1, syllables: 10, endSound: "aoon", section: "verse", text: "bar 1" },
          { index: 2, syllables: 10, endSound: "aoon", section: "verse", text: "bar 2" },
          { index: 3, syllables: 10, endSound: "eeb", section: "verse", text: "bar 3" },
          { index: 4, syllables: 10, endSound: "eeb", section: "verse", text: "bar 4" },
        ],
        detectedVibe: "trap",
      };

      const knPlan = planRhymeLadders(cadence, "kannada");
      expect(knPlan.bars.length).toBe(4);
      expect(knPlan.promptInstructions).toContain("PRE-PLANNED MULTISYLLABIC RHYME LADDERS");

      const blendPlan = planRhymeLadders(cadence, "blend");
      expect(blendPlan.bars.length).toBe(4);
      expect(blendPlan.bars[0].suggestedWords.length).toBeGreaterThan(0);
    });

    it("generates offline RAG lyrics with zero pronunciation marks", () => {
      const cadence: LocalCadence = {
        bars: [
          { index: 1, syllables: 10, endSound: "a", section: "verse", text: "macha bisi oota" },
          { index: 2, syllables: 10, endSound: "a", section: "verse", text: "sariyaagi sakkat" },
        ],
      };

      const result = generateOfflineRagLyrics("mumble scratch", cadence, {
        slangRegion: "kanglish, hinglish",
      });

      expect(result.lyrics.sections.length).toBeGreaterThan(0);
      const allLines = result.lyrics.sections.flatMap((s) => s.lines);
      expect(allLines.length).toBeGreaterThan(0);

      const diacriticRegex = /[āīūēōṛḷṇṭḍśṣṃḥúûűȧȥᶃáéíóú]/;
      for (const line of allLines) {
        expect(line).not.toMatch(diacriticRegex);
      }
    });
  });
});
