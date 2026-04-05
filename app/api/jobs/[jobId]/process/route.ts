import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processPage } from '@/lib/ai/openai';
import { readFile } from '@/lib/storage/local';
import { getImageMimeType } from '@/lib/pdf/processor';
import type { TargetLanguage, TranslationStyle, UncertainTerm } from '@/types';

const MAX_PAGES = parseInt(process.env.MAX_PAGES ?? '10', 10);

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  try {
    // Load job with document
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { document: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!['pending_confirmation', 'uploaded', 'failed'].includes(job.status)) {
      return NextResponse.json(
        { error: `Job cannot be processed in status: ${job.status}` },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    const document = job.document;
    const mimeType = getImageMimeType(document.filePath);
    const fileBuffer = await readFile(document.filePath);

    // Determine page count
    let totalPages = document.pageCount ?? 1;
    if (job.mode === 'first_page') {
      totalPages = 1;
    } else {
      totalPages = Math.min(totalPages, MAX_PAGES);
    }

    let hasUncertainTerms = false;

    // Process pages sequentially
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      // Create or get page record
      let jobPage = await prisma.jobPage.findUnique({
        where: { jobId_pageNumber: { jobId, pageNumber } },
      });

      if (!jobPage) {
        jobPage = await prisma.jobPage.create({
          data: {
            jobId,
            pageNumber,
            status: 'processing',
          },
        });
      } else {
        await prisma.jobPage.update({
          where: { id: jobPage.id },
          data: { status: 'processing' },
        });
      }

      try {
        const { result, rawRequest, rawResponse } = await processPage({
          imageBuffer: fileBuffer,
          mimeType,
          pageNumber,
          totalPages,
          targetLanguage: job.targetLanguage as TargetLanguage,
          style: job.style as TranslationStyle,
        });

        // Log debug info
        await prisma.debugLog.create({
          data: {
            jobId,
            pageId: jobPage.id,
            stage: 'process_page',
            request: JSON.parse(JSON.stringify(rawRequest)),
            response: JSON.parse(JSON.stringify(rawResponse)),
          },
        });

        const uncertainTerms = result.uncertain_terms as unknown as UncertainTerm[];

        const uncertainTermsJson = JSON.parse(JSON.stringify(uncertainTerms));

        // Save page version 1
        await prisma.pageVersion.upsert({
          where: { pageId_version: { pageId: jobPage.id, version: 1 } },
          create: {
            pageId: jobPage.id,
            version: 1,
            transcription: result.transcription,
            translation: result.translation,
            confidence: result.confidence,
            uncertainTerms: uncertainTermsJson,
          },
          update: {
            transcription: result.transcription,
            translation: result.translation,
            confidence: result.confidence,
            uncertainTerms: uncertainTermsJson,
          },
        });

        // Update page record
        await prisma.jobPage.update({
          where: { id: jobPage.id },
          data: {
            transcription: result.transcription,
            translation: result.translation,
            confidence: result.confidence,
            uncertainTerms: uncertainTermsJson,
            status: uncertainTerms.length > 0 ? 'uncertain' : 'completed',
            currentVersion: 1,
          },
        });

        if (uncertainTerms.length > 0) {
          hasUncertainTerms = true;
        }
      } catch (pageError) {
        const errorMsg = pageError instanceof Error ? pageError.message : 'Unknown error';

        await prisma.debugLog.create({
          data: {
            jobId,
            pageId: jobPage.id,
            stage: 'process_page_error',
            error: errorMsg,
          },
        });

        await prisma.jobPage.update({
          where: { id: jobPage.id },
          data: { status: 'failed' },
        });

        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'failed', errorMessage: `Page ${pageNumber} failed: ${errorMsg}` },
        });

        return NextResponse.json({ error: `Processing failed on page ${pageNumber}: ${errorMsg}` }, { status: 500 });
      }
    }

    // Update job status
    const finalStatus = hasUncertainTerms ? 'waiting_user_input' : 'completed';
    await prisma.job.update({
      where: { id: jobId },
      data: { status: finalStatus },
    });

    return NextResponse.json({
      success: true,
      status: finalStatus,
      hasUncertainTerms,
      totalPages,
    });
  } catch (error) {
    console.error('Process job error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage: errorMsg },
    }).catch(() => {});

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
