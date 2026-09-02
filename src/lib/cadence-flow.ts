// Cadence & Flow Engine
// Ported and adapted from VibeLyrics with syllable-level stress patterning (Lagu 'x' vs Guru '/'),
// rhythmic cadence scoring, and flow-aligned Doppelreim matching.
// 100% pure TypeScript running in-browser with zero latency.

import { countSyllables, syllablesInWord } from "./phonetics";
import { romanizeIndic } from "./indic-romanizer";
import { wordToPhones } from "./rhyme-highlighter";
import { KANNADA_DICTIONARY, type DictEntry } from "./data/kannada-dict";
import { HINDI_DICTIONARY } from "./data/hindi-dict";

export type LanguageCode = "en" | "kn" | "hi" | "auto";

export type SyllableStressNode = {
  char: "/" | "x";
  index: number;
  word: string;
  isOverridden?: boolean;
};

export type LineStressAnalysis = {
  rawPattern: string;       // e.g. "x / x /"
  chars: ("/" | "x")[];     // e.g. ["x", "/", "x", "/"]
  syllableCount: number;
  wordCount: number;
  words: { word: string; pattern: string; syllables: number }[];
};

export type DoppelreimResult = {
  word: string;
  language: "en" | "kn" | "hi";
  syllables: number;
  stressPattern: string;
  meaning?: string;
  score: number;
  rhythmicScore?: number;
  pos?: string;
  matchType: "exact-multi" | "vowel-resonance" | "rime" | "slant";
};

export type DoppelreimSearchOptions = {
  language?: LanguageCode;
  flowAligned?: boolean;
  targetSyllables?: number;
  targetStress?: string;
  maxResults?: number;
  filterPos?: string;
};

// Indic long vowels (Guru - heavy / stressed)
const INDIC_LONG_VOWELS = new Set([
  "aa", "ii", "uu", "ee", "oo", "ai", "au",
  "ā", "ī", "ū", "ē", "ō", "ai", "au"
]);

/**
 * Matra (Mātrā) weight calculation for Classical Indic and DHH prosody.
 * Laghu (L = 1 mātrā) for short vowels; Guru (G = 2 mātrās) for long vowels,
 * diphthongs, and syllables with coda clusters / anusvara.
 */
