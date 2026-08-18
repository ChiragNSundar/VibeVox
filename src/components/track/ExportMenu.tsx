// ExportMenu — dropdown for exporting lyrics in various formats.
// Extracted from track.$id.tsx for reusability.

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import {
  toPlainText, toGeniusMarkdown, toRtf, toTimestamped, toPrintableHtml,
  downloadBlob, openPrintWindow, slugify,
} from "@/lib/exports";
import { toast } from "sonner";
import type { LocalLyrics } from "@/lib/local-pipeline";

export type ExportMenuProps = {
  lyrics: LocalLyrics;
  cadence?: { bars: { index: number; syllables: number; endSound: string; section: string; text: string }[] } | null;
  bpm?: number;
};

export function ExportMenu({ lyrics, cadence, bpm }: ExportMenuProps) {
  const exportAs = (format: "txt" | "md" | "rtf" | "timestamped" | "pdf") => {
    const slug = slugify(lyrics.title);
    if (format === "txt") downloadBlob(`${slug}.txt`, toPlainText(lyrics), "text/plain");
    else if (format === "md") downloadBlob(`${slug}.md`, toGeniusMarkdown(lyrics), "text/markdown");
    else if (format === "rtf") downloadBlob(`${slug}.rtf`, toRtf(lyrics), "application/rtf");
    else if (format === "timestamped") downloadBlob(`${slug}.timestamped.txt`, toTimestamped(lyrics, cadence, bpm ?? 90), "text/plain");
    else if (format === "pdf") openPrintWindow(toPrintableHtml(lyrics));
    toast.success(format === "pdf" ? "Opening print dialog…" : "Downloaded");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4 mr-1.5" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider">Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportAs("pdf")}>PDF (print sheet)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs("rtf")}>RTF (Word / Pages)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs("md")}>Markdown (Genius-style)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs("timestamped")}>Plain text w/ timestamps</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs("txt")}>Plain text</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
