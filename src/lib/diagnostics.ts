// Real-Time Lyrical Diagnostics Engine
// Ported and adapted from VibeLyrics with 7-dimensional complexity scoring,
// tier grade evaluation, and semantic drift detection with anchor keywords.
// 100% pure TypeScript running in-browser with zero latency.

import { countSyllables, classifyScheme, rhymeScheme } from "./phonetics";
import { wordToPhones, getRhymingPart } from "./rhyme-highlighter";

export type ComplexityGrade = "S-Tier" | "A-Tier" | "B-Tier" | "C-Tier" | "D-Tier" | "Beginner";

export type ComplexityDimensions = {
  internal_rhyme: number;        // 0..100
  multisyllabic: number;         // 0..100
  assonance: number;             // 0..100
  consonance: number;            // 0..100
  vocabulary: number;            // 0..100
  homophone: number;             // 0..100
  scheme_sophistication: number; // 0..100
};

export type ComplexityScoreResult = {
  score: number; // 0..100
  grade: ComplexityGrade;
  dimensions: ComplexityDimensions;
  details: string;
};

export type DriftStatus = "stable" | "drifting" | "off-topic";

export type SemanticDriftResult = {
  drift_score: number; // 0.0..1.0
  status: DriftStatus;
  warning: string;
  anchor_keywords: string[];
  recent_keywords: string[];
  windows?: {
    start_line: number;
    end_line: number;
    drift_score: number;
    status: DriftStatus;
  }[];
};

const STOP_WORDS = new Set([
  "i", "me", "my", "you", "your", "we", "us", "the", "a", "an",
  "is", "am", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "can", "may", "might", "shall",
  "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "up", "out", "if", "or", "and", "but", "not", "no", "so",
  "too", "very", "just", "don't", "didn't", "won't",
  "it", "its", "it's", "that", "this", "those", "these",
  "what", "when", "where", "who", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some",
  "such", "than", "then", "only", "own", "same",
  "like", "got", "get", "go", "going", "gonna", "ain't",
  "yeah", "uh", "oh", "ay", "hey", "yo",
]);

const VOWEL_PHONEMES = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY",
  "IH", "IY", "OW", "OY", "UH", "UW",
]);

const CONSONANT_PHONEMES = new Set([
  "B", "CH", "D", "DH", "F", "G", "HH", "JH", "K", "L", "M",
  "N", "NG", "P", "R", "S", "SH", "T", "TH", "V", "W", "Y", "Z", "ZH",
]);

/**
 * Score lyric complexity on a 0–100 scale across 7 dimensions:
 * internal rhyme, multisyllabic frequency, assonance, consonance,
 * vocabulary richness, homophone play, and scheme sophistication.
 */
export function scoreComplexity(lines: string[]): ComplexityScoreResult {
  const cleanLines = lines.map((l) => l.trim()).filter(Boolean);

  if (cleanLines.length === 0) {
    return {
      score: 0,
      grade: "Beginner",
      dimensions: {
        internal_rhyme: 0,
        multisyllabic: 0,
        assonance: 0,
        consonance: 0,
        vocabulary: 0,
        homophone: 0,
        scheme_sophistication: 0,
      },
      details: "Write or record at least 2 bars to calculate flow complexity.",
    };
  }

  const internalScore = calcInternalRhymeScore(cleanLines);
  const multiScore = calcMultisyllabicScore(cleanLines);
  const assonScore = calcAssonanceScore(cleanLines);
  const consonScore = calcConsonanceScore(cleanLines);
  const vocabScore = calcVocabularyScore(cleanLines);
  const homoScore = calcHomophoneScore(cleanLines);
  const schemeScore = calcSchemeSophisticationScore(cleanLines);

  // 7-dimensional weighted combination (calibrated to hip-hop craftsmanship)
  const overall = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        internalScore * 0.22 +
        multiScore * 0.20 +
        assonScore * 0.12 +
        consonScore * 0.08 +
        vocabScore * 0.15 +
        homoScore * 0.10 +
        schemeScore * 0.13
      )
    )
  );

  const grade = getGrade(overall);
  const details = getDetailsText(overall, grade, {
    internal_rhyme: internalScore,
    multisyllabic: multiScore,
    assonance: assonScore,
    consonance: consonScore,
    vocabulary: vocabScore,
    homophone: homoScore,
    scheme_sophistication: schemeScore,
  });

  return {
    score: overall,
    grade,
    dimensions: {
      internal_rhyme: Math.round(internalScore),
      multisyllabic: Math.round(multiScore),
      assonance: Math.round(assonScore),
      consonance: Math.round(consonScore),
      vocabulary: Math.round(vocabScore),
      homophone: Math.round(homoScore),
      scheme_sophistication: Math.round(schemeScore),
    },
    details,
  };
}

function getGrade(score: number): ComplexityGrade {
  if (score >= 85) return "S-Tier";
  if (score >= 70) return "A-Tier";
  if (score >= 55) return "B-Tier";
  if (score >= 40) return "C-Tier";
  if (score >= 20) return "D-Tier";
  return "Beginner";
}

