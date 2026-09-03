// Writer's Headspace — Semantic & Emotional RAG Retrieval Engine
//
// Recalls relevant real-life thoughts, emotions, and raw journal reflections
// from the local IndexedDB journal store, fusing lexical keyword matching
// with emotional mood alignment and semantic relevance.

import { getJournalEntries, type JournalEntry } from "./local-store";

export type JournalRecallResult = {
  entry: JournalEntry;
  score: number;
  matchReason: string;
};

export type JournalRecallOptions = {
  mood?: string;
  limit?: number;
};

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "and", "or", "but", "so", "is", "was", "are", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "i", "me", "my", "myself", "we",
  "our", "you", "your", "he", "she", "it", "they", "them", "that", "this",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Recalls the most contextually and emotionally relevant journal entries
 * given the active lyrics or theme query.
 */
export async function recallRelevantJournalEntries(
  query: string,
  opts: JournalRecallOptions = {}
): Promise<JournalRecallResult[]> {
  const entries = await getJournalEntries().catch(() => []);
  if (!entries.length || !query.trim()) return [];

  const limit = opts.limit ?? 3;
  const targetMood = opts.mood?.toLowerCase().trim();
  const queryTokens = new Set(tokenize(query));

  const scored: JournalRecallResult[] = [];

  for (const entry of entries) {
    const entryTokens = tokenize(entry.content);
    let overlapCount = 0;
    const matchedWords: string[] = [];

    for (const t of entryTokens) {
      if (queryTokens.has(t)) {
        overlapCount++;
        matchedWords.push(t);
      }
    }

    // Lexical Jaccard-like score
    const totalTokens = new Set([...queryTokens, ...entryTokens]).size;
    const lexicalScore = totalTokens > 0 ? overlapCount / totalTokens : 0;

    // Mood match bonus
    const moodMatches = targetMood && entry.mood.toLowerCase() === targetMood;
    const moodBonus = moodMatches ? 0.35 : 0;

    // Recency bonus: mild bias toward thoughts written in last 7 days
    const ageDays = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
    const recencyBonus = ageDays <= 7 ? 0.15 : ageDays <= 30 ? 0.05 : 0;

    const finalScore = lexicalScore * 2.0 + moodBonus + recencyBonus;

    let reason = "Thematic connection";
    if (moodMatches && overlapCount > 0) {
      reason = `Mood (${entry.mood}) + keywords: ${matchedWords.slice(0, 3).join(", ")}`;
    } else if (moodMatches) {
      reason = `Matching emotional tone (${entry.mood})`;
    } else if (overlapCount > 0) {
      reason = `Lyrical themes: ${matchedWords.slice(0, 3).join(", ")}`;
    } else if (ageDays <= 2) {
      reason = "Recent headspace reflection";
    }

    if (finalScore > 0.1 || moodMatches || ageDays <= 3) {
      scored.push({
        entry,
        score: finalScore,
        matchReason: reason,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Formats recalled journal entries into an authentic contextual injection
 * block suitable for LLM ghostwriter prompts.
 */
export function formatJournalContextForPrompt(results: JournalRecallResult[]): string {
  if (!results.length) return "";

  const lines: string[] = [
    "=== ARTIST'S RAW HEADSPACE & REAL-LIFE JOURNAL CONTEXT ===",
    "The artist recorded these private reflections. Borrow the authenticity, emotional depth, and raw imagery from these thoughts without copying them word-for-word:",
  ];

  for (const item of results) {
    const snippet = item.entry.content.replace(/\n+/g, " ").slice(0, 200);
    lines.push(`- [${item.entry.mood}]: "${snippet}"`);
  }

  lines.push("==========================================================");
  return lines.join("\n");
}
