// Aesthetic Lyric Sheet Exporter — Decorative PDF & Rich Word (.doc) Exporters
// Preserves live color-coded rhyme schemes, cadence metrics, and studio manuscript styling.

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
  theme?: "dark-studio" | "platinum-manuscript";
  rhymeVision?: RhymeVisionMode;
};

// Map rhyme group classes to inline styles for Word / HTML printing
const RHYME_GROUP_STYLES_DARK: Record<string, string> = {
  "rhyme-group-1": "background: rgba(250, 204, 21, 0.25); color: #fef08a; border-bottom: 2px solid #facc15; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-2": "background: rgba(6, 182, 212, 0.25); color: #a5f3fc; border-bottom: 2px solid #06b6d4; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-3": "background: rgba(239, 68, 68, 0.25); color: #fecaca; border-bottom: 2px solid #ef4444; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-4": "background: rgba(34, 197, 94, 0.25); color: #bbf7d0; border-bottom: 2px solid #22c55e; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-5": "background: rgba(236, 72, 153, 0.28); color: #fbcfe8; border-bottom: 2px solid #ec4899; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-6": "background: rgba(249, 115, 22, 0.25); color: #fed7aa; border-bottom: 2px solid #f97316; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-7": "background: rgba(129, 140, 248, 0.25); color: #c7d2fe; border-bottom: 2px solid #818cf8; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-8": "background: rgba(192, 132, 252, 0.25); color: #e9d5ff; border-bottom: 2px solid #c084fc; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-9": "background: rgba(251, 113, 133, 0.25); color: #fecdd3; border-bottom: 2px solid #fb7185; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-10": "background: rgba(163, 230, 53, 0.25); color: #d9f99d; border-bottom: 2px solid #a3e635; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-11": "background: rgba(45, 212, 191, 0.25); color: #99f6e4; border-bottom: 2px solid #2dd4bf; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-12": "background: rgba(251, 146, 60, 0.25); color: #fed7aa; border-bottom: 2px solid #fb923c; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
};

const RHYME_GROUP_STYLES_LIGHT: Record<string, string> = {
  "rhyme-group-1": "background: #fef08a; color: #854d0e; border-bottom: 2px solid #ca8a04; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-2": "background: #cffafe; color: #155e75; border-bottom: 2px solid #0891b2; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-3": "background: #fee2e2; color: #991b1b; border-bottom: 2px solid #dc2626; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-4": "background: #dcfce7; color: #166534; border-bottom: 2px solid #16a34a; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-5": "background: #fce7f3; color: #9d174d; border-bottom: 2px solid #db2777; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-6": "background: #ffedd5; color: #9a3412; border-bottom: 2px solid #ea580c; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-7": "background: #e0e7ff; color: #3730a3; border-bottom: 2px solid #4f46e5; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-8": "background: #f3e8ff; color: #6b21a8; border-bottom: 2px solid #9333ea; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-9": "background: #ffe4e6; color: #9f1239; border-bottom: 2px solid #e11d48; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-10": "background: #ecfccb; color: #3f6212; border-bottom: 2px solid #65a30d; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-11": "background: #ccfbf1; color: #115e59; border-bottom: 2px solid #0d9488; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
  "rhyme-group-12": "background: #fef3c7; color: #92400e; border-bottom: 2px solid #d97706; padding: 1px 4px; border-radius: 4px; font-weight: 600;",
};

