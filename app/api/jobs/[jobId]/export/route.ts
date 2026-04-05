import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePdf } from '@/lib/export/pdf';
import { generateDocx } from '@/lib/export/docx';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  try {
    const body = await request.json() as {
      format: 'pdf' | 'docx';
      includeTranscription?: boolean;
    };

    const { format, includeTranscription = true } = body;

    if (!['pdf', 'docx'].includes(format)) {
      return NextResponse.json({ error: 'Format must be pdf or docx' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        document: true,
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: 'Job must be completed before exporting' },
        { status: 400 }
      );
    }

    const exportPages = job.pages.map((p) => ({
      pageNumber: p.pageNumber,
      transcription: p.transcription ?? undefined,
      translation: p.translation ?? undefined,
      confidence: p.confidence ?? undefined,
    }));

    const languageLabels: Record<string, string> = {
      hebrew: 'Hebrew',
      english: 'English',
      french: 'Modern French',
    };

    const exportOptions = {
      jobId,
      documentName: job.document.fileName,
      targetLanguage: languageLabels[job.targetLanguage] ?? job.targetLanguage,
      pages: exportPages,
      includeTranscription,
    };

    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'pdf') {
      buffer = await generatePdf(exportOptions);
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      buffer = await generateDocx(exportOptions);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    }

    const baseName = job.document.fileName.replace(/\.[^.]+$/, '');
    const exportFileName = `${baseName}_translation.${fileExtension}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportFileName}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
