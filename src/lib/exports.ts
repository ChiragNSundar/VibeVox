// Lyric exporters — pure functions, all client-side. Each returns a Blob
// (or string) ready to download. Keeps the "Copy all" menu lean.

import type { CadenceMap } from "./lyrics-analysis";

export type Lyrics = { title: string; sections: { type: string; lines: string[] }[] };

function flatLines(lyrics: Lyrics): string[] {
  return lyrics.sections.flatMap((s) => s.lines);
}

export function toPlainText(lyrics: Lyrics): string {
  return (
    `${lyrics.title}\n\n` +
    lyrics.sections
      .map((s) => `[${s.type.toUpperCase()}]\n${s.lines.join("\n")}`)
      .join("\n\n")
  );
}

export function toGeniusMarkdown(lyrics: Lyrics): string {
  return (
    `# ${lyrics.title}\n\n` +
    lyrics.sections
      .map((s) => `**[${s.type.toUpperCase()}]**\n\n${s.lines.join("  \n")}`)
      .join("\n\n")
  );
}

/** Lightweight RTF — opens cleanly in Word/Pages/TextEdit. */
export function toRtf(lyrics: Lyrics): string {
  const esc = (t: string) =>
    t.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
  const parts: string[] = [];
  parts.push(`{\\rtf1\\ansi\\deff0`);
  parts.push(`{\\fonttbl{\\f0 Helvetica;}}`);
  parts.push(`\\fs36\\b ${esc(lyrics.title)}\\b0\\par\\par`);
  for (const s of lyrics.sections) {
    parts.push(`\\fs22\\b [${esc(s.type.toUpperCase())}]\\b0\\par`);
    parts.push(`\\fs24 ${s.lines.map((l) => esc(l)).join("\\par ")}\\par\\par`);
  }
  parts.push(`}`);
  return parts.join("");
}

/** Plain-text with bar-level timestamps derived from cadence syllables. */
export function toTimestamped(lyrics: Lyrics, cadence: CadenceMap | null, bpm = 90): string {
  const lines = flatLines(lyrics);
  // Rough estimate: assume 4 syllables ≈ one beat at the given BPM.
  const secondsPerBeat = 60 / bpm;
  let acc = 0;
  const stamped = lines.map((line, i) => {
    const bar = cadence?.bars[i];
    const syll = bar?.syllables ?? Math.max(4, Math.round(line.split(/\s+/).length * 1.3));
    const start = acc;
    acc += (syll / 4) * secondsPerBeat;
    const mm = Math.floor(start / 60).toString().padStart(2, "0");
    const ss = Math.floor(start % 60).toString().padStart(2, "0");
    const ms = Math.floor((start % 1) * 100).toString().padStart(2, "0");
    return `[${mm}:${ss}.${ms}] ${line}`;
  });
  return `${lyrics.title} · est. ${bpm} BPM\n\n${stamped.join("\n")}`;
}

/** Standard synced LRC format for DAWs, Spotify & Karaoke players. */
export function toLrc(lyrics: Lyrics, cadence: CadenceMap | null, bpm = 90): string {
  const lines = flatLines(lyrics);
  const secondsPerBeat = 60 / bpm;
  let acc = 0;
  const header = `[ti:${lyrics.title}]\n[ar:VibeVox]\n[by:VibeVox AI]\n[re:VibeVox Studio]\n[ve:1.0]\n\n`;
  const stamped = lines.map((line, i) => {
    const bar = cadence?.bars[i];
    const syll = bar?.syllables ?? Math.max(4, Math.round(line.split(/\s+/).length * 1.3));
    const start = acc;
    acc += (syll / 4) * secondsPerBeat;
    const mm = Math.floor(start / 60).toString().padStart(2, "0");
    const ss = Math.floor(start % 60).toString().padStart(2, "0");
    const ms = Math.floor((start % 1) * 100).toString().padStart(2, "0");
    return `[${mm}:${ss}.${ms}]${line}`;
  });
  return header + stamped.join("\n");
}

