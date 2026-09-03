import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BookOpen, Flame, Moon, Sparkles, Zap, Send, Clock, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  saveJournalEntry,
  getJournalEntries,
  type JournalEntry,
} from "@/lib/local-store";

interface JournalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertIntoPad?: (text: string) => void;
}

const QUICK_MOODS = [
  { id: "Raw", label: "Raw", icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "Introspective", label: "Introspective", icon: BookOpen, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { id: "Aggressive", label: "Aggressive", icon: Zap, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "Melancholic", label: "Melancholic", icon: Moon, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { id: "Triumphant", label: "Triumphant", icon: Sparkles, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
] as const;

export function JournalDrawer({
  open,
  onOpenChange,
  onInsertIntoPad,
}: JournalDrawerProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("Introspective");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  async function loadEntries() {
    try {
      const data = await getJournalEntries();
      setEntries(data.slice(0, 8)); // latest 8 for quick drawer
    } catch {
      // ignore
    }
  }

  async function handleQuickSave() {
    if (!content.trim()) return;
    try {
      setSaving(true);
      const saved = await saveJournalEntry({
        content: content.trim(),
        mood,
      });
      setEntries([saved, ...entries]);
      setContent("");
      toast.success("Saved to Headspace! Ghostwriter RAG updated.");
    } catch (e) {
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-md border-border/80">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-display font-semibold">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              Writer&apos;s Headspace & Quick Journal
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Jot raw emotions while writing. The AI Ghostwriter pulls from these entries.
          </p>
        </DialogHeader>

        <div className="p-4 space-y-3 overflow-y-auto studio-scroll flex-1">
          {/* Quick Input Card */}
          <Card className="p-3 bg-card/60 border-border/70 space-y-2.5">
            <div className="flex items-center gap-1 flex-wrap">
              {QUICK_MOODS.map((m) => {
                const Icon = m.icon;
                const active = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                      active ? m.color + " font-semibold" : "border-border/40 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Unfiltered thought or emotion..."
              className="min-h-[70px] text-xs font-sans bg-background/40 border-border/60 p-2.5 resize-none"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleQuickSave();
                }
              }}
            />

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-muted-foreground font-mono">
                Ctrl+Enter to save
              </span>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 cursor-pointer"
                onClick={handleQuickSave}
                disabled={saving || !content.trim()}
              >
                <Send className="h-3 w-3" />
                <span>Save</span>
              </Button>
            </div>
          </Card>

          {/* Recent Headspace Stream */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground font-mono uppercase tracking-wider block">
              Recent Headspace Entries
            </span>

            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4 font-mono">
                No entries yet. Jot your first thought above!
              </p>
            ) : (
              entries.map((entry) => (
                <Card
                  key={entry.id}
                  className="p-2.5 bg-card/40 border-border/60 space-y-1.5 text-xs hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {entry.mood}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-foreground/90 font-sans text-xs leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>

                  {onInsertIntoPad && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onInsertIntoPad(entry.content);
                          onOpenChange(false);
                          toast.success("Injected thoughts into writing pad");
                        }}
                        className="text-[10px] font-mono text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Drop into pad</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
