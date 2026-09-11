// Aesthetic Lyric Sheet Exporter — Decorative PDF & Rich Word (.doc) Exporters
// Preserves live color-coded rhyme schemes, cadence metrics, and studio manuscript styling.
// Tuned for crystal-clear word visibility with WCAG AAA high-contrast typography.

import { highlightLyrics, getStanzaRhymeScheme, type RhymeVisionMode, type HighlightedLineResult } from "./rhyme-highlighter";
import { downloadBlob, openPrintWindow, slugify } from "./exports";

export type DecorativeExportOptions = {
  title: string;
  artist?: string;
  sections?: { type: string; lines: string[] }[];
  rawText?: string;
  bpm?: number;
  genre?: string;
  vibe?: string;
  theme?: "platinum-manuscript" | "dark-studio";
  rhymeVision?: RhymeVisionMode;
};

// High-contrast, WCAG AAA compliant palette for razor-sharp visibility on print & light backgrounds
export const RHYME_GROUP_STYLES_PRINT: Record<string, string> = {
  "rhyme-group-1": "background: #fef08a; color: #713f12; border: 1.5px solid #ca8a04; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-2": "background: #cffafe; color: #164e63; border: 1.5px solid #0891b2; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-3": "background: #fee2e2; color: #7f1d1d; border: 1.5px solid #dc2626; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-4": "background: #dcfce7; color: #14532d; border: 1.5px solid #16a34a; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-5": "background: #fce7f3; color: #831843; border: 1.5px solid #db2777; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-6": "background: #ffedd5; color: #7c2d12; border: 1.5px solid #ea580c; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-7": "background: #e0e7ff; color: #312e81; border: 1.5px solid #4f46e5; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-8": "background: #f3e8ff; color: #581c87; border: 1.5px solid #9333ea; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-9": "background: #ffe4e6; color: #881337; border: 1.5px solid #e11d48; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-10": "background: #ecfccb; color: #365314; border: 1.5px solid #65a30d; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-11": "background: #ccfbf1; color: #134e4a; border: 1.5px solid #0d9488; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-12": "background: #fef3c7; color: #78350f; border: 1.5px solid #d97706; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
};

// Dark Studio theme palette (only used when dark background is explicitly requested)
export const RHYME_GROUP_STYLES_DARK: Record<string, string> = {
  "rhyme-group-1": "background: rgba(250, 204, 21, 0.35); color: #fef08a; border: 1.5px solid #facc15; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-2": "background: rgba(6, 182, 212, 0.35); color: #a5f3fc; border: 1.5px solid #06b6d4; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-3": "background: rgba(239, 68, 68, 0.35); color: #fecaca; border: 1.5px solid #ef4444; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-4": "background: rgba(34, 197, 94, 0.35); color: #bbf7d0; border: 1.5px solid #22c55e; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-5": "background: rgba(236, 72, 153, 0.35); color: #fbcfe8; border: 1.5px solid #ec4899; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-6": "background: rgba(249, 115, 22, 0.35); color: #fed7aa; border: 1.5px solid #f97316; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-7": "background: rgba(129, 140, 248, 0.35); color: #c7d2fe; border: 1.5px solid #818cf8; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-8": "background: rgba(192, 132, 252, 0.35); color: #e9d5ff; border: 1.5px solid #c084fc; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-9": "background: rgba(251, 113, 133, 0.35); color: #fecdd3; border: 1.5px solid #fb7185; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-10": "background: rgba(163, 230, 53, 0.35); color: #d9f99d; border: 1.5px solid #a3e635; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-11": "background: rgba(45, 212, 191, 0.35); color: #99f6e4; border: 1.5px solid #2dd4bf; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
  "rhyme-group-12": "background: rgba(251, 146, 60, 0.35); color: #fed7aa; border: 1.5px solid #fb923c; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;",
};

/** Converts highlighted HTML classes into inline styles for seamless Word and Print rendering */
function applyInlineColorStyles(html: string, isDark = false): string {
  const table = isDark ? RHYME_GROUP_STYLES_DARK : RHYME_GROUP_STYLES_PRINT;
  let out = html;
  for (const [cls, style] of Object.entries(table)) {
    const reg = new RegExp(`class="([^"]*?\\b${cls}\\b[^"]*?)"`, "g");
    out = out.replace(reg, `style="${style}"`);
  }
  // Compound cadences & fallback rhyme spans with crystal-clear high contrast
  out = out.replace(
    /class="[^"]*?mosaic-compound-pill[^"]*?"/g,
    `style="${isDark ? 'background: rgba(245, 158, 11, 0.35); color: #fde68a; border: 1.5px solid #f59e0b;' : 'background: #fef3c7; color: #78350f; border: 1.5px solid #d97706;'} font-weight: 700; padding: 1.5px 5px; border-radius: 4px;"`
  );
  out = out.replace(
    /class="[^"]*?rhyme-word[^"]*?"/g,
    `style="${isDark ? 'color: #38bdf8; font-weight: 700;' : 'color: #0369a1; font-weight: 700;'}"`
  );
  return out;
}

