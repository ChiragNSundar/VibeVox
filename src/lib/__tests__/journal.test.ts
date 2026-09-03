import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  saveJournalEntry,
  getJournalEntries,
  getJournalEntry,
  deleteJournalEntry,
  exportBundle,
  importBundle,
  type JournalEntry,
} from "../local-store";
import {
  recallRelevantJournalEntries,
  formatJournalContextForPrompt,
} from "../journal-rag";

describe("Writer's Headspace & Journal Storage", () => {
  it("saves, retrieves, and deletes a journal entry", async () => {
    const entry = await saveJournalEntry({
      content: "Late night reflections in Bangalore, grinding on the mic while the city sleeps.",
      mood: "Introspective",
      tags: ["late-night", "grind"],
    });

    expect(entry.id).toBeDefined();
    expect(entry.content).toContain("Late night reflections");
    expect(entry.mood).toBe("Introspective");
    expect(entry.createdAt).toBeGreaterThan(0);

    const all = await getJournalEntries();
    expect(all.some((e) => e.id === entry.id)).toBe(true);

    const single = await getJournalEntry(entry.id);
    expect(single).not.toBeNull();
    expect(single?.content).toBe(entry.content);

    await deleteJournalEntry(entry.id);
    const afterDelete = await getJournalEntry(entry.id);
    expect(afterDelete).toBeNull();
  });

  it("preserves journal entries across bundle export and import", async () => {
    const entry = await saveJournalEntry({
      content: "Hunger in my veins, never backing down from the cipher.",
      mood: "Aggressive",
      tags: ["cipher", "hunger"],
    });

    const bundle = await exportBundle();
    expect(bundle.journal).toBeDefined();
    expect(bundle.journal?.some((j) => j.id === entry.id)).toBe(true);

    const imported = await importBundle({
      version: 1,
      exportedAt: Date.now(),
      tracks: [],
      bars: [],
      audio: {},
      journal: [
        {
          id: "jnl_imported_test",
          content: "Imported memories from another studio session.",
          mood: "Triumphant",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

    expect(imported).toBeDefined();
    const importedEntry = await getJournalEntry("jnl_imported_test");
    expect(importedEntry).not.toBeNull();
    expect(importedEntry?.content).toBe("Imported memories from another studio session.");
  });
});

describe("Journal Emotional State RAG", () => {
  beforeEach(async () => {
    await saveJournalEntry({
      id: "jnl_rag_1",
      content: "Feel like ticking clocks in an empty room, running against time.",
      mood: "Introspective",
      tags: ["time", "clocks"],
    });

    await saveJournalEntry({
      id: "jnl_rag_2",
      content: "Heavy 808s shaking the floor, aggressive flow tearing through competitors.",
      mood: "Aggressive",
      tags: ["808", "flow"],
    });
  });

  it("recalls relevant thoughts based on query tokens and mood matching", async () => {
    const results = await recallRelevantJournalEntries("running against ticking time in my city", {
      mood: "Introspective",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toContain("ticking clocks");
    expect(results[0].matchReason).toContain("Introspective");
  });

  it("formats recalled thoughts into a structured LLM context block", async () => {
    const results = await recallRelevantJournalEntries("aggressive 808s and heavy flow", {
      mood: "Aggressive",
    });

    const promptBlock = formatJournalContextForPrompt(results);
    expect(promptBlock).toContain("ARTIST'S RAW HEADSPACE");
    expect(promptBlock).toContain("[Aggressive]");
    expect(promptBlock).toContain("Heavy 808s shaking the floor");
  });
});
