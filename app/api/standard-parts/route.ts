import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { detectCycle } from '@/app/utils/cycleDetection';

// POST /api/standard-parts - Create a new StandardPart
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      partNumber,
      description,
      defaultUnit,
      defaultSupplier,
      parentId,
    }: {
      partNumber: string;
      description: string;
      defaultUnit: string;
      defaultSupplier?: string | null;
      parentId?: number | null;
    } = data;

    // Validate required fields
    if (!partNumber || !description || !defaultUnit) {
      return NextResponse.json({ error: 'Missing required fields: partNumber, description, defaultUnit' }, { status: 400 });
    }

    // If parentId is provided, check for cycles
    if (parentId !== undefined && parentId !== null) {
      // We need a temporary ID for the new item for cycle detection,
      // but since it's a new item, it can't be part of a cycle yet unless parentId is self.
      // The detectCycle function needs an actual itemId.
      // However, a new item cannot create a cycle with existing items by just setting a parent,
      // unless the parent is part of a chain that would lead back to this item - which is impossible for a new item.
      // The critical check is that parentId is not the ID of the item itself, which is not possible for a new item.
      // A more relevant check here is if the parentId actually exists.
      const parentExists = await prisma.standardPart.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        return NextResponse.json({ error: 'Proposed parent StandardPart not found.' }, { status: 400 });
      }
      // The cycle detection for new items is implicitly handled by not being able to be an ancestor of oneself.
      // More complex cycle detection logic in detectCycle is for existing items being re-parented.
    }

    const newStandardPart = await prisma.standardPart.create({
      data: {
        partNumber,
        description,
        defaultUnit,
        defaultSupplier,
        parentId,
      },
    });

    return NextResponse.json(newStandardPart, { status: 201 });
  } catch (error: any) {
    console.error('Error creating StandardPart:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('partNumber')) {
      return NextResponse.json({ error: 'A StandardPart with this part number already exists.' }, { status: 409 });
    }
    if (error.code === 'P2003' && error.meta?.field_name?.includes('parentId')) {
        return NextResponse.json({ error: 'Invalid parentId: The specified parent StandardPart does not exist.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/standard-parts - Retrieve all StandardParts
export async function GET(request: Request) {
  try {
    const standardParts = await prisma.standardPart.findMany({
      include: {
        children: true, // Include children for each item
        // parent: true // Optionally include parent
      },
      // Optionally, to fetch only top-level items first:
      // where: { parentId: null },
    });
    return NextResponse.json(standardParts);
  } catch (error) {
    console.error('Error fetching StandardParts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
