import { describe, it, expect } from "vitest";
import { putTrack, getTrack, listTracks, deleteTrack, type LocalTrack } from "../local-store";

describe("local-store IndexedDB operations", () => {
  it("can put, get, list, and delete a local track", async () => {
    const sampleTrack: LocalTrack = {
      id: "test-track-123",
      deviceId: "device-test",
      title: "Test Freestyle",
      status: "done",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      transcript: "mumble test transcript",
      lyrics: JSON.stringify({ title: "Test Freestyle", sections: [{ type: "verse", lines: ["Line 1", "Line 2"] }] }),
    };

    await putTrack(sampleTrack);

    const retrieved = await getTrack("test-track-123");
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe("Test Freestyle");

    const tracks = await listTracks();
    expect(tracks.some((t) => t.id === "test-track-123")).toBe(true);

    await deleteTrack("test-track-123");
    const deleted = await getTrack("test-track-123");
    expect(deleted).toBeFalsy();
  });
});
