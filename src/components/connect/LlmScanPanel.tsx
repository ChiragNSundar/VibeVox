// LlmScanPanel — discovered LLM backends & model catalog picker.
// Extracted from connect.tsx for modularity.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, RefreshCw, Copy, Cpu } from "lucide-react";
import {
  corsHint,
  recommendedModels,
  type DiscoveredLlm,
} from "@/lib/local-discovery";
import {
  chatProviders,
  getProvider,
  isLocalProvider,
  missingKey,
  type CatalogModel,
  type ProviderId,
} from "@/lib/providers";
import { chatTarget, keyFor, type LlmConfig } from "@/lib/llm-config";
import { toast } from "sonner";

export type LlmScanPanelProps = {
  config: LlmConfig;
  llms: DiscoveredLlm[];
  catalog: CatalogModel[];
  catalogState: "idle" | "loading" | "error";
  modelFilter: string;
  testing: "llm" | "whisper" | null;
  testResult: { kind: "llm" | "whisper"; ok: boolean; msg: string } | null;
  onProviderChange: (id: ProviderId) => void;
  onKeyChange: (key: string) => void;
  onUpdateConfig: (patch: Partial<LlmConfig>) => void;
  onUseLlm: (d: DiscoveredLlm, modelId: string) => void;
  onLoadCatalog: () => void;
  onPickCatalogModel: (m: CatalogModel) => void;
  onTestLlm: () => void;
  onModelFilterChange: (filter: string) => void;
};

export function LlmScanPanel({
  config,
  llms,
  catalog,
  catalogState,
  modelFilter,
  testing,
  testResult,
  onProviderChange,
  onKeyChange,
  onUpdateConfig,
  onUseLlm,
  onLoadCatalog,
  onPickCatalogModel,
  onTestLlm,
  onModelFilterChange,
}: LlmScanPanelProps) {
  const provider = getProvider(config.providerId);
  const isLocal = isLocalProvider(config.providerId);
  const needsKey = missingKey(chatTarget(config));
  const filteredCatalog = modelFilter.trim()
    ? catalog.filter((m) => m.id.toLowerCase().includes(modelFilter.trim().toLowerCase()))
    : catalog;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Provider</CardTitle>
          <CardDescription>
            Local servers and hosted gateways speak the same API — pick whichever you want driving the pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Backend</Label>
              <Select value={config.providerId} onValueChange={(v: ProviderId) => onProviderChange(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {chatProviders().map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {provider.needsKey && (
              <div>
                <Label htmlFor="apiKey">API key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  autoComplete="off"
                  value={keyFor(config)}
                  onChange={(e) => onKeyChange(e.target.value)}
                  placeholder={provider.keyPlaceholder ?? "sk-…"}
                />
              </div>
            )}
            {!provider.needsKey && (
              <div>
                <Label htmlFor="baseUrl">Endpoint base URL</Label>
                <Input
                  id="baseUrl"
                  value={config.baseUrl}
                  onChange={(e) => onUpdateConfig({ baseUrl: e.target.value })}
                  placeholder={provider.baseUrl || "http://localhost:1234/v1"}
                />
              </div>
            )}
            <div>
              <Label htmlFor="model">Model ID</Label>
              <Input
                id="model"
                value={config.model}
                onChange={(e) => onUpdateConfig({ model: e.target.value })}
                placeholder={provider.defaultModel || "qwen2.5:14b"}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button size="sm" onClick={onTestLlm} disabled={testing === "llm" || needsKey}>
              {testing === "llm" && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Test connection
            </Button>
            {provider.catalogUrl && (
              <Button size="sm" variant="outline" onClick={onLoadCatalog} disabled={catalogState === "loading" || needsKey}>
                {catalogState === "loading" ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                Load model list
              </Button>
            )}
            {needsKey && <span className="text-xs text-amber-500">Paste an API key above to test this provider.</span>}
            {testResult?.kind === "llm" && (
              <span className={`text-xs ${testResult.ok ? "text-emerald-500 font-medium" : "text-destructive"}`}>
                {testResult.msg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model Catalog Picker */}
      {catalog.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base">Models ({catalog.length})</CardTitle>
                <CardDescription className="text-xs">Click any model to select it and update context limits.</CardDescription>
              </div>
              <Input
                className="w-48 h-8 text-xs"
                placeholder="Filter models…"
                value={modelFilter}
                onChange={(e) => onModelFilterChange(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto space-y-1">
            {filteredCatalog.map((m) => {
              const active = config.model === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onPickCatalogModel(m)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                    active ? "bg-primary/10 border border-primary/40 font-medium" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate pr-2">
                    <span className="font-mono">{m.id}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.contextTokens && <Badge variant="outline" className="text-[10px]">{Math.round(m.contextTokens / 1024)}K ctx</Badge>}
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Discovered Local Backends */}
      <Card>
        <CardHeader>
          <CardTitle>Discovered Local Servers</CardTitle>
          <CardDescription>Servers listening on standard ports ({recommendedModels("ollama").map((m) => m.port).join(", ")}).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {llms.length === 0 ? (
            <p className="text-xs text-muted-foreground">No local LLM servers detected. Make sure LM Studio or Ollama is running.</p>
          ) : (
            <div className="space-y-3">
              {llms.map((d) => (
                <div key={d.baseUrl} className="p-3 rounded-md border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="font-semibold capitalize">{d.backend}</span>
                      <span className="text-muted-foreground">{d.baseUrl}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{d.models.length} model(s)</Badge>
                  </div>
                  {d.models.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {d.models.map((m) => {
                        const active = config.providerId === "local" && config.model === m.id;
                        return (
                          <Button
                            key={m.id}
                            size="sm"
                            variant={active ? "default" : "outline"}
                            className="h-7 text-xs font-mono"
                            onClick={() => onUseLlm(d, m.id)}
                          >
                            {m.id} {active ? "✓" : ""}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                  {corsHint(d.backend) && (
                    <div className="bg-amber-500/10 text-amber-500 p-2 rounded text-[11px] flex items-center justify-between gap-2 mt-2">
                      <span>CORS blocked? Startup flag needed: <code>{corsHint(d.backend)}</code></span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px]"
                        onClick={() => {
                          navigator.clipboard.writeText(corsHint(d.backend)!);
                          toast.success("Copied startup flag");
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
