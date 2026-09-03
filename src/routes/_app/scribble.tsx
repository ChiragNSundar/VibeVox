import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";
import {
  PenLine,
  Sparkles,
  Brain,
  Zap,
  Music,
  Layers,
  Flame,
  BookOpen,
} from "lucide-react";
import {
  makeSenseOfScribble,
  syncScribbleToBrain,
  type ScribbleMode,
  type ScribbleResult,
} from "@/lib/scribble-synthesizer";
import { highlightLyrics, getStanzaRhymeScheme, detectFlowInsight, type RhymeVisionMode } from "@/lib/rhyme-highlighter";
import { RhymeLookup } from "@/components/RhymeLookup";
import { ComplexityGauge, SemanticDriftBar } from "@/components/track";
import { SuperpowersBanner, ScribbleResultView } from "@/components/scribble";
import { JournalDrawer } from "@/components/journal";
import { StudioArsenalDrawer } from "@/components/studio-arsenal";
import { scoreComplexity, detectSemanticDrift } from "@/lib/diagnostics";
import { getLineStressAnalysis, calculateMatra, detectFlowMetric } from "@/lib/cadence-flow";
import { countSyllables } from "@/lib/phonetics";

const DRAFT_KEY = "vibevox:scribble-draft";
const AUTO_SYNC_KEY = "vibevox:scribble-auto-sync";

const SCRIBBLE_MODES = [
  { id: "full-song", label: "Full Song", icon: Music },
  { id: "verse-16", label: "16-Bar Verse", icon: Layers },
  { id: "hook-anthem", label: "Hook & Anthem", icon: Flame },
  { id: "rhyme-slang", label: "Rhyme & Slang", icon: Zap },
] as const;

const PREMADE_STRUCTURES: Record<ScribbleMode, string> = {
  "verse-16": `[Verse 1 — 16 Bars]















`,

  "hook-anthem": `[Hook / Anthem — 8 Bars]







`,

  "full-song": `[Intro]


[Verse 1]




[Hook]




[Verse 2]




[Outro]

`,

  "rhyme-slang": `[4-Bar Rhyme Pocket]



`,
};

export const Route = createFileRoute("/_app/scribble")({
  head: () => ({
    meta: [
      { title: "VibeLyrics Studio — VibeVox" },
      {
        name: "description",
        content: "Scribble messy thoughts, fragmented bars, and voice memos. The AI makes sense of it and syncs to your local brain.",
      },
    ],
  }),
  component: ScribblePage,
});

