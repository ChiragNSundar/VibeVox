// Multi-Level Hybrid RAG Retrieval Engine with Reciprocal Rank Fusion (RRF).
//
// Combines 3 parallel retrieval streams:
//   1. Semantic Vector Similarity (Topic + Attitude)
//   2. Cadence Pocket Alignment (Target Syllable Count ±1)
//   3. POS & Metaphor Scheme Matching (Dictionary Rimes & Tags)
//
// Merges all streams using RRF: Score = sum(1 / (k + rank_i))

import { recallStyleExamples, type RecalledExample } from "./style-recall";
import { loadStyleMemory, DEFAULT_STYLE_SEEDS, type StyleMemoryEntry } from "./style-memory";
import { countSyllables, endRhymeKey } from "./lyrics-analysis";
import { findRhymesWithPos } from "./indic-dictionary";

export type HybridRecallOptions = {
  count?: number;
  targetSyllables?: number;
  vibe?: string;
  genre?: string;
  language?: "kannada" | "hinglish" | "auto";
};

export async function recallHybridStyleExamples(
  query: string,
  opts: HybridRecallOptions = {},
): Promise<RecalledExample[]> {
  const k = 60; // RRF constant
  const targetCount = opts.count ?? 4;
  const memories = loadStyleMemory();
  const pool = memories.length ? memories : DEFAULT_STYLE_SEEDS;

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
  const queryRhymes = findRhymesWithPos(query, opts.language ?? "auto");
  const topRimes = new Set(queryRhymes.map((r) => r.rime_key).filter(Boolean));

  const posRanked = [...pool].sort((a, b) => {
    const rimeHitsA = a.bars.filter((bar) => topRimes.has(endRhymeKey(bar))).length;
    const rimeHitsB = b.bars.filter((bar) => topRimes.has(endRhymeKey(bar))).length;
    return rimeHitsB - rimeHitsA;
  });

  // Calculate RRF scores
  const rrfScores = new Map<string, { entry: StyleMemoryEntry; score: number }>();

  // Helper to add RRF points
  const addRank = (entry: StyleMemoryEntry, rankIndex: number) => {
    const current = rrfScores.get(entry.id) || { entry, score: 0 };
    current.score += 1 / (k + rankIndex + 1);
    rrfScores.set(entry.id, current);
  };

  // Rank Stream 1
  semanticHits.forEach((hit, rank) => {
    const matchEntry = pool.find((e) => e.bars.join("\n") === hit.bars.join("\n")) || pool[rank % pool.length];
    addRank(matchEntry, rank);
  });

  // Rank Stream 2
  cadenceRanked.slice(0, 15).forEach((entry, rank) => addRank(entry, rank));

  // Rank Stream 3
  posRanked.slice(0, 15).forEach((entry, rank) => addRank(entry, rank));

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
    ]
      .filter(Boolean)
      .join(" · "),
  }));
}
