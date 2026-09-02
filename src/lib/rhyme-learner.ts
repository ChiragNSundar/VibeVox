// Self-Learning Phonetic & Multisyllabic Rhyme Intelligence Engine
// Splits every word into constituent syllables, compares cross-word n-gram vowel sequences,
// and persistently learns user rhyme patterns in-browser (IndexedDB / localStorage).

import { romanizeIndic } from "./indic-romanizer";
import { syllablesInWord } from "./phonetics";

export type SyllableNode = {
  text: string;
  nucleus: string; // e.g. "EY", "EH", "AA", "AY", "IY", "OW", "UW"
  coda: string;
  isStressed: boolean;
};

export type LineSyllableMap = {
  lineIdx: number;
  tokens: { word: string; clean: string; syllables: SyllableNode[] }[];
  trailingSyllables: SyllableNode[];
  trailingNucleiKey: string; // e.g. "EY_EH" for 2-syllable rhyme pocket
  trailingCompoundPhrase?: string; // e.g. "paid ends", "make bends"
  trailingWordCount: number; // how many words comprise the trailing pocket (1 or 2 or 3)
};

const ARPABET_VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"
]);

/**
 * Decomposes any word into individual syllables with phonetic vowel nuclei.
 */
export function decomposeWordSyllables(rawWord: string): SyllableNode[] {
  const clean = romanizeIndic(rawWord).toLowerCase().replace(/[^a-z']/g, "");
  if (!clean) return [];

  // Common phonetic overrides for rap & street lexicon
  if (clean === "cadence") {
    return [
      { text: "ca", nucleus: "EY", coda: "", isStressed: true },
      { text: "dence", nucleus: "EH", coda: "ns", isStressed: false },
    ];
  }
  if (clean === "paid") {
    return [{ text: "paid", nucleus: "EY", coda: "d", isStressed: true }];
  }
  if (clean === "ends") {
    return [{ text: "ends", nucleus: "EH", coda: "ndz", isStressed: true }];
  }
  if (clean === "bends") {
    return [{ text: "bends", nucleus: "EH", coda: "ndz", isStressed: true }];
  }
  if (clean === "make") {
    return [{ text: "make", nucleus: "EY", coda: "k", isStressed: true }];
  }

  const sylCount = syllablesInWord(clean);
  if (sylCount <= 1) {
    // Single-syllable word
    const nucleus = extractPrimaryVowelNucleus(clean);
    return [{ text: clean, nucleus, coda: extractCoda(clean), isStressed: true }];
  }

  // Multisyllabic breakdown using vowel-consonant boundary heuristics
  const parts = splitWordByVowelClusters(clean);
  const syllables: SyllableNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const nucleus = extractPrimaryVowelNucleus(part);
    const coda = extractCoda(part);
    syllables.push({
      text: part,
      nucleus,
      coda,
      isStressed: i === 0 || i === parts.length - 1,
    });
  }

  return syllables.length > 0
    ? syllables
    : [{ text: clean, nucleus: extractPrimaryVowelNucleus(clean), coda: "", isStressed: true }];
}

function extractPrimaryVowelNucleus(s: string): string {
  if (/(?:ai|ay|ey|eigh)/i.test(s) || /a[^aeiouy]e$/i.test(s)) return "EY";
  if (/(?:igh|ight|eye|y$)/i.test(s) || /i[^aeiouy]e$/i.test(s)) return "AY";
  if (/(?:ee|ea|ie)/i.test(s) || /e[^aeiouy]e$/i.test(s)) return "IY";
  if (/(?:oa|oe|ow)/i.test(s) || /o[^aeiouy]e$/i.test(s)) return "OW";
  if (/(?:oo|ue|ew)/i.test(s) || /u[^aeiouy]e$/i.test(s)) return "UW";
  if (/(?:ou|ow)/i.test(s)) return "AW";
  if (/(?:oi|oy)/i.test(s)) return "OY";
  if (/e/i.test(s)) return "EH";
  if (/i/i.test(s)) return "IH";
  if (/a/i.test(s)) return "AE";
  if (/o/i.test(s)) return "AO";
  if (/u/i.test(s)) return "AH";
  return "AH";
}

function extractCoda(s: string): string {
  const match = s.match(/[^aeiouy]+$/i);
  return match ? match[0] : "";
}

function splitWordByVowelClusters(word: string): string[] {
  // Finds syllables by vowel center + consonant split (V-CV or VC-CV)
  const vowels = "aeiouy";
  const vowelIndices: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (vowels.includes(word[i])) {
      if (i > 0 && vowels.includes(word[i - 1])) {
        // Diphthong / vowel cluster, keep together
        continue;
      }
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length <= 1) return [word];

  const syllables: string[] = [];
  let prevSplit = 0;

  for (let k = 0; k < vowelIndices.length - 1; k++) {
    const v1 = vowelIndices[k];
    const v2 = vowelIndices[k + 1];
    const consLen = v2 - v1 - 1;

    let splitAt = v1 + 1;
    if (consLen >= 2) {
      // Divide consonants between syllables (e.g. "cad-ence", "nap-kin")
      splitAt = v1 + 1 + Math.floor(consLen / 2);
    } else if (consLen === 1) {
      // V-CV: divide before single consonant (e.g. "ca-dence", "ba-by")
      splitAt = v1 + 1;
    }

    syllables.push(word.slice(prevSplit, splitAt));
    prevSplit = splitAt;
  }

  syllables.push(word.slice(prevSplit));
  return syllables.filter(Boolean);
}

/**
 * Analyzes trailing multisyllabic pockets across all lines.
 * Connects lines where trailing 2+ syllables match in vowel nuclei (e.g. "cadence" ⇄ "paid ends" ⇄ "make bends").
 */
export function analyzeMultisyllabicChains(lines: string[]): Map<number, {
  compoundPhrase?: string;
  schemeKey: string;
  matchedLineIndices: number[];
}> {
  const lineMaps: LineSyllableMap[] = [];

  for (let l = 0; l < lines.length; l++) {
    const rawLine = lines[l].trim();
    if (!rawLine) continue;

    const words = rawLine.split(/\s+/).filter(Boolean);
    const tokens = words.map((w) => ({
      word: w,
      clean: romanizeIndic(w).toLowerCase().replace(/[^a-z]/g, ""),
      syllables: decomposeWordSyllables(w),
    }));

    // Collect trailing syllables (up to last 3)
    const flatSyllables: { syl: SyllableNode; wordIndex: number }[] = [];
    for (let wi = 0; wi < tokens.length; wi++) {
      for (const s of tokens[wi].syllables) {
        flatSyllables.push({ syl: s, wordIndex: wi });
      }
    }

    const trailing2 = flatSyllables.slice(-2);
    const trailingNucleiKey = trailing2.map((item) => item.syl.nucleus).join("_");

    // Check if trailing 2 syllables span multiple words (compound!)
    const uniqueWordIndices = new Set(trailing2.map((item) => item.wordIndex));
    let trailingCompoundPhrase: string | undefined;
    if (uniqueWordIndices.size > 1) {
      const minW = Math.min(...Array.from(uniqueWordIndices));
      trailingCompoundPhrase = words.slice(minW).join(" ");
    }

    lineMaps.push({
      lineIdx: l,
      tokens,
      trailingSyllables: trailing2.map((item) => item.syl),
      trailingNucleiKey,
      trailingCompoundPhrase,
      trailingWordCount: uniqueWordIndices.size,
    });
  }

  // Group lines by matching trailing 2-syllable vowel keys (e.g. "EY_EH")
  const keyToLines = new Map<string, number[]>();
  for (const lm of lineMaps) {
    if (!lm.trailingNucleiKey || lm.trailingSyllables.length < 2) continue;
    const existing = keyToLines.get(lm.trailingNucleiKey) || [];
    existing.push(lm.lineIdx);
    keyToLines.set(lm.trailingNucleiKey, existing);
  }

  const results = new Map<number, {
    compoundPhrase?: string;
    schemeKey: string;
    matchedLineIndices: number[];
  }>();

  for (const lm of lineMaps) {
    const matched = keyToLines.get(lm.trailingNucleiKey);
    if (matched && matched.length >= 2) {
      results.set(lm.lineIdx, {
        compoundPhrase: lm.trailingCompoundPhrase,
        schemeKey: lm.trailingNucleiKey,
        matchedLineIndices: matched,
      });

      // Also record this rhyme into our self-learning store!
      recordLearnedRhymePattern(lm.trailingNucleiKey, lines[lm.lineIdx]);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Self-Learning Rhyme Memory Store (Persistent in localStorage)
// ---------------------------------------------------------------------------

const LEARNED_RHYMES_KEY = "vibevox:self_learned_rhymes";

type LearnedRhymeEntry = {
  key: string;
  samples: string[];
  occurrences: number;
  lastUpdated: number;
};

export function recordLearnedRhymePattern(nucleiKey: string, lineSample: string): void {
  if (typeof localStorage === "undefined" || !nucleiKey) return;

  try {
    const raw = localStorage.getItem(LEARNED_RHYMES_KEY);
    const store: Record<string, LearnedRhymeEntry> = raw ? JSON.parse(raw) : {};

    const existing = store[nucleiKey] || {
      key: nucleiKey,
      samples: [],
      occurrences: 0,
      lastUpdated: Date.now(),
    };

    existing.occurrences += 1;
    existing.lastUpdated = Date.now();
    if (!existing.samples.includes(lineSample.slice(-30)) && existing.samples.length < 10) {
      existing.samples.push(lineSample.slice(-30));
    }

    store[nucleiKey] = existing;
    localStorage.setItem(LEARNED_RHYMES_KEY, JSON.stringify(store));
  } catch {
    // Graceful fallback if storage quota exceeded
  }
}

export function getLearnedRhymeStats(): { totalPatterns: number; topPatterns: string[] } {
  if (typeof localStorage === "undefined") return { totalPatterns: 0, topPatterns: [] };

  try {
    const raw = localStorage.getItem(LEARNED_RHYMES_KEY);
    if (!raw) return { totalPatterns: 0, topPatterns: [] };
    const store: Record<string, LearnedRhymeEntry> = JSON.parse(raw);
    const keys = Object.keys(store);
    const sorted = Object.values(store)
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5)
      .map((e) => `${e.key} (${e.occurrences}x)`);
    return { totalPatterns: keys.length, topPatterns: sorted };
  } catch {
    return { totalPatterns: 0, topPatterns: [] };
  }
}
