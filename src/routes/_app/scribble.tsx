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

      <SemanticDriftBar drift={scribbleDrift} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-card/60 border border-border/70 rounded-xl">
            {SCRIBBLE_MODES.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id as ScribbleMode)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

          <Card className="p-4 bg-card/70 border-border/80 space-y-3 relative shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <PenLine className="h-3.5 w-3.5 text-primary" /> Lyric Writing Pad
                </span>
              </div>

              {liveScheme.name && (
                <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary">
                  🎵 {liveScheme.name}
                </span>
              )}
            </div>

            <Textarea
              placeholder="Dump whatever is in your head...
- 4 bars you mumbled in the car
- fragmented punchlines
- emotional thoughts about your day
- rhyme schemes you want to connect
The live studio on the right will track your cadence and sound families in real-time."
              value={scribbleText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={Math.max(12, linesCount + 2)}
              className="font-mono text-sm leading-relaxed resize-none bg-background/50 border border-border/40 focus-visible:ring-1 focus-visible:ring-primary/50 p-3 rounded-md w-full"
            />

            {liveFlowInsight && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5 text-xs text-amber-200/90 font-mono space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{liveFlowInsight.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{liveFlowInsight.message}</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {liveFlowInsight.suggestions.map((sug, si) => (
                    <button
                      key={si}
                      type="button"
                      onClick={() => {
                        const lines = [...scribbleLines];
                        lines[liveFlowInsight.lineIdx] = sug.replace(/\s*\([^)]*\)/, "");
                        handleTextChange(lines.join("\n"));
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3 font-mono">
                <span>{wordsCount} words</span>
                <span>•</span>
                <span>{linesCount} lines</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
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

        {/* Right Column: Live Rhyme & Cadence Stream Studio OR Sense-Making Output */}
        <div className="lg:col-span-6 space-y-4">
          {!result ? (
            <Card className="p-4 bg-card/70 border-border/80 space-y-3 relative shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/50 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Live Rhyme & Cadence Studio
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Click any word to explore rhymes
                </span>
              </div>

              {scribbleText.trim() ? (
                <div className="space-y-1.5 font-mono text-sm leading-relaxed">
                  {liveHighlighted.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 group hover:bg-card/60 px-2 py-1.5 rounded transition-colors"
                    >
                      <div className="flex items-baseline gap-2 flex-1 min-w-0 flex-wrap">
                        {item.schemeLetter && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-border/40 shrink-0 self-center ${
                              item.rhymeGroupClass || "text-muted-foreground bg-muted/20"
                            }`}
                          >
                            {item.schemeLetter}
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
                      {scribbleLines[idx]?.trim() && (
                        <div className="flex items-center gap-1.5 shrink-0 font-mono pt-0.5">
                          {scribbleStress[idx]?.chars.length > 0 && (
                            <span className="hidden sm:flex items-center gap-0.5 text-[8px]" title={`Cadence: ${scribbleStress[idx]?.rawPattern}`}>
                              {scribbleStress[idx]?.chars.slice(0, 10).map((c, ci) => (
                                <span key={ci} className={c === "/" ? "text-primary font-bold" : "text-muted-foreground/60"}>
                                  {c === "/" ? "●" : "○"}
                                </span>
                              ))}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/60">
                            {item.syllables} syl
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground space-y-3 border border-dashed border-border/50 rounded-lg bg-background/30">
                  <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs leading-relaxed max-w-xs mx-auto">
                    Type on the left or click a Quick Spark to watch multi-syllable rhyme schemes, phoneme clusters, and rhythm cadence dots illuminate live.
                  </p>
                </div>
              )}

              {/* 6-Channel DHH Color Legend */}
              <div className="pt-3 border-t border-border/40 grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[9px] font-mono">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-yellow-400/40 border border-yellow-400/70 shrink-0" />
                  <span className="truncate text-muted-foreground">/aɪ/ Vowel</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400/40 border border-cyan-400/70 shrink-0" />
                  <span className="truncate text-muted-foreground">Consonance</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-red-400/40 border border-red-400/70 shrink-0" />
                  <span className="truncate text-muted-foreground">/eː/ Verbs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-green-400/40 border border-green-400/70 shrink-0" />
                  <span className="truncate text-muted-foreground">/ɑː/ Anchor</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-pink-400/40 border border-pink-400/70 shrink-0" />
                  <span className="truncate text-muted-foreground">/iː/ High</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-orange-400/40 border border-orange-400/70 shrink-0" />
                  <span className="truncate text-muted-foreground">/oʊ/ Back</span>
                </div>
              </div>
            </Card>
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
