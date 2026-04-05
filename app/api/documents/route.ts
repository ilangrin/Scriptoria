import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    const validSortFields = ['createdAt', 'fileName', 'fileSize'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const documents = await prisma.document.findMany({
      orderBy: { [sortField]: sortOrder },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            targetLanguage: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
