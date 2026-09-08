// Indic Poetics Intelligence Engine (Classical & Contemporary DHH / Kannada Rap).
//
// Formal structural analysis for South Asian rap poetics:
//   1. Dwitiyakshara Prasa (ದ್ವಿತೀಯಾಕ್ಷರ ಪ್ರಾಸ) - 2nd consonant cluster matching across bars
//   2. Qafiya & Radif (क़ाफ़िया & रदीफ़) - Internal rhyming word + repeating refrain
//   3. Antyaprasa (ಅಂತ್ಯಪ್ರಾಸ) - Multisyllabic end-rhyme chains
//   4. Matra (Mātrā) Weight Balance - Prosodic breath balance (Laghu/Guru)
//   5. Zero Pronunciation Marks Validator - Strict colloquial Latin script verification

import { calculateMatra } from "./cadence-flow";
import { normalizeIndicWord, stripPronunciationMarks } from "./indic-romanizer";
import type { DictEntry } from "./data/kannada-dict";

// Common Kannada and Hindi multisyllabic rime clusters
export const KANGLISH_MULTIRIMES = [
  "aagi", "odu", "illa", "beku", "ante", "acha", "othu", "ene", "uru", "ana",
  "aaru", "aatha", "inde", "alli", "illi", "utha", "aagiye", "ondhu", "aadu"
] as const;

export const HINGLISH_MULTIRIMES = [
  "aoon", "aan", "eeb", "ehra", "aani", "aana", "aar", "ood", "aat", "al",
  "aaye", "ikhta", "aashi", "oori", "aari", "ooni", "eera", "eena", "aftaar"
] as const;

/**
 * Extracts the second consonant or consonant cluster (Dwitiyakshara) from a word.
 * In classical Kannada prosody (ದ್ವಿತೀಯಾಕ್ಷರ ಪ್ರಾಸ), the second akshara/consonant
 * must match across rhyming lines (e.g. ma-CHA / pa-CHA, ka-STOORI / ni-STEJA).
 */
export function extractDwitiyakshara(word: string): string {
  const clean = normalizeIndicWord(word).toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length < 2) return "";

  // Identify first vowel group
  const firstVowelMatch = clean.match(/^[bcdfghjklmnpqrstvwxyz]*(aa|ee|ii|oo|uu|ai|au|[aeiou])/);
  if (!firstVowelMatch) return "";

  const afterFirstVowel = clean.slice(firstVowelMatch[0].length);
  if (!afterFirstVowel) return "";

  // Extract the entire consonant cluster immediately following the first vowel
  const consonantMatch = afterFirstVowel.match(/^[bcdfghjklmnpqrstvwxyz]+/);
  if (consonantMatch) {
    return consonantMatch[0];
  }

  // If there are adjacent vowels or special glide, return single char
  return afterFirstVowel.charAt(0);
}

/**
 * Checks whether two words or two opening line tokens satisfy Dwitiyakshara Prasa.
 * Accepts exact consonant cluster match or phonetic equivalences (e.g. ch/ch, st/st, mm/m).
 */
export function matchDwitiyakshara(word1: string, word2: string): boolean {
  const c1 = extractDwitiyakshara(word1);
  const c2 = extractDwitiyakshara(word2);
  if (!c1 || !c2) return false;

  if (c1 === c2) return true;

  // Normalized phonetic equivalences (e.g. aspirated/geminate clusters)
  const norm1 = c1.replace(/h/g, "").replace(/(.)\1+/g, "$1");
  const norm2 = c2.replace(/h/g, "").replace(/(.)\1+/g, "$1");
  return norm1 === norm2 && norm1.length > 0;
}

/**
 * Finds dictionary candidates that share the Dwitiyakshara prasa of the target word.
 */
export function findDwitiyaksharaCandidates(targetWord: string, dictionary: DictEntry[]): DictEntry[] {
  const targetCluster = extractDwitiyakshara(targetWord);
  if (!targetCluster) return [];

  const results: DictEntry[] = [];
  const cleanTarget = stripPronunciationMarks(targetWord).toLowerCase();

  for (const entry of dictionary) {
    const entryWord = stripPronunciationMarks(entry.word).toLowerCase();
    if (entryWord === cleanTarget) continue;

    if (matchDwitiyakshara(cleanTarget, entryWord)) {
      results.push({
        ...entry,
        word: stripPronunciationMarks(entry.word),
        display_word: stripPronunciationMarks(entry.display_word || entry.word),
        definition: stripPronunciationMarks(entry.definition),
      });
      if (results.length >= 25) break;
    }
  }

  return results;
}

/**
 * Qafiya & Radif structure extraction for Urdu/Hindi DHH poetics.
 * In standard DHH couplets, the line often ends with a repeating phrase (Radif),
 * preceded immediately by the rhyming word (Qafiya).
 *
 * Example:
 * Line 1: "rootha mera ye naseeb hai yahan"
 * Line 2: "khada jo mere kareeb hai yahan"
 * -> Qafiya: "naseeb" / "kareeb" (rime: "eeb"), Radif: "hai yahan"
 */
