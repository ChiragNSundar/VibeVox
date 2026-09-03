import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Sparkles,
  Search,
  Trash2,
  Copy,
  Check,
  Send,
  Calendar,
  Flame,
  Moon,
  Zap,
  Tag,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  saveJournalEntry,
  getJournalEntries,
  deleteJournalEntry,
  type JournalEntry,
} from "@/lib/local-store";

export const Route = createFileRoute("/_app/journal")({
  head: () => ({
    meta: [
      { title: "Writer's Headspace & Journal · VibeVox" },
      {
        name: "description",
        content: "Private local-first journal capturing loose emotions and thoughts — feeding your AI ghostwriter RAG context.",
      },
    ],
  }),
  component: JournalPage,
});

const MOODS = [
  { id: "Raw", label: "Raw", icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "Introspective", label: "Introspective", icon: BookOpen, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { id: "Aggressive", label: "Aggressive", icon: Zap, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "Melancholic", label: "Melancholic", icon: Moon, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { id: "Triumphant", label: "Triumphant", icon: Sparkles, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { id: "Late Night", label: "Late Night", icon: Moon, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
] as const;

function JournalPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("Introspective");
  const [tagsInput, setTagsInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMoodFilter, setActiveMoodFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await getJournalEntries();
      setEntries(data);
    } catch (e) {
      console.error("Failed to load journal entries", e);
      toast.error("Failed to load journal from local storage");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEntry() {
    if (!content.trim()) {
      toast.error("Write something first before saving");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    try {
      const saved = await saveJournalEntry({
        content: content.trim(),
        mood: selectedMood,
        tags,
      });

      setEntries([saved, ...entries]);
      setContent("");
      setTagsInput("");
      toast.success("Saved to Writer's Headspace! Fed into AI ghostwriter context.");
    } catch (e) {
      console.error("Failed to save journal entry", e);
      toast.error("Failed to save entry");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry?")) return;
    try {
      await deleteJournalEntry(id);
      setEntries(entries.filter((e) => e.id !== id));
      toast.success("Journal entry deleted");
    } catch (e) {
      console.error("Failed to delete journal entry", e);
      toast.error("Could not delete entry");
    }
  }

  function handleCopy(entry: JournalEntry) {
    navigator.clipboard.writeText(entry.content);
    setCopiedId(entry.id);
    toast.success("Copied thoughts to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSendToScribble(entry: JournalEntry) {
    try {
      localStorage.setItem("vibevox:scribble-draft", entry.content);
      toast.success("Transferred to VibeLyrics Studio notepad!");
      navigate({ to: "/scribble" });
    } catch {
      toast.error("Failed to transfer to scribble");
    }
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesMood = activeMoodFilter === "All" || e.mood.toLowerCase() === activeMoodFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.content.toLowerCase().includes(q) ||
        e.mood.toLowerCase().includes(q) ||
        (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesMood && matchesSearch;
    });
  }, [entries, searchQuery, activeMoodFilter]);

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen className="h-6 w-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
              Writer&apos;s Headspace
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-mono">
              Local AI RAG Memory
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Capture unfiltered reflections, late-night thoughts, and raw emotions. The AI Ghostwriter automatically pulls from this headspace when generating bars.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-xs font-mono">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Entries:</span>
            <strong className="text-foreground">{entries.length}</strong>
          </div>
        </div>
      </div>

      {/* Editor Card */}
      <Card className="p-4 sm:p-5 bg-card/80 border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
            Record New Headspace Entry
          </span>
          {/* Mood Selector */}
          <div className="flex items-center gap-1 flex-wrap">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const active = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                    active ? m.color + " shadow-xs font-semibold" : "border-border/50 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's weighing on you right now? What are you feeling, fighting, or chasing? Write completely unfiltered..."
          className="min-h-[120px] font-sans text-sm leading-relaxed bg-background/50 border-border/70 resize-y p-3.5 focus-visible:ring-primary/40"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleSaveEntry();
            }
          }}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Tags (e.g. late-night, hunger, doubt)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="h-8 text-xs bg-background/40 border-border/60"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
              Ctrl+Enter to save
            </span>
            <Button size="sm" onClick={handleSaveEntry} className="gap-1.5 text-xs font-medium cursor-pointer">
              <Send className="h-3.5 w-3.5" />
              Save to Headspace
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Mood Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 studio-scroll">
          <button
            type="button"
            onClick={() => setActiveMoodFilter("All")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeMoodFilter === "All"
                ? "bg-secondary text-secondary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            All ({entries.length})
          </button>
          {MOODS.map((m) => {
            const count = moodCounts[m.id] || 0;
            const active = activeMoodFilter === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMoodFilter(m.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  active
                    ? m.color + " font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <span>{m.label}</span>
                {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search thoughts & tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-card/60 border-border/70"
          />
        </div>
      </div>

      {/* Entries Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs font-mono">
            Loading private headspace...
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-border/60 bg-card/40 space-y-3">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-foreground">Your Headspace is Empty</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery || activeMoodFilter !== "All"
                  ? "No entries match your search query or filter."
                  : "Write your first journal entry above. The AI ghostwriter will use your raw thoughts to write lyrics that sound undeniably like you."}
              </p>
            </div>
          </Card>
        ) : (
          filteredEntries.map((entry) => {
            const moodMeta = MOODS.find((m) => m.id === entry.mood) || MOODS[0];
            const MoodIcon = moodMeta.icon;

            return (
              <Card
                key={entry.id}
                className="p-4 bg-card/60 border-border/70 hover:border-border transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${moodMeta.color}`}
                    >
                      <MoodIcon className="h-3 w-3" />
                      {entry.mood}
                    </span>

                    <span className="text-[11px] text-muted-foreground/70 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
                    </span>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {entry.tags.map((t, ti) => (
                          <span
                            key={ti}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/40 text-muted-foreground border border-border/40"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => handleCopy(entry)}
                      title="Copy thought"
                    >
                      {copiedId === entry.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] text-primary hover:text-primary/80 gap-1 cursor-pointer"
                      onClick={() => handleSendToScribble(entry)}
                      title="Send into VibeLyrics studio notepad"
                    >
                      <span>Studio</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
                  {entry.content}
                </p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
