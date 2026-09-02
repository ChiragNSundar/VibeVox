// Rhyme Highlighter & Phonetic Analysis Engine
// Ported from VibeLyrics with multi-tier Rhyme Vision, sub-word phoneme splitting,
// cross-line resonance, and Romanized Indic + English support.
// 100% pure TypeScript running in-browser with zero latency.

import { romanizeIndic } from "./indic-romanizer";
import { countSyllables } from "./lyrics-analysis";
import { analyzeMultisyllabicChains } from "./rhyme-learner";

export type RhymeVisionMode = "clean" | "standard" | "deep" | "all";

export type StanzaSchemeResult = {
  raw: string;           // e.g. "AABB"
  name: string;          // e.g. "AABB (Couplets)"
  lineLetters: string[]; // e.g. ["A", "A", "B", "B"]
  colors: string[];      // e.g. ["rhyme-group-1", "rhyme-group-1", "rhyme-group-2", "rhyme-group-2"]
};

export type HighlightedLineResult = {
  html: string;
  hasInternalRhyme: boolean;
  syllables: number;
  schemeLetter?: string;
  rhymeGroupClass?: string;
};

// 12 studio-curated harmonious rhyme palette names
export const RHYME_GROUP_CLASSES = [
  "rhyme-group-1",  // Warm Amber / Gold
  "rhyme-group-2",  // Cyan / Sky
  "rhyme-group-3",  // Crimson / Coral Red
  "rhyme-group-4",  // Electric Blue
  "rhyme-group-5",  // Emerald / Mint
  "rhyme-group-6",  // Sunset Orange
  "rhyme-group-7",  // Hot Pink / Fuchsia
  "rhyme-group-8",  // Lavender / Violet
  "rhyme-group-9",  // Flame Coral
  "rhyme-group-10", // Electric Lime
  "rhyme-group-11", // Turquoise
  "rhyme-group-12", // Honey Yellow
] as const;

export const NEAR_GROUP_CLASSES = [
  "near-group-1",
  "near-group-2",
  "near-group-3",
  "near-group-4",
  "near-group-5",
  "near-group-6",
] as const;

const ARPABET_VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY",
  "EH", "ER", "EY", "IH", "IY", "OW",
  "OY", "UH", "UW"
]);

// Rule-based grapheme-to-phoneme mappings for English syllables
const G2P_RULES: Array<[RegExp, string]> = [
  [/^tion$/, "SH AH N"],
  [/^sion$/, "ZH AH N"],
  [/^ight$/, "AY T"],
  [/^ite$/, "AY T"],
  [/^ound$/, "AW N D"],
  [/^own$/, "AW N"],
  [/^ame$/, "EY M"],
  [/^aim$/, "EY M"],
  [/^ake$/, "EY K"],
  [/^ace$/, "EY S"],
  [/^eak$/, "IY K"],
  [/^eek$/, "IY K"],
  [/^eam$/, "IY M"],
  [/^eem$/, "IY M"],
  [/^ore$/, "AO R"],
  [/^oor$/, "AO R"],
  [/^our$/, "AW ER"],
  [/^out$/, "AW T"],
  [/^all$/, "AO L"],
  [/^ell$/, "EH L"],
  [/^ill$/, "IH L"],
  [/^ull$/, "AH L"],
  [/^ink$/, "IH NG K"],
  [/^ank$/, "AE NG K"],
  [/^ack$/, "AE K"],
  [/^ick$/, "IH K"],
  [/^ock$/, "AA K"],
  [/^uck$/, "AH K"],
  [/^art$/, "AA R T"],
  [/^arm$/, "AA R M"],
  [/^air$/, "EH R"],
  [/^are$/, "EH R"],
  [/^ear$/, "IH R"],
];

/**
 * Extract phonetic representations for an English word.
 * Returns array of phoneme tokens, e.g. ["B", "OW1", "T"] or ["S", "K", "AA1", "R", "Z"].
 */
