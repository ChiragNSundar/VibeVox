// Aesthetic Lyric Sheet Exporter — Decorative PDF & Rich Word (.doc) Exporters
// Preserves live color-coded rhyme schemes, cadence metrics, and studio manuscript styling.
// Default theme: Dark Studio (matches VibeVox dark UI with 100% color-adjust print fidelity).

import { highlightLyrics, getStanzaRhymeScheme, type RhymeVisionMode, type HighlightedLineResult } from "./rhyme-highlighter";
import { downloadBlob, openPrintWindow, slugify } from "./exports";
import { getLineStressAnalysis, detectFlowMetric } from "./cadence-flow";

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

// Dark Studio theme palette (matches VibeVox Studio UI pixel-for-pixel)
export const RHYME_GROUP_STYLES_DARK: Record<string, string> = {
  "rhyme-group-1": "border: 1.5px solid #facc15; background: rgba(250, 204, 21, 0.22); color: #fef08a; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-2": "border: 1.5px solid #06b6d4; background: rgba(6, 182, 212, 0.22); color: #a5f3fc; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-3": "border: 1.5px solid #ef4444; background: rgba(239, 68, 68, 0.22); color: #fecaca; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-4": "border: 1.5px solid #22c55e; background: rgba(34, 197, 94, 0.22); color: #bbf7d0; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-5": "border: 1.5px solid #ec4899; background: rgba(236, 72, 153, 0.24); color: #fbcfe8; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-6": "border: 1.5px solid #f97316; background: rgba(249, 115, 22, 0.22); color: #fed7aa; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-7": "border: 1.5px solid #818cf8; background: rgba(129, 140, 248, 0.22); color: #c7d2fe; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-8": "border: 1.5px solid #c084fc; background: rgba(192, 132, 252, 0.22); color: #e9d5ff; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-9": "border: 1.5px solid #fb7185; background: rgba(251, 113, 133, 0.22); color: #fecdd3; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-10": "border: 1.5px solid #a3e635; background: rgba(163, 230, 53, 0.22); color: #d9f99d; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-11": "border: 1.5px solid #2dd4bf; background: rgba(45, 212, 191, 0.22); color: #99f6e4; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
  "rhyme-group-12": "border: 1.5px solid #fb923c; background: rgba(251, 146, 60, 0.22); color: #fed7aa; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; -webkit-print-color-adjust: exact;",
};

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