/** Converts highlighted HTML classes into inline styles for seamless Word and Print rendering */
function applyInlineColorStyles(html: string, isDark = false): string {
  const table = isDark ? RHYME_GROUP_STYLES_DARK : RHYME_GROUP_STYLES_LIGHT;
  let out = html;
  for (const [cls, style] of Object.entries(table)) {
    // Replace class="... cls ..." with style="..."
    const reg = new RegExp(`class="([^"]*?\\b${cls}\\b[^"]*?)"`, "g");
    out = out.replace(reg, `style="${style}"`);
  }
  // Replace generic rhyme-word or mosaic-pill that didn't match a specific group
  out = out.replace(/class="[^"]*?mosaic-compound-pill[^"]*?"/g, `style="${isDark ? 'background: rgba(245, 158, 11, 0.25); color: #fde68a;' : 'background: #fef3c7; color: #b45309;'} font-weight: 700; padding: 1px 4px; border-radius: 4px;"`);
  out = out.replace(/class="[^"]*?rhyme-word[^"]*?"/g, `style="${isDark ? 'color: #38bdf8;' : 'color: #0284c7;'} font-weight: 600;"`);
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
 * ready for browser printing or direct PDF export.
 */
export function generateAestheticLyricSheetHtml(opts: DecorativeExportOptions): string {
  const title = opts.title.trim() || "Untitled Manuscript";
  const artist = opts.artist || "VibeVox Studio";
  const bpm = opts.bpm || 90;
  const genre = opts.genre || "Hip-Hop / Lyricism";
  const vibe = opts.vibe || "Cadence Locked";
  const theme = opts.theme || "dark-studio";
  const isDark = theme === "dark-studio";

  const rawSections = opts.sections && opts.sections.length > 0
    ? opts.sections
    : parseSectionsFromText(opts.rawText || "");

  // Flatten lines for rhyme highlighter
  const allLines: string[] = [];
  for (const s of rawSections) {
    for (const l of s.lines) {
      allLines.push(l);
    }
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — VibeVox Studio Lyric Sheet</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: ${isDark ? "#090d16" : "#ffffff"};
      color: ${isDark ? "#e2e8f0" : "#1e293b"};
      line-height: 1.6;
      padding: 24px;
      max-width: 860px;
      margin: 0 auto;
    }

    /* Studio Header */
    .studio-header {
      border: 1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"};
      background: ${isDark ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))" : "linear-gradient(135deg, #f8fafc, #f1f5f9)"};
      border-radius: 12px;
      padding: 22px 26px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.04)"};
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .watermark-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 9999px;
      background: ${isDark ? "rgba(245, 158, 11, 0.18)" : "#fef3c7"};
      color: ${isDark ? "#fbbf24" : "#b45309"};
      border: 1px solid ${isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a"};
    }
    .date-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: ${isDark ? "#94a3b8" : "#64748b"};
    }
    .song-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${isDark ? "#ffffff" : "#0f172a"};
      margin-bottom: 4px;
    }
    .artist-name {
      font-size: 13px;
      color: ${isDark ? "#a855f7" : "#7c3aed"};
      font-weight: 600;
      margin-bottom: 14px;
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
      background: ${isDark ? "rgba(255,255,255,0.06)" : "#ffffff"};
      border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
      color: ${isDark ? "#cbd5e1" : "#475569"};
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .info-pill b {
      color: ${isDark ? "#f8fafc" : "#0f172a"};
    }

    /* Section Cards */
    .section-card {
      margin-bottom: 22px;
      border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
      background: ${isDark ? "rgba(15, 23, 42, 0.5)" : "#fcfcfc"};
      border-radius: 10px;
      padding: 16px 20px;
      page-break-inside: avoid;
    }
    .section-badge {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"};
    }
    .section-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${isDark ? "#38bdf8" : "#0284c7"};
    }

    /* Line Rows */
    .line-row {
      display: grid;
      grid-template-columns: 28px 1fr auto;
      gap: 12px;
      align-items: baseline;
      padding: 4px 0;
      border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"};
    }
    .line-row.blank-line {
      height: 12px;
      border: none;
    }
    .bar-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: ${isDark ? "#64748b" : "#94a3b8"};
      font-weight: 500;
    }
    .lyric-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      line-height: 1.65;
      color: ${isDark ? "#f1f5f9" : "#1e293b"};
      word-break: break-word;
    }
    .meta-tags {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .scheme-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      background: ${isDark ? "rgba(168, 85, 247, 0.2)" : "#f3e8ff"};
      color: ${isDark ? "#c084fc" : "#7e22ce"};
      border: 1px solid ${isDark ? "rgba(168, 85, 247, 0.3)" : "#e9d5ff"};
    }
    .syl-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      background: ${isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"};
      color: ${isDark ? "#94a3b8" : "#64748b"};
    }

    /* Rhyme Scheme Legend */
    .legend-card {
      margin-top: 24px;
      padding: 14px 18px;
      border-radius: 10px;
      border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
      background: ${isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"};
      page-break-inside: avoid;
    }
    .legend-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${isDark ? "#94a3b8" : "#64748b"};
      margin-bottom: 8px;
    }
    .legend-swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .swatch {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Studio Footer */
    .studio-footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: ${isDark ? "#64748b" : "#94a3b8"};
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
        border-color: #e2e8f0 !important;
      }
      .lyric-text { color: #0f172a !important; }
      .legend-card { background: #f8fafc !important; }
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
      <span class="swatch" style="${RHYME_GROUP_STYLES_DARK['rhyme-group-1']}">Yellow: /aɪ/ (hai, side, life)</span>
      <span class="swatch" style="${RHYME_GROUP_STYLES_DARK['rhyme-group-2']}">Cyan: Consonants (-aya, grind)</span>
      <span class="swatch" style="${RHYME_GROUP_STYLES_DARK['rhyme-group-3']}">Red: Mid-Front (kehna, dekha)</span>
      <span class="swatch" style="${RHYME_GROUP_STYLES_DARK['rhyme-group-4']}">Green: Central /ɑː/ (raasta, tha)</span>
      <span class="swatch" style="${RHYME_GROUP_STYLES_DARK['rhyme-group-5']}">Magenta: High /iː/ (nahi, peak)</span>
      <span class="swatch" style="${RHYME_GROUP_STYLES_DARK['rhyme-group-6']}">Orange: Back /oʊ/, /uː/ (bro, tu)</span>
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
 * that Microsoft Word and Google Docs render with full color schemes.
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
          <td style="width: 32px; font-family: 'Courier New', monospace; font-size: 10pt; color: #94a3b8; vertical-align: top; padding: 3px 4px;">
            ${displayBar}
          </td>
          <td style="font-family: 'Courier New', monospace; font-size: 11pt; color: #0f172a; line-height: 1.6; padding: 3px 6px;">
            ${renderedText}
          </td>
          <td style="width: 70px; font-family: 'Courier New', monospace; font-size: 9pt; text-align: right; vertical-align: top; padding: 3px 4px;">
            ${schemeLetter ? `<span style="background: #f3e8ff; color: #7e22ce; font-weight: bold; padding: 1px 4px; border-radius: 3px; border: 1px solid #e9d5ff;">${schemeLetter}</span> ` : ""}
            ${syl > 0 ? `<span style="color: #64748b;">${syl}s</span>` : ""}
          </td>
        </tr>
      `;
    }).join("\n");

    return `
      <div style="margin-top: 18px; margin-bottom: 12px;">
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
    body { font-family: 'Arial', sans-serif; margin: 20mm; color: #1e293b; }
    h1 { font-family: 'Arial Black', Arial, sans-serif; font-size: 22pt; margin: 0 0 4px 0; color: #0f172a; }
    .header-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="header-card">
    <div style="font-family: 'Arial', sans-serif; font-size: 9pt; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">
      VIBEVOX STUDIO LYRIC MANUSCRIPT
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div style="font-size: 11pt; color: #7c3aed; font-weight: bold; margin-bottom: 12px;">
      ${escapeHtml(artist)}
    </div>
    <div style="font-size: 9.5pt; color: #475569; font-family: 'Courier New', monospace;">
      <b>BPM:</b> ${bpm} &nbsp;|&nbsp;
      <b>GENRE:</b> ${escapeHtml(genre)} &nbsp;|&nbsp;
      <b>VIBE:</b> ${escapeHtml(vibe)} &nbsp;|&nbsp;
      <b>SCHEME:</b> ${escapeHtml(schemeResult.name)}
    </div>
  </div>

  ${sectionsHtml}

  <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 8.5pt; color: #94a3b8; font-family: 'Courier New', monospace;">
    Generated with VibeVox Studio · Preserving Rich Color-Coded Rhyme Schemes
  </div>
</body>
</html>`;
}

/** Opens the decorative PDF print preview in browser */
export function exportDecorativePdf(opts: DecorativeExportOptions) {
  const html = generateAestheticLyricSheetHtml(opts);
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