/** Returns formatted HTML for the print dialog → PDF. */
export function toPrintableHtml(lyrics: Lyrics): string {
  const css = `
    @page { margin: 24mm; }
    body { font: 14px/1.6 -apple-system, system-ui, sans-serif; color: #111; }
    h1 { font-size: 28px; margin: 0 0 24px; letter-spacing: -0.01em; }
    .section { margin: 0 0 20px; page-break-inside: avoid; }
    .label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
             color: #b45309; font-weight: 700; margin-bottom: 6px; }
    p { margin: 0; white-space: pre-wrap; }
    footer { margin-top: 32px; font-size: 10px; color: #888; }
  `;
  const body = lyrics.sections
    .map(
      (s) =>
        `<div class="section"><div class="label">${escapeHtml(
          s.type,
        )}</div><p>${escapeHtml(s.lines.join("\n"))}</p></div>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    lyrics.title,
  )}</title><style>${css}</style></head><body><h1>${escapeHtml(
    lyrics.title,
  )}</h1>${body}<footer>Generated with VibeVox</footer></body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export function downloadBlob(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openPrintWindow(html: string) {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  // Give the browser a tick to layout fonts before triggering print.
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* ignore */ } }, 250);
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "track";
}

export type TrackExportItem = {
  title: string;
  lyrics?: Lyrics | null;
  rawTranscript?: string;
  bpm?: number;
  createdAt?: number | string;
};

/** Plain-text compilation of multiple tracks */
export function toMultiTrackPlainText(tracks: TrackExportItem[]): string {
  const divider = "==================================================";
  return tracks
    .map((t, idx) => {
      const header = `${idx + 1}. ${t.title.toUpperCase()}${t.bpm ? ` (${t.bpm} BPM)` : ""}`;
      let body = "";
      if (t.lyrics && t.lyrics.sections && t.lyrics.sections.length > 0) {
        body = t.lyrics.sections
          .map((s) => `[${s.type.toUpperCase()}]\n${s.lines.join("\n")}`)
          .join("\n\n");
      } else if (t.rawTranscript) {
        body = t.rawTranscript;
      } else {
        body = "(No lyrics recorded)";
      }
      return `${divider}\n${header}\n${divider}\n\n${body}`;
    })
    .join("\n\n\n");
}

/** Markdown compilation of multiple tracks formatted for Genius/notebooks */
export function toMultiTrackGeniusMarkdown(tracks: TrackExportItem[]): string {
  return (
    `# VibeVox Track Collection\n\n*Compiled on ${new Date().toLocaleDateString()} · ${tracks.length} track${tracks.length === 1 ? "" : "s"}*\n\n---\n\n` +
    tracks
      .map((t, idx) => {
        const header = `## ${idx + 1}. ${t.title}${t.bpm ? ` *(${t.bpm} BPM)*` : ""}\n\n`;
        let body = "";
        if (t.lyrics && t.lyrics.sections && t.lyrics.sections.length > 0) {
          body = t.lyrics.sections
            .map((s) => `**[${s.type.toUpperCase()}]**\n\n${s.lines.join("  \n")}`)
            .join("\n\n");
        } else if (t.rawTranscript) {
          body = t.rawTranscript;
        } else {
          body = "*No lyrics recorded*";
        }
        return `${header}${body}\n\n---`;
      })
      .join("\n\n")
  );
}

/** HTML compilation for printing / saving as multi-page PDF songbook */
export function toMultiTrackPrintableHtml(tracks: TrackExportItem[]): string {
  const css = `
    @page { margin: 20mm; }
    body { font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 800px; margin: 0 auto; }
    .cover { padding: 40px 0 60px; text-align: center; border-bottom: 2px solid #eee; margin-bottom: 40px; page-break-after: always; }
    .cover h1 { font-size: 34px; margin: 0 0 12px; letter-spacing: -0.02em; color: #000; }
    .cover p { color: #666; font-size: 14px; }
    .track { margin-bottom: 50px; page-break-after: auto; page-break-inside: avoid; }
    .track:not(:last-child) { border-bottom: 1px dashed #ddd; padding-bottom: 40px; }
    .track-title { font-size: 24px; margin: 0 0 8px; color: #111; font-weight: 700; }
    .track-meta { font-size: 12px; color: #888; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section { margin: 0 0 18px; }
    .label { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #b45309; font-weight: 700; margin-bottom: 6px; }
    p { margin: 0; white-space: pre-wrap; }
    footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 15px; }
  `;

  const trackHtml = tracks
    .map((t, idx) => {
      let content = "";
      if (t.lyrics && t.lyrics.sections && t.lyrics.sections.length > 0) {
        content = t.lyrics.sections
          .map(
            (s) =>
              `<div class="section"><div class="label">${escapeHtml(
                s.type,
              )}</div><p>${escapeHtml(s.lines.join("\n"))}</p></div>`,
          )
          .join("");
      } else if (t.rawTranscript) {
        content = `<div class="section"><p>${escapeHtml(t.rawTranscript)}</p></div>`;
      } else {
        content = `<p style="color: #999; font-style: italic;">No lyrics recorded</p>`;
      }

      return `
        <div class="track">
          <div class="track-title">${idx + 1}. ${escapeHtml(t.title)}</div>
          <div class="track-meta">${t.bpm ? `${t.bpm} BPM · ` : ""}VibeVox AI Studio</div>
          ${content}
        </div>
      `;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>VibeVox Songbook (${tracks.length} tracks)</title>
  <style>${css}</style>
</head>
<body>
  <div class="cover">
    <h1>VibeVox Songbook</h1>
    <p>${tracks.length} track${tracks.length === 1 ? "" : "s"} · Exported on ${new Date().toLocaleDateString()}</p>
  </div>
  ${trackHtml}
  <footer>Compiled with VibeVox — AI Lyricist & Vocal Studio</footer>
</body>
</html>`;
}

export function openMultiTrackPrintWindow(tracks: TrackExportItem[]) {
  openPrintWindow(toMultiTrackPrintableHtml(tracks));
}
