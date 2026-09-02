import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  PenLine,
  Sparkles,
  Brain,
  Zap,
  Music,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Layers,
  Flame,
  Lightbulb,
  CheckCircle2,
  FolderSync,
} from "lucide-react";
import {
  makeSenseOfScribble,
  syncScribbleToBrain,
  type ScribbleMode,
  type ScribbleResult,
} from "@/lib/scribble-synthesizer";
import { highlightLyrics, getStanzaRhymeScheme, detectFlowInsight, type RhymeVisionMode } from "@/lib/rhyme-highlighter";
import { RhymeLookup } from "@/components/RhymeLookup";
import { ComplexityGauge } from "@/components/track/ComplexityGauge";
import { SemanticDriftBar } from "@/components/track/SemanticDriftBar";
import { scoreComplexity, detectSemanticDrift } from "@/lib/diagnostics";
import { getLineStressAnalysis } from "@/lib/cadence-flow";

const DRAFT_KEY = "voxscript:scribble-draft";
const AUTO_SYNC_KEY = "voxscript:scribble-auto-sync";

const QUICK_SPARKS = [
  { label: "Midnight Drive", text: "driving past empty neon lights, windows down cold air hitting my face\nthree in the morning thoughts running wild\nremember when nobody answered the calls" },
  { label: "Paper Chase", text: "sixty floors up counting up the backend\nevery secret in the city bought and sold\nstay quiet in the room full of loud talkers\nbuilt it from the pavement now the circle small" },
  { label: "Vulnerable & Real", text: "tired of putting on the armor every morning\nfake smiles in crowded rooms\nscared to lose what i barely just found\nsometimes the truth hurts worse than the lie" },
  { label: "Battle Ready", text: "never fold never flinch when the pressure rise\nsharpen the pen like a blade in the dark\nwatching them switch up soon as the money talk\nkept my head high in the middle of the storm" },
];

const SCRIBBLE_MODES = [
  { id: "full-song", label: "Full Song", icon: Music },
  { id: "verse-16", label: "16-Bar Verse", icon: Layers },
  { id: "hook-anthem", label: "Hook & Anthem", icon: Flame },
  { id: "rhyme-slang", label: "Rhyme & Slang", icon: Zap },
] as const;