function parseSectionsFromText(rawText: string): { type: string; lines: string[] }[] {
  const lines = rawText.split("\n");
  const sections: { type: string; lines: string[] }[] = [];
  let curType = "VERSE";
  let curLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^\[(.*?)\]$/);
    if (headerMatch) {
      if (curLines.length > 0) {
        sections.push({ type: curType, lines: curLines });
        curLines = [];
      }
      curType = headerMatch[1].toUpperCase();
    } else {
      curLines.push(line);
    }
  }
  if (curLines.length > 0) {
    sections.push({ type: curType, lines: curLines });
  }
  return sections;
}

/**
 * Builds an ultra-aesthetic, studio-grade decorative HTML document
 * ready for browser printing or direct PDF export with 100% visible typography.
 */
export function generateAestheticLyricSheetHtml(opts: DecorativeExportOptions): string {
  const title = opts.title.trim() || "Untitled Manuscript";
  const artist = opts.artist || "VibeVox Studio";
  const bpm = opts.bpm || 90;
  const genre = opts.genre || "Hip-Hop / Lyricism";
  const vibe = opts.vibe || "Cadence Locked";
  // Default to platinum-manuscript for high-contrast, crystal-clear printing
  const theme = opts.theme || "platinum-manuscript";
  const isDark = theme === "dark-studio";

  const rawSections = opts.sections && opts.sections.length > 0
    ? opts.sections
    : parseSectionsFromText(opts.rawText || "");

  const allLines: string[] = [];
  for (const s of rawSections) {
    for (const l of s.lines) allLines.push(l);
  }

  const highlightedResults = highlightLyrics(allLines, opts.rhymeVision || "standard");
  const schemeResult = getStanzaRhymeScheme(allLines.filter((l) => l.trim().length > 0));

  let lineOffset = 0;
  let barCounter = 1;

  const sectionsHtml = rawSections.map((s) => {
    const secLines = s.lines;
    const linesHtml = secLines.map((line) => {
      const idx = lineOffset++;
      const h = highlightedResults[idx] as HighlightedLineResult | undefined;
      const isBlank = !line.trim();
      const syl = h?.syllables ?? (line.trim() ? Math.round(line.split(/\s+/).length * 1.2) : 0);
      const schemeLetter = h?.schemeLetter || "";
      const displayBar = !isBlank ? (barCounter++).toString().padStart(2, "0") : "";

      const renderedText = isBlank
        ? "&nbsp;"
        : applyInlineColorStyles(h?.html || line, isDark);

      return `
        <div class="line-row ${isBlank ? "blank-line" : ""}">
          <div class="bar-num">${displayBar}</div>
          <div class="lyric-text">${renderedText}</div>
          <div class="meta-tags">
            ${schemeLetter ? `<span class="scheme-tag">${schemeLetter}</span>` : ""}
            ${syl > 0 ? `<span class="syl-tag">${syl}s</span>` : ""}
          </div>
        </div>
      `;
    }).join("\n");

    return `
      <div class="section-card">
        <div class="section-badge">
          <span class="section-name">[ ${escapeHtml(s.type)} ]</span>
        </div>
        <div class="section-content">
          ${linesHtml}
        </div>
      </div>
    `;
  }).join("\n");

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const swatchesStyle = isDark ? RHYME_GROUP_STYLES_DARK : RHYME_GROUP_STYLES_PRINT;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — VibeVox Studio Lyric Sheet</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: ${isDark ? "#090d16" : "#f8fafc"};
      color: ${isDark ? "#f8fafc" : "#0f172a"};
      line-height: 1.6;
      padding: 24px;
      max-width: 860px;
      margin: 0 auto;
    }

    /* Studio Header */
    .studio-header {
      border: 1px solid ${isDark ? "rgba(255,255,255,0.14)" : "#cbd5e1"};
      background: ${isDark ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #ffffff, #f1f5f9)"};
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      position: relative;
      box-shadow: 0 4px 16px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.04)"};
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .watermark-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 9999px;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .date-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      color: ${isDark ? "#cbd5e1" : "#475569"};
    }
    .song-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${isDark ? "#ffffff" : "#0f172a"};
      margin-bottom: 4px;
    }
    .artist-name {
      font-size: 13px;
      color: ${isDark ? "#c084fc" : "#7c3aed"};
      font-weight: 700;
      margin-bottom: 12px;
    }
    .pills-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .info-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 6px;
      background: ${isDark ? "#1e293b" : "#ffffff"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1"};
      color: ${isDark ? "#f1f5f9" : "#1e293b"};
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .info-pill b {
      color: ${isDark ? "#94a3b8" : "#64748b"};
      font-weight: 700;
    }

    /* Section Cards */
    .section-card {
      margin-bottom: 18px;
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"};
      background: ${isDark ? "#0f172a" : "#ffffff"};
      border-radius: 10px;
      padding: 16px 20px;
      page-break-inside: avoid;
      box-shadow: 0 1px 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)"};
    }
    .section-badge {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"};
    }
    .section-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0284c7;
    }

    /* Line Rows */
    .line-row {
      display: grid;
      grid-template-columns: 28px 1fr auto;
      gap: 12px;
      align-items: baseline;
      padding: 4px 0;
      border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"};
    }
    .line-row.blank-line {
      height: 12px;
      border: none;
    }
    .bar-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: ${isDark ? "#94a3b8" : "#64748b"};
      font-weight: 600;
    }
    .lyric-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      line-height: 1.7;
      color: ${isDark ? "#f8fafc" : "#0f172a"};
      word-break: break-word;
    }
    .meta-tags {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .scheme-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #d8b4fe;
    }
    .syl-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 600;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: ${isDark ? "#1e293b" : "#f1f5f9"};
      color: ${isDark ? "#cbd5e1" : "#475569"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1"};
    }

    /* Rhyme Scheme Legend */
    .legend-card {
      margin-top: 22px;
      padding: 14px 18px;
      border-radius: 10px;
      border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1"};
      background: ${isDark ? "#0f172a" : "#f8fafc"};
      page-break-inside: avoid;
    }
    .legend-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${isDark ? "#cbd5e1" : "#334155"};
      margin-bottom: 8px;
    }
    .legend-swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .swatch {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Studio Footer */
    .studio-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1"};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 600;
      color: ${isDark ? "#94a3b8" : "#64748b"};
    }

    /* Print rules */
    @media print {
      body {
        padding: 0;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      .studio-header {
        background: #f8fafc !important;
        border-color: #cbd5e1 !important;
        box-shadow: none !important;
      }
      .song-title { color: #0f172a !important; }
      .section-card {
        background: #ffffff !important;
        border-color: #cbd5e1 !important;
        box-shadow: none !important;
      }
      .lyric-text { color: #0f172a !important; }
      .legend-card {
        background: #f8fafc !important;
        border-color: #cbd5e1 !important;
      }
    }
  </style>
</head>
<body>
  <div class="studio-header">
    <div class="header-top">
      <span class="watermark-pill">VibeVox Studio Master</span>
      <span class="date-tag">${todayStr}</span>
    </div>
    <div class="song-title">${escapeHtml(title)}</div>
    <div class="artist-name">${escapeHtml(artist)}</div>
    <div class="pills-bar">
      <span class="info-pill"><b>BPM</b> ${bpm}</span>
      <span class="info-pill"><b>GENRE</b> ${escapeHtml(genre)}</span>
      <span class="info-pill"><b>VIBE</b> ${escapeHtml(vibe)}</span>
      <span class="info-pill"><b>SCHEME</b> ${escapeHtml(schemeResult.name)}</span>
    </div>
  </div>

  <div class="sections-container">
    ${sectionsHtml}
  </div>

  <div class="legend-card">
    <div class="legend-title">Phonetic Rhyme Palette & Scheme Legend</div>
    <div class="legend-swatches">
      <span class="swatch" style="${swatchesStyle['rhyme-group-1']}">Yellow: /aɪ/ (hai, side, life)</span>
      <span class="swatch" style="${swatchesStyle['rhyme-group-2']}">Cyan: Consonants (-aya, grind)</span>
      <span class="swatch" style="${swatchesStyle['rhyme-group-3']}">Red: Mid-Front (kehna, dekha)</span>
      <span class="swatch" style="${swatchesStyle['rhyme-group-4']}">Green: Central /ɑː/ (raasta, tha)</span>
      <span class="swatch" style="${swatchesStyle['rhyme-group-5']}">Magenta: High /iː/ (nahi, peak)</span>
      <span class="swatch" style="${swatchesStyle['rhyme-group-6']}">Orange: Back /oʊ/, /uː/ (bro, tu)</span>
    </div>
  </div>

  <div class="studio-footer">
    <span>Crafted with VibeVox Studio · Local Brain Intelligence</span>
    <span>Aesthetic Lyric Manuscript</span>
  </div>
</body>
</html>`;
}

/**
 * Builds a formatted, rich-text Word Document (.doc) with native inline styles
 * that Microsoft Word and Google Docs render with full color schemes and 100% visible typography.
 */
export function generateColoredWordDocument(opts: DecorativeExportOptions): string {
  const title = opts.title.trim() || "Untitled Manuscript";
  const artist = opts.artist || "VibeVox Studio";
  const bpm = opts.bpm || 90;
  const genre = opts.genre || "Hip-Hop / Lyricism";
  const vibe = opts.vibe || "Cadence Locked";

  const rawSections = opts.sections && opts.sections.length > 0
    ? opts.sections
    : parseSectionsFromText(opts.rawText || "");

  const allLines: string[] = [];
  for (const s of rawSections) {
    for (const l of s.lines) allLines.push(l);
  }

  const highlightedResults = highlightLyrics(allLines, opts.rhymeVision || "standard");
  const schemeResult = getStanzaRhymeScheme(allLines.filter((l) => l.trim().length > 0));

  let lineOffset = 0;
  let barCounter = 1;

  const sectionsHtml = rawSections.map((s) => {
    const linesHtml = s.lines.map((line) => {
      const idx = lineOffset++;
      const h = highlightedResults[idx] as HighlightedLineResult | undefined;
      const isBlank = !line.trim();
      const syl = h?.syllables ?? (line.trim() ? Math.round(line.split(/\s+/).length * 1.2) : 0);
      const schemeLetter = h?.schemeLetter || "";
      const displayBar = !isBlank ? (barCounter++).toString().padStart(2, "0") : "";

      const renderedText = isBlank
        ? "<br/>"
        : applyInlineColorStyles(h?.html || line, false);

      return `
        <tr>
          <td style="width: 32px; font-family: 'Courier New', monospace; font-size: 10pt; color: #64748b; font-weight: bold; vertical-align: top; padding: 4px 4px;">
            ${displayBar}
          </td>
          <td style="font-family: 'Courier New', monospace; font-size: 11pt; color: #0f172a; line-height: 1.7; padding: 4px 6px;">
            ${renderedText}
          </td>
          <td style="width: 80px; font-family: 'Courier New', monospace; font-size: 9.5pt; text-align: right; vertical-align: top; padding: 4px 4px;">
            ${schemeLetter ? `<span style="background: #f3e8ff; color: #6b21a8; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #d8b4fe;">${schemeLetter}</span> ` : ""}
            ${syl > 0 ? `<span style="color: #475569; font-weight: bold; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; border: 1px solid #cbd5e1;">${syl}s</span>` : ""}
          </td>
        </tr>
      `;
    }).join("\n");

    return `
      <div style="margin-top: 20px; margin-bottom: 14px;">
        <div style="font-family: 'Arial', sans-serif; font-size: 11pt; font-weight: bold; color: #0284c7; text-transform: uppercase; border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-bottom: 8px;">
          [ ${escapeHtml(s.type)} ]
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${linesHtml}
        </table>
      </div>
    `;
  }).join("\n");

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Arial', sans-serif; margin: 20mm; color: #0f172a; }
    h1 { font-family: 'Arial Black', Arial, sans-serif; font-size: 22pt; margin: 0 0 4px 0; color: #0f172a; }
    .header-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="header-card">
    <div style="font-family: 'Arial', sans-serif; font-size: 9pt; font-weight: bold; color: #92400e; text-transform: uppercase; margin-bottom: 4px;">
      VIBEVOX STUDIO LYRIC MANUSCRIPT
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div style="font-size: 11pt; color: #7c3aed; font-weight: bold; margin-bottom: 12px;">
      ${escapeHtml(artist)}
    </div>
    <div style="font-size: 9.5pt; color: #1e293b; font-family: 'Courier New', monospace; font-weight: bold;">
      <span style="background: #ffffff; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px;">BPM: ${bpm}</span> &nbsp;
      <span style="background: #ffffff; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px;">GENRE: ${escapeHtml(genre)}</span> &nbsp;
      <span style="background: #ffffff; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px;">VIBE: ${escapeHtml(vibe)}</span> &nbsp;
      <span style="background: #ffffff; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px;">SCHEME: ${escapeHtml(schemeResult.name)}</span>
    </div>
  </div>

  ${sectionsHtml}

  <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 9pt; color: #475569; font-family: 'Courier New', monospace; font-weight: bold;">
    Generated with VibeVox Studio · High-Contrast Color Scheme Preserved
  </div>
</body>
</html>`;
}

/** Opens the decorative PDF print preview in browser */
export function exportDecorativePdf(opts: DecorativeExportOptions) {
  const html = generateAestheticLyricSheetHtml({
    ...opts,
    theme: opts.theme || "platinum-manuscript",
  });
  openPrintWindow(html);
}

/** Downloads the color-coded Word document (.doc) */
export function exportColoredWordDoc(opts: DecorativeExportOptions) {
  const html = generateColoredWordDocument(opts);
  const slug = slugify(opts.title || "vibe-lyrics");
  downloadBlob(`${slug}-colored-lyrics.doc`, html, "application/msword");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}
