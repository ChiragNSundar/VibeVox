import { describe, it, expect } from "vitest";
import { runOfflineRagGenerator } from "../offline-rag-generator";

describe("offline-rag-generator integration test", () => {
  it("generates cadence-locked lyrics and quality scores without an LLM", async () => {
    const brief = {
      genre: "trap",
      slangRegion: "hinglish",
      topic: "city lights night drive",
    };
    const transcript = "yeah in the city late night driving fast money on my mind";

    const result = await runOfflineRagGenerator(transcript, brief);

    expect(result).toBeDefined();
    expect(result.lyrics).toBeDefined();
    expect(result.lyrics.title).toBeTruthy();
    expect(result.lyrics.sections.length).toBeGreaterThan(0);

    expect(result.cadence).toBeDefined();
    expect(result.cadence.bars.length).toBeGreaterThan(0);

    expect(result.quality).toBeDefined();
    expect(result.quality.cadenceMatch).toBeGreaterThan(0);
    expect(result.quality.drakeScore).toBeGreaterThan(0);
  });
});
