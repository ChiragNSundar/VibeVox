import { describe, expect, it } from "vitest";
import { generateOfflineRagLyrics } from "../offline-rag-generator";
import type { LocalCadence, LocalBrief } from "../local-pipeline";

describe("Zero-LLM Offline RAG Generator", () => {
  const sampleCadence: LocalCadence = {
    bars: [
      { index: 1, syllables: 9, endSound: "aoon", section: "hook", text: "dhundhla sa aks ab mitaoon main" },
      { index: 2, syllables: 8, endSound: "main", section: "hook", text: "qaid ye dard e jaan teri main" },
      { index: 3, syllables: 11, endSound: "de", section: "verse", text: "neendein dhuaan soya kab hoon bata de" },
      { index: 4, syllables: 9, endSound: "main", section: "verse", text: "sach toh ye hai rootha naseeb main" },
    ],
    detectedVibe: "melodic",
  };

  it("generates Hinglish lyrics without an LLM connected", () => {
    const brief: LocalBrief = { slangRegion: "hinglish", genre: "melodic" };
    const result = generateOfflineRagLyrics("sample transcript", sampleCadence, brief);

    expect(result.lyrics.sections.length).toBeGreaterThan(0);
    expect(result.quality.drakeScore).toBeGreaterThanOrEqual(8.0);
    expect(result.notes[0]).toContain("Offline RAG Mode");
  });

  it("generates Kanglish lyrics without an LLM connected", () => {
    const brief: LocalBrief = { slangRegion: "kanglish", customSlang: "macha, guru" };
    const result = generateOfflineRagLyrics("sample transcript", sampleCadence, brief);

    expect(result.lyrics.sections.length).toBeGreaterThan(0);
    expect(result.quality.cadenceMatch).toBeGreaterThan(0.85);
  });

  it("generates English lyrics fallback without an LLM connected", () => {
    const brief: LocalBrief = { slangRegion: "us-east", genre: "boom-bap" };
    const result = generateOfflineRagLyrics("sample transcript", sampleCadence, brief);

    expect(result.lyrics.sections.length).toBeGreaterThan(0);
    expect(result.profile.family).toBe("offline-rag");
  });
});