function getDetailsText(
  score: number,
  grade: ComplexityGrade,
  dims: ComplexityDimensions
): string {
  if (score >= 85) {
    return `${grade} — Elite internal rhyme density, sophisticated multi-syllabics, and varied vocabulary. Studio-master quality.`;
  }
  if (score >= 70) {
    return `${grade} — Strong multisyllabic flow with solid assonance patterns. Professional-grade verse.`;
  }
  if (score >= 55) {
    const suggestion = dims.internal_rhyme < 50
      ? "Try weaving internal rhymes inside each bar to elevate flow."
      : dims.multisyllabic < 50
      ? "Experiment with 2-to-3 syllable compound rhyme endings."
      : "Solid rhythm. Diversify vocabulary to push into A-Tier.";
    return `${grade} — Solid craft. ${suggestion}`;
  }
  if (score >= 40) {
    return `${grade} — Moderate complexity. Focus on multi-syllabic end rhymes and consonant punch.`;
  }
  if (score >= 20) {
    return `${grade} — Basic end-rhymes detected. Layer internal rhymes and expand bar syllable pockets.`;
  }
  return `${grade} — Just getting started. Focus on nailing pocket cadence and end-rhymes first.`;
}

// ── 7 Dimension Calculators ──────────────────────────────────────

function calcInternalRhymeScore(lines: string[]): number {
  let totalPairs = 0;
  let validLines = 0;

  for (const line of lines) {
    const words = line.toLowerCase().match(/[a-zA-Z'\u0900-\u097F\u0C80-\u0CFF]+/g) || [];
    if (words.length < 3) continue;
    validLines++;

    const endings = words.map((w) => {
      const phones = wordToPhones(w);
      return getRhymingPart(phones);
    });

    const seen = new Set<string>();
    let pairs = 0;

    for (let i = 0; i < endings.length; i++) {
      for (let j = i + 1; j < endings.length; j++) {
        if (endings[i] && endings[j] && endings[i] === endings[j]) {
          const key = `${i}-${j}`;
          if (!seen.has(key)) {
            seen.add(key);
            pairs++;
          }
        }
      }
    }
    totalPairs += pairs;
  }

  if (validLines === 0) return 20;
  const avg = totalPairs / validLines;
  // 1.5 pairs/line is considered master level (~100)
  return Math.min(100, Math.round(avg * 65));
}

function calcMultisyllabicScore(lines: string[]): number {
  let multiCount = 0;
  let totalWords = 0;

  for (const line of lines) {
    const words = line.toLowerCase().match(/[a-zA-Z'\u0900-\u097F\u0C80-\u0CFF]+/g) || [];
    for (const w of words) {
      totalWords++;
      const syl = countSyllables(w);
      if (syl >= 3) multiCount += 2;
      else if (syl === 2) multiCount += 1;
    }
  }

  if (totalWords === 0) return 0;
  const ratio = multiCount / totalWords;
  return Math.min(100, Math.round(ratio * 150));
}

function calcAssonanceScore(lines: string[]): number {
  let repeatedVowels = 0;
  let totalLineCount = 0;

  for (const line of lines) {
    const words = line.toLowerCase().match(/[a-zA-Z']+/g) || [];
    if (words.length < 2) continue;
    totalLineCount++;

    const vowelSequence: string[] = [];
    for (const w of words) {
      const phones = wordToPhones(w);
      for (const p of phones) {
        const base = p.replace(/[0-9]/, "");
        if (VOWEL_PHONEMES.has(base)) {
          vowelSequence.push(base);
        }
      }
    }

    // Count adjacent matching vowels
    for (let i = 0; i < vowelSequence.length - 1; i++) {
      if (vowelSequence[i] === vowelSequence[i + 1]) {
        repeatedVowels++;
      }
    }
  }

  if (totalLineCount === 0) return 30;
  const avg = repeatedVowels / totalLineCount;
  return Math.min(100, Math.round(avg * 35 + 20));
}

function calcConsonanceScore(lines: string[]): number {
  let consonantMatches = 0;
  let totalLines = 0;

  for (const line of lines) {
    const words = line.toLowerCase().match(/[a-zA-Z']+/g) || [];
    if (words.length < 2) continue;
    totalLines++;

    const startingConsonants = words
      .map((w) => {
        const phones = wordToPhones(w);
        return phones.find((p) => CONSONANT_PHONEMES.has(p));
      })
      .filter(Boolean);

    // Alliteration check
    for (let i = 0; i < startingConsonants.length - 1; i++) {
      if (startingConsonants[i] === startingConsonants[i + 1]) {
        consonantMatches += 1.5;
      }
    }
  }

  if (totalLines === 0) return 25;
  const avg = consonantMatches / totalLines;
  return Math.min(100, Math.round(avg * 40 + 20));
}

function calcVocabularyScore(lines: string[]): number {
  const allWords = lines
    .join(" ")
    .toLowerCase()
    .match(/[a-zA-Z'\u0900-\u097F\u0C80-\u0CFF]+/g) || [];

  if (allWords.length === 0) return 0;

  const unique = new Set(allWords);
  const typeTokenRatio = unique.size / allWords.length;

  // Syllable variety
  const sylVariety = new Set(allWords.map((w) => countSyllables(w))).size;

  const score = typeTokenRatio * 60 + Math.min(40, sylVariety * 8);
  return Math.min(100, Math.round(score));
}

function calcHomophoneScore(lines: string[]): number {
  const allWords = lines
    .join(" ")
    .toLowerCase()
    .match(/[a-zA-Z']+/g) || [];

  const soundMap = new Map<string, Set<string>>();

  for (const w of allWords) {
    const phones = wordToPhones(w).join(" ");
    if (!phones) continue;
    if (!soundMap.has(phones)) {
      soundMap.set(phones, new Set());
    }
    soundMap.get(phones)!.add(w);
  }

  let homophoneSets = 0;
  for (const words of soundMap.values()) {
    if (words.size >= 2) homophoneSets++;
  }

  return Math.min(100, Math.round(homophoneSets * 35 + 25));
}

function calcSchemeSophisticationScore(lines: string[]): number {
  if (lines.length < 2) return 50;
  const schemeStr = rhymeScheme(lines);
  const type = classifyScheme(schemeStr);

  const SCORES: Record<string, number> = {
    "ABAB": 95,
    "ABBA": 90,
    "ABCB": 80,
    "AABB": 65,
    "AAAA": 40,
    "freeform": 60,
  };

  return SCORES[type] ?? 55;
}

// ── Semantic Drift Detection ────────────────────────────────────────

function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-zA-Z'\u0900-\u097F\u0C80-\u0CFF]+/g) || [];
  return new Set(words.filter((w) => !STOP_WORDS.has(w) && w.length > 2));
}

/**
 * Detect when lyric verses wander away from their core thematic anchor.
 * Compares opening anchor bars against the most recent bars.
 */
export function detectSemanticDrift(
  lines: string[],
  sessionTheme: string = ""
): SemanticDriftResult {
  const cleanLines = lines.map((l) => l.trim()).filter(Boolean);

  if (cleanLines.length < 6) {
    return {
      drift_score: 0.0,
      status: "stable",
      warning: "",
      anchor_keywords: [],
      recent_keywords: [],
    };
  }

  // Anchor: first 4 lines + optional session theme
  const anchorText = cleanLines.slice(0, 4).join(" ") + (sessionTheme ? ` ${sessionTheme}` : "");
  // Recent: last 4 lines
  const recentText = cleanLines.slice(-4).join(" ");

  const anchorKw = extractKeywords(anchorText);
  const recentKw = extractKeywords(recentText);

  if (anchorKw.size === 0 || recentKw.size === 0) {
    return {
      drift_score: 0.0,
      status: "stable",
      warning: "",
      anchor_keywords: Array.from(anchorKw),
      recent_keywords: Array.from(recentKw),
    };
  }

  // Jaccard similarity between anchor keywords and recent keywords
  let intersectionCount = 0;
  for (const k of recentKw) {
    if (anchorKw.has(k)) intersectionCount++;
  }

  const unionSize = new Set([...anchorKw, ...recentKw]).size;
  const similarity = unionSize > 0 ? intersectionCount / unionSize : 1.0;
  const driftScore = Math.round((1.0 - similarity) * 100) / 100;

  let status: DriftStatus = "stable";
  let warning = "";

  const anchorList = Array.from(anchorKw).slice(0, 5);

  if (driftScore >= 0.65) {
    status = "off-topic";
    warning = `Heavy drift detected! Recent bars share almost no thematic overlap with your opening. Consider circling back to: ${anchorList.join(", ")}.`;
  } else if (driftScore >= 0.4) {
    status = "drifting";
    warning = `Bars are starting to wander from the core theme. Anchor keywords: ${anchorList.join(", ")}.`;
  }

  // Sliding windows for verse trajectory
  const windows: SemanticDriftResult["windows"] = [];
  const windowSize = 4;

  if (cleanLines.length >= windowSize * 2) {
    for (let i = windowSize; i <= cleanLines.length - windowSize; i++) {
      const winText = cleanLines.slice(i, i + windowSize).join(" ");
      const winKw = extractKeywords(winText);
      let winInter = 0;
      for (const k of winKw) {
        if (anchorKw.has(k)) winInter++;
      }
      const winUnion = new Set([...anchorKw, ...winKw]).size;
      const winSim = winUnion > 0 ? winInter / winUnion : 1.0;
      const winDrift = Math.round((1.0 - winSim) * 100) / 100;
      const winStatus: DriftStatus = winDrift >= 0.65 ? "off-topic" : winDrift >= 0.4 ? "drifting" : "stable";

      windows.push({
        start_line: i + 1,
        end_line: i + windowSize,
        drift_score: winDrift,
        status: winStatus,
      });
    }
  }

  return {
    drift_score: driftScore,
    status,
    warning,
    anchor_keywords: Array.from(anchorKw).slice(0, 10),
    recent_keywords: Array.from(recentKw).slice(0, 10),
    windows,
  };
}