export const Route = createFileRoute("/_app/scribble")({
  head: () => ({
    meta: [
      { title: "Scribble Studio & Sense-Maker — VoxScript" },
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
  const [rhymeLookupWord, setRhymeLookupWord] = useState("");
  const [rhymeLookupOpen, setRhymeLookupOpen] = useState(false);
  const [mode, setMode] = useState<ScribbleMode>("full-song");
  const [autoSync, setAutoSync] = useState(true);
  const [zeroAiMode, setZeroAiMode] = useState(false);
  const [result, setResult] = useState<ScribbleResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncedPaths, setSyncedPaths] = useState<{ lyricsPath?: string; rhymesPath?: string } | null>(null);

  // Restore draft and settings on mount
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) setScribbleText(savedDraft);
      const savedAutoSync = localStorage.getItem(AUTO_SYNC_KEY);
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

  async function handleMakeSense() {
    if (!scribbleText.trim()) {
      toast.error("Write some scribbles or click a Quick Spark first");
      return;
    }

    startTransition(async () => {
      try {
        const res = await makeSenseOfScribble(scribbleText, mode, { offlineOnly: zeroAiMode });
        setResult(res);
        toast.success(zeroAiMode ? "Synthesized via Zero-AI RAG Engine!" : "Synthesized scribbles!", {
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PenLine className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">Scribble Studio</h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Stream-of-Consciousness
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Scribble raw thoughts, fragmented bars, and voice memos. The engine extracts the core narrative,
            isolates punchlines, locks into cadence, and syncs directly into your local Brain backend.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ComplexityGauge result={scribbleComplexity} />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-muted-foreground font-medium">Zero-AI RAG</span>
            <Switch
              checked={zeroAiMode}
              onCheckedChange={setZeroAiMode}
              aria-label="Toggle Zero-AI RAG mode"
            />
          </div>

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
        <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
          <span className="p-1 rounded bg-amber-500/10 text-amber-400 shrink-0 text-sm">💡</span>
          <div>
            <span className="font-semibold text-foreground block">Narrative Extraction</span>
            <span className="text-muted-foreground text-[10px] leading-tight block">Detects raw themes, mood & emotions</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
          <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 shrink-0 text-sm">💎</span>
          <div>
            <span className="font-semibold text-foreground block">Gem Mining</span>
            <span className="text-muted-foreground text-[10px] leading-tight block">Preserves punchlines & standout bars</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0 text-sm">⚡</span>
          <div>
            <span className="font-semibold text-foreground block">Cadence Lock</span>
            <span className="text-muted-foreground text-[10px] leading-tight block">6-channel DHH phonemes & pocket flow</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-card/60 border border-border/70 flex items-start gap-2 shadow-xs">
          <span className="p-1 rounded bg-purple-500/10 text-purple-400 shrink-0 text-sm">📁</span>
          <div>
            <span className="font-semibold text-foreground block">Brain Auto-Sync</span>
            <span className="text-muted-foreground text-[10px] leading-tight block">Zero-cloud local memory indexing</span>
          </div>
        </div>
      </div>

      <SemanticDriftBar drift={scribbleDrift} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Combined In-Place Studio Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-card/60 border border-border/70 rounded-xl">
            {SCRIBBLE_MODES.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id as ScribbleMode)}
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

          {/* Dynamic Rhyme Continuations & Quick Lookup */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium flex-wrap gap-1">
              {dynamicSuggestions && activeTrailingWord ? (
                <span className="flex items-center gap-1.5 text-primary font-mono font-semibold">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Rhyme Continuations for &quot;{activeTrailingWord}&quot;
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-amber-400" /> Starter Themes (Load inspiration)
                </span>
              )}

              {activeTrailingWord && (
                <button
                  type="button"
                  onClick={() => {
                    setRhymeLookupWord(activeTrailingWord);
                    setRhymeLookupOpen(true);
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 underline cursor-pointer"
                >
                  🔍 Explore rhymes for &quot;{activeTrailingWord}&quot;
                </button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {dynamicSuggestions ? (
                dynamicSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplySpark(sug.line)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors text-primary font-mono cursor-pointer"
                  >
                    + &quot;{sug.label}&quot;
                  </button>
                ))
              ) : (
                QUICK_SPARKS.map((spark) => (
                  <button
                    key={spark.label}
                    type="button"
                    onClick={() => handleApplySpark(spark.text)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-secondary/40 hover:bg-secondary border border-border/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    + {spark.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* COMBINED IN-PLACE CANVAS */}
          <Card className="p-4 bg-card/70 border-border/80 space-y-3 relative shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> VibeLyrics Unified Studio
                </span>
                <span className="text-[10px] text-muted-foreground/60 hidden sm:inline font-mono">
                  (Type & highlight in the same place)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {liveScheme.name && (
                  <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary">
                    🎵 {liveScheme.name}
                  </span>
                )}
                <div className="flex items-center gap-1 bg-background/60 p-0.5 rounded-lg border border-border/60 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCanvasMode("combined")}
                    className={`px-2 py-0.5 rounded font-mono transition-all cursor-pointer ${
                      canvasMode === "combined"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    In-Place Canvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasMode("scratchpad")}
                    className={`px-2 py-0.5 rounded font-mono transition-all cursor-pointer ${
                      canvasMode === "scratchpad"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Bulk Paste
                  </button>
                </div>
              </div>
            </div>

            {/* In-Place Combined Mode */}
            {canvasMode === "combined" ? (
              <div className="space-y-1 font-mono text-sm leading-relaxed">
                {scribbleLines.length > 0 && scribbleLines.some((l) => l.trim()) ? (
                  scribbleLines.map((lineText, idx) => {
                    const item = liveHighlighted[idx];
                    const isEditing = editingLineIdx === idx;
                    const stress = scribbleStress[idx];

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 group px-2 py-1 rounded-md hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40"
                      >
                        {/* Scheme Badge Gutter */}
                        <div className="w-7 shrink-0 flex items-center justify-start">
                          {item?.schemeLetter ? (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-border/40 ${item.rhymeGroupClass || "text-muted-foreground bg-muted/20"}`}>
                              {item.schemeLetter}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40 pl-1">{idx + 1}</span>
                          )}
                        </div>

                        {/* In-Place Editor / Live Highlighted Bar */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              autoFocus
                              value={lineText}
                              onChange={(e) => {
                                const newLines = [...scribbleLines];
                                newLines[idx] = e.target.value;
                                handleTextChange(newLines.join("\n"));
                              }}
                              onBlur={() => setEditingLineIdx(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const newLines = [...scribbleLines];
                                  newLines.splice(idx + 1, 0, "");
                                  handleTextChange(newLines.join("\n"));
                                  setEditingLineIdx(idx + 1);
                                } else if (e.key === "Backspace" && !lineText && scribbleLines.length > 1) {
                                  e.preventDefault();
                                  const newLines = [...scribbleLines];
                                  newLines.splice(idx, 1);
                                  handleTextChange(newLines.join("\n"));
                                  setEditingLineIdx(Math.max(0, idx - 1));
                                } else if (e.key === "ArrowUp" && idx > 0) {
                                  e.preventDefault();
                                  setEditingLineIdx(idx - 1);
                                } else if (e.key === "ArrowDown" && idx < scribbleLines.length - 1) {
                                  e.preventDefault();
                                  setEditingLineIdx(idx + 1);
                                }
                              }}
                              className="w-full bg-background border border-primary/60 px-2 py-0.5 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                            />
                          ) : (
                            <div
                              onClick={() => setEditingLineIdx(idx)}
                              className="cursor-text select-text break-words py-0.5"
                              dangerouslySetInnerHTML={{
                                __html: item?.html || (lineText.trim() ? lineText : "<span class='text-muted-foreground/40 italic'>Empty bar... click to write</span>"),
                              }}
                            />
                          )}
                        </div>

                        {/* Right Margin: Cadence Dots & Syllables */}
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-muted-foreground/70">
                          {stress?.chars.length > 0 && (
                            <span className="hidden sm:flex items-center gap-0.5 text-[8px]" title={`Cadence: ${stress.rawPattern}`}>
                              {stress.chars.slice(0, 10).map((c, ci) => (
                                <span key={ci} className={c === "/" ? "text-primary font-bold" : "text-muted-foreground/50"}>
                                  {c === "/" ? "●" : "○"}
                                </span>
                              ))}
                            </span>
                          )}
                          <span className="w-12 text-right text-[10px] text-muted-foreground/70">
                            {item?.syllables || countSyllables(lineText)} syl
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    onClick={() => {
                      if (!scribbleText.trim()) {
                        handleTextChange(" ");
                        setEditingLineIdx(0);
                      }
                    }}
                    className="p-8 text-center text-muted-foreground space-y-2 border border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs leading-relaxed">
                      Click here to write your first bar, or pick a Quick Spark above.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const newLines = [...scribbleLines, ""];
                      handleTextChange(newLines.join("\n"));
                      setEditingLineIdx(newLines.length - 1);
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-mono flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors cursor-pointer"
                  >
                    + Add Next Bar (Enter)
                  </button>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Click any word to explore rhymes
                  </span>
                </div>
              </div>
            ) : (
              /* Scratchpad / Bulk Paste Mode */
              <Textarea
                placeholder="Paste full lyrics or dump multi-line freestyle here..."
                value={scribbleText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={Math.max(12, linesCount + 2)}
                className="font-mono text-sm leading-relaxed resize-none bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-primary/50 p-3 rounded-md w-full"
              />
            )}

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

        {/* Right 5 Columns: Flow Diagnostic, Rhyme Inspector & Sense-Making Output */}
        <div className="lg:col-span-5 space-y-4">
          {!result ? (
            <div className="space-y-4">
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

              {/* 6-Channel DHH Color Map Guide */}
              <Card className="p-4 bg-card/70 border-border/80 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    6-Channel Phonetic Legend
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-yellow-400/10 border border-yellow-400/30">
                    <span className="w-3 h-3 rounded bg-yellow-400/50 border border-yellow-400 shrink-0" />
                    <span className="text-yellow-300 font-medium">/aɪ/ Diphthong</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-cyan-400/10 border border-cyan-400/30">
                    <span className="w-3 h-3 rounded bg-cyan-400/50 border border-cyan-400 shrink-0" />
                    <span className="text-cyan-300 font-medium">Consonance & Nasal</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-400/10 border border-red-400/30">
                    <span className="w-3 h-3 rounded bg-red-400/50 border border-red-400 shrink-0" />
                    <span className="text-red-300 font-medium">/eː/ Rhyme Verbs</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-green-400/10 border border-green-400/30">
                    <span className="w-3 h-3 rounded bg-green-400/50 border border-green-400 shrink-0" />
                    <span className="text-green-300 font-medium">/ɑː/ Rhythm Anchor</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-pink-400/10 border border-pink-400/30">
                    <span className="w-3 h-3 rounded bg-pink-400/50 border border-pink-400 shrink-0" />
                    <span className="text-pink-300 font-medium">/iː/ High-Front</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 rounded bg-orange-400/10 border border-orange-400/30">
                    <span className="w-3 h-3 rounded bg-orange-400/50 border border-orange-400 shrink-0" />
                    <span className="text-orange-300 font-medium">/oʊ/ Back Vowels</span>
                  </div>
                </div>
              </Card>

              {/* Ready to Synthesize Prompt */}
              <Card className="p-5 text-center text-muted-foreground space-y-3 border-dashed bg-card/30">
                <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto">
                  <Brain className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground text-xs">Ready to Synthesize into a Song</h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Click &ldquo;Make Sense of This&rdquo; when your scribble is ready to structure it into locked verses and hook.
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              {/* Sense-Making Executive Card */}
              <Card className="p-4 space-y-3 bg-card/80 border-emerald-500/40 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold font-display">{result.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {result.analysis.centralNarrative}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono shrink-0">
                    ~{result.analysis.suggestedBpm} BPM
                  </Badge>
                </div>

                {/* Mood & Vibe Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px]">
                    Mood: {result.analysis.mood}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Genre: {result.analysis.genre}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Vibe: {result.analysis.vibe}
                  </Badge>
                </div>

                {/* Standout Gems */}
                {result.analysis.standoutGems.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-border/60">
                    <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-400" /> Extracted Standout Gems:
                    </div>
                    <div className="space-y-1">
                      {result.analysis.standoutGems.map((gem, i) => (
                        <div key={i} className="text-xs font-mono p-1.5 rounded bg-background/60 border border-border/40 text-foreground italic">
                          "{gem}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rhyme Pockets */}
                {result.analysis.rhymeClusters.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-border/60">
                    <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-emerald-400" /> Discovered Rhyme Pockets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.analysis.rhymeClusters.map((cluster, i) => (
                        <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border/60">
                          <strong className="text-primary">{cluster.word}</strong> ↔ {cluster.rhymesWith.join(", ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Synthesized Lyrics Section */}
              <Card className="p-4 space-y-4 border-border/80 bg-card/60">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Synthesized Lyric Blueprint</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="space-y-4">
                  {result.sections.map((section, sIdx) => {
                    const prevLinesCount = result.sections
                      .slice(0, sIdx)
                      .reduce((acc, s) => acc + s.lines.length, 0);

                    return (
                      <div key={sIdx} className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          [{section.type}]
                        </div>
                        <div className="bg-background/80 p-3 rounded-md border border-border/50 space-y-1.5 font-mono text-xs leading-relaxed">
                          {section.lines.map((line, lIdx) => {
                            const globalIdx = prevLinesCount + lIdx;
                            const hItem = resultHighlighted[globalIdx];
                            return (
                              <div key={lIdx} className="flex items-center justify-between gap-3 text-muted-foreground">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {hItem?.schemeLetter && (
                                    <span
                                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-border/40 shrink-0 ${
                                        hItem.rhymeGroupClass || "text-muted-foreground bg-muted/20"
                                      }`}
                                    >
                                      {hItem.schemeLetter}
                                    </span>
                                  )}
                                  <span
                                    className="text-foreground select-text cursor-pointer"
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
                                    dangerouslySetInnerHTML={{ __html: hItem?.html || line }}
                                  />
                                </div>
                                <span className="text-[10px] opacity-60 shrink-0 font-mono">
                                  {countSyllables(line)} syl
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions & Brain Status */}
                <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {syncedPaths ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Synced to {syncedPaths.lyricsPath}
                      </span>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={handleManualSyncToBrain} className="text-xs">
                        <FolderSync className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                        Save to Local Brain
                      </Button>
                    )}
                  </div>

                  <Button size="sm" onClick={handleSendToStudio} className="text-xs bg-primary hover:bg-primary/90">
                    Use in Track Studio <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <RhymeLookup
        open={rhymeLookupOpen}
        onOpenChange={setRhymeLookupOpen}
        defaultWord={rhymeLookupWord}
      />
    </div>
  );
}
