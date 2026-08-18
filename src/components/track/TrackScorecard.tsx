// TrackScorecard — Ghostwriter quality scorecard with critic council radar.
// Extracted from track.$id.tsx for modularity.

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QualityRadar } from "@/components/QualityRadar";
import { Target } from "lucide-react";

function Meter({ label, value, max, suffix, tone }: {
  label: string; value: number; max: number; suffix?: string;
  tone: "good" | "warn" | "bad" | "info";
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const bar =
    tone === "good" ? "bg-emerald-500"
    : tone === "warn" ? "bg-amber-500"
    : tone === "bad" ? "bg-rose-500"
    : "bg-primary";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}{suffix ?? ""}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

export type TrackQuality = {
  cadenceMatch: number;
  rhymeDensity: number;
  clicheCount: number;
  vibeConsistency: number;
  barCount: number;
  drakeScore: number;
  councilByRole?: Record<string, number>;
};

export type TrackScorecardProps = {
  quality: TrackQuality;
  busy: boolean;
  isProcessing: boolean;
  onRewriteWeakest: () => void;
};

export function TrackScorecard({ quality, busy, isProcessing, onRewriteWeakest }: TrackScorecardProps) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Ghostwriter scorecard
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Meter
          label="Cadence match"
          value={Math.round(quality.cadenceMatch * 100)}
          max={100} suffix="%"
          tone={quality.cadenceMatch >= 0.8 ? "good" : quality.cadenceMatch >= 0.6 ? "warn" : "bad"}
        />
        <Meter
          label="Rhyme density"
          value={quality.rhymeDensity}
          max={4}
          tone={quality.rhymeDensity >= 1.5 ? "good" : "info"}
        />
        <Meter
          label="Clichés caught"
          value={quality.clicheCount}
          max={Math.max(5, quality.clicheCount)}
          tone={quality.clicheCount === 0 ? "good" : quality.clicheCount <= 2 ? "warn" : "bad"}
        />
        <Meter
          label="Vibe consistency"
          value={quality.vibeConsistency}
          max={5} suffix="/5"
          tone={quality.vibeConsistency >= 4 ? "good" : "warn"}
        />
      </div>
      {quality.councilByRole && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row md:items-center gap-4">
          <div className="shrink-0 flex justify-center">
            <QualityRadar scores={quality.councilByRole} size={170} />
          </div>
          <div className="flex-1 space-y-2 text-xs">
            <div className="uppercase tracking-wider text-muted-foreground">Critic council</div>
            {(() => {
              const sorted = Object.entries(quality.councilByRole!).sort((a: any, b: any) => Number(a[1]) - Number(b[1]));
              const [weakRole, weakScoreRaw] = sorted[0];
              const weakScore = Number(weakScoreRaw);
              const strongScore = Number(sorted[sorted.length - 1][1]);
              return (
                <>
                  <p className="text-foreground">
                    Weakest axis: <b className="capitalize">{weakRole}</b> ({weakScore.toFixed(1)}/10).
                    Strongest: <b className="capitalize">{sorted[sorted.length - 1][0]}</b> ({strongScore.toFixed(1)}/10).
                  </p>
                  <Button
                    size="sm" variant="outline"
                    onClick={onRewriteWeakest}
                    disabled={busy || isProcessing}
                  >
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    Rewrite to lift {weakRole}
                  </Button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Card>
  );
}
