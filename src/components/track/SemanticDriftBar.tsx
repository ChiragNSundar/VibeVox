import React from "react";
import { Compass, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SemanticDriftResult } from "@/lib/diagnostics";

export type SemanticDriftBarProps = {
  drift?: SemanticDriftResult | null;
};

export function SemanticDriftBar({ drift }: SemanticDriftBarProps) {
  if (!drift || (drift.drift_score === 0 && drift.status === "stable" && !drift.warning)) {
    return null;
  }

  const { drift_score, status, warning, anchor_keywords } = drift;
  const pct = Math.min(100, Math.round(drift_score * 100));

  const statusConfig = {
    stable: {
      label: "On Track",
      icon: CheckCircle2,
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
      barGradient: "linear-gradient(90deg, #34d399, #10b981)",
    },
    drifting: {
      label: "Theme Drifting",
      icon: AlertTriangle,
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/30",
      barGradient: "linear-gradient(90deg, #f59e0b, #d97706)",
    },
    "off-topic": {
      label: "Off Topic",
      icon: Compass,
      textColor: "text-rose-400",
      bgColor: "bg-rose-500/15 border-rose-500/40",
      barGradient: "linear-gradient(90deg, #ef4444, #dc2626)",
    },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div
      className={`rounded-md px-3 py-2 border ${statusConfig.bgColor} backdrop-blur-sm space-y-1.5 transition-all text-xs my-2`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${statusConfig.textColor}`} />
          <span className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${statusConfig.textColor}`}>
            Thematic Focus: {statusConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-20 sm:w-28 h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: statusConfig.barGradient,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{pct}% drift</span>
        </div>
      </div>

      {warning && (
        <div className="text-[11px] text-foreground/90 leading-normal pl-5">
          {warning}
          {anchor_keywords && anchor_keywords.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <span className="text-muted-foreground text-[10px] font-mono">Anchor anchors:</span>
              {anchor_keywords.slice(0, 5).map((kw, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.2 rounded bg-background/80 border border-border/50 text-[10px] font-mono text-primary"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
