import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, RefreshCw, Zap, Cpu, Mic2 } from "lucide-react";
import {
  discoverLlmBackends,
  discoverWhisperBackends,
  getOllamaContextLength,
  type DiscoveredLlm,
  type DiscoveredWhisper,
} from "@/lib/local-discovery";
import {
  loadLlmConfig,
  saveLlmConfig,
  pingLlm,
  keyFor,
  setKeyFor,
  selectProvider,
  chatTarget,
  type LlmConfig,
} from "@/lib/llm-config";
import {
  embeddingProviders,
  getProvider,
  fetchCatalog,
  isLocalProvider,
  type CatalogModel,
  type ProviderId,
} from "@/lib/providers";
import { pingLocalWhisper } from "@/lib/local-transcribe";
import { detectModel, tierFor, profileFor } from "@/lib/local-profiles";
import { LlmScanPanel } from "@/components/connect/LlmScanPanel";
import { WhisperScanPanel } from "@/components/connect/WhisperScanPanel";

export const Route = createFileRoute("/_app/connect")({
  component: ConnectPage,
});

function ConnectPage() {
  const [config, setConfig] = useState<LlmConfig>(() => loadLlmConfig());
  const [llms, setLlms] = useState<DiscoveredLlm[]>([]);
  const [whispers, setWhispers] = useState<DiscoveredWhisper[]>([]);
  const [scanning, setScanning] = useState(false);
  const [testing, setTesting] = useState<"llm" | "whisper" | null>(null);
  const [testResult, setTestResult] = useState<{ kind: "llm" | "whisper"; ok: boolean; msg: string } | null>(null);
  const [catalog, setCatalog] = useState<CatalogModel[]>([]);
  const [catalogState, setCatalogState] = useState<"idle" | "loading" | "error">("idle");
  const [modelFilter, setModelFilter] = useState("");

  async function scan() {
    setScanning(true);
    try {
      const [l, w] = await Promise.all([discoverLlmBackends(), discoverWhisperBackends()]);
      setLlms(l);
      setWhispers(w);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => { scan(); }, []);

  function updateConfig(patch: Partial<LlmConfig>) {
    updateConfigFrom(config, patch);
  }

  function updateConfigFrom(base: LlmConfig, patch: Partial<LlmConfig>) {
    const next = { ...base, ...patch };
    setConfig(next);
    saveLlmConfig(next);
  }

  async function useThisLlm(d: DiscoveredLlm, modelId: string) {
    let ctx: number | undefined;
    if (d.backend === "ollama") {
      const base = d.baseUrl.replace(/\/v1$/, "");
      ctx = await getOllamaContextLength(base, modelId);
    } else {
      const m = d.models.find((m) => m.id === modelId);
      ctx = m?.contextTokens;
    }
    const withKey = setKeyFor(
      config,
      "local",
      d.backend === "ollama" ? "ollama" : keyFor(config, "local") || "local",
    );
    setConfig(withKey);
    updateConfigFrom(withKey, {
      providerId: "local",
      baseUrl: d.baseUrl,
      model: modelId,
      contextTokens: ctx,
    });
    toast.success(`Connected to ${d.backend} · ${modelId}${ctx ? ` (${ctx} ctx)` : ""}`);
  }

  function onProviderChange(id: ProviderId) {
    const next = selectProvider(config, id);
    setConfig(next);
    saveLlmConfig(next);
    setCatalog([]);
    setCatalogState("idle");
    setModelFilter("");
    setTestResult(null);
  }

  function onKeyChange(value: string) {
    const next = setKeyFor(config, config.providerId, value);
    setConfig(next);
    saveLlmConfig(next);
  }

  async function loadCatalog() {
    setCatalogState("loading");
    try {
      const list = await fetchCatalog(chatTarget(config));
      setCatalog(list);
      setCatalogState("idle");
      if (!list.length) toast.info("No model list from this provider — type the model id manually.");
    } catch (e) {
      setCatalogState("error");
      setCatalog([]);
      toast.error(e instanceof Error ? e.message : "Could not load model list");
    }
  }

  function pickCatalogModel(m: CatalogModel) {
    updateConfig({ model: m.id, contextTokens: m.contextTokens });
    toast.success(`Model set to ${m.id}${m.contextTokens ? ` (${m.contextTokens.toLocaleString()} ctx)` : ""}`);
  }

  function useThisWhisper(w: DiscoveredWhisper) {
    updateConfig({
      transcriptionMode: "local",
      whisperBaseUrl: w.baseUrl,
      whisperBackend: w.backend === "unknown" ? "auto" : w.backend,
    });
    toast.success(`Whisper set to ${w.backend} at ${w.baseUrl}`);
  }

  async function testLlm() {
    setTesting("llm");
    const r = await pingLlm(config);
    setTestResult({ kind: "llm", ok: r.ok, msg: r.message });
    setTesting(null);
  }

  async function testWhisper() {
    setTesting("whisper");
    const r = await pingLocalWhisper({
      baseUrl: config.whisperBaseUrl,
      backend: config.whisperBackend,
      model: config.whisperModel,
      language: config.whisperLanguage || undefined,
    });
    setTestResult({ kind: "whisper", ok: r.ok, msg: r.message });
    setTesting(null);
  }

  const detected = detectModel(config.model);
  const isLocal = isLocalProvider(config.providerId);
  const offlineReady = isLocal && config.transcriptionMode === "local";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Connect Local AI</h1>
          <p className="text-muted-foreground mt-1">Discover and wire up local LLM + Whisper servers for offline ghostwriting.</p>
        </div>
        <Button onClick={scan} disabled={scanning} variant="outline">
          {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Rescan localhost
        </Button>
      </div>

      {offlineReady && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium">Offline-ready</div>
            <div className="text-sm text-muted-foreground">LLM + transcription both routed locally. You can pull the network plug.</div>
          </div>
        </div>
      )}

      <Tabs defaultValue="llm">
        <TabsList>
          <TabsTrigger value="llm"><Cpu className="h-4 w-4 mr-1.5" />LLM</TabsTrigger>
          <TabsTrigger value="whisper"><Mic2 className="h-4 w-4 mr-1.5" />Transcription</TabsTrigger>
          <TabsTrigger value="tuning">Tuning</TabsTrigger>
        </TabsList>

        <TabsContent value="llm" className="space-y-4 mt-4">
          <LlmScanPanel
            config={config}
            llms={llms}
            catalog={catalog}
            catalogState={catalogState}
            modelFilter={modelFilter}
            testing={testing}
            testResult={testResult}
            onProviderChange={onProviderChange}
            onKeyChange={onKeyChange}
            onUpdateConfig={updateConfig}
            onUseLlm={useThisLlm}
            onLoadCatalog={loadCatalog}
            onPickCatalogModel={pickCatalogModel}
            onTestLlm={testLlm}
            onModelFilterChange={setModelFilter}
          />
        </TabsContent>

        <TabsContent value="whisper" className="space-y-4 mt-4">
          <WhisperScanPanel
            config={config}
            whispers={whispers}
            testing={testing}
            testResult={testResult}
            onUpdateConfig={updateConfig}
            onUseWhisper={useThisWhisper}
            onTestWhisper={testWhisper}
          />
        </TabsContent>

        <TabsContent value="tuning" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Family & tier overrides</CardTitle>
              <CardDescription>Detection runs off the model id. Override if it picks wrong — affects prompt format, sampling, and iteration budget.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Family</Label>
                <Select value={config.familyOverride ?? "auto"} onValueChange={(v) => updateConfig({ familyOverride: v === "auto" ? undefined : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto · detected: {detected.family}</SelectItem>
                    {(["qwen", "llama", "mistral", "deepseek", "gemma", "phi", "command-r", "yi", "gpt", "claude", "gemini", "grok", "other"] as const).map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={config.tierOverride ?? "auto"} onValueChange={(v) => updateConfig({ tierOverride: v === "auto" ? undefined : v as "small" | "mid" | "large" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto · detected: {tierFor(detected.paramsB, detected.family)}</SelectItem>
                    <SelectItem value="small">small (≤8B) — 2 critic loops, target 7.5</SelectItem>
                    <SelectItem value="mid">mid (13–32B) — 4 loops, target 8.5</SelectItem>
                    <SelectItem value="large">large (70B+ / hosted) — 6 loops, target 9.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Memory cap (max few-shot entries kept locally)</Label>
                <Input type="number" min={50} max={20000} step={50} value={config.localMemoryCap} onChange={(e) => updateConfig({ localMemoryCap: Number(e.target.value) || 2000 })} />
                <p className="text-xs text-muted-foreground mt-1">Default 2000 for local mode. Cloud mode caps at 200 to keep request size sane.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embeddings</CardTitle>
              <CardDescription>
                Powers style-memory recall. Configured separately because several chat providers
                don&apos;t serve embeddings.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Select
                  value={config.embedProviderId}
                  onValueChange={(v: ProviderId) => {
                    const p = getProvider(v);
                    updateConfig({
                      embedProviderId: v,
                      embedBaseUrl: p.baseUrl,
                      embedModel: p.defaultEmbedModel ?? "",
                    });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {embeddingProviders().map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Input
                  value={config.embedModel}
                  onChange={(e) => updateConfig({ embedModel: e.target.value })}
                  placeholder={getProvider(config.embedProviderId).defaultEmbedModel ?? "nomic-embed-text"}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Base URL</Label>
                <Input
                  value={config.embedBaseUrl}
                  onChange={(e) => updateConfig({ embedBaseUrl: e.target.value })}
                  placeholder={getProvider(config.embedProviderId).baseUrl}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