export function calculateMatra(line: string): {
  totalMatra: number;
  pattern: ("L" | "G")[];
  weights: number[];
} {
  if (!line || !line.trim()) return { totalMatra: 0, pattern: [], weights: [] };

  const clean = romanizeIndic(line).toLowerCase().replace(/[^a-z\s]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  const pattern: ("L" | "G")[] = [];
  const weights: number[] = [];

  for (const w of words) {
    // Break word into approximate vowel nuclei
    const nuclei = w.match(/(?:aa|ii|uu|ee|oo|ai|au|ay|ey|oy|[aeiouy])/g) || [];
    for (let i = 0; i < nuclei.length; i++) {
      const nuc = nuclei[i];
      const isLong = nuc.length >= 2 || nuc === "e" || nuc === "o"; // 'e' and 'o' are always Guru in Sanskrit/Hindi
      // Check if followed by conjunct consonants before next vowel
      const nextNucIndex = i < nuclei.length - 1 ? w.indexOf(nuclei[i + 1], w.indexOf(nuc) + nuc.length) : w.length;
      const consonantCluster = w.slice(w.indexOf(nuc) + nuc.length, nextNucIndex).replace(/[^a-z]/g, "");
      const isHeavyByCluster = consonantCluster.length >= 2 || /[nm]$/i.test(consonantCluster);

      if (isLong || isHeavyByCluster) {
        pattern.push("G");
        weights.push(2);
      } else {
        pattern.push("L");
        weights.push(1);
      }
    }
  }

  const totalMatra = weights.reduce((sum, w) => sum + w, 0);
  return { totalMatra, pattern, weights };
}

export type FlowMetricResult = {
  metricType: "triplet" | "straight-16th" | "syncopated" | "staccato";
  badge: string;
  label: string;
};

/**
 * Detects polyrhythmic flow pockets (triplet rolls / Migos pockets vs straight-16th).
 */
export function detectFlowMetric(line: string, chars: ("/" | "x")[] = []): FlowMetricResult {
  const syl = chars.length || countSyllables(line);
  if (syl < 3) {
    return { metricType: "staccato", badge: "Staccato", label: "Short punchy bar" };
  }

  // Triplet detection: syllable counts clustering in 3s (6, 9, 12, 15) or 3-syllable stress rolls
  const stressStr = chars.join("");
  const hasTripletRoll =
    /(?:\/xx|\/xx\/|xx\/|x\/x){2,}/.test(stressStr) ||
    (syl >= 6 && syl % 3 === 0 && /(?:ing|tion|ty|ly|te|na|ke|re|ya)\s+(?:ing|tion|te|na)/i.test(line));

  if (hasTripletRoll || syl === 9 || syl === 15) {
    return {
      metricType: "triplet",
      badge: "┌3┐ [3:2]",
      label: "Triplet flow / 3-syllable roll",
    };
  }

  // Syncopation check: alternating stresses with caesura breaks
  if (syl >= 7 && (syl % 2 !== 0 || /[,|\-]/.test(line))) {
    return {
      metricType: "syncopated",
      badge: "Syncopated",
      label: "Off-beat syncopated pocket",
    };
  }

  return {
    metricType: "straight-16th",
    badge: "16th Grid",
    label: "Straight 16th-note pocket",
  };
}

export type CaesuraResult = {
  hasCaesura: boolean;
  pauseIndex: number;
  before: string;
  after: string;
};

/**
 * Detects micro-caesuras (natural breath pauses or syntactic breaks) in longer bars.
 */
export function detectCaesura(line: string): CaesuraResult {
  if (!line || line.trim().length < 15) {
    return { hasCaesura: false, pauseIndex: -1, before: line, after: "" };
  }

  // Explicit punctuation pause (comma, semicolon, dash, pipe)
  const punctMatch = /^(.*?[,;—\-|])\s+(.*)$/.exec(line);
  if (punctMatch) {
    return {
      hasCaesura: true,
      pauseIndex: punctMatch[1].length,
      before: punctMatch[1].trim(),
      after: punctMatch[2].trim(),
    };
  }

  // Natural conjunction breath breaks in DHH (e.g. "but you dont see", "aur hum yahan", "par tu nahi")
  const conjMatch = /^(.*?\b(?:but|and|yet|cause|cuz|par|aur|lekin|magar|toh|kyunki)\b)\s*(.*)$/i.exec(line);
  if (conjMatch && conjMatch[1].split(/\s+/).length >= 3 && conjMatch[2].split(/\s+/).length >= 2) {
    return {
      hasCaesura: true,
      pauseIndex: conjMatch[1].length,
      before: conjMatch[1].trim(),
      after: conjMatch[2].trim(),
    };
  }

  return { hasCaesura: false, pauseIndex: -1, before: line, after: "" };
}

export type CodeSwitchResult = {
  hindiPct: number;
  englishPct: number;
  label: string;
  isCodeSwitched: boolean;
};

/**
 * Computes bilingual code-switching language ratio for DHH lines.
 */
export function detectCodeSwitch(line: string): CodeSwitchResult {
  if (!line || !line.trim()) {
    return { hindiPct: 0, englishPct: 100, label: "100% EN", isCodeSwitched: false };
  }

  const words = line.toLowerCase().replace(/[^a-z\u0900-\u097F\u0C80-\u0CFF\s]/g, "").split(/\s+/).filter(Boolean);
  if (!words.length) return { hindiPct: 0, englishPct: 100, label: "100% EN", isCodeSwitched: false };

  let indicCount = 0;
  let englishCount = 0;

  const INDIC_PARTICLES = new Set([
    "jo", "woh", "wo", "tu", "tera", "teri", "mere", "mera", "meri", "hum", "main", "hai", "hain",
    "kare", "karta", "karti", "karte", "muskuraate", "gungunaate", "chahe", "gaaye", "laye", "hoti", "hota",
    "bhai", "gully", "apna", "apni", "pyaar", "duniya", "raasta", "sahi", "nahi", "kabhi", "bhi",
    "dekhu", "dekha", "dekh", "sun", "bol", "kar", "baat", "dil", "jaan", "bhavi", "ek", "do", "teen",
    "side", "par", "pe", "se", "ke", "ko", "me", "mein", "ka", "ki"
  ]);

  for (const w of words) {
    if (/[\u0900-\u097F\u0C80-\u0CFF]/.test(w) || INDIC_PARTICLES.has(w) || /(?:te|ta|ti|ra|ri|ke|se|pe|de|ne)$/i.test(w)) {
      indicCount++;
    } else {
      englishCount++;
    }
  }

  const total = indicCount + englishCount;
  const hindiPct = Math.round((indicCount / total) * 100);
  const englishPct = 100 - hindiPct;
  const isCodeSwitched = (indicCount >= 1 && englishCount >= 2) || (hindiPct >= 15 && englishPct >= 15);

  let label = `${englishPct}% EN`;
  if (isCodeSwitched) {
    label = `${hindiPct}% HI · ${englishPct}% EN`;
  } else if (hindiPct > 80) {
    label = `${hindiPct}% HI`;
  }

  return { hindiPct, englishPct, label, isCodeSwitched };
}

/**
 * Detect language heuristics from string.
 */
export function detectLanguage(text: string): "en" | "kn" | "hi" {
  if (!text) return "en";
  // Native Kannada script range
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  // Native Devanagari script range
  if (/[\u0900-\u097F]/.test(text)) return "hi";

  const lower = text.toLowerCase();
  // Romanized Kanglish distinctive suffixes / particles
  if (/(?:beku|gothilla|illa|madi|agide|nanna|namma|huduga|hudugi|bengaluru|kannada|avnu|avlu)$/i.test(lower)) {
    return "kn";
  }
  // Romanized Hinglish distinctive suffixes / particles
  if (/(?:hai|tha|thi|the|nahi|apna|apni|mera|meri|karta|karte|gully|duniya|pyaar|bhai)$/i.test(lower)) {
    return "hi";
  }

  return "en";
}

/**
 * Extract stress pattern for an English word using phonetic rules and phoneme stresses.
 * Returns pattern string with 'x' (unstressed) and '/' (stressed), e.g. "x/" for "hello".
 */
export function getEnglishWordStress(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-z']/g, "");
  if (!clean) return "";

  const phones = wordToPhones(clean);
  const stresses: ("/" | "x")[] = [];

  for (const p of phones) {
    if (/[0-9]/.test(p)) {
      if (p.endsWith("1") || p.endsWith("2")) {
        stresses.push("/");
      } else if (p.endsWith("0")) {
        stresses.push("x");
      }
    }
  }

  if (stresses.length > 0) {
    return stresses.join("");
  }

  // Fallback heuristic based on syllable count
  const syl = syllablesInWord(clean);
  if (syl === 1) return "/";
  if (syl === 2) {
    // English two-syllable nouns often trochaic (/x), verbs often iambic (x/)
    return "/x";
  }
  if (syl === 3) return "/xx";
  if (syl === 4) return "x/xx";

  return "/".repeat(1) + "x".repeat(Math.max(0, syl - 1));
}

/**
 * Extract stress pattern for Romanized Indic words (Kannada / Hindi) based on Swara/Matra duration.
 * Long vowels (Guru) = '/', Short vowels (Lagu) = 'x'.
 */
export function getIndicWordStress(word: string, lang: "kn" | "hi" = "kn"): string {
  const romanized = romanizeIndic(word).toLowerCase().replace(/[^a-z]/g, "");
  if (!romanized) return "";

  // Tokenize into vowel groups & syllables
  const vowelsRegex = /(aa|ii|uu|ee|oo|ai|au|a|i|u|e|o)/g;
  const matches: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = vowelsRegex.exec(romanized)) !== null) {
    matches.push(m[1]);
  }

  if (matches.length === 0) {
    return "/";
  }

  const longVowels = lang === "hi"
    ? new Set(["aa", "ii", "uu", "e", "ai", "o", "au"])
    : new Set(["aa", "ii", "uu", "ee", "oo", "ai", "au"]);

  const stresses = matches.map((v) => (longVowels.has(v) ? "/" : "x"));

  // Ensure at least one stressed syllable in multisyllabic words
  if (!stresses.includes("/") && stresses.length > 0) {
    stresses[0] = "/";
  }

  return stresses.join("");
}

