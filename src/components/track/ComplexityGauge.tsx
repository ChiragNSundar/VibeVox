import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, Layers, BookOpen, Volume2, ShieldAlert } from "lucide-react";
import type { ComplexityScoreResult, ComplexityGrade } from "@/lib/diagnostics";

export type ComplexityGaugeProps = {
  result?: ComplexityScoreResult | null;
  size?: "sm" | "md";
};

const DIMENSION_CONFIG: {
  key: keyof ComplexityScoreResult["dimensions"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "internal_rhyme", label: "Internal Rhyme", icon: Sparkles },
  { key: "multisyllabic", label: "Multisyllabic Flow", icon: Layers },
  { key: "assonance", label: "Assonance (Vowels)", icon: Volume2 },
  { key: "consonance", label: "Consonance (Punch)", icon: Activity },
  { key: "vocabulary", label: "Lexical Diversity", icon: BookOpen },
  { key: "homophone", label: "Sound-Alike Play", icon: Sparkles },
  { key: "scheme_sophistication", label: "Rhyme Scheme", icon: Layers },
];

function getGradeBadgeVariant(grade: ComplexityGrade): "default" | "secondary" | "outline" | "destructive" {
  if (grade === "S-Tier" || grade === "A-Tier") return "default";
  if (grade === "B-Tier") return "secondary";
  return "outline";
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#34d399"; // emerald
  if (score >= 50) return "#f59e0b"; // amber
  if (score >= 25) return "#f97316"; // orange
  return "#ef4444"; // red
}

export function ComplexityGauge({ result, size = "sm" }: ComplexityGaugeProps) {
  if (!result || result.score === 0) {
    return (
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono px-2 py-1 rounded border border-border/40 bg-muted/20">
        <Activity className="h-3 w-3 text-muted-foreground/60" />
        <span>Flow: —</span>
      </div>
    );
  }

  const { score, grade, dimensions, details } = result;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/50 bg-background/60 hover:bg-background/90 transition-colors shadow-sm cursor-pointer select-none group"
          title={`Complexity Score: ${score}/100 (${grade}) — Click for detailed breakdown`}
        >
          {/* Mini circular radial gauge */}
          <div className="relative flex items-center justify-center w-7 h-7 shrink-0">
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r={radius}
                className="stroke-muted/40 fill-none"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                className="fill-none transition-all duration-500 ease-out"
                strokeWidth="3.5"
                stroke={color}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-bold text-foreground">
              {score}
            </span>
          </div>

          <div className="flex flex-col items-start leading-none text-left">
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">
              Flow Score
            </span>
            <span
              className="text-[11px] font-mono font-semibold"
              style={{ color }}
            >
              {grade}
            </span>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-4 space-y-4 bg-popover/95 backdrop-blur-md">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-sm">Lyric Complexity</span>
          </div>
          <Badge variant={getGradeBadgeVariant(grade)} className="font-mono text-xs">
            {grade} ({score}/100)
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed italic">
          "{details}"
        </p>

        <div className="space-y-2.5 pt-1">
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            7-Dimension Breakdown
          </div>

          {DIMENSION_CONFIG.map(({ key, label, icon: Icon }) => {
            const val = dimensions[key] ?? 0;
            const barColor = getScoreColor(val);

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-foreground/80">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    {label}
                  </span>
                  <span className="font-mono text-[11px] font-medium" style={{ color: barColor }}>
                    {val}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${val}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
