import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/storage/local';
import { getPdfPageCount } from '@/lib/pdf/processor';
import path from 'path';

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '50', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_PAGES = parseInt(process.env.MAX_PAGES ?? '10', 10);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, PDF` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to storage
    const filePath = await saveFile(buffer, file.name, 'originals');

    // Get page count for PDFs
    let pageCount: number | null = null;
    if (file.type === 'application/pdf') {
      const count = await getPdfPageCount(filePath);
      pageCount = Math.min(count, MAX_PAGES);
    } else {
      pageCount = 1;
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        filePath,
        mimeType: file.type,
        pageCount,
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
