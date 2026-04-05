import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 });
    }

    // Security: ensure path is within uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);

    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const buffer = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf',
    };

    const contentType = mimeMap[ext] ?? 'application/octet-stream';

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