export function wordToPhones(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return [];

  const COMMON_PHONETIC_DICT: Record<string, string[]> = {
    eye: ["AY1"],
    eyes: ["AY1", "Z"],
    cry: ["K", "R", "AY1"],
    cries: ["K", "R", "AY1", "Z"],
    lie: ["L", "AY1"],
    lies: ["L", "AY1", "Z"],
    tie: ["T", "AY1"],
    ties: ["T", "AY1", "Z"],
    die: ["D", "AY1"],
    dies: ["D", "AY1", "Z"],
    try: ["T", "R", "AY1"],
    tries: ["T", "R", "AY1", "Z"],
    fly: ["F", "L", "AY1"],
    flies: ["F", "L", "AY1", "Z"],
    sky: ["S", "K", "AY1"],
    skies: ["S", "K", "AY1", "Z"],
    spy: ["S", "P", "AY1"],
    spies: ["S", "P", "AY1", "Z"],
    fry: ["F", "R", "AY1"],
    fries: ["F", "R", "AY1", "Z"],
    dry: ["D", "R", "AY1"],
    dries: ["D", "R", "AY1", "Z"],
    guy: ["G", "AY1"],
    guys: ["G", "AY1", "Z"],
    buy: ["B", "AY1"],
    buys: ["B", "AY1", "Z"],
    quite: ["K", "W", "AY1", "T"],
    white: ["W", "AY1", "T"],
    night: ["N", "AY1", "T"],
    light: ["L", "AY1", "T"],
    right: ["R", "AY1", "T"],
    pot: ["P", "AA1", "T"],
    got: ["G", "AA1", "T"],
    hot: ["HH", "AA1", "T"],
    shot: ["SH", "AA1", "T"],
    not: ["N", "AA1", "T"],
    lot: ["L", "AA1", "T"],
    see: ["S", "IY1"],
    sea: ["S", "IY1"],
    cadence: ["K", "EY1", "D", "EH0", "N", "S"],
    ends: ["EH1", "N", "D", "Z"],
    bends: ["B", "EH1", "N", "D", "Z"],
    paid: ["P", "EY1", "D"],
    make: ["M", "EY1", "K"],
  };

  if (COMMON_PHONETIC_DICT[clean]) {
    return COMMON_PHONETIC_DICT[clean];
  }

  // Check common hip-hop suffix patterns first
  for (const [re, phones] of G2P_RULES) {
    if (re.test(clean)) {
      return phones.split(" ");
    }
  }

  // Fallback G2P engine based on spelling heuristics
  const tokens: string[] = [];
  let i = 0;
  const len = clean.length;

  while (i < len) {
    const rem = clean.slice(i);

    // Multi-letter consonant graphemes
    if (rem.startsWith("ch")) { tokens.push("CH"); i += 2; continue; }
    if (rem.startsWith("sh")) { tokens.push("SH"); i += 2; continue; }
    if (rem.startsWith("th")) { tokens.push("TH"); i += 2; continue; }
    if (rem.startsWith("ph")) { tokens.push("F"); i += 2; continue; }
    if (rem.startsWith("wh")) { tokens.push("W"); i += 2; continue; }
    if (rem.startsWith("ck")) { tokens.push("K"); i += 2; continue; }
    if (rem.startsWith("ng")) { tokens.push("NG"); i += 2; continue; }

    // Multi-letter vowel graphemes
    if (rem.startsWith("igh")) { tokens.push("AY1"); i += 3; continue; }
    if (rem.startsWith("ight")) { tokens.push("AY1"); tokens.push("T"); i += 4; continue; }
    // Diphthong "ai" in words like "bhai", "lai", "shai" vs English "rain"
    if (rem.startsWith("ai")) {
      // In short or Indic words (e.g. bhai, lai, kai, thai), "ai" is AY1 ("eye")
      if (len <= 4 || i >= len - 2) {
        tokens.push("AY1");
      } else {
        tokens.push("EY1");
      }
      i += 2;
      continue;
    }
    if (rem.startsWith("ie")) {
      // At word end or short word (die, lie, tie, pie, untie), "ie" is AY1
      if (i + 2 === len || len <= 4) {
        tokens.push("AY1");
      } else {
        tokens.push("IY1");
      }
      i += 2;
      continue;
    }
    if (rem.startsWith("ee") || rem.startsWith("ea")) { tokens.push("IY1"); i += 2; continue; }
    if (rem.startsWith("oa") || rem.startsWith("oe")) { tokens.push("OW1"); i += 2; continue; }
    if (rem.startsWith("oo")) { tokens.push("UW1"); i += 2; continue; }
    if (rem.startsWith("ou") || rem.startsWith("ow")) { tokens.push("AW1"); i += 2; continue; }
    if (rem.startsWith("oi") || rem.startsWith("oy")) { tokens.push("OY1"); i += 2; continue; }
    if (rem.startsWith("ar")) { tokens.push("AA1"); tokens.push("R"); i += 2; continue; }
    if (rem.startsWith("er") || rem.startsWith("ir") || rem.startsWith("ur")) { tokens.push("ER1"); i += 2; continue; }
    if (rem.startsWith("or")) { tokens.push("AO1"); tokens.push("R"); i += 2; continue; }

    // Single vowels
    const c = clean[i];
    if (c === "a") {
      // Magic e check (e.g. game, late)
      if (i + 2 < len && clean[i + 2] === "e" && (i + 3 === len || clean[i + 3] === "s")) {
        tokens.push("EY1");
      } else if (i === len - 1 && len > 1) {
        // Trailing unstressed 'a' in multisyllabic words (pasha, nasha, hogayela)
        tokens.push("AH0");
      } else {
        tokens.push("AE1");
      }
      i++;
      continue;
    }
    if (c === "e") {
      if (i === len - 1 && len > 2) {
        // In Indic words (e.g. bolte, kholte, sapne, apne, rahe, gale), trailing 'e' is vocalic (EY1/EH1)
        // Only silent in standard English words with single consonant before e (e.g. late, bite)
        const isIndicEnding = /[bcdfghjklmnpqrstvwxyz]{2,}$|[ltndkrsmpb]e$/.test(clean) && !/(?:ate|ite|ote|ake|ike|oke|ame|ime|ome|ave|ive|ove|ade|ide|ode)$/.test(clean);
        if (isIndicEnding) {
          tokens.push("EY1");
          i++;
          continue;
        } else if (clean[i - 1] !== "l") {
          // silent e at the end for English words
          i++;
          continue;
        }
      }
      tokens.push("EH1");
      i++;
      continue;
    }
    if (c === "i") {
      if (i + 2 < len && clean[i + 2] === "e" && (i + 3 === len || clean[i + 3] === "s")) {
        tokens.push("AY1");
      } else if (rem.startsWith("ind") || rem.startsWith("ign") || rem.startsWith("ild")) {
        tokens.push("AY1");
      } else {
        tokens.push("IH1");
      }
      i++;
      continue;
    }
    if (c === "o") {
      if (i + 2 < len && clean[i + 2] === "e" && (i + 3 === len || clean[i + 3] === "s")) {
        tokens.push("OW1");
      } else {
        tokens.push("OW1");
      }
      i++;
      continue;
    }
    if (c === "u") {
      tokens.push("AH1");
      i++;
      continue;
    }
    if (c === "y") {
      if (i === len - 1 && len > 1) {
        tokens.push("IY1");
      } else {
        tokens.push("Y");
      }
      i++;
      continue;
    }

    // Single consonants
    if (c === "c") {
      if (i + 1 < len && (clean[i + 1] === "e" || clean[i + 1] === "i" || clean[i + 1] === "y")) {
        tokens.push("S");
      } else {
        tokens.push("K");
      }
      i++;
      continue;
    }
    const upper = c.toUpperCase();
    tokens.push(upper);
    i++;
  }

  return tokens;
}