/** Converts highlighted HTML classes into inline styles for seamless Word and Print rendering */
function applyInlineColorStyles(html: string, isDark = true): string {
  const table = isDark ? RHYME_GROUP_STYLES_DARK : RHYME_GROUP_STYLES_PRINT;
  let out = html;
  for (const [cls, style] of Object.entries(table)) {
    const reg = new RegExp(`class="([^"]*?\\b${cls}\\b[^"]*?)"`, "g");
    out = out.replace(reg, `style="${style}"`);
  }
  // Compound cadences & fallback rhyme spans with crystal-clear high contrast
  out = out.replace(
    /class="[^"]*?mosaic-compound-pill[^"]*?"/g,
    `style="${isDark ? 'border: 1.5px solid #f59e0b; background: rgba(245, 158, 11, 0.25); color: #fde68a;' : 'background: #fef3c7; color: #78350f; border: 1.5px solid #d97706;'} font-weight: 700; padding: 1.5px 5px; border-radius: 4px;"`
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
 * ready for browser printing or direct PDF export in SLEEK DARK MODE ONLY.
 */
export function generateAestheticLyricSheetHtml(opts: DecorativeExportOptions): string {
  const title = opts.title.trim() || "Untitled Manuscript";
  const artist = opts.artist || "VibeVox Studio";
  const bpm = opts.bpm || 90;
  const genre = opts.genre || "Hip-Hop / Lyricism";
  const vibe = opts.vibe || "Cadence Locked";
  // Default to dark-studio: user explicitly requested dark mode only
  const theme = opts.theme || "dark-studio";
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

      // Cadence & flow detection matching studio view
      const stress = getLineStressAnalysis(line);
      const flow = detectFlowMetric(line, stress?.chars);
      const stressDots = stress.chars.slice(0, 8).map((c) => (c === "/" ? "●" : "○")).join("");

      const renderedText = isBlank
        ? "&nbsp;"
        : applyInlineColorStyles(h?.html || line, isDark);

      return `
        <div class="line-row ${isBlank ? "blank-line" : ""}">
          <div class="bar-badge-col">
            ${displayBar ? `<span class="bar-num-badge">${displayBar}</span>` : ""}
            ${schemeLetter ? `<span class="scheme-letter-badge ${h?.rhymeGroupClass || "scheme-default"}">${schemeLetter}</span>` : ""}
          </div>
          <div class="lyric-text">${renderedText}</div>
          <div class="meta-tags">
            ${flow.badge ? `<span class="flow-pill ${flow.metricType === "triplet" ? "flow-triplet" : ""}">${escapeHtml(flow.badge)}</span>` : ""}
            ${stressDots ? `<span class="stress-dots" title="Cadence Stress: ${escapeHtml(stress.rawPattern)}">${stressDots}</span>` : ""}
            ${syl > 0 ? `<span class="syl-tag">${syl} syl</span>` : ""}
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root, html, body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      background: #090d16;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #090d16 !important;
      background-color: #090d16 !important;
      color: #f8fafc !important;
      line-height: 1.6;
      padding: 24px;
      max-width: 880px;
      margin: 0 auto;
    }

    /* Studio Header */
    .studio-header {
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      background: linear-gradient(135deg, #131d31, #0c1220) !important;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
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
      background: rgba(245, 158, 11, 0.15);
      color: #fde68a;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    .date-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .song-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .artist-name {
      font-size: 13px;
      color: #c084fc;
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
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .info-pill b {
      color: #94a3b8;
      font-weight: 700;
    }

    /* Section Cards */
    .section-card {
      margin-bottom: 18px;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      background: #0e1626 !important;
      border-radius: 10px;
      padding: 16px 20px;
      page-break-inside: avoid;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    }
    .section-badge {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
    }
    .section-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #38bdf8;
    }

    /* Line Rows */
    .line-row {
      display: grid;
      grid-template-columns: 58px 1fr auto;
      gap: 12px;
      align-items: baseline;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .line-row.blank-line {
      height: 12px;
      border: none;
    }
    .bar-badge-col {
      display: flex;
      align-items: center;
      gap: 4px;
      shrink-0: 0;
    }
    .bar-num-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.15) !important;
      color: #34d399 !important;
      border: 1px solid rgba(16, 185, 129, 0.35) !important;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1;
      -webkit-print-color-adjust: exact;
    }
    .scheme-letter-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      line-height: 1;
      -webkit-print-color-adjust: exact;
      background: rgba(245, 158, 11, 0.18);
      color: #fde68a;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    .scheme-default {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .lyric-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      line-height: 1.7;
      color: #f8fafc !important;
      word-break: break-word;
    }
    .meta-tags {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
    }
    .flow-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 1.5px 6px;
      border-radius: 4px;
      white-space: nowrap;
      -webkit-print-color-adjust: exact;
    }
    .flow-triplet {
      background: rgba(245, 158, 11, 0.18) !important;
      color: #fde68a !important;
      border-color: rgba(245, 158, 11, 0.45) !important;
    }
    .stress-dots {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 1px;
      color: #f59e0b;
      opacity: 0.9;
      white-space: nowrap;
    }
    .syl-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 600;
      color: #94a3b8;
      min-width: 44px;
      text-align: right;
      white-space: nowrap;
    }

    /* 6-Channel Studio Legend */
    .legend-card {
      margin-top: 22px;
      padding: 16px 20px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      background: #0e1626 !important;
      page-break-inside: avoid;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    }
    .legend-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #cbd5e1;
      margin-bottom: 10px;
    }
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    @media (max-width: 600px) {
      .legend-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      -webkit-print-color-adjust: exact;
    }
    .legend-yellow {
      background: rgba(250, 204, 21, 0.12) !important;
      border: 1px solid rgba(250, 204, 21, 0.35) !important;
      color: #fef08a !important;
    }
    .legend-cyan {
      background: rgba(6, 182, 212, 0.12) !important;
      border: 1px solid rgba(6, 182, 212, 0.35) !important;
      color: #a5f3fc !important;
    }
    .legend-red {
      background: rgba(239, 68, 68, 0.12) !important;
      border: 1px solid rgba(239, 68, 68, 0.35) !important;
      color: #fecaca !important;
    }
    .legend-green {
      background: rgba(34, 197, 94, 0.12) !important;
      border: 1px solid rgba(34, 197, 94, 0.35) !important;
      color: #bbf7d0 !important;
    }
    .legend-pink {
      background: rgba(236, 72, 153, 0.12) !important;
      border: 1px solid rgba(236, 72, 153, 0.35) !important;
      color: #fbcfe8 !important;
    }
    .legend-orange {
      background: rgba(249, 115, 22, 0.12) !important;
      border: 1px solid rgba(249, 115, 22, 0.35) !important;
      color: #fed7aa !important;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      display: inline-block;
    }
    .dot-yellow { background: #facc15 !important; }
    .dot-cyan   { background: #06b6d4 !important; }
    .dot-red    { background: #ef4444 !important; }
    .dot-green  { background: #22c55e !important; }
    .dot-pink   { background: #ec4899 !important; }
    .dot-orange { background: #f97316 !important; }

    /* Studio Footer */
    .studio-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
    }

    /* Print rules — strictly preserves dark theme on print and PDF export */
    @media print {
      :root, html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        background: #090d16 !important;
        background-color: #090d16 !important;
        color: #f8fafc !important;
      }
      body {
        padding: 0;
        background: #090d16 !important;
        background-color: #090d16 !important;
      }
      .studio-header {
        background: linear-gradient(135deg, #131d31, #0c1220) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        box-shadow: none !important;
        -webkit-print-color-adjust: exact !important;
      }
      .song-title { color: #ffffff !important; }
      .section-card {
        background: #0e1626 !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow: none !important;
        -webkit-print-color-adjust: exact !important;
      }
      .line-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
      }
      .lyric-text { color: #f8fafc !important; }
      .legend-card {
        background: #0e1626 !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        -webkit-print-color-adjust: exact !important;
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
    <div class="legend-title">Phonetic Rhyme Palette &amp; Scheme Legend</div>
    <div class="legend-grid">
      <div class="legend-item legend-yellow">
        <span class="dot dot-yellow"></span>
        <span>/aɪ/ Diphthong</span>
      </div>
      <div class="legend-item legend-cyan">
        <span class="dot dot-cyan"></span>
        <span>Consonance &amp; Nasal</span>
      </div>
      <div class="legend-item legend-red">
        <span class="dot dot-red"></span>
        <span>/eː/ Rhyme Verbs</span>
      </div>
      <div class="legend-item legend-green">
        <span class="dot dot-green"></span>
        <span>/ɑː/ Anchor</span>
      </div>
      <div class="legend-item legend-pink">
        <span class="dot dot-pink"></span>
        <span>/iː/ High-Front</span>
      </div>
      <div class="legend-item legend-orange">
        <span class="dot dot-orange"></span>
        <span>/oʊ/ Back Vowels</span>
      </div>
    </div>
  </div>

  <div class="studio-footer">
    <span>Crafted with VibeVox Studio · Local Brain Intelligence</span>
    <span>Aesthetic Dark Manuscript</span>
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

      const stress = getLineStressAnalysis(line);
      const flow = detectFlowMetric(line, stress?.chars);

      const renderedText = isBlank
        ? "<br/>"
        : applyInlineColorStyles(h?.html || line, false);

      return `
        <tr>
          <td style="width: 32px; font-family: 'Courier New', monospace; font-size: 10pt; color: #059669; font-weight: bold; vertical-align: top; padding: 4px 4px;">
            ${displayBar}
          </td>
          <td style="width: 28px; font-family: 'Courier New', monospace; font-size: 9.5pt; color: #d97706; font-weight: bold; vertical-align: top; padding: 4px 4px;">
            ${schemeLetter ? `[${schemeLetter}]` : ""}
          </td>
          <td style="font-family: 'Courier New', monospace; font-size: 11pt; color: #0f172a; line-height: 1.7; padding: 4px 6px;">
            ${renderedText}
          </td>
          <td style="width: 140px; font-family: 'Courier New', monospace; font-size: 9pt; text-align: right; vertical-align: top; padding: 4px 4px;">
            ${flow.badge ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 5px; border-radius: 3px; font-weight: bold;">${escapeHtml(flow.badge)}</span> ` : ""}
            ${syl > 0 ? `<span style="color: #475569; font-weight: bold; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; border: 1px solid #cbd5e1;">${syl} syl</span>` : ""}
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

  <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
    <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-bottom: 8px; text-transform: uppercase;">
      Phonetic Rhyme Palette &amp; Scheme Legend
    </div>
    <div style="font-size: 8.5pt; font-family: 'Courier New', monospace; color: #1e293b;">
      <span style="background: #fef08a; color: #713f12; padding: 2px 6px; border-radius: 3px; font-weight: bold;">/aɪ/ Diphthong</span> &nbsp;
      <span style="background: #cffafe; color: #164e63; padding: 2px 6px; border-radius: 3px; font-weight: bold;">Consonance &amp; Nasal</span> &nbsp;
      <span style="background: #fee2e2; color: #7f1d1d; padding: 2px 6px; border-radius: 3px; font-weight: bold;">/eː/ Rhyme Verbs</span> &nbsp;
      <span style="background: #dcfce7; color: #14532d; padding: 2px 6px; border-radius: 3px; font-weight: bold;">/ɑː/ Anchor</span> &nbsp;
      <span style="background: #fce7f3; color: #831843; padding: 2px 6px; border-radius: 3px; font-weight: bold;">/iː/ High-Front</span> &nbsp;
      <span style="background: #ffedd5; color: #7c2d12; padding: 2px 6px; border-radius: 3px; font-weight: bold;">/oʊ/ Back Vowels</span>
    </div>
  </div>

  <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 9pt; color: #475569; font-family: 'Courier New', monospace; font-weight: bold;">
    Generated with VibeVox Studio · High-Contrast Color Scheme Preserved
  </div>
</body>
</html>`;
}

/** Opens the decorative PDF print preview in browser (strictly dark theme) */
export function exportDecorativePdf(opts: DecorativeExportOptions) {
  const html = generateAestheticLyricSheetHtml({
    ...opts,
    theme: "dark-studio",
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
