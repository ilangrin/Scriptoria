import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TargetLanguage, TranslationStyle, ProcessingMode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      documentId: string;
      targetLanguage: TargetLanguage;
      style: TranslationStyle;
      mode: ProcessingMode;
    };

    const { documentId, targetLanguage, style, mode } = body;

    // Validate
    if (!documentId || !targetLanguage || !style || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, targetLanguage, style, mode' },
        { status: 400 }
      );
    }

    const validLanguages: TargetLanguage[] = ['hebrew', 'english', 'french'];
    const validStyles: TranslationStyle[] = ['accurate', 'fluent'];
    const validModes: ProcessingMode[] = ['first_page', 'full'];

    if (!validLanguages.includes(targetLanguage)) {
      return NextResponse.json({ error: 'Invalid targetLanguage' }, { status: 400 });
    }
    if (!validStyles.includes(style)) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
    }
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    // Check document exists
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        documentId,
        targetLanguage,
        style,
        mode,
        status: 'pending_confirmation',
      },
      include: {
        document: true,
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: { id: true, fileName: true, fileSize: true, mimeType: true },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
          select: {
            id: true,
            pageNumber: true,
            status: true,
            confidence: true,
          },
        },
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