function ScribblePage() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [scribbleText, setScribbleText] = useState("");
  const [rhymeVision, setRhymeVision] = useState<RhymeVisionMode>("standard");
  const [scribbleViewMode, setScribbleViewMode] = useState<"live" | "raw">("live");
  const [canvasMode, setCanvasMode] = useState<"combined" | "scratchpad">("combined");
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [rhymeLookupWord, setRhymeLookupWord] = useState("");
  const [rhymeLookupOpen, setRhymeLookupOpen] = useState(false);
  const [journalDrawerOpen, setJournalDrawerOpen] = useState(false);
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [showMatra, setShowMatra] = useState(false);
  const [mode, setMode] = useState<ScribbleMode>("full-song");
  const [autoSync, setAutoSync] = useState(true);
  const [result, setResult] = useState<ScribbleResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncedPaths, setSyncedPaths] = useState<{ lyricsPath?: string; rhymesPath?: string } | null>(null);

  // Restore draft and settings on mount
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const savedDraft = localStorage.getItem(DRAFT_KEY) || localStorage.getItem("voxscript:scribble-draft");
      if (savedDraft) setScribbleText(savedDraft);
      const savedAutoSync = localStorage.getItem(AUTO_SYNC_KEY) || localStorage.getItem("voxscript:scribble-auto-sync");
      if (savedAutoSync !== null) setAutoSync(savedAutoSync === "true");
    }
  }, []);

  // Auto-save draft on text change
  function handleTextChange(val: string) {
    setScribbleText(val);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DRAFT_KEY, val);
    }
  }

  function handleAutoSyncToggle(enabled: boolean) {
    setAutoSync(enabled);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTO_SYNC_KEY, String(enabled));
    }
    toast.info(enabled ? "Auto-sync to brain enabled" : "Auto-sync disabled");
  }

  function handleApplySpark(sparkText: string) {
    setScribbleText((prev) => (prev ? `${prev}\n\n${sparkText}` : sparkText));
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DRAFT_KEY, scribbleText ? `${scribbleText}\n\n${sparkText}` : sparkText);
    }
  }

  function handleClear() {
    if (scribbleText && confirm("Clear your scribble draft?")) {
      setScribbleText("");
      setResult(null);
      setSyncedPaths(null);
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }

  function handleModeSelect(newMode: ScribbleMode) {
    setMode(newMode);
    const template = PREMADE_STRUCTURES[newMode];
    if (template) {
      handleTextChange(template);
    }
  }

  async function handleMakeSense() {
    if (!scribbleText.trim()) {
      toast.error("Write some scribbles or click a Quick Spark first");
      return;
    }

    startTransition(async () => {
      try {
        const res = await makeSenseOfScribble(scribbleText, mode);
        setResult(res);
        toast.success("Synthesized scribbles!", {
          description: `Detected: ${res.analysis.mood} · ${res.analysis.vibe}`,
        });

        // If autoSync is enabled, write to local brain backend immediately!
        if (autoSync) {
          try {
            const paths = await syncScribbleToBrain(res);
            setSyncedPaths(paths);
            toast.success("Updated local brain backend", {
              description: `Saved to ${paths.lyricsPath || "brain/lyrics/"}`,
            });
          } catch (syncErr) {
            console.warn("Brain sync error:", syncErr);
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to synthesize scribble");
      }
    });
  }

  async function handleManualSyncToBrain() {
    if (!result) return;
    try {
      const paths = await syncScribbleToBrain(result);
      setSyncedPaths(paths);
      toast.success("Saved to Local Brain!", {
        description: `Written to ${paths.lyricsPath} and indexed in memory.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save to brain");
    }
  }

  function handleCopy() {
    if (!result) return;
    const textToCopy = `${result.title}\n\n` + result.sections
      .map((s) => `[${s.type.toUpperCase()}]\n${s.lines.join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lyrics copied to clipboard");
  }

  function handleSendToStudio() {
    if (!result) return;
    navigate({ to: "/new" });
  }

  const linesCount = scribbleText.split("\n").filter((l) => l.trim().length > 0).length;
  const wordsCount = scribbleText.trim() ? scribbleText.trim().split(/\s+/).length : 0;

  const scribbleLines = useMemo(() => scribbleText.split("\n"), [scribbleText]);
  const liveHighlighted = useMemo(
    () => highlightLyrics(scribbleLines, rhymeVision),
    [scribbleLines, rhymeVision]
  );
  const liveScheme = useMemo(
    () => getStanzaRhymeScheme(scribbleLines.filter((l) => l.trim())),
    [scribbleLines]
  );
  const liveFlowInsight = useMemo(
    () => detectFlowInsight(scribbleLines.filter((l) => l.trim())),
    [scribbleLines]
  );

  const scribbleComplexity = useMemo(() => {
    const valid = scribbleLines.filter((l) => l.trim().length > 0);
    if (valid.length < 2) return null;
    return scoreComplexity(valid);
  }, [scribbleLines]);

  const scribbleDrift = useMemo(() => {
    const valid = scribbleLines.filter((l) => l.trim().length > 0);
    if (valid.length < 6) return null;
    return detectSemanticDrift(valid);
  }, [scribbleLines]);

  const scribbleStress = useMemo(() => {
    return scribbleLines.map((l) => getLineStressAnalysis(l));
  }, [scribbleLines]);

  const activeTrailingWord = useMemo(() => {
    const lines = scribbleLines.filter((l) => l.trim().length > 0);
    if (!lines.length) return "";
    const last = lines[lines.length - 1].trim();
    const words = last.split(/\s+/);
    return words[words.length - 1].toLowerCase().replace(/[^a-z]/g, "");
  }, [scribbleLines]);

  const dynamicSuggestions = useMemo(() => {
    if (!activeTrailingWord) return null;
    const w = activeTrailingWord;

    if (["cries", "eyes", "lies", "ties", "skies", "guys", "buys", "tries", "flies"].includes(w)) {
      return [
        { label: "disguise", line: "watch the truth behind their disguise" },
        { label: "compromise", line: "on this grind we never compromise" },
        { label: "slowly rise", line: "from the ashes watch the empire rise" },
        { label: "realize", line: "too late when they finally realize" },
      ];
    }

    if (["die", "hai", "homicide", "side", "life", "ride", "wide"].includes(w)) {
      return [
        { label: "other side", line: "pulling up straight to the other side" },
        { label: "slow down ride", line: "grind pe na slow down ride" },
        { label: "worldwide", line: "making moves running worldwide" },
        { label: "compromise", line: "grind pe na compromise" },
      ];
    }

    if (["kare", "dare", "rahe", "chale", "bhale"].includes(w)) {
      return [
        { label: "na dare", line: "khud se lade aur kabhi na dare" },
        { label: "badhte rahe", line: "manzil ki taraf aage badhte rahe" },
        { label: "saare gile", line: "bhool gaye hum toh saare gile" },
      ];
    }

    if (["bro", "woh", "flow", "slow", "glow", "show"].includes(w)) {
      return [
        { label: "let it go", line: "pack the bags and just let it go" },
        { label: "heavy flow", line: "switching up gears with the heavy flow" },
        { label: "stealing show", line: "lights down low we stealing the show" },
      ];
    }

    return null;
  }, [activeTrailingWord]);

  const resultFlatLines = useMemo(
    () => (result ? result.sections.flatMap((s) => s.lines) : []),
    [result]
  );
  const resultHighlighted = useMemo(
    () => highlightLyrics(resultFlatLines, rhymeVision),
    [resultFlatLines, rhymeVision]
  );

  return (
    <div className="w-full space-y-4 pt-1 pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-6 w-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">VibeLyrics Studio</h1>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono">
              Live Phonetics & Scribble
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Freestyle your thoughts, fragmented bars, or slang. Watch 6-channel DHH phonetics, multisyllabic compound schemes,
            and cadence stress illuminate in the exact same place you write in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ComplexityGauge result={scribbleComplexity} />

          <button
            type="button"
            onClick={() => { setRhymeLookupWord(""); setRhymeLookupOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-pointer"
            title="Open Rhyme Studio"
          >
            <Music className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Rhyme Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setJournalDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs text-muted-foreground hover:text-foreground hover:border-indigo-500/40 transition-all cursor-pointer"
            title="Open Writer's Headspace & Quick Journal"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-medium">Headspace</span>
          </button>

          <button
            type="button"
            onClick={() => setArsenalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs text-muted-foreground hover:text-foreground hover:border-amber-500/40 transition-all cursor-pointer"
            title="Open Studio Arsenal: Punchlines & Hooks"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-medium">Arsenal</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs">
            <Brain className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-muted-foreground font-medium">Auto-Sync to Brain</span>
            <Switch
              checked={autoSync}
              onCheckedChange={handleAutoSyncToggle}
              aria-label="Toggle Auto-sync to Brain"
            />
          </div>
        </div>
      </div>

      {/* VibeLyrics Flagship 4-Superpowers Banner */}
      <SuperpowersBanner />

      <SemanticDriftBar drift={scribbleDrift} />

      {/* Top Mode Selector */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-card/60 border border-border/70 rounded-xl">
          {SCRIBBLE_MODES.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleModeSelect(item.id as ScribbleMode)}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Word Quick Rhyme Link if typing */}
        {activeTrailingWord && (
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            <span className="text-muted-foreground">Active bar ending: <strong className="text-primary">&quot;{activeTrailingWord}&quot;</strong></span>
            <button
              type="button"
              onClick={() => {
                setRhymeLookupWord(activeTrailingWord);
                setRhymeLookupOpen(true);
              }}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 underline cursor-pointer"
            >
              🔍 Explore rhymes for &quot;{activeTrailingWord}&quot;
            </button>
          </div>
        )}
      </div>

      {/* STRICT SIDE-BY-SIDE DUAL STUDIO (50% / 50%) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* LEFT COLUMN: 100% NORMALLY TYPABLE WRITING PAD */}
        <div className="space-y-3">
          <Card className="p-4 bg-card/70 border-border/80 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Lyric Writing Pad (Notepad)
                </span>
              </div>
              {liveScheme.name && (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary">
                  🎵 {liveScheme.name}
                </span>
              )}
            </div>

            <Textarea
              value={scribbleText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type your bars here normally like a notepad...
jo chahe mujhe woh chahe
jo laye mujhe woh gaaye
na dekhu muskuraate mere hot
pot gungunaate but you dont see it in my eyes
because i got quite cries"
              spellCheck={false}
              rows={Math.max(14, linesCount + 2)}
              className="w-full bg-background/50 font-mono text-sm leading-relaxed p-3.5 rounded-md border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 resize-none max-h-[580px] studio-scroll overflow-y-auto block"
            />

            <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3 font-mono">
                <span>{wordsCount} words</span>
                <span>•</span>
                <span>{linesCount} lines</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Auto-saved locally
              </div>
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 cursor-pointer"
            onClick={handleMakeSense}
            disabled={isPending || !scribbleText.trim()}
          >
            <Sparkles className={`h-4 w-4 mr-2 ${isPending ? "animate-spin text-amber-300" : ""}`} />
            {isPending ? "Deconstructing & Synthesizing…" : "Make Sense of This →"}
          </Button>
        </div>

        {/* RIGHT COLUMN: Live Phonetic Clusters (Side-by-Side) */}
        <div className="space-y-4">
          {!result ? (
            <div className="space-y-4">
              <Card className="p-4 bg-card/70 border-border/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-border/50 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      DHH Phonetic & Flow Studio
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMatra(!showMatra)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border cursor-pointer ${
                        showMatra
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                          : "bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground"
                      }`}
                      title="Toggle Classical Indic Matra (Laghu/Guru) vs. Western Syllable Count"
                    >
                      {showMatra ? "Mātrā (L/G)" : "Syllables"}
                    </button>
                    <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                      Click word to inspect
                    </span>
                  </div>
                </div>

                <div className="max-h-[580px] overflow-y-auto studio-scroll pr-1.5 space-y-2 font-mono text-sm leading-relaxed p-1">
                  {liveHighlighted.length > 0 && scribbleLines.some((l) => l.trim()) ? (
                    liveHighlighted.map((item, idx) => {
                      const line = scribbleLines[idx] || "";
                      const stress = scribbleStress[idx];
                      const flow = detectFlowMetric(line, stress?.chars);

                      const matra = showMatra ? calculateMatra(line) : null;
                      const isAnaphora = item.anaphora;
                      const isSectionHeader = /^\[.+\]$/.test(line.trim());

                      // Count bar number: track non-empty, non-header lines since last header
                      let barNum = 0;
                      if (!isSectionHeader && line.trim()) {
                        let count = 0;
                        for (let bi = idx; bi >= 0; bi--) {
                          const bl = scribbleLines[bi]?.trim() || "";
                          if (/^\[.+\]$/.test(bl)) break;
                          if (bl) count++;
                        }
                        barNum = count;
                      }

                      if (isSectionHeader) {
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-2 py-2 mt-1"
                          >
                            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 tracking-wide uppercase">
                              {line.trim().replace(/^\[|\]$/g, "")}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-start justify-between gap-3 group hover:bg-card/60 px-2 py-1.5 rounded transition-colors ${
                            isAnaphora ? "anaphora-bracket" : ""
                          }`}
                        >
                          <div className="flex items-baseline gap-2 flex-1 min-w-0 flex-wrap">
                            {barNum > 0 && (
                              <span
                                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 self-center tabular-nums"
                                title={`Bar ${barNum}`}
                              >
                                {String(barNum).padStart(2, "0")}
                              </span>
                            )}
                            {item.schemeLetter && (
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-border/40 shrink-0 self-center ${
                                  item.rhymeGroupClass || "text-muted-foreground bg-muted/20"
                                }`}
                              >
                                {item.schemeLetter}
                              </span>
                            )}
                            {isAnaphora && (
                              <span
                                className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 shrink-0 self-center"
                                title={`Parallel framing / Anaphora (${item.anaphora?.phrase})`}
                              >
                                ↳ {item.anaphora?.phrase}
                              </span>
                            )}
                            <span
                              className="select-text cursor-pointer break-words leading-relaxed text-sm font-medium"
                              onClick={(e) => {
                                const target = (e.target as HTMLElement).closest(".word-hover") as HTMLElement | null;
                                if (target) {
                                  const w = target.getAttribute("data-word") || target.textContent || "";
                                  if (w.trim()) {
                                    setRhymeLookupWord(w.trim());
                                    setRhymeLookupOpen(true);
                                  }
                                }
                              }}
                              dangerouslySetInnerHTML={{ __html: item.html || "&nbsp;" }}
                            />
                          </div>
                          {line.trim() && (
                            <div className="flex items-center gap-1.5 shrink-0 font-mono pt-0.5">
                              {/* Polyrhythmic Triplet / 16th flow tag */}
                              {flow.badge && (
                                <span
                                  className={`text-[8px] font-mono px-1 py-0.2 rounded border ${
                                    flow.metricType === "triplet"
                                      ? "bg-amber-500/15 text-amber-300 border-amber-500/35 font-bold"
                                      : "bg-muted/30 text-muted-foreground/80 border-border/30"
                                  }`}
                                  title={flow.label}
                                >
                                  {flow.badge}
                                </span>
                              )}

                              {/* Cadence stress dots */}
                              {!showMatra && stress?.chars.length > 0 && (
                                <span className="hidden sm:flex items-center gap-0.5 text-[8px]" title={`Cadence: ${stress.rawPattern}`}>
                                  {stress.chars.slice(0, 8).map((c, ci) => (
                                    <span key={ci} className={c === "/" ? "text-primary font-bold" : "text-muted-foreground/60"}>
                                      {c === "/" ? "●" : "○"}
                                    </span>
                                  ))}
                                </span>
                              )}

                              {/* Matra or Syllable display */}
                              <span className="text-[10px] text-muted-foreground/80 w-14 text-right">
                                {showMatra && matra ? `${matra.totalMatra} mtr` : `${item.syllables} syl`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-muted-foreground space-y-2 border border-dashed border-border/50 rounded-lg">
                      <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                      <p className="text-xs leading-relaxed">
                        Type bars on the left to see live rhyme families, syllables, and cadence stress here.
                      </p>
                    </div>
                  )}
                </div>

                {/* 6-Channel DHH Color Map Guide */}
                <div className="pt-3 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-yellow-400/10 border border-yellow-400/30">
                    <span className="w-2.5 h-2.5 rounded bg-yellow-400/50 border border-yellow-400 shrink-0" />
                    <span className="text-yellow-300 font-medium text-[10px]">/aɪ/ Diphthong</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-cyan-400/10 border border-cyan-400/30">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-400/50 border border-cyan-400 shrink-0" />
                    <span className="text-cyan-300 font-medium text-[10px]">Consonance & Nasal</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-400/10 border border-red-400/30">
                    <span className="w-2.5 h-2.5 rounded bg-red-400/50 border border-red-400 shrink-0" />
                    <span className="text-red-300 font-medium text-[10px]">/eː/ Rhyme Verbs</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-green-400/10 border border-green-400/30">
                    <span className="w-2.5 h-2.5 rounded bg-green-400/50 border border-green-400 shrink-0" />
                    <span className="text-green-300 font-medium text-[10px]">/ɑː/ Anchor</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-pink-400/10 border border-pink-400/30">
                    <span className="w-2.5 h-2.5 rounded bg-pink-400/50 border border-pink-400 shrink-0" />
                    <span className="text-pink-300 font-medium text-[10px]">/iː/ High-Front</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-orange-400/10 border border-orange-400/30">
                    <span className="w-2.5 h-2.5 rounded bg-orange-400/50 border border-orange-400 shrink-0" />
                    <span className="text-orange-300 font-medium text-[10px]">/oʊ/ Back Vowels</span>
                  </div>
                </div>
              </Card>

              {/* Flow Architecture Insight Card */}
              {liveFlowInsight && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 font-mono space-y-2 animate-in fade-in shadow-sm">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>{liveFlowInsight.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{liveFlowInsight.message}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {liveFlowInsight.suggestions.map((sug, si) => (
                      <button
                        key={si}
                        type="button"
                        onClick={() => {
                          const lines = [...scribbleLines];
                          lines[liveFlowInsight.lineIdx] = sug.replace(/\s*\([^)]*\)/, "");
                          handleTextChange(lines.join("\n"));
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ScribbleResultView
              result={result}
              resultHighlighted={resultHighlighted}
              copied={copied}
              onCopy={handleCopy}
              syncedPaths={syncedPaths}
              onManualSync={handleManualSyncToBrain}
              onSendToStudio={handleSendToStudio}
              onWordClick={(w) => {
                setRhymeLookupWord(w);
                setRhymeLookupOpen(true);
              }}
            />
          )}
        </div>
      </div>

      <RhymeLookup
        open={rhymeLookupOpen}
        onOpenChange={setRhymeLookupOpen}
        defaultWord={rhymeLookupWord}
        trigger={<span className="hidden" />}
      />

      <JournalDrawer
        open={journalDrawerOpen}
        onOpenChange={setJournalDrawerOpen}
        onInsertIntoPad={(text) => {
          handleTextChange(scribbleText ? `${scribbleText}\n${text}` : text);
        }}
      />

      <StudioArsenalDrawer
        open={arsenalOpen}
        onOpenChange={setArsenalOpen}
        onInsertLine={(line) => {
          handleTextChange(scribbleText ? `${scribbleText}\n${line}` : line);
        }}
        recentLines={scribbleLines}
      />
    </div>
  );
}
