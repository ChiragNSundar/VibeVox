// Server functions for the localized Brain drop-folder.
// Exposed to client code via TanStack Start RPC.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  scanBrainFilesServer,
  saveBrainFileServer,
  deleteBrainFileServer,
  type BrainFileRecord,
  type BrainCategory,
} from "./brain.server";

const BrainCategorySchema = z.enum(["lyrics", "personas", "rhymes", "notes"]);

const SaveFileInput = z.object({
  category: BrainCategorySchema,
  filename: z.string().min(1).max(120),
  content: z.string().max(500_000),
});

const DeleteFileInput = z.object({
  category: BrainCategorySchema,
  filename: z.string().min(1).max(120),
});

export const scanBrainDirectory = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ files: BrainFileRecord[] }> => {
    const files = await scanBrainFilesServer();
    return { files };
  },
);

export const saveBrainFile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveFileInput.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; relativePath: string }> => {
    return await saveBrainFileServer(data.category as BrainCategory, data.filename, data.content);
  });

export const deleteBrainFile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DeleteFileInput.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const success = await deleteBrainFileServer(data.category as BrainCategory, data.filename);
    return { success };
  });
