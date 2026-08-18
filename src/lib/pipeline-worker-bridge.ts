// Main-thread bridge for pipeline.worker.ts.
// Executes local pipeline via Web Worker with automatic fallback to direct call.

import type { LocalBrief, LocalPipelineResult, ProgressEvent } from "./local-pipeline";
import type { LlmConfig } from "./llm-config";
import { runLocalPipeline } from "./local-pipeline";

let workerInstance: Worker | null = null;
let requestIdCounter = 0;

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" });
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

export async function runPipelineWorker(
  config: LlmConfig,
  transcript: string,
  brief?: LocalBrief,
  onProgress?: (e: ProgressEvent) => void,
): Promise<LocalPipelineResult> {
  const worker = getWorker();
  if (!worker) {
    // Fallback to main thread execution if Workers are unavailable
    return runLocalPipeline(config, transcript, brief, onProgress);
  }

  const id = ++requestIdCounter;

  return new Promise<LocalPipelineResult>((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.id !== id) return;

      if (e.data.type === "progress") {
        onProgress?.(e.data.progress);
      } else if (e.data.type === "done") {
        worker.removeEventListener("message", handleMessage);
        resolve(e.data.result);
      } else if (e.data.type === "error") {
        worker.removeEventListener("message", handleMessage);
        reject(new Error(e.data.error));
      }
    };

    worker.addEventListener("message", handleMessage);
    worker.postMessage({ id, config, transcript, brief });
  });
}
