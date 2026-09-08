// Multi-Level Hybrid RAG Retrieval Engine with Reciprocal Rank Fusion (RRF) 2.0.
//
// Combines 4 parallel retrieval streams:
//   1. Semantic Vector Similarity (Topic + Attitude)
//   2. Cadence Pocket Alignment (Target Syllable Count ±1)
//   3. POS & Metaphor Scheme Matching (Dictionary Rimes & Tags)
//   4. Indic Poetic Structure Stream (Dwitiyakshara Prasa, Qafiya-Radif & Antyaprasa)
//
// Merges all streams using RRF: Score = sum(1 / (k + rank_i))
// Supports single language and multi-language code-switching ("blend").

import { recallStyleExamples, type RecalledExample } from "./style-recall";
import { loadStyleMemory, loadUnifiedStyleMemory, DEFAULT_STYLE_SEEDS, type StyleMemoryEntry } from "./style-memory";
import { countSyllables, endRhymeKey } from "./lyrics-analysis";
import { findRhymesWithPos } from "./indic-dictionary";
import {
  matchDwitiyakshara,
  matchQafiyaRadif,
  KANGLISH_MULTIRIMES,
  HINGLISH_MULTIRIMES,
} from "./indic-poetics";

export type HybridRecallOptions = {
  count?: number;
  targetSyllables?: number;
  vibe?: string;
  genre?: string;
  language?: "kannada" | "hinglish" | "blend" | "auto";
  languages?: string[];
};

export async function recallHybridStyleExamples(
  query: string,
  opts: HybridRecallOptions = {},
): Promise<RecalledExample[]> {
  const k = 60; // RRF constant
  const targetCount = opts.count ?? 4;
  const memories = loadUnifiedStyleMemory();
  const pool = memories.length ? memories : DEFAULT_STYLE_SEEDS;

  // Resolve language targeting
  let lang = opts.language ?? "auto";
  if (opts.languages && opts.languages.length > 1) {
    const hasKn = opts.languages.some((l) => l.includes("kanglish") || l.includes("kannada"));
    const hasHi = opts.languages.some((l) => l.includes("hinglish") || l.includes("hindi"));
    if (hasKn && hasHi) lang = "blend";
    else if (hasKn) lang = "kannada";
    else if (hasHi) lang = "hinglish";
  }

  // Stream 1: Semantic Vector Similarity
  const semanticHits = await recallStyleExamples(query, {
    count: Math.max(8, targetCount * 2),
    filter: { vibe: opts.vibe, genre: opts.genre },
  });

  // Stream 2: Cadence Pocket Alignment (ranking entries by syllable delta)
  const targetSyl = opts.targetSyllables ?? 10;
  const cadenceRanked = [...pool].sort((a, b) => {
    const avgA = a.bars.reduce((s, bar) => s + countSyllables(bar), 0) / (a.bars.length || 1);
    const avgB = b.bars.reduce((s, bar) => s + countSyllables(bar), 0) / (b.bars.length || 1);
    return Math.abs(avgA - targetSyl) - Math.abs(avgB - targetSyl);
  });

  // Stream 3: POS & Metaphor Scheme Matching (matching rime keys)
  const queryRhymes = findRhymesWithPos(query, lang === "blend" ? "blend" : lang);
  const topRimes = new Set(queryRhymes.map((r) => r.rime_key).filter(Boolean));

  const posRanked = [...pool].sort((a, b) => {
    const rimeHitsA = a.bars.filter((bar) => topRimes.has(endRhymeKey(bar))).length;
    const rimeHitsB = b.bars.filter((bar) => topRimes.has(endRhymeKey(bar))).length;
    return rimeHitsB - rimeHitsA;
  });

  // Stream 4: Indic Poetics & Prasa Stream
  // Evaluates Dwitiyakshara Prasa for Kannada and Qafiya-Radif for Hindi
  const poeticsRanked = [...pool].sort((a, b) => {
    const scoreEntry = (entry: StyleMemoryEntry): number => {
      let pts = 0;
      for (let i = 0; i < entry.bars.length - 1; i++) {
        const b1 = entry.bars[i] || "";
        const b2 = entry.bars[i + 1] || "";

        // Kannada: Dwitiyakshara Prasa check
        if (lang === "kannada" || lang === "blend" || lang === "auto") {
          const w1 = b1.trim().split(/\s+/)[0] || "";
          const w2 = b2.trim().split(/\s+/)[0] || "";
          if (matchDwitiyakshara(w1, w2)) pts += 3;

          const end1 = endRhymeKey(b1).toLowerCase();
          const end2 = endRhymeKey(b2).toLowerCase();
          if (KANGLISH_MULTIRIMES.some((mr) => end1.endsWith(mr) || end2.endsWith(mr))) pts += 2;
        }

        // Hindi: Qafiya & Radif check
        if (lang === "hinglish" || lang === "blend" || lang === "auto") {
          const qr = matchQafiyaRadif(b1, b2);
          if (qr.matches) pts += 3;
          if (qr.radifMatch) pts += 2;

          const end1 = endRhymeKey(b1).toLowerCase();
          const end2 = endRhymeKey(b2).toLowerCase();
          if (HINGLISH_MULTIRIMES.some((mr) => end1.endsWith(mr) || end2.endsWith(mr))) pts += 2;
        }
      }
      return pts;
    };

    return scoreEntry(b) - scoreEntry(a);
  });

  // Calculate RRF scores across all 4 streams
  const rrfScores = new Map<string, { entry: StyleMemoryEntry; score: number }>();

  // Helper to add RRF points
  const addRank = (entry: StyleMemoryEntry, rankIndex: number) => {
    const current = rrfScores.get(entry.id) || { entry, score: 0 };
    current.score += 1 / (k + rankIndex + 1);
    rrfScores.set(entry.id, current);
  };

  // Rank Stream 1 (Semantic)
  semanticHits.forEach((hit, rank) => {
    const matchEntry = pool.find((e) => e.bars.join("\n") === hit.bars.join("\n")) || pool[rank % pool.length];
    addRank(matchEntry, rank);
  });

  // Rank Stream 2 (Cadence)
  cadenceRanked.slice(0, 15).forEach((entry, rank) => addRank(entry, rank));

  // Rank Stream 3 (POS / Rime)
  posRanked.slice(0, 15).forEach((entry, rank) => addRank(entry, rank));

  // Rank Stream 4 (Indic Poetics / Prasa)
  poeticsRanked.slice(0, 15).forEach((entry, rank) => addRank(entry, rank));

  // Sort candidates by combined RRF score
  const sorted = Array.from(rrfScores.values()).sort((a, b) => b.score - a.score);
  const selected = sorted.slice(0, targetCount);

  return selected.map(({ entry, score }) => ({
    bars: entry.bars.slice(0, 8),
    meta: [
      entry.vibe ? `vibe: ${entry.vibe}` : null,
      entry.genre ? `genre: ${entry.genre}` : null,
      `drakeScore: ${entry.drakeScore.toFixed(1)}/10`,
      `rrfScore: ${(score * 100).toFixed(1)}`,
      lang !== "auto" ? `poetics: ${lang}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));
}