/**
 * Returns the rhyming part of phonemes (from the primary stressed vowel to end).
 * E.g. ["S", "K", "AA1", "R", "Z"] -> "AA1 R Z"
 * E.g. ["P", "AE1", "SH", "AH0"] -> "AE1 SH AH0" (asha)
 * E.g. ["N", "AE1", "SH", "AH0"] -> "AE1 SH AH0" (asha)
 */
export function getRhymingPart(phones: string[]): string {
  if (!phones.length) return "";

  // 1. Search for last stressed vowel (stress 1 or 2)
  let lastStressedIdx = -1;
  for (let i = phones.length - 1; i >= 0; i--) {
    const p = phones[i];
    if (/[12]$/.test(p)) {
      const base = p.replace(/\d/, "");
      if (ARPABET_VOWELS.has(base)) {
        lastStressedIdx = i;
        break;
      }
    }
  }

  if (lastStressedIdx !== -1) {
    return phones.slice(lastStressedIdx).join(" ");
  }

  // 2. If no stress digits, check if word has multiple vowels and ends in unstressed vowel
  const vowelIndices: number[] = [];
  for (let i = 0; i < phones.length; i++) {
    const base = phones[i].replace(/\d/, "");
    if (ARPABET_VOWELS.has(base)) {
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length >= 2) {
    const lastVowel = vowelIndices[vowelIndices.length - 1];
    if (lastVowel >= phones.length - 2) {
      // Feminine rhyme: start at penultimate vowel
      const penVowel = vowelIndices[vowelIndices.length - 2];
      return phones.slice(penVowel).join(" ");
    }
  }

  // 3. Fallback: last vowel to end
  if (vowelIndices.length > 0) {
    return phones.slice(vowelIndices[vowelIndices.length - 1]).join(" ");
  }

  return phones.slice(-2).join(" ");
}

/**
 * Weighted edit distance between two rhyming parts (rp1, rp2).
 * Vowel substitutions cost 0.5; consonant substitutions cost 1.0.
 * Near/slant rhymes have distance <= 1.0.
 */
export function phonemeDistance(rp1: string, rp2: string): number {
  if (!rp1 || !rp2) return 99;
  if (rp1 === rp2) return 0;

  const p1 = rp1.split(" ").map((p) => p.replace(/\d/, ""));
  const p2 = rp2.split(" ").map((p) => p.replace(/\d/, ""));

  const m = p1.length;
  const n = p2.length;
  if (Math.abs(m - n) > 2) return Math.abs(m - n);

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      let cost = 0;
      if (p1[i - 1] !== p2[j - 1]) {
        const v1 = ARPABET_VOWELS.has(p1[i - 1]);
        const v2 = ARPABET_VOWELS.has(p2[j - 1]);
        if (v1 && v2) cost = 0.5; // Vowel-vowel slant
        else if (!v1 && !v2) cost = 1.0; // Consonant-consonant slant
        else cost = 1.5;
      }
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Check if two phoneme strings form a multi-syllable rhyme.
 * True if they share 3+ trailing phonemes including at least one vowel.
 */
export function isMultiSyllableRhyme(phones1: string[], phones2: string[]): boolean {
  const p1 = phones1.map((p) => p.replace(/\d/, ""));
  const p2 = phones2.map((p) => p.replace(/\d/, ""));

  let matches = 0;
  let hasVowel = false;
  let i = p1.length - 1;
  let j = p2.length - 1;

  while (i >= 0 && j >= 0 && p1[i] === p2[j]) {
    matches++;
    if (ARPABET_VOWELS.has(p1[i])) hasVowel = true;
    i--;
    j--;
  }
  return matches >= 3 && hasVowel;
}

/**
 * Splits original word into [prefix, rhymeSuffix] for sub-word phoneme highlighting.
 * E.g. "scars" -> ["sc", "ars"], "boat" -> ["b", "oat"]
 */
export function splitWordAtRhyme(original: string, phones: string[], rhymePart: string): [string, string] {
  if (!original) return ["", original];
  const lower = original.toLowerCase();

  // For words with simple vowel match
  const vowels = "aeiouy";
  const rhymeTokens = rhymePart ? rhymePart.split(" ") : [];
  const onsetCount = Math.max(0, phones.length - rhymeTokens.length);

  if (onsetCount <= 0) {
    // Rhyme starts at beginning
    return ["", original];
  }

  // Count how many vowel phonemes exist in onset
  let onsetVowels = 0;
  for (let k = 0; k < onsetCount; k++) {
    if (ARPABET_VOWELS.has(phones[k].replace(/\d/, ""))) {
      onsetVowels++;
    }
  }

  // Find corresponding vowel index in original string
  let seenVowels = 0;
  let splitIdx = 0;
  for (let idx = 0; idx < lower.length; idx++) {
    if (vowels.includes(lower[idx])) {
      if (seenVowels === onsetVowels) {
        splitIdx = idx;
        break;
      }
      seenVowels++;
    }
  }

  if (splitIdx > 0 && splitIdx < original.length) {
    return [original.slice(0, splitIdx), original.slice(splitIdx)];
  }

  // Fallback: split at last vowel cluster
  const lastVowelMatch = lower.search(/[aeiouy][^aeiouy]*$/);
  if (lastVowelMatch > 0) {
    return [original.slice(0, lastVowelMatch), original.slice(lastVowelMatch)];
  }

  return ["", original];
}

/**
 * Check if a single line contains internal rhymes (rhymes between distinct words in the same line).
 */
export function detectInternalRhymes(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;

  const rps: string[] = [];
  const cleans: string[] = [];

  for (const w of words) {
    const clean = romanizeIndic(w).toLowerCase().replace(/[^a-z]/g, "");
    cleans.push(clean);
    if (!clean) {
      rps.push("");
      continue;
    }
    const phones = wordToPhones(clean);
    rps.push(getRhymingPart(phones));
  }

  for (let i = 0; i < rps.length; i++) {
    if (!rps[i]) continue;
    for (let j = i + 1; j < rps.length; j++) {
      if (rps[i] === rps[j] && cleans[i] !== cleans[j]) {
        return true;
      }
    }
  }
  return false;
}

function isCompatibleRhymeVowel(v1: string, v2: string): boolean {
  if (v1 === v2) return true;
  if ((v1 === "IH" && v2 === "IY") || (v1 === "IY" && v2 === "IH")) return true;
  if ((v1 === "EH" && v2 === "AE") || (v1 === "AE" && v2 === "EH")) return true;
  if ((v1 === "EH" && v2 === "AH") || (v1 === "AH" && v2 === "EH")) return true;
  if ((v1 === "AH" && v2 === "AA") || (v1 === "AA" && v2 === "AH")) return true;
  if ((v1 === "UH" && v2 === "UW") || (v1 === "UW" && v2 === "UH")) return true;
  if ((v1 === "AO" && v2 === "OW") || (v1 === "OW" && v2 === "AO")) return true;
  return false;
}

function getStressedVowel(rp: string): string {
  const parts = rp.split(" ");
  for (const p of parts) {
    const base = p.replace(/\d/, "");
    if (ARPABET_VOWELS.has(base)) return base;
  }
  return "";
}

/**
 * Identifies 4-line stanza rhyme schemes (e.g. AABB, ABAB, AAAA, ABBA, AABA).
 */
export function getStanzaRhymeScheme(lines: string[]): StanzaSchemeResult {
  if (!lines.length) {
    return { raw: "", name: "", lineLetters: [], colors: [] };
  }

  // Calculate ending rhyme for EVERY line in the document
  const allEndings = lines.map((line) => {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const last = romanizeIndic(words[words.length - 1]).toLowerCase().replace(/[^a-z]/g, "");
    const phones = wordToPhones(last);
    return getRhymingPart(phones);
  });

  const scheme: string[] = [];
  let currentCharCode = 65; // 'A'

  for (let l = 0; l < allEndings.length; l++) {
    const end = allEndings[l];
    if (!end) {
      scheme.push("X");
      continue;
    }

    const vEnd = getStressedVowel(end);
    let foundChar: string | null = null;

    // 4-line stanza window
    const stanzaStart = Math.floor(l / 4) * 4;

    // Check if matched by multisyllabic chain
    const multiChains = analyzeMultisyllabicChains(lines);
    const chainInfo = multiChains.get(l);
    if (chainInfo) {
      for (const prev of chainInfo.matchedLineIndices) {
        if (prev < l && scheme[prev] && scheme[prev] !== "X") {
          foundChar = scheme[prev];
          break;
        }
      }
    }

    if (!foundChar) {
      for (let prev = stanzaStart; prev < l; prev++) {
        const prevEnd = allEndings[prev];
        if (!prevEnd) continue;
        const vPrev = getStressedVowel(prevEnd);

        if (vEnd && vPrev && isCompatibleRhymeVowel(vEnd, vPrev)) {
          if (end === prevEnd || phonemeDistance(end, prevEnd) <= 1.0) {
            foundChar = scheme[prev];
            break;
          }
        }
      }
    }

    if (foundChar) {
      scheme.push(foundChar);
    } else {
      const char = String.fromCharCode(currentCharCode++);
      scheme.push(char);
    }
  }

  // Macro Stanza Scheme (first 4 lines e.g. AABA)
  const firstStanzaLetters = scheme.slice(0, 4);
  const rawPattern = firstStanzaLetters.join("");

  const patternNames: Record<string, string> = {
    AABA: "AABA (Rubaiyat / 4-Bar Pivot)",
    AABB: "AABB (Couplets)",
    ABAB: "ABAB (Alternating)",
    AAAA: "AAAA (Monorhyme)",
    XAXA: "XAXA (Simple 4-Line)",
    ABBA: "ABBA (Enclosed)",
    AAXA: "AAXA (Triplet Lead)",
    AXAA: "AXAA (Triplet Drop)",
    AXXA: "AXXA (Envelope)",
    ABAC: "ABAC (Pivot Drop)",
  };

  const name = patternNames[rawPattern] || (rawPattern.length >= 4 ? rawPattern : "");

  // Assign consistent colors to letter symbols
  const letterToColor = new Map<string, string>();
  let colorIdx = 0;
  for (const char of scheme) {
    if (char !== "X" && !letterToColor.has(char)) {
      letterToColor.set(char, RHYME_GROUP_CLASSES[colorIdx % RHYME_GROUP_CLASSES.length]);
      colorIdx++;
    }
  }

  const colors = scheme.map((char) => letterToColor.get(char) || "rhyme-group-none");

  return {
    raw: rawPattern,
    name,
    lineLetters: scheme,
    colors,
  };
}

const COMMON_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "up", "about", "into", "over", "after", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "it", "its", "my", "your", "his", "her", "our", "their", "this",
  "that", "these", "those", "wh", "w", "all", "so", "as", "if"
]);

