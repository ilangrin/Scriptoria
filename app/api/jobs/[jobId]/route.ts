import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        document: true,
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
        corrections: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json() as { status?: string; errorMessage?: string };

    const job = await prisma.job.update({
      where: { id: params.jobId },
      data: {
        ...(body.status && { status: body.status as never }),
        ...(body.errorMessage !== undefined && { errorMessage: body.errorMessage }),
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
