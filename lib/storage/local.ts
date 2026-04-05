import fs from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

function ensureUploadDir(): void {
  const dirs = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'originals'),
    path.join(UPLOAD_DIR, 'pages'),
    path.join(UPLOAD_DIR, 'exports'),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  subdir: 'originals' | 'pages' | 'exports' = 'originals'
): Promise<string> {
  ensureUploadDir();
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${timestamp}_${base}${ext}`;
  const filePath = path.join(UPLOAD_DIR, subdir, fileName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function savePageImage(
  buffer: Buffer,
  jobId: string,
  pageNumber: number
): Promise<string> {
  ensureUploadDir();
  const dir = path.join(UPLOAD_DIR, 'pages', jobId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `page_${pageNumber}.jpg`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function readFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore if already deleted
  }
}

export async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore if already deleted
  }
}

export function getPublicPath(filePath: string): string {
  // Return a relative path for serving via API
  return `/api/files?path=${encodeURIComponent(filePath)}`;
}

export async function fileToBase64(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString('base64');
}

export function getMimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
}
