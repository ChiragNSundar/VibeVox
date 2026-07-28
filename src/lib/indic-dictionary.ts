// Unified Indic Lyric Dictionary & RAG Intelligence Engine.
//
// Powered by the processed KEED 2018 dictionary (31,000+ Romanized Kannada entries)
// and curated Romanized Hindi (Hinglish) rap vocabulary.
// Provides POS-aware rhyme matching, multisyllabic rimes, English meanings, and syllable lookup.

import { KANNADA_DICTIONARY, type DictEntry } from "./data/kannada-dict";
import { HINDI_DICTIONARY } from "./data/hindi-dict";

export type { DictEntry };

export type WordMatch = DictEntry & {
  score: number;
  language: "kannada" | "hinglish";
};

/**
 * Find words matching a rime key or end sound with optional Part of Speech filter.
 */
export function findRhymesWithPos(
  targetWord: string,
  language: "kannada" | "hinglish" | "auto" = "auto",
  filterPos?: string,
): WordMatch[] {
  const clean = targetWord.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return [];

  const dataset: { data: DictEntry[]; lang: "kannada" | "hinglish" }[] = [];

  if (language === "kannada" || language === "auto") {
    dataset.push({ data: KANNADA_DICTIONARY, lang: "kannada" });
  }
  if (language === "hinglish" || language === "auto") {
    dataset.push({ data: HINDI_DICTIONARY, lang: "hinglish" });
  }

  const endSound = clean.slice(-3);
  const targetRime = clean.slice(-2);
  const matches: WordMatch[] = [];

  for (const { data, lang } of dataset) {
    for (const entry of data) {
      if (entry.word === clean) continue;

      if (filterPos && entry.pos.toLowerCase() !== filterPos.toLowerCase()) {
        continue;
      }

      let score = 0;

      // Perfect multi-rime match
      if (entry.multi_rime && clean.endsWith(entry.multi_rime)) {
        score = 95;
      } else if (entry.rime_key && clean.endsWith(entry.rime_key)) {
        score = 80;
      } else if (entry.word.endsWith(endSound)) {
        score = 75;
      } else if (entry.word.endsWith(targetRime)) {
        score = 60;
      }

      if (score > 0) {
        matches.push({
          ...entry,
          score,
          language: lang,
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 30);
}

/**
 * Search dictionary entries by Romanized word or English definition.
 */
export function searchDictionaryWords(
  query: string,
  language: "kannada" | "hinglish" | "auto" = "auto",
): WordMatch[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const dataset: { data: DictEntry[]; lang: "kannada" | "hinglish" }[] = [];

  if (language === "kannada" || language === "auto") {
    dataset.push({ data: KANNADA_DICTIONARY, lang: "kannada" });
  }
  if (language === "hinglish" || language === "auto") {
    dataset.push({ data: HINDI_DICTIONARY, lang: "hinglish" });
  }

  const results: WordMatch[] = [];

  for (const { data, lang } of dataset) {
    for (const entry of data) {
      if (entry.word.toLowerCase() === q) {
        results.unshift({ ...entry, score: 100, language: lang });
      } else if (entry.word.toLowerCase().includes(q)) {
        results.push({ ...entry, score: 80, language: lang });
      } else if (entry.definition.toLowerCase().includes(q)) {
        results.push({ ...entry, score: 60, language: lang });
      }
    }
  }

  return results.slice(0, 40);
}

/**
 * Get word info (POS, English meaning, syllable count, rime key) for bar inspector tooltips.
 */
export function getWordMetadata(word: string): DictEntry | null {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return null;

  const foundHindi = HINDI_DICTIONARY.find((e) => e.word === clean);
  if (foundHindi) return foundHindi;

  const foundKannada = KANNADA_DICTIONARY.find((e) => e.word === clean);
  if (foundKannada) return foundKannada;

  return null;
}
