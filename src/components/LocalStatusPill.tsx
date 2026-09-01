import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cpu, Cloud, Loader2, WifiOff, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loadLlmConfig, pingLlm, isLocalConfig, type LlmConfig } from "@/lib/llm-config";
import { getProvider } from "@/lib/providers";
import { pingLocalWhisper } from "@/lib/local-transcribe";
import { setMemoryLimits } from "@/lib/style-memory";

type Status = "checking" | "cloud" | "local-ready" | "offline-ready" | "offline-rag" | "ai-offline";

export function LocalStatusPill() {
  const [status, setStatus] = useState<Status>("checking");
  const [config, setConfig] = useState<LlmConfig | null>(null);
  const [tip, setTip] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const cfg = loadLlmConfig();
      setConfig(cfg);
      // Sync memory cap on every boot — local mode can hold a much bigger
      // few-shot library than cloud (no per-request size limit).
      setMemoryLimits({ maxEntries: isLocalConfig(cfg) ? cfg.localMemoryCap : 200 });

      // If set to explicit offline mode
      if (cfg.baseUrl === "offline" || cfg.baseUrl === "none") {
        if (!cancelled) {
          setStatus("offline-rag");
          setTip("Zero-LLM RAG Engine active · Cadence segmentation & local brain memory");
        }
        return;
      }

      const llm = await pingLlm(cfg);
      if (!llm.ok) {
        if (!cancelled) {
          // If local LLM server isn't running, the app operates via built-in Offline RAG!
          if (isLocalConfig(cfg)) {
            setStatus("offline-rag");
            setTip(`Zero-LLM RAG Engine active · No local LLM running at ${cfg.baseUrl} (click to connect)`);
          } else {
            setStatus("ai-offline");
            setTip(llm.message);
          }
        }
        return;
      }

      // A hosted provider is reachable but never "offline-ready"
      if (!isLocalConfig(cfg)) {
        if (!cancelled) {
          setStatus("cloud");
          setTip(`${getProvider(cfg.providerId).label} · ${cfg.model}`);
        }
        return;
      }

      const w = await pingLocalWhisper({
        baseUrl: cfg.whisperBaseUrl,
        backend: cfg.whisperBackend,
        model: cfg.whisperModel,
        language: cfg.whisperLanguage || undefined,
      });

      if (!cancelled) {
        if (w.ok) {
          setStatus("offline-ready");
          setTip(`Offline-ready · ${cfg.model} + Whisper`);
        } else {
          setStatus("local-ready");
          setTip(`Local LLM ready · ${cfg.model}`);
        }
      }
    }

    check();
    const t = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const variant =
    status === "offline-ready"
      ? "default"
      : status === "local-ready"
      ? "secondary"
      : status === "offline-rag"
      ? "secondary"
      : status === "ai-offline"
      ? "outline"
      : "outline";

  const Icon =
    status === "checking"
      ? Loader2
      : status === "cloud"
      ? Cloud
      : status === "offline-ready"
      ? Zap
      : status === "offline-rag"
      ? Zap
      : status === "ai-offline"
      ? WifiOff
      : Cpu;

  const label =
    status === "checking"
      ? "Checking…"
      : status === "cloud"
      ? "Cloud"
      : status === "offline-ready"
      ? "Offline-ready"
      : status === "offline-rag"
      ? "Offline RAG"
      : status === "ai-offline"
      ? "AI Offline"
      : "Local";

  return (
    <Link to="/connect" title={tip} className="inline-flex">
      <Badge variant={variant} className="cursor-pointer gap-1 text-[11px]">
        <Icon className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`} />
        {label}
        {config && status !== "checking" && status !== "ai-offline" && (
          <span className="text-muted-foreground/80 hidden sm:inline">
            · {status === "offline-rag" ? "Zero-LLM" : config.model.split("/").pop()!.split(":")[0].slice(0, 14)}
          </span>
        )}
      </Badge>
    </Link>
  );
}
