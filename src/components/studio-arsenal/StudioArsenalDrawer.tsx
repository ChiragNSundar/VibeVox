import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Sparkles,
  Zap,
  Flame,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  RefreshCw,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import {
  generatePunchlines,
  type ScoredPunchline,
} from "@/lib/punchline-engine";
import {
  generateHooks,
  type GeneratedHook,
} from "@/lib/hook-engine";

interface StudioArsenalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertLine?: (line: string) => void;
  recentLines?: string[];
}

const PUNCHLINE_MOODS = ["Confident", "Aggressive", "Dark", "Witty", "Smooth"] as const;
const HOOK_MOODS = ["Anthemic", "Melodic", "Hypnotic", "Aggressive", "Chant"] as const;

export function StudioArsenalDrawer({
  open,
  onOpenChange,
  onInsertLine,
  recentLines,
}: StudioArsenalDrawerProps) {
  const [activeTab, setActiveTab] = useState<"punchlines" | "hooks">("punchlines");

  // Punchline State
  const [punchInput, setPunchInput] = useState("");
  const [punchMood, setPunchMood] = useState<string>("Confident");
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchlines, setPunchlines] = useState<ScoredPunchline[]>([]);
  const [punchSource, setPunchSource] = useState<"ai" | "algorithmic" | null>(null);

  // Hook State
  const [hookTheme, setHookTheme] = useState("");
  const [hookMood, setHookMood] = useState<string>("Anthemic");
  const [hookLoading, setHookLoading] = useState(false);
  const [hooks, setHooks] = useState<GeneratedHook[]>([]);
  const [hookSource, setHookSource] = useState<"ai" | "algorithmic" | null>(null);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  async function handleGeneratePunchlines() {
    if (!punchInput.trim()) {
      toast.error("Enter a setup line or theme word first");
      return;
    }
    try {
      setPunchLoading(true);
      const res = await generatePunchlines(punchInput, {
        mood: punchMood.toLowerCase(),
        recentLines,
      });
      setPunchlines(res.punchlines);
      setPunchSource(res.source);
      toast.success(`Generated ${res.punchlines.length} punchlines via ${res.source === "ai" ? "AI" : "algorithmic engine"}`);
    } catch {
      toast.error("Failed to generate punchlines");
    } finally {
      setPunchLoading(false);
    }
  }

  async function handleGenerateHooks() {
    if (!hookTheme.trim()) {
      toast.error("Enter a theme or concept for the chorus");
      return;
    }
    try {
      setHookLoading(true);
      const res = await generateHooks(hookTheme, {
        mood: hookMood.toLowerCase(),
        recentLines,
      });
      setHooks(res.hooks);
      setHookSource(res.source);
      toast.success(`Generated ${res.hooks.length} hook options via ${res.source === "ai" ? "AI" : "algorithmic engine"}`);
    } catch {
      toast.error("Failed to generate hooks");
    } finally {
      setHookLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedText(null), 2000);
  }

  function handleInsert(text: string) {
    if (onInsertLine) {
      onInsertLine(text);
      onOpenChange(false);
      toast.success("Inserted into writing pad!");
    } else {
      handleCopy(text);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-md border-border/80">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-display font-semibold">
              <Zap className="h-4 w-4 text-amber-400" />
              Studio Arsenal & Lyrical Weapons
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Generate hard-hitting punchlines, double entendres, and anthemic hooks on demand.
          </p>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 pt-2.5 border-b bg-muted/20">
            <TabsList className="grid grid-cols-2 w-full max-w-sm h-8">
              <TabsTrigger value="punchlines" className="text-xs gap-1.5 cursor-pointer">
                <Target className="h-3.5 w-3.5 text-amber-400" />
                Punchlines & Wordplay
              </TabsTrigger>
              <TabsTrigger value="hooks" className="text-xs gap-1.5 cursor-pointer">
                <Flame className="h-3.5 w-3.5 text-rose-400" />
                Hook & Anthem Builder
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-4">
            {/* TAB 1: PUNCHLINES */}
            <TabsContent value="punchlines" className="m-0 space-y-4">
              <Card className="p-3.5 bg-card/60 border-border/70 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
                    Setup Bar / Target Word
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {PUNCHLINE_MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPunchMood(m)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                          punchMood === m
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold"
                            : "border-border/40 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={punchInput}
                    onChange={(e) => setPunchInput(e.target.value)}
                    placeholder="e.g. They sleeping on my name, or clock ticking..."
                    className="h-9 text-xs bg-background/50 border-border/70"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGeneratePunchlines();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleGeneratePunchlines}
                    disabled={punchLoading || !punchInput.trim()}
                    className="h-9 gap-1.5 text-xs shrink-0 cursor-pointer"
                  >
                    {punchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Fire</span>
                  </Button>
                </div>
              </Card>

              {/* Punchlines Stream */}
              <div className="space-y-2.5">
                {punchSource && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                    <span>Generated Candidates</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Engine: {punchSource.toUpperCase()}
                    </Badge>
                  </div>
                )}

                {punchlines.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-6 font-mono">
                    Enter a setup phrase above to generate hard-hitting punchlines.
                  </p>
                ) : (
                  punchlines.map((p, idx) => (
                    <Card
                      key={idx}
                      className="p-3 bg-card/40 border-border/60 hover:border-amber-500/30 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                            {p.score} pts
                          </Badge>
                          {p.techniques.map((t, ti) => (
                            <span
                              key={ti}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/40 text-muted-foreground border border-border/40"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => handleCopy(p.line)}
                            title="Copy line"
                          >
                            {copiedText === p.line ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-primary hover:text-primary/80 gap-1 cursor-pointer"
                            onClick={() => handleInsert(p.line)}
                            title="Insert into editor"
                          >
                            <span>Insert</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs font-mono text-foreground leading-relaxed">
                        &quot;{p.line}&quot;
                      </p>

                      {p.explanation && (
                        <p className="text-[10px] text-muted-foreground/70 font-mono italic">
                          💡 {p.explanation}
                        </p>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: HOOKS */}
            <TabsContent value="hooks" className="m-0 space-y-4">
              <Card className="p-3.5 bg-card/60 border-border/70 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
                    Chorus Theme / Concept
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {HOOK_MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setHookMood(m)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                          hookMood === m
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold"
                            : "border-border/40 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={hookTheme}
                    onChange={(e) => setHookTheme(e.target.value)}
                    placeholder="e.g. Underdogs winning, late night adrenaline, rising above..."
                    className="h-9 text-xs bg-background/50 border-border/70"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGenerateHooks();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleGenerateHooks}
                    disabled={hookLoading || !hookTheme.trim()}
                    className="h-9 gap-1.5 text-xs shrink-0 cursor-pointer bg-rose-600 hover:bg-rose-700"
                  >
                    {hookLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                    <span>Craft Hook</span>
                  </Button>
                </div>
              </Card>

              {/* Hooks Stream */}
              <div className="space-y-3">
                {hookSource && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                    <span>Generated Hook Blueprints</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Engine: {hookSource.toUpperCase()}
                    </Badge>
                  </div>
                )}

                {hooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-6 font-mono">
                    Enter a theme or song concept to generate anthemic chorus hooks.
                  </p>
                ) : (
                  hooks.map((h, hIdx) => {
                    const fullHookText = h.lines.join("\n");
                    return (
                      <Card
                        key={hIdx}
                        className="p-3.5 bg-card/40 border-border/60 hover:border-rose-500/30 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Music className="h-3.5 w-3.5 text-rose-400" />
                            <span className="text-xs font-semibold font-display">{h.title}</span>
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {h.vibe}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => handleCopy(fullHookText)}
                              title="Copy full hook"
                            >
                              {copiedText === fullHookText ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px] text-rose-400 hover:text-rose-300 gap-1 cursor-pointer"
                              onClick={() => handleInsert(fullHookText)}
                              title="Insert hook into editor"
                            >
                              <span>Insert Hook</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-background/60 p-2.5 rounded-md border border-border/40 space-y-1 font-mono text-xs leading-relaxed">
                          {h.lines.map((line, li) => (
                            <div key={li} className="flex items-center justify-between text-foreground">
                              <span>{line}</span>
                              {h.syllablesPerLine && (
                                <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">
                                  {h.syllablesPerLine[li]} syl
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
