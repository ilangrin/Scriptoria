import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFile, deleteDirectory } from '@/lib/storage/local';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.docId },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            pages: {
              orderBy: { pageNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.docId },
      include: { jobs: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete uploaded file
    await deleteFile(document.filePath);

    // Delete page images for all jobs
    for (const job of document.jobs) {
      const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
      await deleteDirectory(path.join(UPLOAD_DIR, 'pages', job.id));
    }

    // Delete from database (cascades to jobs, pages, corrections, debug logs)
    await prisma.document.delete({ where: { id: params.docId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