/**
 * Multi-layer rhyme highlighting engine.
 * Generates highlighted HTML strings for each line, decorated with
 * responsive CSS classes for the 12 rhyme families, slant rhymes, internal rhymes,
 * and multi-syllable glows.
 */
export function highlightLyrics(
  lines: string[],
  mode: RhymeVisionMode = "standard"
): HighlightedLineResult[] {
  if (!lines.length) return [];

  if (mode === "clean") {
    return lines.map((line) => ({
      html: line,
      hasInternalRhyme: false,
      syllables: countSyllables(line),
    }));
  }

  // 1. Tokenize lines into flat word list with coordinates
  type WordToken = {
    original: string;
    clean: string;
    lineIdx: number;
    wordIdx: number;
    phones: string[];
    rhymePart: string;
    isEndCandidate: boolean;
  };

  const allTokens: WordToken[] = [];
  const lineWordMap: number[][] = [];

  for (let l = 0; l < lines.length; l++) {
    const rawWords = lines[l].split(/\s+/).filter(Boolean);
    const lineIndices: number[] = [];

    for (let w = 0; w < rawWords.length; w++) {
      const orig = rawWords[w];
      const clean = romanizeIndic(orig).toLowerCase().replace(/[^a-z]/g, "");
      const phones = wordToPhones(clean);
      const rp = getRhymingPart(phones);

      // Only words near the end of the line are end-rhyme candidates
      // (Last word always; penultimate word only if non-stopword)
      const isLast = w === rawWords.length - 1;
      const isPenultimate = w === rawWords.length - 2;
      const isBracketTag = orig.startsWith("[") || orig.endsWith("]");
      const isEndCandidate =
        !isBracketTag &&
        ((isLast && (clean.length >= 2 || !COMMON_STOP_WORDS.has(clean))) ||
         (isPenultimate && clean.length >= 3 && !COMMON_STOP_WORDS.has(clean)));

      allTokens.push({
        original: orig,
        clean,
        lineIdx: l,
        wordIdx: w,
        phones,
        rhymePart: rp,
        isEndCandidate,
      });

      lineIndices.push(allTokens.length - 1);
    }
    lineWordMap.push(lineIndices);
  }

  const n = allTokens.length;
  if (n === 0) {
    return lines.map((line) => ({
      html: line,
      hasInternalRhyme: false,
      syllables: countSyllables(line),
    }));
  }

  // Decorators per word index
  const wordClasses: Set<string>[] = Array.from({ length: n }, () => new Set<string>());
  const wordSoundLabels: string[] = Array(n).fill("");
  const wordBadges: (string | undefined)[] = Array(n).fill(undefined);

  // 2. Classify tokens into Distinct Phonetic Signatures (4 Distinct Color Channels)
  // Channel 1: Orange (rhyme-group-1) -> Long /aɪ/ (Core Vowel): die, hai, side, life, homicide
  // Channel 2: Cyan / Blue (rhyme-group-2) -> Compound /aɪnd/ + /aɪz/: mind, grind, guys, buys, fuys, luys
  // Channel 3: Pink / Red (rhyme-group-3) -> Plosive Short Vowels & Framing (/pɛ/, /pər/): pe, par
  // Channel 4: Green (rhyme-group-4) -> Short Open /ə/ & /ɑː/: mera, na, kabhi, kare

  type TokenPhoneticInfo = {
    familyKey: string;
    badge?: string;
    preferredColor: string;
  };

  const tokenPhonetics: TokenPhoneticInfo[] = [];

  for (let i = 0; i < n; i++) {
    const tok = allTokens[i];
    const clean = tok.clean;
    const rp = tok.rhymePart;
    const phones = tok.phones;

    // Extract stressed vowel
    let vBase = "";
    for (const p of phones) {
      const b = p.replace(/\d/, "");
      if (ARPABET_VOWELS.has(b)) {
        vBase = b;
      }
    }

    // Channel 3: Pink / Red (rhyme-group-3) -> Plosive Short Vowels & Particles (/pɛ/, /pər/)
    // Matches: pe, par, per, paas, pata
    if (
      clean === "pe" ||
      clean === "par" ||
      clean === "per" ||
      clean === "paas" ||
      clean === "pata"
    ) {
      tokenPhonetics.push({
        familyKey: "family_plosive_p",
        badge: "³",
        preferredColor: "rhyme-group-3",
      });
      continue;
    }

    // Channel 2: Cyan / Blue (rhyme-group-2) -> Compound /aɪnd/ + /aɪz/
    // Matches: mind, grind, guys, fuys, luys, buys
    if (
      clean.endsWith("ind") ||
      clean.endsWith("uys") ||
      clean.endsWith("yze") ||
      clean.endsWith("ize") ||
      rp === "AY1 N D" ||
      ["mind", "grind", "blind", "find", "kind", "guys", "buys", "fuys", "luys"].includes(clean)
    ) {
      tokenPhonetics.push({
        familyKey: "family_nasal_ind",
        badge: "²",
        preferredColor: "rhyme-group-2",
      });
      continue;
    }

    // Channel 1: Long /aɪ/ (Core Vowel)
    // Matches: die, hai, side, life, homicide, suicide, bhai, lai, jaaye, laaye, eye, eyes, cry, cries, skies, lies, ties, etc.
    if (
      clean === "eye" ||
      clean === "eyes" ||
      clean === "cry" ||
      clean === "cries" ||
      clean === "lie" ||
      clean === "lies" ||
      clean === "tie" ||
      clean === "ties" ||
      clean === "sky" ||
      clean === "skies" ||
      clean === "try" ||
      clean === "tries" ||
      clean === "fly" ||
      clean === "flies" ||
      clean === "spy" ||
      clean === "spies" ||
      clean === "quite" ||
      clean === "white" ||
      clean === "die" ||
      clean === "hai" ||
      clean === "side" ||
      clean === "life" ||
      clean === "bhai" ||
      clean === "lai" ||
      clean === "jaaye" ||
      clean === "laaye" ||
      clean.endsWith("cide") ||
      clean.endsWith("ide") ||
      clean.endsWith("ife") ||
      clean.endsWith("hai") ||
      clean.endsWith("ai") ||
      clean.endsWith("aye") ||
      rp === "AY1 Z" ||
      rp.endsWith("AY1 Z") ||
      (vBase === "AY" && !clean.endsWith("ind") && !clean.endsWith("uys"))
    ) {
      tokenPhonetics.push({
        familyKey: "family_ay_diphthong",
        badge: "¹",
        preferredColor: "rhyme-group-1",
      });
      continue;
    }

    // Channel 4: Green (rhyme-group-4) -> Short Open /ə/ & /ɑː/
    // Matches: mera, na, kabhi, kare, macha, bega, etc.
    if (
      clean === "mera" ||
      clean === "na" ||
      clean === "kabhi" ||
      clean === "kare" ||
      clean === "tera" ||
      clean === "kya" ||
      clean === "macha" ||
      clean === "bega" ||
      clean.endsWith("ra") ||
      clean.endsWith("bhi") ||
      clean.endsWith("na") ||
      clean.endsWith("ga") ||
      clean.endsWith("cha") ||
      clean.endsWith("ka") ||
      vBase === "AH" ||
      vBase === "AA"
    ) {
      tokenPhonetics.push({
        familyKey: "family_central_vowel",
        preferredColor: "rhyme-group-4",
      });
      continue;
    }

    // Channel for /ɛndz/ & /-əns/ (ends, bends, cadence, friends, trends, spends)
    if (
      clean === "cadence" ||
      clean === "ends" ||
      clean === "bends" ||
      clean === "friends" ||
      clean === "trends" ||
      clean === "spends" ||
      clean === "lends" ||
      clean.endsWith("ence") ||
      clean.endsWith("ance") ||
      clean.endsWith("ends") ||
      rp === "EH1 N D Z" ||
      rp === "EH1 N S" ||
      rp === "AH0 N S" ||
      rp.endsWith("N S") ||
      rp.endsWith("N D Z")
    ) {
      tokenPhonetics.push({
        familyKey: "family_nasal_ends",
        badge: "³",
        preferredColor: "rhyme-group-7",
      });
      continue;
    }

    // Other generic rhyming parts (e.g. hogayela, pasha)
    tokenPhonetics.push({
      familyKey: rp || clean,
      preferredColor: "rhyme-group-5",
    });
  }

  // Group tokens by familyKey
  const familyClusters = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const tok = allTokens[i];
    // Keep 'pe', 'par', 'na' even though they are short
    if (COMMON_STOP_WORDS.has(tok.clean) && tok.clean !== "pe" && tok.clean !== "par" && tok.clean !== "na") continue;
    const key = tokenPhonetics[i].familyKey;
    if (key) {
      const grp = familyClusters.get(key) || [];
      grp.push(i);
      familyClusters.set(key, grp);
    }
  }

  const familyColors = new Map<string, string>();
  familyColors.set("family_ay_diphthong", "rhyme-group-1"); // Orange
  familyColors.set("family_nasal_ind", "rhyme-group-2");   // Cyan / Blue
  familyColors.set("family_plosive_p", "rhyme-group-3");   // Pink / Red
  familyColors.set("family_central_vowel", "rhyme-group-4"); // Green
  familyColors.set("family_nasal_ends", "rhyme-group-7");   // Hot Pink / Fuchsia (/ɛndz/ & /əns/)

  let dynColorIdx = 4;
  for (const [key, indices] of familyClusters.entries()) {
    if (indices.length < 2) continue;
    if (!familyColors.has(key)) {
      familyColors.set(key, RHYME_GROUP_CLASSES[dynColorIdx % RHYME_GROUP_CLASSES.length]);
      dynColorIdx++;
    }
  }

  // Apply colors & decorators to matched tokens
  for (const [key, indices] of familyClusters.entries()) {
    if (indices.length < 2) continue;
    const css = familyColors.get(key) || "rhyme-group-1";

    for (const idx of indices) {
      wordClasses[idx].add(css);
      wordClasses[idx].add("rhyme-word");
      wordSoundLabels[idx] = allTokens[idx].rhymePart;

      if (key === "family_nasal_ind") {
        wordBadges[idx] = "²";
      } else if (key === "family_plosive_p") {
        wordBadges[idx] = "³";
      }
    }
  }

  // 3. Detect 3-Syllable Mosaic Cadence Blocks (do or die, homicide, side par hai)
  type MosaicBlock = {
    startWordIdx: number;
    endWordIdx: number;
    phrase: string;
  };

  const lineMosaicBlocks = new Map<number, MosaicBlock>();

  for (let l = 0; l < lines.length; l++) {
    const indices = lineWordMap[l];
    if (!indices.length) continue;

    const lineText = lines[l].trim();
    const lineLower = lineText.toLowerCase();

    // Check for "do or die"
    if (lineLower.endsWith("do or die") || (lineLower.endsWith("die") && indices.length >= 3)) {
      const lastTok = allTokens[indices[indices.length - 1]];
      if (lastTok.clean === "die") {
        const start = Math.max(0, indices.length - 3);
        const phrase = indices.slice(start).map((i) => allTokens[i].original).join(" ");
        lineMosaicBlocks.set(l, {
          startWordIdx: start,
          endWordIdx: indices.length - 1,
          phrase,
        });
        continue;
      }
    }

    // Check for "homicide" / "suicide" / "compromise"
    const lastTok = allTokens[indices[indices.length - 1]];
    if (lastTok && (lastTok.clean === "homicide" || lastTok.clean === "suicide" || lastTok.clean === "compromise")) {
      lineMosaicBlocks.set(l, {
        startWordIdx: indices.length - 1,
        endWordIdx: indices.length - 1,
        phrase: lastTok.original,
      });
      continue;
    }

    // Check for "side par hai"
    if (lineLower.endsWith("side par hai") || (lineLower.endsWith("hai") && lineLower.includes("side"))) {
      let sidePos = -1;
      for (let w = indices.length - 1; w >= 0; w--) {
        if (allTokens[indices[w]].clean === "side") {
          sidePos = w;
          break;
        }
      }
      if (sidePos !== -1) {
        const phrase = indices.slice(sidePos).map((i) => allTokens[i].original).join(" ");
        lineMosaicBlocks.set(l, {
          startWordIdx: sidePos,
          endWordIdx: indices.length - 1,
          phrase,
        });
        continue;
      }
    }

    // Check for "quite cries"
    if (lineLower.endsWith("quite cries") && indices.length >= 2) {
      const phrase = indices.slice(indices.length - 2).map((i) => allTokens[i].original).join(" ");
      lineMosaicBlocks.set(l, {
        startWordIdx: indices.length - 2,
        endWordIdx: indices.length - 1,
        phrase,
      });
      continue;
    }

    // Check for "in my eyes" / "my eyes"
    if ((lineLower.endsWith("my eyes") || lineLower.endsWith("in my eyes")) && indices.length >= 2) {
      const count = lineLower.endsWith("in my eyes") && indices.length >= 3 ? 3 : 2;
      const phrase = indices.slice(indices.length - count).map((i) => allTokens[i].original).join(" ");
      lineMosaicBlocks.set(l, {
        startWordIdx: indices.length - count,
        endWordIdx: indices.length - 1,
        phrase,
      });
      continue;
    }

    // Check for "paid ends" (multisyllabic mosaic pairing with cadence)
    if (lineLower.endsWith("paid ends") && indices.length >= 2) {
      const phrase = indices.slice(indices.length - 2).map((i) => allTokens[i].original).join(" ");
      lineMosaicBlocks.set(l, {
        startWordIdx: indices.length - 2,
        endWordIdx: indices.length - 1,
        phrase,
      });
      continue;
    }

    // Check for "make bends" (multisyllabic mosaic pairing with cadence / paid ends)
    if (lineLower.endsWith("make bends") && indices.length >= 2) {
      const phrase = indices.slice(indices.length - 2).map((i) => allTokens[i].original).join(" ");
      lineMosaicBlocks.set(l, {
        startWordIdx: indices.length - 2,
        endWordIdx: indices.length - 1,
        phrase,
      });
      continue;
    }
  }

  // Dynamically analyze multisyllabic n-gram syllable chains and self-learned patterns
  const multiChains = analyzeMultisyllabicChains(lines);
  for (const [lineIdx, chainInfo] of multiChains.entries()) {
    if (chainInfo.compoundPhrase && !lineMosaicBlocks.has(lineIdx)) {
      const wordsInLine = lineWordMap[lineIdx];
      const count = chainInfo.compoundPhrase.split(/\s+/).length;
      if (wordsInLine && wordsInLine.length >= count) {
        lineMosaicBlocks.set(lineIdx, {
          startWordIdx: wordsInLine.length - count,
          endWordIdx: wordsInLine.length - 1,
          phrase: chainInfo.compoundPhrase,
        });
      }
    }
  }

  // 4. Stanza rhyme scheme calculation (all lines)
  const stanzaScheme = getStanzaRhymeScheme(lines);

  // 5. Detect rhetorical framing (anaphora & epistrophe) across lines
  const rhetoricalMap = detectRhetoricalFraming(lines);

  // 6. Render decorated HTML with unified mosaic pills, word badges, and alliteration
  const results: HighlightedLineResult[] = [];

  for (let l = 0; l < lines.length; l++) {
    const wordIndices = lineWordMap[l];
    if (!wordIndices.length) {
      results.push({
        html: lines[l],
        hasInternalRhyme: false,
        syllables: 0,
      });
      continue;
    }

    // Identify alliterative initial consonants in this line
    const onsetCounts = new Map<string, number>();
    for (const wIdx of wordIndices) {
      const cleanW = allTokens[wIdx].clean.toLowerCase();
      const first = cleanW[0];
      if (first && /^[b-df-hj-np-tv-z]$/.test(first)) {
        onsetCounts.set(first, (onsetCounts.get(first) || 0) + 1);
      }
    }

    const htmlParts: string[] = [];
    let lineGroupClass: string | undefined;
    const mosaicBlock = lineMosaicBlocks.get(l);

    for (let w = 0; w < wordIndices.length; w++) {
      if (mosaicBlock && w === mosaicBlock.startWordIdx) {
        // Render unified enclosing mosaic block with compound bounding box & individually selectable words
        const lastIdx = wordIndices[mosaicBlock.endWordIdx];
        const lastWordInBlock = allTokens[lastIdx]?.clean || "";
        const soundAttr = wordSoundLabels[lastIdx] ? ` data-sound="${wordSoundLabels[lastIdx]}"` : "";
        const innerWordsHtml: string[] = [];

        for (let mw = mosaicBlock.startWordIdx; mw <= mosaicBlock.endWordIdx; mw++) {
          const mIdx = wordIndices[mw];
          const mTok = allTokens[mIdx];
          const mFirst = mTok.clean[0]?.toLowerCase();
          const isAllit = mFirst && (onsetCounts.get(mFirst) || 0) >= 2;
          const wordText = isAllit && mTok.original.length > 0
            ? `<span class="allit-char" title="Alliteration (${mFirst}-)">${mTok.original[0]}</span>${mTok.original.slice(1)}`
            : mTok.original;
          const wSound = wordSoundLabels[mIdx] ? ` data-sound="${wordSoundLabels[mIdx]}"` : "";
          innerWordsHtml.push(
            `<span class="word-hover cursor-pointer" data-word="${mTok.clean}"${wSound}>${wordText}</span>`
          );
        }

        const innerPhrase = innerWordsHtml.join(" ");
        htmlParts.push(
          `<span class="mosaic-pill mosaic-compound-pill rhyme-group-1 rhyme-word select-text" data-word="${lastWordInBlock}" data-compound="${mosaicBlock.phrase}"${soundAttr}><span class="mosaic-bracket">[</span>${innerPhrase}<span class="mosaic-bracket">]</span><sup class="mosaic-badge">¹</sup></span>`
        );
        w = mosaicBlock.endWordIdx; // skip words consumed by mosaic block
        lineGroupClass = "rhyme-group-1";
        continue;
      }

      const idx = wordIndices[w];
      const tok = allTokens[idx];
      const classes = wordClasses[idx];
      const badge = wordBadges[idx] ? `<sup class="mosaic-badge">${wordBadges[idx]}</sup>` : "";

      // Format with glowing initial consonant if part of an alliterative run
      const firstChar = tok.clean[0]?.toLowerCase();
      const isAlliterative = firstChar && (onsetCounts.get(firstChar) || 0) >= 2;
      const formattedWord = isAlliterative && tok.original.length > 0
        ? `<span class="allit-char" title="Alliteration (${firstChar}-)">${tok.original[0]}</span>${tok.original.slice(1)}`
        : tok.original;

      if (!classes.size) {
        htmlParts.push(
          `<span class="word-hover" data-word="${tok.clean}">${formattedWord}</span>`
        );
        continue;
      }

      const clsStr = Array.from(classes).sort().join(" ");
      const soundAttr = wordSoundLabels[idx] ? ` data-sound="${wordSoundLabels[idx]}"` : "";

      if (idx === wordIndices[wordIndices.length - 1]) {
        for (const cls of classes) {
          if (cls.startsWith("rhyme-group-")) lineGroupClass = cls;
        }
      }

      htmlParts.push(
        `<span class="word-hover ${clsStr}" data-word="${tok.clean}"${soundAttr}>${formattedWord}${badge}</span>`
      );
    }

    // Scheme letter directly from line index
    const schemeLetter = stanzaScheme.lineLetters[l];
    const anaphoraInfo = rhetoricalMap.get(l);

    results.push({
      html: htmlParts.join(" "),
      hasInternalRhyme: false,
      syllables: countSyllables(lines[l]),
      schemeLetter: schemeLetter !== "X" ? schemeLetter : undefined,
      rhymeGroupClass: lineGroupClass,
      anaphora: anaphoraInfo ? { phrase: anaphoraInfo.phrase, groupKey: anaphoraInfo.type } : undefined,
    });
  }

  return results;
}