export function extractQafiyaRadif(line: string): {
  qafiyaWord: string;
  qafiyaRime: string;
  radif: string;
} {
  const clean = stripPronunciationMarks(line).trim().replace(/[^\w\s-]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { qafiyaWord: "", qafiyaRime: "", radif: "" };
  }

  if (words.length === 1) {
    const w = words[0].toLowerCase();
    return { qafiyaWord: w, qafiyaRime: w.slice(-3), radif: "" };
  }

  // Common DHH / Hindi radifs (repeating post-rhyme refrains)
  const commonRadifKeywords = new Set([
    "hai", "tha", "hoon", "main", "tu", "bhi", "na", "mera", "tera", "apna",
    "yahan", "wahan", "sahiba", "meri", "tere", "mere", "saath", "liye", "bhai"
  ]);

  // Check if last 1 or 2 words form a Radif
  const lastWord = words[words.length - 1].toLowerCase();
  const secondLastWord = words.length > 2 ? words[words.length - 2].toLowerCase() : "";

  let radifWords: string[] = [];
  let qafiyaIndex = words.length - 1;

  if (commonRadifKeywords.has(lastWord)) {
    if (secondLastWord && commonRadifKeywords.has(secondLastWord)) {
      radifWords = [secondLastWord, lastWord];
      qafiyaIndex = words.length - 3;
    } else {
      radifWords = [lastWord];
      qafiyaIndex = words.length - 2;
    }
  }

  const qWord = (words[qafiyaIndex] || words[words.length - 1]).toLowerCase();
  const rime = qWord.slice(-3);

  return {
    qafiyaWord: qWord,
    qafiyaRime: rime,
    radif: radifWords.join(" "),
  };
}

/**
 * Checks whether two consecutive bars exhibit consistent Qafiya (rhyming phonemes)
 * and optional Radif parallelism.
 */
export function matchQafiyaRadif(line1: string, line2: string): {
  matches: boolean;
  qafiyaMatch: boolean;
  radifMatch: boolean;
  qafiyaRime: string;
} {
  const qr1 = extractQafiyaRadif(line1);
  const qr2 = extractQafiyaRadif(line2);

  if (!qr1.qafiyaWord || !qr2.qafiyaWord) {
    return { matches: false, qafiyaMatch: false, radifMatch: false, qafiyaRime: "" };
  }

  const qafiyaMatch = qr1.qafiyaWord.slice(-3) === qr2.qafiyaWord.slice(-3) ||
    qr1.qafiyaWord.slice(-2) === qr2.qafiyaWord.slice(-2);

  const radifMatch = Boolean(qr1.radif && qr2.radif && qr1.radif.toLowerCase() === qr2.radif.toLowerCase());

  return {
    matches: qafiyaMatch,
    qafiyaMatch,
    radifMatch,
    qafiyaRime: qr1.qafiyaRime,
  };
}

/**
 * Evaluates Matra prosodic breath balance across two lines.
 * Returns true if both lines fall within a rhythmic ±3 Matra delta.
 */
export function evaluateMatraBalance(line1: string, line2: string): {
  isBalanced: boolean;
  matra1: number;
  matra2: number;
  delta: number;
} {
  const m1 = calculateMatra(line1).totalMatra;
  const m2 = calculateMatra(line2).totalMatra;
  const delta = Math.abs(m1 - m2);

  return {
    isBalanced: delta <= 3,
    matra1: m1,
    matra2: m2,
    delta,
  };
}

export type IndicPoeticsScore = {
  overallScore: number;
  dwitiyakshara: boolean;
  qafiyaMatched: boolean;
  matraBalanced: boolean;
  hasUnwantedDiacritics: boolean;
  feedback: string[];
};

/**
 * Comprehensive evaluator for Indic rap couplets / bars.
 */
export function scoreIndicPoetics(
  line1: string,
  line2: string,
  language: "kannada" | "hinglish" | "blend" | "auto" = "auto"
): IndicPoeticsScore {
  const feedback: string[] = [];
  let score = 7.0;

  // Check diacritics
  const diacriticRegex = /[āīūēōṛḷṇṭḍśṣṃḥúûűȧȥᶃáéíóú]/i;
  const hasUnwantedDiacritics = diacriticRegex.test(line1) || diacriticRegex.test(line2);
  if (hasUnwantedDiacritics) {
    score -= 2.0;
    feedback.push("Unwanted pronunciation marks or macrons detected — must use colloquial Latin script only.");
  }

  // 1. Dwitiyakshara Prasa (Critical for Kannada)
  const firstWord1 = line1.trim().split(/\s+/)[0] || "";
  const firstWord2 = line2.trim().split(/\s+/)[0] || "";
  const dwitiyakshara = matchDwitiyakshara(firstWord1, firstWord2);

  if (dwitiyakshara) {
    score += (language === "kannada" || language === "blend") ? 1.8 : 0.8;
    feedback.push(`Strong Dwitiyakshara Prasa ('${extractDwitiyakshara(firstWord1)}') across bars.`);
  } else if (language === "kannada") {
    feedback.push("Tip: Adding Dwitiyakshara Prasa (2nd consonant match on bar openings) elevates classical Kannada authenticity.");
  }

  // 2. Qafiya & Radif (Critical for Hinglish / DHH)
  const qafiyaRes = matchQafiyaRadif(line1, line2);
  const qafiyaMatched = qafiyaRes.matches;

  if (qafiyaMatched) {
    score += 1.5;
    feedback.push(`Locked Qafiya rhyme ('${qafiyaRes.qafiyaRime}')`);
    if (qafiyaRes.radifMatch) {
      score += 0.7;
      feedback.push("Harmonious Radif refrain match.");
    }
  }

  // 3. Matra Prosody Balance
  const matraRes = evaluateMatraBalance(line1, line2);
  if (matraRes.isBalanced) {
    score += 0.8;
  } else {
    score -= 0.5;
    feedback.push(`Matra delta is wide (${matraRes.matra1} vs ${matraRes.matra2}) — smooth out the rhythmic weight.`);
  }

  const overallScore = Number(Math.max(1, Math.min(10, score)).toFixed(1));

  return {
    overallScore,
    dwitiyakshara,
    qafiyaMatched,
    matraBalanced: matraRes.isBalanced,
    hasUnwantedDiacritics,
    feedback,
  };
}
