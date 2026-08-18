// Unified Indic Lyric Dictionary & RAG Intelligence Engine.
//
// Powered by the processed KEED 2018 dictionary (31,000+ Romanized Kannada entries)
// and curated Romanized Hindi (Hinglish) rap vocabulary.
// Provides POS-aware rhyme matching, multisyllabic rimes, English meanings, and syllable lookup.

import type { DictEntry } from "./data/kannada-dict";

export type { DictEntry };

export type WordMatch = DictEntry & {
  score: number;
  language: "kannada" | "hinglish";
};

let cachedKannada: DictEntry[] | null = null;
let cachedHindi: DictEntry[] | null = null;

async function ensureDictionariesLoaded() {
  if (!cachedKannada) {
    const mod = await import("./data/kannada-dict");
    cachedKannada = mod.KANNADA_DICTIONARY;
  }
  if (!cachedHindi) {
    const mod = await import("./data/hindi-dict");
    cachedHindi = mod.HINDI_DICTIONARY;
  }
  return { kannada: cachedKannada, hindi: cachedHindi };
}

/**
 * Synchronous dictionary getters for existing callers (falls back to empty if not yet loaded).
 */
function getKannadaDictSync(): DictEntry[] {
  if (!cachedKannada) {
    import("./data/kannada-dict").then((m) => { cachedKannada = m.KANNADA_DICTIONARY; });
    return [];
  }
  return cachedKannada;
}

function getHindiDictSync(): DictEntry[] {
  if (!cachedHindi) {
    import("./data/hindi-dict").then((m) => { cachedHindi = m.HINDI_DICTIONARY; });
    return [];
  }
  return cachedHindi;
}

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

  const kannada = getKannadaDictSync();
  const hindi = getHindiDictSync();

  if (language === "kannada" || language === "auto") {
    if (kannada.length) dataset.push({ data: kannada, lang: "kannada" });
  }
  if (language === "hinglish" || language === "auto") {
    if (hindi.length) dataset.push({ data: hindi, lang: "hinglish" });
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
  const kannada = getKannadaDictSync();
  const hindi = getHindiDictSync();

  if (language === "kannada" || language === "auto") {
    if (kannada.length) dataset.push({ data: kannada, lang: "kannada" });
  }
  if (language === "hinglish" || language === "auto") {
    if (hindi.length) dataset.push({ data: hindi, lang: "hinglish" });
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

  const hindi = getHindiDictSync();
  const foundHindi = hindi.find((e) => e.word === clean);
  if (foundHindi) return foundHindi;

  const kannada = getKannadaDictSync();
  const foundKannada = kannada.find((e) => e.word === clean);
  if (foundKannada) return foundKannada;

  return null;
}