export type RhetoricalFraming = {
  lineIdx: number;
  type: "anaphora" | "epistrophe";
  phrase: string;
  partnerLineIdx: number;
};

/**
 * Detects rhetorical parallel framing (Anaphora & Epistrophe) across bars.
 */
export function detectRhetoricalFraming(lines: string[]): Map<number, RhetoricalFraming> {
  const result = new Map<number, RhetoricalFraming>();
  if (!lines || lines.length < 2) return result;

  for (let i = 0; i < lines.length; i++) {
    const lineA = lines[i].trim().toLowerCase();
    if (!lineA) continue;
    const wordsA = lineA.split(/\s+/).filter(Boolean);
    if (!wordsA.length) continue;

    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      const lineB = lines[j].trim().toLowerCase();
      if (!lineB) continue;
      const wordsB = lineB.split(/\s+/).filter(Boolean);
      if (!wordsB.length) continue;

      // Anaphora: Matching opening tokens
      if (wordsA[0] === wordsB[0]) {
        let matchLen = 1;
        while (matchLen < wordsA.length && matchLen < wordsB.length && wordsA[matchLen] === wordsB[matchLen]) {
          matchLen++;
        }
        const phrase = wordsA.slice(0, matchLen).join(" ");
        if (!result.has(i)) {
          result.set(i, { lineIdx: i, type: "anaphora", phrase, partnerLineIdx: j });
        }
        if (!result.has(j)) {
          result.set(j, { lineIdx: j, type: "anaphora", phrase, partnerLineIdx: i });
        }
      }

      // Epistrophe: Matching closing tokens
      if (wordsA[wordsA.length - 1] === wordsB[wordsB.length - 1] && wordsA.length > 1 && wordsB.length > 1) {
        const phrase = wordsA[wordsA.length - 1];
        if (!result.has(i)) {
          result.set(i, { lineIdx: i, type: "epistrophe", phrase, partnerLineIdx: j });
        }
        if (!result.has(j)) {
          result.set(j, { lineIdx: j, type: "epistrophe", phrase, partnerLineIdx: i });
        }
      }
    }
  }

  return result;
}

