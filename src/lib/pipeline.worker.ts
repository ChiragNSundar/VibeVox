// Web Worker for off-thread ghostwriter pipeline execution.
// Prevents JSON parsing, syllable counting, and RAG recall from blocking the UI thread.

import { runLocalPipeline, type LocalPipelineResult } from "./local-pipeline";

self.onmessage = async (e: MessageEvent) => {
  const { id, config, transcript, brief } = e.data;
  try {
    const result = await runLocalPipeline(config, transcript, brief, (progress) => {
      self.postMessage({ id, type: "progress", progress });
    });
    self.postMessage({ id, type: "done", result });
  } catch (error) {
    self.postMessage({ id, type: "error", error: (error as Error).message || String(error) });
  }
};
