import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { scorePunchline, generatePunchlines } from "../punchline-engine";
import { generateHooks } from "../hook-engine";
import { computeLyricalStats } from "../stats-analyzer";
import { putTrack, putBars, saveJournalEntry } from "../local-store";

describe("Punchline & Double Entendre Engine", () => {
  it("scores punchlines and detects contrast & wordplay techniques", () => {
    const line = "They say money talks, but my silence speaks louder than words";
    const scored = scorePunchline(line);

    expect(scored.score).toBeGreaterThanOrEqual(40);
    expect(scored.techniques).toContain("Contrast");
    expect(scored.syllables).toBeGreaterThan(10);
  });

  it("detects alliteration in punchlines", () => {
    const line = "Fast flows flipping furiously";
    const scored = scorePunchline(line);

    expect(scored.techniques).toContain("Alliteration");
  });

  it("generates punchline candidates using algorithmic fallback when offline", async () => {
    const res = await generatePunchlines("ticking clocks", { mood: "introspective" });

    expect(res.punchlines.length).toBeGreaterThan(0);
    expect(res.punchlines[0].line).toBeDefined();
    expect(res.punchlines[0].techniques.length).toBeGreaterThan(0);
    expect(res.punchlines[0].score).toBeGreaterThan(0);
  });
});

describe("Hook & Chorus Generator Engine", () => {
  it("generates structured anthemic hooks with syllable counts", async () => {
    const res = await generateHooks("winning against all odds", { mood: "anthemic" });

    expect(res.hooks.length).toBeGreaterThan(0);
    const firstHook = res.hooks[0];
    expect(firstHook.title).toBeDefined();
    expect(firstHook.lines.length).toBeGreaterThanOrEqual(2);
    expect(firstHook.syllablesPerLine).toBeDefined();
    expect(firstHook.syllablesPerLine?.length).toBe(firstHook.lines.length);
  });
});

describe("Lyrical Evolution & Stats Analyzer", () => {
  it("computes stats from local tracks, bars, and journal entries", async () => {
    const trackId = "trk_stats_test_1";
    await putTrack({
      id: trackId,
      deviceId: "dev_test",
      title: "Midnight Drive",
      status: "done",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await putBars([
      {
        id: `${trackId}:0`,
        trackId,
        index: 0,
        line: "Cruising down the highway in the dead of night",
        syllables: 12,
        endSound: "aɪt",
        createdAt: Date.now(),
      },
      {
        id: `${trackId}:1`,
        trackId,
        index: 1,
        line: "Watching all the city stars shining so bright",
        syllables: 12,
        endSound: "aɪt",
        createdAt: Date.now(),
      },
    ]);

    await saveJournalEntry({
      content: "Late night city drives clear my thoughts completely.",
      mood: "Late Night",
    });

    const stats = await computeLyricalStats();

    expect(stats.totalTracks).toBeGreaterThanOrEqual(1);
    expect(stats.totalBars).toBeGreaterThanOrEqual(2);
    expect(stats.uniqueVocabularyCount).toBeGreaterThan(5);
    expect(stats.topRhymeSounds.length).toBeGreaterThan(0);
    expect(stats.syllableDistribution.length).toBeGreaterThan(0);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
    expect(stats.totalJournalEntries).toBeGreaterThanOrEqual(1);
  });
});
