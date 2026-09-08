import { describe, it, expect } from "vitest";
import {
  toMultiTrackPlainText,
  toMultiTrackGeniusMarkdown,
  toMultiTrackPrintableHtml,
  type TrackExportItem,
} from "../exports";

const SAMPLE_TRACKS: TrackExportItem[] = [
  {
    title: "Night Shift",
    bpm: 140,
    lyrics: {
      title: "Night Shift",
      sections: [
        {
          type: "verse",
          lines: [
            "Late night in the penthouse counting up the bands",
            "Diamonds in the bezel shining on my hands",
          ],
        },
        {
          type: "chorus",
          lines: ["Never sleep when the dream is alive", "Studio glowing until quarter past five"],
        },
      ],
    },
  },
  {
    title: "Freestyle 404",
    bpm: 95,
    rawTranscript: "Just stepped in the booth ready to cook up something fresh",
  },
];

describe("Multi-Track Export Engine", () => {
  it("compiles multiple tracks into structured plain text", () => {
    const text = toMultiTrackPlainText(SAMPLE_TRACKS);
    expect(text).toContain("1. NIGHT SHIFT (140 BPM)");
    expect(text).toContain("[VERSE]");
    expect(text).toContain("Late night in the penthouse counting up the bands");
    expect(text).toContain("2. FREESTYLE 404 (95 BPM)");
    expect(text).toContain("Just stepped in the booth ready to cook up something fresh");
  });

  it("compiles multiple tracks into Genius-formatted markdown", () => {
    const md = toMultiTrackGeniusMarkdown(SAMPLE_TRACKS);
    expect(md).toContain("# VibeVox Track Collection");
    expect(md).toContain("## 1. Night Shift *(140 BPM)*");
    expect(md).toContain("**[VERSE]**");
    expect(md).toContain("Late night in the penthouse counting up the bands");
    expect(md).toContain("## 2. Freestyle 404 *(95 BPM)*");
  });

  it("compiles multiple tracks into printable HTML songbook", () => {
    const html = toMultiTrackPrintableHtml(SAMPLE_TRACKS);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("VibeVox Songbook");
    expect(html).toContain("Night Shift");
    expect(html).toContain("140 BPM");
    expect(html).toContain("Freestyle 404");
    expect(html).toContain("Diamonds in the bezel shining on my hands");
  });
});
