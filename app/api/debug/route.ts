import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        document: {
          select: { id: true, fileName: true, mimeType: true, pageCount: true },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
          select: {
            id: true,
            pageNumber: true,
            status: true,
            confidence: true,
            currentVersion: true,
          },
        },
        debugLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Never expose API keys — sanitize request objects
    const sanitizedLogs = job.debugLogs.map((log) => ({
      id: log.id,
      pageId: log.pageId,
      stage: log.stage,
      error: log.error,
      createdAt: log.createdAt,
      request: log.request
        ? sanitizeRequest(log.request as Record<string, unknown>)
        : null,
      response: log.response ?? null,
    }));

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        targetLanguage: job.targetLanguage,
        style: job.style,
        mode: job.mode,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        document: job.document,
        pages: job.pages,
      },
      debugLogs: sanitizedLogs,
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
  }
}

function sanitizeRequest(request: Record<string, unknown>): Record<string, unknown> {
  // Remove any sensitive fields
  const sanitized = { ...request };
  if (sanitized.api_key) delete sanitized.api_key;
  if (sanitized.authorization) delete sanitized.authorization;

  // Redact base64 image data from messages
  if (Array.isArray(sanitized.messages)) {
    sanitized.messages = (sanitized.messages as unknown[]).map((msg) => {
      if (typeof msg !== 'object' || msg === null) return msg;
      const m = msg as Record<string, unknown>;
      if (Array.isArray(m.content)) {
        return {
          ...m,
          content: (m.content as unknown[]).map((part) => {
            if (typeof part !== 'object' || part === null) return part;
            const p = part as Record<string, unknown>;
            if (p.type === 'image_url') {
              return { type: 'image_url', url: '[BASE64_IMAGE_REDACTED]' };
            }
            return p;
          }),
        };
      }
      return m;
    });
  }

  return sanitized;
}
