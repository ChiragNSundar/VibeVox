// Unified Indic Lyric Dictionary & RAG Intelligence Engine.
//
// Powered by the processed KEED 2018 dictionary (31,000+ Romanized Kannada entries)
// and curated Romanized Hindi (Hinglish) rap vocabulary.
// Provides POS-aware rhyme matching, multisyllabic rimes, English meanings, and syllable lookup.

import { KANNADA_DICTIONARY, type DictEntry } from "./data/kannada-dict";
import { HINDI_DICTIONARY } from "./data/hindi-dict";
import { romanizeIndic, stripPronunciationMarks, normalizeIndicWord } from "./indic-romanizer";

export type { DictEntry };

export type WordMatch = DictEntry & {
  score: number;
  language: "kannada" | "hinglish";
};

function getKannadaDictSync(): DictEntry[] {
  return KANNADA_DICTIONARY;
}

function getHindiDictSync(): DictEntry[] {
  return HINDI_DICTIONARY;
}

/**
 * Find words matching a rime key or end sound with optional Part of Speech filter.
 * Supports native Kannada, Devanagari, and Romanized Kanglish/Hinglish without pronunciation marks.
 */
export function findRhymesWithPos(
  targetWord: string,
  language: "kannada" | "hinglish" | "auto" = "auto",
  filterPos?: string,
): WordMatch[] {
  const clean = normalizeIndicWord(targetWord);
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
          word: stripPronunciationMarks(entry.word),
          display_word: stripPronunciationMarks(entry.display_word || entry.word),
          definition: stripPronunciationMarks(entry.definition),
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
 * Strips all pronunciation marks.
 */
export function searchDictionaryWords(
  query: string,
  language: "kannada" | "hinglish" | "auto" = "auto",
): WordMatch[] {
  const q = normalizeIndicWord(query);
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
      const cleanWord = stripPronunciationMarks(entry.word).toLowerCase();
      const cleanDef = stripPronunciationMarks(entry.definition).toLowerCase();

      if (cleanWord === q) {
        results.unshift({
          ...entry,
          word: cleanWord,
          display_word: stripPronunciationMarks(entry.display_word || entry.word),
          definition: cleanDef,
          score: 100,
          language: lang,
        });
      } else if (cleanWord.includes(q)) {
        results.push({
          ...entry,
          word: cleanWord,
          display_word: stripPronunciationMarks(entry.display_word || entry.word),
          definition: cleanDef,
          score: 80,
          language: lang,
        });
      } else if (cleanDef.includes(q)) {
        results.push({
          ...entry,
          word: cleanWord,
          display_word: stripPronunciationMarks(entry.display_word || entry.word),
          definition: cleanDef,
          score: 60,
          language: lang,
        });
      }
    }
  }

  return results.slice(0, 40);
}

/**
 * Get word info (POS, English meaning, syllable count, rime key) for bar inspector tooltips.
 */
export function getWordMetadata(word: string): DictEntry | null {
  const clean = normalizeIndicWord(word);
  if (!clean) return null;

  const hindi = getHindiDictSync();
  const foundHindi = hindi.find((e) => stripPronunciationMarks(e.word) === clean);
  if (foundHindi) {
    return {
      ...foundHindi,
      word: stripPronunciationMarks(foundHindi.word),
      display_word: stripPronunciationMarks(foundHindi.display_word || foundHindi.word),
      definition: stripPronunciationMarks(foundHindi.definition),
    };
  }

  const kannada = getKannadaDictSync();
  const foundKannada = kannada.find((e) => stripPronunciationMarks(e.word) === clean);
  if (foundKannada) {
    return {
      ...foundKannada,
      word: stripPronunciationMarks(foundKannada.word),
      display_word: stripPronunciationMarks(foundKannada.display_word || foundKannada.word),
      definition: stripPronunciationMarks(foundKannada.definition),
    };
  }

  return null;
}
