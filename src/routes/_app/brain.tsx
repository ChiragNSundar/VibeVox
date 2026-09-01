import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain,
  RefreshCw,
  FolderOpen,
  Music,
  User,
  Zap,
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  Database,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  loadBrainState,
  reindexBrain,
  setPersonaActive,
  type BrainState,
  type BrainPersona,
} from "@/lib/brain-indexer";
import { saveBrainFile } from "@/lib/brain.functions";
import { countSyllables } from "@/lib/lyrics-analysis";

export const Route = createFileRoute("/_app/brain")({
  head: () => ({
    meta: [
      { title: "Localized Brain & Memory — VoxScript" },
      {
        name: "description",
        content: "Local drop-folder ingestion and RAG knowledge base for lyric generation.",
      },
    ],
  }),
  component: BrainPage,
});

function BrainPage() {
  const [brainState, setBrainState] = useState<BrainState>(() => loadBrainState());
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("lyrics");

  // Raw file viewer modal
  const [viewingFile, setViewingFile] = useState<{ filename: string; category: string; content?: string } | null>(null);

  // New file modal state
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileCategory, setNewFileCategory] = useState<"lyrics" | "personas" | "rhymes" | "notes">("lyrics");
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [savingFile, setSavingFile] = useState(false);

  // Auto-scan on initial load
  useEffect(() => {
    handleReindex(false);
  }, []);

  async function handleReindex(showToast = true) {
    startTransition(async () => {
      try {
        const updated = await reindexBrain({ embed: true });
        setBrainState(updated);
        if (showToast) {
          toast.success("Brain re-indexed", {
            description: `Loaded ${updated.stats.totalFiles} files with ${updated.stats.totalChunks} indexed chunks.`,
          });
        }
      } catch (err) {
        if (showToast) {
          toast.error("Failed to re-index brain", {
            description: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    });
  }

  function handleTogglePersona(p: BrainPersona) {
    const nextState = !p.active;
    setPersonaActive(p.id, nextState);
    setBrainState((prev) => ({
      ...prev,
      personas: prev.personas.map((item) => (item.id === p.id ? { ...item, active: nextState } : item)),
    }));
    toast.info(nextState ? `Activated ${p.name}` : `Deactivated ${p.name}`);
  }

  async function handleCreateFile() {
    if (!newFileName.trim()) {
      toast.error("Please enter a filename");
      return;
    }
    setSavingFile(true);
    try {
      await saveBrainFile({
        data: {
          category: newFileCategory,
          filename: newFileName.trim(),
          content: newFileContent,
        },
      });
      toast.success(`Created brain/${newFileCategory}/${newFileName}`);
      setNewFileDialogOpen(false);
      setNewFileName("");
      setNewFileContent("");
      await handleReindex(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create file");
    } finally {
      setSavingFile(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Localized Brain & Memory</h1>
            <Badge variant="outline" className="text-xs bg-amber-500/5 text-amber-400 border-amber-500/30">
              Drop-Folder RAG
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Drop raw lyric sheets, artist voice personas, custom rhyme dictionaries, or creative rules into{" "}
            <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-foreground">brain/</code> at the project root.
            The engine automatically chunks, embeds, and injects them into generation prompts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewFileDialogOpen(true)}
            className="flex-1 sm:flex-none text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add File
          </Button>
          <Button
            size="sm"
            onClick={() => handleReindex(true)}
            disabled={isPending}
            className="flex-1 sm:flex-none text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Indexing…" : "Re-index Brain"}
          </Button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-card/60 backdrop-blur-sm border-border/70 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Brain Files</div>
            <div className="text-lg font-semibold font-mono">{brainState.stats.totalFiles}</div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 backdrop-blur-sm border-border/70 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Indexed Chunks</div>
            <div className="text-lg font-semibold font-mono">{brainState.stats.totalChunks}</div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 backdrop-blur-sm border-border/70 flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Vector Vectors</div>
            <div className="text-lg font-semibold font-mono">{brainState.stats.embeddedChunks}</div>
          </div>
        </Card>

        <Card className="p-3.5 bg-card/60 backdrop-blur-sm border-border/70 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Active Personas</div>
            <div className="text-lg font-semibold font-mono">
              {brainState.personas.filter((p) => p.active).length}/{brainState.personas.length}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="lyrics" className="gap-1.5 text-xs">
              <Music className="h-3.5 w-3.5" />
              Lyrics Bank ({brainState.lyrics.length})
            </TabsTrigger>
            <TabsTrigger value="personas" className="gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" />
              Personas ({brainState.personas.length})
            </TabsTrigger>
            <TabsTrigger value="rhymes" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5" />
              Rhymes & Slang ({brainState.rhymes.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Rules & Notes ({brainState.notes.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5 text-xs">
              <FolderOpen className="h-3.5 w-3.5" />
              Files ({brainState.files.length})
            </TabsTrigger>
          </TabsList>

          <Link to="/new" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
            Test in new punch-in track <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Tab 1: Lyrics Bank */}
        <TabsContent value="lyrics" className="space-y-4">
          {brainState.lyrics.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm space-y-2 border-dashed">
              <Music className="h-8 w-8 mx-auto opacity-40 text-amber-400" />
              <div className="font-semibold text-foreground">No lyric files indexed yet</div>
              <p className="text-xs max-w-md mx-auto">
                Place `.txt` or `.md` files containing your favorite bars into{" "}
                <code className="font-mono text-foreground">brain/lyrics/</code> to automatically chunk and embed them for
                few-shot style recall.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {brainState.lyrics.map((chunk) => {
                const avgSyllables =
                  chunk.bars.reduce((sum, b) => sum + countSyllables(b), 0) / (chunk.bars.length || 1);
                return (
                  <Card
                    key={chunk.id}
                    className="p-4 space-y-2.5 flex flex-col justify-between border-border/70 hover:border-amber-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{chunk.title}</h3>
                        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                          {chunk.drakeScore.toFixed(1)}/10
                        </Badge>
                      </div>

                      <div className="flex gap-1.5 flex-wrap mt-1.5 mb-2.5">
                        {chunk.vibe && (
                          <Badge variant="outline" className="text-[10px]">
                            vibe: {chunk.vibe}
                          </Badge>
                        )}
                        {chunk.genre && (
                          <Badge variant="outline" className="text-[10px]">
                            genre: {chunk.genre}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                          ~{avgSyllables.toFixed(1)} syl/bar
                        </Badge>
                        {chunk.sourceUrl && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                            {chunk.sourceUrl}
                          </Badge>
                        )}
                      </div>

                      <div className="bg-background/80 p-2.5 rounded border border-border/50 space-y-1 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto">
                        {chunk.bars.map((bar, i) => (
                          <div key={i} className="flex items-baseline justify-between gap-2 text-muted-foreground">
                            <span className="text-foreground">{bar}</span>
                            <span className="text-[10px] opacity-60 shrink-0 font-mono">
                              {countSyllables(bar)} syl
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Personas */}
        <TabsContent value="personas" className="space-y-4">
          {brainState.personas.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm space-y-2 border-dashed">
              <User className="h-8 w-8 mx-auto opacity-40 text-purple-400" />
              <div className="font-semibold text-foreground">No personas found</div>
              <p className="text-xs max-w-md mx-auto">
                Add artist personas to <code className="font-mono text-foreground">brain/personas/</code> as markdown
                files with YAML frontmatter specifying voice, attitude, and signature slang.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {brainState.personas.map((persona) => (
                <Card
                  key={persona.id}
                  className={`p-4 space-y-3 border transition-colors ${
                    persona.active ? "border-purple-500/50 bg-purple-500/5" : "border-border/70 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-md ${
                          persona.active ? "bg-purple-500/20 text-purple-400" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{persona.name}</h3>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          brain/personas/{persona.sourceFile}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{persona.active ? "Active" : "Inactive"}</span>
                      <Switch
                        checked={persona.active}
                        onCheckedChange={() => handleTogglePersona(persona)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {persona.genre && <Badge variant="outline" className="text-[10px]">genre: {persona.genre}</Badge>}
                    {persona.vibe && <Badge variant="outline" className="text-[10px]">vibe: {persona.vibe}</Badge>}
                    {persona.attitude?.map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px]">
                        {a}
                      </Badge>
                    ))}
                  </div>

                  {persona.slang && persona.slang.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-muted-foreground">Signature Slang / Phrases:</div>
                      <div className="flex flex-wrap gap-1">
                        {persona.slang.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-background border border-border/70 text-[10px] font-mono text-foreground"
                          >
                            "{s}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-background/80 p-2.5 rounded border border-border/50 text-xs font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed text-muted-foreground">
                    {persona.guidelines}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Rhymes & Slang */}
        <TabsContent value="rhymes" className="space-y-4">
          {brainState.rhymes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm space-y-2 border-dashed">
              <Zap className="h-8 w-8 mx-auto opacity-40 text-emerald-400" />
              <div className="font-semibold text-foreground">No rhyme dictionaries found</div>
              <p className="text-xs max-w-md mx-auto">
                Add rhyme pairs or regional slang dictionaries into{" "}
                <code className="font-mono text-foreground">brain/rhymes/</code> in JSON or text format.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {brainState.rhymes.map((rb, idx) => (
                <Card key={idx} className="p-4 space-y-3 border-border/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      <h3 className="font-semibold text-sm">{rb.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      brain/rhymes/{rb.sourceFile}
                    </Badge>
                  </div>

                  {/* Regional Slang */}
                  {rb.slang.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-muted-foreground">Slang & Vocabulary Bank ({rb.slang.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {rb.slang.map((token, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-mono">
                            {token}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rhyme Pairs */}
                  {Object.keys(rb.rhymePairs).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Custom Rhyme Pairs ({Object.keys(rb.rhymePairs).length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(rb.rhymePairs).map(([target, rhymes]) => (
                          <div
                            key={target}
                            className="p-2 rounded bg-background border border-border/60 text-xs font-mono space-y-1"
                          >
                            <span className="font-semibold text-primary">/{target}/</span>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {rhymes.join(", ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flow Patterns */}
                  {rb.patterns.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-muted-foreground">Cadence Pattern Blueprints ({rb.patterns.length})</div>
                      <div className="space-y-1">
                        {rb.patterns.map((pat, i) => (
                          <div key={i} className="text-xs font-mono p-1.5 rounded bg-background border border-border/40 text-muted-foreground">
                            • {pat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Rules & Notes */}
        <TabsContent value="notes" className="space-y-4">
          {brainState.notes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm space-y-2 border-dashed">
              <FileText className="h-8 w-8 mx-auto opacity-40 text-blue-400" />
              <div className="font-semibold text-foreground">No guidelines or note files found</div>
              <p className="text-xs max-w-md mx-auto">
                Add writing constraints, prohibited clichés, or thematic notes into{" "}
                <code className="font-mono text-foreground">brain/notes/</code> as markdown files.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {brainState.notes.map((note) => (
                <Card key={note.id} className="p-4 space-y-3 border-border/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-400" />
                      <h3 className="font-semibold text-sm">{note.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      brain/notes/{note.sourceFile}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Extracted Active Rules ({note.rules.length}):
                    </div>
                    <div className="space-y-1.5">
                      {note.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs p-2 rounded bg-background border border-border/50 leading-relaxed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Raw Files */}
        <TabsContent value="files" className="space-y-4">
          <Card className="p-0 overflow-hidden border-border/70">
            <div className="p-3 bg-muted/40 border-b flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Path</span>
              <span>Size</span>
            </div>
            <div className="divide-y divide-border/60">
              {brainState.files.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No files detected in brain/</div>
              ) : (
                brainState.files.map((file, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-muted/20">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-mono font-medium text-foreground">
                          brain/{file.category}/{file.filename}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          Updated {new Date(file.updatedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New File Modal */}
      <Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Brain Document</DialogTitle>
            <DialogDescription>
              Create a document directly in your local `brain/` folder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {(["lyrics", "personas", "rhymes", "notes"] as const).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={newFileCategory === cat ? "default" : "outline"}
                    className="capitalize text-xs"
                    onClick={() => setNewFileCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Filename</label>
              <Input
                placeholder={
                  newFileCategory === "lyrics"
                    ? "my-verse.txt"
                    : newFileCategory === "personas"
                    ? "drake-voice.md"
                    : newFileCategory === "rhymes"
                    ? "drill-slang.json"
                    : "guidelines.md"
                }
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Content</label>
              <Textarea
                placeholder="Paste lyrics, frontmatter markdown, or JSON definitions…"
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setNewFileDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateFile} disabled={savingFile}>
                {savingFile ? "Saving…" : "Save to Brain"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
