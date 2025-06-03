import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/bom-items - List all BOMItems
export async function GET(request: Request) {
  try {
    // TODO: Implement pagination for production environments
    // const { searchParams } = new URL(request.url);
    // const page = parseInt(searchParams.get('page') || '1', 10);
    // const limit = parseInt(searchParams.get('limit') || '10', 10);
    // const skip = (page - 1) * limit;

    const bomItems = await prisma.bOMItem.findMany({
      include: {
        // customFields: true, // Optionally include custom fields for each item
        // bom: { // Optionally include parent BOM details
        //   select: {
        //     id: true,
        //     name: true,
        //     pumpModelId: true,
        //   }
        // }
      },
      orderBy: {
        // id: 'desc', // Example ordering
        createdAt: 'desc',
      },
      // take: limit,
      // skip: skip,
    });

    // const totalItems = await prisma.bOMItem.count();

    // Each bomItem in the response will have a `bomId` field due to the schema update.
    return NextResponse.json({
      // data: bomItems,
      // totalPages: Math.ceil(totalItems / limit),
      // currentPage: page,
      bomItems, // Simplified response for now
    });
  } catch (error) {
    console.error('Error fetching all BOMItems:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
