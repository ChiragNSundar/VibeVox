// Lyrical Evolution & Stats Analytics Engine
//
// Computes comprehensive lyrical analytics 100% locally from IndexedDB
// tracks, bars, and journal entries.

import { listTracks, barsForTrack, getJournalEntries, type LocalTrack, type LocalBar } from "./local-store";
import { countSyllables, endRhymeKey } from "./lyrics-analysis";
import { format } from "date-fns";

export interface LyricalStats {
  totalTracks: number;
  totalBars: number;
  totalWords: number;
  avgSyllablesPerBar: number;
  uniqueVocabularyCount: number;
  vocabularyDiversityPercent: number;
  topRhymeSounds: Array<{ sound: string; count: number }>;
  syllableDistribution: Array<{ syllables: number; count: number }>;
  evolutionTimeline: Array<{
    date: string;
    trackTitle: string;
    barsCount: number;
    avgSyllables: number;
  }>;
  streakDays: number;
  totalJournalEntries: number;
}

const WORD_SPLIT_RE = /[^\w\s']|_/g;

export async function computeLyricalStats(): Promise<LyricalStats> {
  const tracks = await listTracks().catch(() => [] as LocalTrack[]);
  const journal = await getJournalEntries().catch(() => []);

  const allBars: LocalBar[] = [];
  for (const t of tracks) {
    const b = await barsForTrack(t.id).catch(() => []);
    allBars.push(...b);
  }

  const allWords: string[] = [];
  const rhymeCounts: Record<string, number> = {};
  const sylCounts: Record<number, number> = {};
  let totalSyllables = 0;
  let barCount = 0;

  for (const bar of allBars) {
    const text = (bar.line || bar.transcript || "").trim();
    if (!text) continue;

    barCount++;
    const syl = bar.syllables ?? countSyllables(text);
    totalSyllables += syl;
    sylCounts[syl] = (sylCounts[syl] || 0) + 1;

    const sound = bar.endSound || endRhymeKey(text);
    if (sound && sound.length >= 2) {
      rhymeCounts[sound] = (rhymeCounts[sound] || 0) + 1;
    }

    const words = text
      .replace(WORD_SPLIT_RE, " ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    allWords.push(...words);
  }

  // Also include journal entry words in vocabulary count
  for (const j of journal) {
    const jWords = (j.content || "")
      .replace(WORD_SPLIT_RE, " ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    allWords.push(...jWords);
  }

  const uniqueWords = new Set(allWords);
  const totalWords = allWords.length;
  const vocabDiversity = totalWords > 0 ? Math.round((uniqueWords.size / totalWords) * 100) : 0;
  const avgSyllables = barCount > 0 ? Math.round((totalSyllables / barCount) * 10) / 10 : 0;

  // Top 6 Rhyme sounds
  const topRhymeSounds = Object.entries(rhymeCounts)
    .map(([sound, count]) => ({ sound: `/${sound}/`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Syllables distribution (range 4 to 18)
  const syllableDistribution: Array<{ syllables: number; count: number }> = [];
  for (let s = 6; s <= 18; s++) {
    syllableDistribution.push({ syllables: s, count: sylCounts[s] || 0 });
  }

  // Evolution timeline (sorted by track creation)
  const sortedTracks = [...tracks].sort((a, b) => a.createdAt - b.createdAt);
  const evolutionTimeline: LyricalStats["evolutionTimeline"] = [];

  for (const t of sortedTracks.slice(-10)) {
    const tBars = await barsForTrack(t.id).catch(() => []);
    const valid = tBars.filter((b) => (b.line || b.transcript || "").trim());
    if (valid.length > 0) {
      const sylSum = valid.reduce((acc, b) => acc + (b.syllables || countSyllables(b.line || "")), 0);
      evolutionTimeline.push({
        date: format(new Date(t.createdAt), "MMM d"),
        trackTitle: t.title || "Untitled",
        barsCount: valid.length,
        avgSyllables: Math.round((sylSum / valid.length) * 10) / 10,
      });
    }
  }

  // Calculate streak: unique active calendar days
  const activeDays = new Set<string>();
  for (const t of tracks) {
    activeDays.add(format(new Date(t.createdAt), "yyyy-MM-dd"));
  }
  for (const j of journal) {
    activeDays.add(format(new Date(j.createdAt), "yyyy-MM-dd"));
  }

  // Streak logic (days active in recent window)
  const streakDays = activeDays.size;

  return {
    totalTracks: tracks.length,
    totalBars: barCount,
    totalWords,
    avgSyllablesPerBar: avgSyllables,
    uniqueVocabularyCount: uniqueWords.size,
    vocabularyDiversityPercent: vocabDiversity,
    topRhymeSounds,
    syllableDistribution,
    evolutionTimeline,
    streakDays,
    totalJournalEntries: journal.length,
  };
}
