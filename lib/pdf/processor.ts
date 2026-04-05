/**
 * PDF Processor
 *
 * Extracts pages from PDF as images for AI processing.
 * Uses sharp for image optimization.
 */

import fs from 'fs/promises';
import path from 'path';

export interface ExtractedPage {
  pageNumber: number;
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Get the number of pages in a PDF using a byte-scan approach.
 * Falls back to 1 for non-PDFs.
 */
export async function getPdfPageCount(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const matches = content.match(/\/Type[\s]*\/Page[^s]/g);
    if (matches) return matches.length;
    // Fallback: count /Page entries
    const pageMatches = content.match(/\/Pages/g);
    return pageMatches ? Math.max(1, pageMatches.length) : 1;
  } catch {
    return 1;
  }
}

/**
 * For PDF files: returns the raw PDF buffer for each "page" to send to OpenAI.
 * OpenAI GPT-4o supports PDF files natively.
 * For image files: returns the image buffer.
 */
export async function extractPageBuffers(
  filePath: string,
  mimeType: string,
  maxPages: number = 10
): Promise<ExtractedPage[]> {
  if (mimeType === 'application/pdf') {
    return extractPdfPages(filePath, maxPages);
  } else {
    return extractImagePage(filePath);
  }
}

async function extractImagePage(filePath: string): Promise<ExtractedPage[]> {
  const buffer = await fs.readFile(filePath);
  return [
    {
      pageNumber: 1,
      buffer,
      width: 0,
      height: 0,
    },
  ];
}

async function extractPdfPages(filePath: string, maxPages: number): Promise<ExtractedPage[]> {
  // For PDF processing, we read the full PDF and return it as a single unit
  // OpenAI's GPT-4o can process multi-page PDFs natively via the file content API
  // For page-by-page processing, we pass the full PDF with page index instructions
  const buffer = await fs.readFile(filePath);

  // Try to determine page count from PDF structure
  const content = buffer.toString('binary');
  const pageMatches = content.match(/\/Type[\s]*\/Page[^s]/g);
  const pageCount = Math.min(pageMatches?.length ?? 1, maxPages);

  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= pageCount; i++) {
    pages.push({
      pageNumber: i,
      buffer,
      width: 0,
      height: 0,
    });
  }

  return pages;
}

export function getImageMimeType(filePath: string): 'image/jpeg' | 'image/png' | 'application/pdf' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  return 'image/jpeg';
}
