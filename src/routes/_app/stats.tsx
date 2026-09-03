import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Flame,
  Zap,
  BookOpen,
  Music,
  TrendingUp,
  Activity,
  Mic,
  Calendar,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { computeLyricalStats, type LyricalStats } from "@/lib/stats-analyzer";

export const Route = createFileRoute("/_app/stats")({
  head: () => ({
    meta: [
      { title: "Lyrical Evolution & Stats · VibeVox" },
      {
        name: "description",
        content: "Track your writing growth, syllable cadence pockets, vocabulary diversity, and rhyme sound families.",
      },
    ],
  }),
  component: StatsPage,
});

export function StatsPage() {
  const [stats, setStats] = useState<LyricalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeLyricalStats()
      .then((data) => setStats(data))
      .catch((e) => console.error("Stats calculation error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center text-xs font-mono text-muted-foreground">
        Analyzing lyrical DNA and cadence history...
      </div>
    );
  }

  const s = stats || {
    totalTracks: 0,
    totalBars: 0,
    totalWords: 0,
    avgSyllablesPerBar: 0,
    uniqueVocabularyCount: 0,
    vocabularyDiversityPercent: 0,
    topRhymeSounds: [],
    syllableDistribution: [],
    evolutionTimeline: [],
    streakDays: 0,
    totalJournalEntries: 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
              Lyrical Evolution & Stats
            </h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono">
              Local Studio Analytics
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Track your writing velocity, cadence pocket consistency, vocabulary growth, and recurring rhyme sound families across all sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/80 text-amber-400">
            <Flame className="h-4 w-4" />
            <span>Active Days:</span>
            <strong className="text-foreground">{s.streakDays}</strong>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-card/60 border-border/70 space-y-1">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Total Bars</span>
          </div>
          <div className="text-2xl font-bold font-display tracking-tight text-foreground">
            {s.totalBars}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Across {s.totalTracks} track{s.totalTracks === 1 ? "" : "s"}
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/70 space-y-1">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Vocabulary Pool</span>
          </div>
          <div className="text-2xl font-bold font-display tracking-tight text-foreground">
            {s.uniqueVocabularyCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {s.vocabularyDiversityPercent}% unique ratio
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/70 space-y-1">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Cadence Pocket</span>
          </div>
          <div className="text-2xl font-bold font-display tracking-tight text-foreground">
            {s.avgSyllablesPerBar || "—"}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Avg. syllables / bar
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/70 space-y-1">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Headspace Thoughts</span>
          </div>
          <div className="text-2xl font-bold font-display tracking-tight text-foreground">
            {s.totalJournalEntries}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Entries in journal RAG
          </p>
        </Card>
      </div>

      {/* Empty State Onboarding Banner */}
      {s.totalBars === 0 && (
        <Card className="p-5 bg-amber-500/10 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Welcome to your Lyrical Analytics Hub
            </h3>
            <p className="text-xs text-muted-foreground">
              Once you start writing bars in the VibeLyrics Studio or recording vocal takes, this dashboard will visualize your cadence consistency, rhyme density, and vocabulary growth.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/scribble">
              <Button size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Open Studio</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Syllable Distribution */}
        <Card className="p-4 bg-card/60 border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold font-display">Cadence Pocket Distribution</h3>
              <p className="text-xs text-muted-foreground">
                Frequency of syllable counts per bar (6 to 18 syl)
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Syllables
            </Badge>
          </div>

          <div className="h-52 w-full">
            {s.syllableDistribution.length > 0 && s.totalBars > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.syllableDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
                  <XAxis dataKey="syllables" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }}
                    labelFormatter={(val) => `${val} Syllables`}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                No bar data available yet. Start writing in the studio!
              </div>
            )}
          </div>
        </Card>

        {/* Chart 2: Track Velocity Timeline */}
        <Card className="p-4 bg-card/60 border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold font-display">Session Progression</h3>
              <p className="text-xs text-muted-foreground">
                Bar volume and pacing across recent track sessions
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Timeline
            </Badge>
          </div>

          <div className="h-52 w-full">
            {s.evolutionTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.evolutionTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "11px" }}
                    labelFormatter={(val, payload) => payload?.[0]?.payload?.trackTitle || val}
                  />
                  <Area type="monotone" dataKey="barsCount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                Session progression will appear as you save tracks.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Insights: Top Rhymes & Growth Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Rhyme Sound Families */}
        <Card className="p-4 bg-card/60 border-border/70 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-display flex items-center gap-1.5">
              <Music className="h-4 w-4 text-primary" />
              <span>Dominant Rhyme Sound Families</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Phonetic Anchors</span>
          </div>

          {s.topRhymeSounds.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 font-mono py-4">
              Write more bars to discover your signature rhyme families.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {s.topRhymeSounds.map((r, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-background/50 border border-border/60 flex items-center justify-between"
                >
                  <span className="font-mono text-xs font-semibold text-primary">{r.sound}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {r.count} bars
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lyrical DNA Advice */}
        <Card className="p-4 bg-card/60 border-border/70 space-y-2.5">
          <h3 className="text-sm font-semibold font-display flex items-center gap-1.5 text-amber-400">
            <TrendingUp className="h-4 w-4" />
            <span>Lyrical Growth DNA</span>
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {s.totalBars > 20
              ? s.vocabularyDiversityPercent > 45
                ? "Your vocabulary diversity is exceptionally high. You avoid repetitive clichés and push unique figurative phrasing."
                : "Your cadence is locked in a tight pocket. Try experimenting with multisyllabic rhymes and varying bar syllable lengths."
              : "Keep creating tracks and recording thoughts in your journal to train your local AI style memory and unlock deep analytics."}
          </p>
        </Card>
      </div>
    </div>
  );
}
