// TrackToolbar — header toolbar for the lyrics section.
// Contains undo/redo, bulk mode toggle, copy, export, and keyboard shortcuts.
// Extracted from track.$id.tsx for modularity.

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Undo2, Redo2, CheckSquare, Copy, Keyboard, AlertTriangle, Sparkles,
} from "lucide-react";
import { ExportMenu } from "./ExportMenu";
import { ComplexityGauge } from "./ComplexityGauge";
import { SemanticDriftBar } from "./SemanticDriftBar";
import type { LocalLyrics } from "@/lib/local-pipeline";
import type { RhymeVisionMode } from "@/lib/rhyme-highlighter";
import type { ComplexityScoreResult, SemanticDriftResult } from "@/lib/diagnostics";
import { toPlainText } from "@/lib/exports";
import { toast } from "sonner";

export type RepetitionWarning = { message: string; badBarIndices: number[] };

export type TrackToolbarProps = {
  lyrics: LocalLyrics;
  cadence?: { bars: { index: number; syllables: number; endSound: string; section: string; text: string }[] } | null;
  bpm?: number;
  scheme: string;
  warnings: RepetitionWarning[];
  undoStack: { label: string }[];
  redoStack: { label: string }[];
  selectMode: boolean;
  rhymeVision?: RhymeVisionMode;
  stanzaSchemeName?: string;
  complexityResult?: ComplexityScoreResult | null;
  semanticDrift?: SemanticDriftResult | null;
  onSetRhymeVision?: (mode: RhymeVisionMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSelectMode: () => void;
  onExitSelectMode: () => void;
};

export function TrackToolbar({
  lyrics, cadence, bpm, scheme, warnings,
  undoStack, redoStack, selectMode,
  rhymeVision = "standard", stanzaSchemeName,
  complexityResult, semanticDrift,
  onSetRhymeVision,
  onUndo, onRedo, onToggleSelectMode, onExitSelectMode,
}: TrackToolbarProps) {
  const copyAll = async () => {
    await navigator.clipboard.writeText(toPlainText(lyrics));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="font-display font-semibold">Lyrics</h2>
        {stanzaSchemeName && (
          <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary" title="Detected Rhyme Scheme Pattern">
            🎵 {stanzaSchemeName}
          </span>
        )}
        {warnings.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="h-3 w-3" />
                {warnings.length} repetition warning{warnings.length === 1 ? "" : "s"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-xs">
              <ul className="space-y-1">
                {warnings.map((w, i) => <li key={i}>• {w.message}</li>)}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {onSetRhymeVision && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs h-8 px-2 gap-1.5" title="Rhyme Vision Level">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Vision:</span>
                <strong className="capitalize">{rhymeVision}</strong>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-mono">Rhyme Vision</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSetRhymeVision("clean")}>
                Clean (No highlights)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRhymeVision("standard")}>
                Standard (End-rhymes & multi-syl glow)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRhymeVision("deep")}>
                Deep (Slant & internal rhymes)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRhymeVision("all")}>
                All (Full assonance/consonance)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <ComplexityGauge result={complexityResult} />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="icon"
              onClick={onUndo}
              disabled={undoStack.length === 0}
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {undoStack.length ? `Undo: ${undoStack[undoStack.length - 1].label}` : "Nothing to undo"}
            <span className="ml-2 opacity-60">⌘/Ctrl+Z</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="icon"
              onClick={onRedo}
              disabled={redoStack.length === 0}
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {redoStack.length ? `Redo: ${redoStack[redoStack.length - 1].label}` : "Nothing to redo"}
            <span className="ml-2 opacity-60">⌘/Ctrl+Shift+Z</span>
          </TooltipContent>
        </Tooltip>
        <Button
          variant={selectMode ? "default" : "ghost"}
          size="sm"
          onClick={() => { if (selectMode) onExitSelectMode(); else onToggleSelectMode(); }}
          title="Toggle bulk rewrite (B)"
        >
          <CheckSquare className="h-4 w-4 mr-1.5" />
          {selectMode ? "Done" : "Bulk rewrite"}
        </Button>
        <Button variant="ghost" size="sm" onClick={copyAll} title="Copy plain text">
          <Copy className="h-4 w-4 mr-1.5" /> Copy
        </Button>
        <ExportMenu lyrics={lyrics} cadence={cadence} bpm={bpm} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Keyboard shortcuts">
              <Keyboard className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider">Shortcuts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs space-y-1">
              <div className="flex justify-between"><span>Navigate bars</span><kbd className="text-[10px] bg-muted px-1.5 rounded">↑ ↓ / j k</kbd></div>
              <div className="flex justify-between"><span>Rewrite focused bar</span><kbd className="text-[10px] bg-muted px-1.5 rounded">R</kbd></div>
              <div className="flex justify-between"><span>Lock / unlock</span><kbd className="text-[10px] bg-muted px-1.5 rounded">L</kbd></div>
              <div className="flex justify-between"><span>Cycle alternates</span><kbd className="text-[10px] bg-muted px-1.5 rounded">← →</kbd></div>
              <div className="flex justify-between"><span>Accept alternate</span><kbd className="text-[10px] bg-muted px-1.5 rounded">A / Enter</kbd></div>
              <div className="flex justify-between"><span>Discard alternate</span><kbd className="text-[10px] bg-muted px-1.5 rounded">D</kbd></div>
              <div className="flex justify-between"><span>Bulk mode</span><kbd className="text-[10px] bg-muted px-1.5 rounded">B</kbd></div>
              <div className="flex justify-between"><span>Toggle selection</span><kbd className="text-[10px] bg-muted px-1.5 rounded">S</kbd></div>
              <div className="flex justify-between"><span>Undo</span><kbd className="text-[10px] bg-muted px-1.5 rounded">⌘/Ctrl+Z</kbd></div>
              <div className="flex justify-between"><span>Redo</span><kbd className="text-[10px] bg-muted px-1.5 rounded">⌘/Ctrl+⇧+Z</kbd></div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