/**
 * Get stress pattern for any single word with automatic language detection.
 */
export function getWordStressPattern(word: string, lang: LanguageCode = "auto"): string {
  const resolvedLang = lang === "auto" ? detectLanguage(word) : lang;
  if (resolvedLang === "kn" || resolvedLang === "hi") {
    return getIndicWordStress(word, resolvedLang);
  }
  return getEnglishWordStress(word);
}

/**
 * Compute full stress and syllable analysis for a lyric line or bar.
 * Strips parenthetical ad-libs (e.g. '(skrrt)', '(yeah)') from rhythm calculation.
 */
export function getLineStressAnalysis(line: string, lang: LanguageCode = "auto"): LineStressAnalysis {
  if (!line || !line.trim()) {
    return { rawPattern: "", chars: [], syllableCount: 0, wordCount: 0, words: [] };
  }

  // Strip parenthetical adlibs
  const cleanLine = line.replace(/\([^)]*\)/g, " ").trim();
  const rawWords = cleanLine.split(/\s+/).filter(Boolean);

  const wordDetails: { word: string; pattern: string; syllables: number }[] = [];
  const allChars: ("/" | "x")[] = [];

  for (const rw of rawWords) {
    const cleanWord = rw.replace(/[^a-zA-Z'\u0900-\u097F\u0C80-\u0CFF]/g, "");
    if (!cleanWord) continue;

    const pattern = getWordStressPattern(cleanWord, lang);
    const syl = countSyllables(cleanWord);
    wordDetails.push({ word: cleanWord, pattern, syllables: syl });

    for (const c of pattern.split("")) {
      if (c === "/" || c === "x") {
        allChars.push(c);
      }
    }
  }

  const rawPattern = wordDetails.map((w) => w.pattern).join(" ");

  return {
    rawPattern,
    chars: allChars,
    syllableCount: allChars.length || countSyllables(cleanLine),
    wordCount: wordDetails.length,
    words: wordDetails,
  };
}

/**
 * Calculate rhythmic fit score (0.0 to 1.0) comparing candidate rhyme word
 * against target cadence (syllables & stress envelope).
 */
export function calculateRhythmicScore(
  candSyllables: number,
  candStress: string,
  targetSyllables?: number,
  targetStress?: string
): number {
  let score = 1.0;

  // Syllable alignment penalty
  if (targetSyllables != null && targetSyllables > 0) {
    const sylDiff = Math.abs(candSyllables - targetSyllables);
    if (sylDiff === 0) {
      score *= 1.0;
    } else if (sylDiff === 1) {
      score *= 0.88;
    } else if (sylDiff === 2) {
      score *= 0.65;
    } else {
      score *= Math.max(0.1, 1.0 - sylDiff * 0.2);
    }
  }

  // Stress envelope alignment
  if (targetStress && targetStress.trim()) {
    const cleanTarget = targetStress.replace(/\s+/g, "");
    const cleanCand = candStress.replace(/\s+/g, "");

    if (cleanTarget && cleanCand) {
      const minLen = Math.min(cleanTarget.length, cleanCand.length);
      let prefixMatches = 0;
      let suffixMatches = 0;

      for (let i = 0; i < minLen; i++) {
        if (cleanTarget[i] === cleanCand[i]) prefixMatches++;
      }
      for (let i = 1; i <= minLen; i++) {
        if (cleanTarget[cleanTarget.length - i] === cleanCand[cleanCand.length - i]) suffixMatches++;
      }

      const matchRatio = Math.max(prefixMatches, suffixMatches) / minLen;
      score *= 0.6 + 0.4 * matchRatio;
    }
  }

  return Math.round(score * 100) / 100;
}

/**
 * Search Doppelreim (multi-syllabic rhymes) across both English and Indic rap datasets
 * with optional Flow-Aligned cadence sorting.
 */
export function searchDoppelreim(
  query: string,
  options: DoppelreimSearchOptions = {}
): DoppelreimResult[] {
  const clean = query.toLowerCase().replace(/[^a-zA-Z\u0900-\u097F\u0C80-\u0CFF]/g, "").trim();
  if (!clean) return [];

  const {
    language = "auto",
    flowAligned = false,
    targetSyllables,
    targetStress,
    maxResults = 40,
    filterPos,
  } = options;

  const resolvedLang = language === "auto" ? detectLanguage(clean) : language;
  const results: DoppelreimResult[] = [];
  const seenWords = new Set<string>();
  seenWords.add(clean);

  // 1. Search Indic datasets if Kannada or Hindi
  if (resolvedLang === "kn" || resolvedLang === "hi" || language === "auto") {
    const datasets: { data: DictEntry[]; lang: "kn" | "hi" }[] = [];
    if (resolvedLang === "kn" || language === "auto") {
      datasets.push({ data: KANNADA_DICTIONARY, lang: "kn" });
    }
    if (resolvedLang === "hi" || language === "auto") {
      datasets.push({ data: HINDI_DICTIONARY, lang: "hi" });
    }

    const targetVowels = clean.match(/[aeiouy]+/g)?.join("-") || "";
    const last3 = clean.slice(-3);
    const last2 = clean.slice(-2);

    for (const { data, lang: dLang } of datasets) {
      for (const entry of data) {
        if (!entry.word || seenWords.has(entry.word)) continue;
        if (filterPos && entry.pos && entry.pos.toLowerCase() !== filterPos.toLowerCase()) continue;

        let baseScore = 0;
        let matchType: DoppelreimResult["matchType"] = "slant";

        // Multi-rime exact match
        if (entry.multi_rime && clean.endsWith(entry.multi_rime)) {
          baseScore = 92;
          matchType = "exact-multi";
        } else if (entry.vowels && targetVowels && entry.vowels.endsWith(targetVowels.slice(-4))) {
          baseScore = 85;
          matchType = "vowel-resonance";
        } else if (entry.rime_key && clean.endsWith(entry.rime_key)) {
          baseScore = 78;
          matchType = "rime";
        } else if (entry.word.endsWith(last3)) {
          baseScore = 74;
          matchType = "rime";
        } else if (entry.word.endsWith(last2) && last2.length >= 2) {
          baseScore = 60;
          matchType = "slant";
        }

        if (baseScore >= 60) {
          seenWords.add(entry.word);
          const candStress = getIndicWordStress(entry.word, dLang);
          const candSyllables = entry.syllables || countSyllables(entry.word);

          const rScore = flowAligned
            ? calculateRhythmicScore(candSyllables, candStress, targetSyllables, targetStress)
            : 1.0;

          const finalScore = flowAligned ? Math.round(baseScore * (0.6 + 0.4 * rScore)) : baseScore;

          results.push({
            word: entry.word,
            language: dLang,
            syllables: candSyllables,
            stressPattern: candStress,
            meaning: entry.meaning,
            score: finalScore,
            rhythmicScore: rScore,
            pos: entry.pos,
            matchType,
          });
        }
      }
    }
  }

  // 2. Search English phonetics / multi-syllables
  if (resolvedLang === "en" || language === "auto") {
    // English rhyme search using common multi-rime vowel keys
    const queryPhones = wordToPhones(clean);
    const queryStress = getEnglishWordStress(clean);
    const querySyllables = countSyllables(clean);

    // Well-known hip-hop multi-syllable rhyming vocabulary bank
    const ENGLISH_HIP_HOP_WORDS = [
      "action", "faction", "traction", "passion", "ration", "fashion",
      "vision", "mission", "collision", "decision", "precision", "division",
      "power", "tower", "flower", "hour", "shower", "sour",
      "grinding", "shining", "finding", "binding", "winding", "blinding",
      "hustle", "muscle", "rustle", "bustle", "tussle",
      "pavement", "statement", "basement", "chasing", "racing", "facing",
      "danger", "stranger", "ranger", "chamber", "anchor",
      "shadow", "meadow", "fellow", "mellow", "yellow",
      "glory", "story", "territory", "mandatory",
      "champion", "stadium", "radiant", "alien", "billion", "million",
      "pressure", "measure", "treasure", "pleasure",
      "silent", "violent", "tyrant", "island", "vibrant",
      "spirit", "lyric", "mirror", "fearless", "peerless",
    ];

    for (const w of ENGLISH_HIP_HOP_WORDS) {
      if (w === clean || seenWords.has(w)) continue;
      const wPhones = wordToPhones(w);
      const wStress = getEnglishWordStress(w);
      const wSyllables = countSyllables(w);

      let baseScore = 0;
      let matchType: DoppelreimResult["matchType"] = "slant";

      // Vowel match check
      const cleanVowels = clean.match(/[aeiouy]+/g)?.join("") || "";
      const wVowels = w.match(/[aeiouy]+/g)?.join("") || "";

      if (clean.slice(-3) === w.slice(-3)) {
        baseScore = 88;
        matchType = "exact-multi";
      } else if (clean.slice(-2) === w.slice(-2)) {
        baseScore = 75;
        matchType = "rime";
      } else if (cleanVowels && wVowels && cleanVowels.slice(-2) === wVowels.slice(-2)) {
        baseScore = 70;
        matchType = "vowel-resonance";
      }

      if (baseScore >= 70) {
        seenWords.add(w);
        const rScore = flowAligned
          ? calculateRhythmicScore(wSyllables, wStress, targetSyllables, targetStress)
          : 1.0;

        const finalScore = flowAligned ? Math.round(baseScore * (0.6 + 0.4 * rScore)) : baseScore;

        results.push({
          word: w,
          language: "en",
          syllables: wSyllables,
          stressPattern: wStress,
          score: finalScore,
          rhythmicScore: rScore,
          matchType,
        });
      }
    }
  }

  // Sort by final score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}
