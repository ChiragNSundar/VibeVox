// Server-only helper for reading and managing the project-root brain/ folder.
// Never import this file directly in client-side code.

import * as fs from "node:fs/promises";
import * as path from "node:path";

export type BrainCategory = "lyrics" | "personas" | "rhymes" | "notes";

export type BrainFileRecord = {
  category: BrainCategory;
  filename: string;
  relativePath: string;
  sizeBytes: number;
  updatedAt: number;
  content: string;
};

const BRAIN_DIR_NAME = "brain";
const CATEGORIES: readonly BrainCategory[] = ["lyrics", "personas", "rhymes", "notes"] as const;

function getBrainRoot(): string {
  return path.join(process.cwd(), BRAIN_DIR_NAME);
}

export async function ensureBrainDirectories(): Promise<void> {
  const root = getBrainRoot();
  await fs.mkdir(root, { recursive: true });
  for (const cat of CATEGORIES) {
    await fs.mkdir(path.join(root, cat), { recursive: true });
  }
}

export async function scanBrainFilesServer(): Promise<BrainFileRecord[]> {
  await ensureBrainDirectories();
  const root = getBrainRoot();
  const records: BrainFileRecord[] = [];

  for (const cat of CATEGORIES) {
    const dir = path.join(root, cat);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && !entry.name.startsWith(".")) {
          const filePath = path.join(dir, entry.name);
          const stat = await fs.stat(filePath);
          const content = await fs.readFile(filePath, "utf-8");
          records.push({
            category: cat,
            filename: entry.name,
            relativePath: `${cat}/${entry.name}`,
            sizeBytes: stat.size,
            updatedAt: Math.floor(stat.mtimeMs),
            content,
          });
        }
      }
    } catch {
      // Ignore reading errors for individual category directories
    }
  }

  return records;
}

export async function saveBrainFileServer(
  category: BrainCategory,
  filename: string,
  content: string,
): Promise<{ success: boolean; relativePath: string }> {
  await ensureBrainDirectories();
  // Sanitize filename to prevent path traversal
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!safeName) throw new Error("Invalid filename");

  const filePath = path.join(getBrainRoot(), category, safeName);
  await fs.writeFile(filePath, content, "utf-8");
  return { success: true, relativePath: `${category}/${safeName}` };
}

export async function deleteBrainFileServer(category: BrainCategory, filename: string): Promise<boolean> {
  const safeName = path.basename(filename);
  const filePath = path.join(getBrainRoot(), category, safeName);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