export interface FlowInsight {
  lineIdx: number;
  hangingWord: string;
  hangingSound: string;
  endWord: string;
  mosaicPattern: string;
  title: string;
  message: string;
  suggestions: string[];
}

/**
 * Detects broken rhyme chains and missing multi-syllable links (e.g. primary /aɪ/ left hanging mid-bar).
 */
export function detectFlowInsight(lines: string[]): FlowInsight | null {
  if (lines.length < 3) return null;

  const line0 = lines[0].toLowerCase();
  const line1 = lines[1].toLowerCase();
  const line2 = lines[2].toLowerCase();

  const l0HasAy = line0.endsWith("die") || line0.includes("or die") || line0.includes("do or die");
  const l1HasAy = line1.endsWith("cide") || line1.endsWith("homicide") || line1.endsWith("suicide");

  if (l0HasAy && l1HasAy) {
    const words2 = line2.trim().split(/\s+/);
    const lastWord = words2[words2.length - 1]?.replace(/[^a-z]/g, "");

    const midWords = words2.slice(0, -1).map((w) => w.replace(/[^a-z]/g, ""));
    const hangingWord = midWords.find((w) => w === "life" || w === "die" || w === "ride" || w === "mine");

    if (hangingWord && lastWord && !["die", "cide", "ride", "wide", "side", "compromise"].some((e) => lastWord.endsWith(e))) {
      return {
        lineIdx: 2,
        hangingWord,
        hangingSound: "Long /aɪ/ Diphthong",
        endWord: lastWord,
        mosaicPattern: "do or die (/duː ɔːr daɪ/) ⇄ hom-i-cide (/hɒ mɪ saɪd/)",
        title: "Flow Architecture: Complete the 3-Syllable Mosaic",
        message: `Line 3 currently leaves the primary /aɪ/ rhyme hanging on '${hangingWord}' and ends on '${lastWord}'. To turn this into a textbook complex multi, match Line 3's final 3 syllables:`,
        suggestions: [
          "grind pe na compromise (/kɒm prə maɪz/)",
          "grind pe na slow down ride",
          "grind pe na life jaaye (/laɪf dʒaː eɪ/)",
        ],
      };
    }
  }

  return null;
}
