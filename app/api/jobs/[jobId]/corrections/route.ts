import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processPage } from '@/lib/ai/openai';
import { readFile } from '@/lib/storage/local';
import { getImageMimeType } from '@/lib/pdf/processor';
import type { TargetLanguage, TranslationStyle, UserCorrection, UncertainTerm } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  try {
    const body = await request.json() as { corrections: UserCorrection[] };
    const { corrections } = body;

    if (!corrections || !Array.isArray(corrections) || corrections.length === 0) {
      return NextResponse.json({ error: 'No corrections provided' }, { status: 400 });
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

    if (job.status !== 'waiting_user_input') {
      return NextResponse.json(
        { error: `Job is not waiting for input (current status: ${job.status})` },
        { status: 400 }
      );
    }

    // Save corrections
    await prisma.correction.createMany({
      data: corrections.map((c) => ({
        jobId,
        termId: c.termId,
        pageNumber: c.pageNumber,
        originalSnippet: c.originalSnippet,
        userCorrection: c.correction,
      })),
      skipDuplicates: true,
    });

    // Move to reprocessing
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'reprocessing' },
    });

    const document = job.document;
    const mimeType = getImageMimeType(document.filePath);
    const fileBuffer = await readFile(document.filePath);

    // Group corrections by page
    const correctionsByPage = new Map<number, UserCorrection[]>();
    for (const c of corrections) {
      const existing = correctionsByPage.get(c.pageNumber) ?? [];
      existing.push(c);
      correctionsByPage.set(c.pageNumber, existing);
    }

    // Reprocess pages that had corrections or uncertain terms
    for (const page of job.pages) {
      const pageCorrections = correctionsByPage.get(page.pageNumber);
      const uncertainTerms = (page.uncertainTerms as unknown as UncertainTerm[]) ?? [];

      if (uncertainTerms.length === 0 && !pageCorrections) {
        continue;
      }

      const totalPages = job.pages.length;

      try {
        const { result, rawRequest, rawResponse } = await processPage({
          imageBuffer: fileBuffer,
          mimeType,
          pageNumber: page.pageNumber,
          totalPages,
          targetLanguage: job.targetLanguage as TargetLanguage,
          style: job.style as TranslationStyle,
          corrections: pageCorrections ?? [],
        });

        await prisma.debugLog.create({
          data: {
            jobId,
            pageId: page.id,
            stage: 'reprocess_page',
            request: rawRequest,
            response: rawResponse,
          },
        });

        const newVersion = page.currentVersion + 1;

        // Save new version
        await prisma.pageVersion.create({
          data: {
            pageId: page.id,
            version: newVersion,
            transcription: result.transcription,
            translation: result.translation,
            confidence: result.confidence,
            uncertainTerms: result.uncertain_terms as unknown as never,
            corrections: (pageCorrections ?? []) as unknown as never,
          },
        });

        const newUncertainTerms = result.uncertain_terms as unknown as UncertainTerm[];

        // Update page
        await prisma.jobPage.update({
          where: { id: page.id },
          data: {
            transcription: result.transcription,
            translation: result.translation,
            confidence: result.confidence,
            uncertainTerms: newUncertainTerms as unknown as never,
            status: newUncertainTerms.length > 0 ? 'uncertain' : 'completed',
            currentVersion: newVersion,
          },
        });
      } catch (pageError) {
        const errorMsg = pageError instanceof Error ? pageError.message : 'Unknown error';
        await prisma.debugLog.create({
          data: {
            jobId,
            pageId: page.id,
            stage: 'reprocess_page_error',
            error: errorMsg,
          },
        });
      }
    }

    // Check if any pages still have uncertain terms
    const updatedPages = await prisma.jobPage.findMany({ where: { jobId } });
    const stillUncertain = updatedPages.some((p) => p.status === 'uncertain');

    const finalStatus = stillUncertain ? 'waiting_user_input' : 'completed';
    await prisma.job.update({
      where: { id: jobId },
      data: { status: finalStatus },
    });

    return NextResponse.json({ success: true, status: finalStatus });
  } catch (error) {
    console.error('Corrections error:', error);
    return NextResponse.json({ error: 'Failed to process corrections' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const corrections = await prisma.correction.findMany({
      where: { jobId: params.jobId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ corrections });
  } catch (error) {
    console.error('Get corrections error:', error);
    return NextResponse.json({ error: 'Failed to fetch corrections' }, { status: 500 });
  }
}
