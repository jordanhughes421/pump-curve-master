import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to recursively fetch children BOMItems
async function fetchBOMItemChildren(bomItemId: number): Promise<any[]> {
  const children = await prisma.bOMItem.findMany({
    where: { parentId: bomItemId },
    include: {
      customFields: true,
      // We will recursively call this function for grandchildren
    },
  });

  for (let i = 0; i < children.length; i++) {
    // @ts-ignore
    children[i].children = await fetchBOMItemChildren(children[i].id);
  }
  return children;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idInt = parseInt(params.id);

    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'Invalid pump ID' }, { status: 400 });
    }

    const pump = await prisma.pumpModel.findUnique({
      where: { id: idInt },
    });

    if (!pump) {
      return NextResponse.json(
        { error: 'Pump not found' },
        { status: 404 }
      );
    }

    // Fetch top-level BOMItems (those without a parentId for this pump)
    const topLevelBOMItems = await prisma.bOMItem.findMany({
      where: {
        bom: { pumpModelId: idInt },
        parentId: null, // Only top-level items
      },
      include: {
        customFields: true,
      },
    });

    // For each top-level item, fetch its children recursively
    for (let i = 0; i < topLevelBOMItems.length; i++) {
      // @ts-ignore
      topLevelBOMItems[i].children = await fetchBOMItemChildren(topLevelBOMItems[i].id);
    }

    return NextResponse.json(topLevelBOMItems);
  } catch (error) {
    console.error(`Failed to fetch BOM for pump ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch BOM structure' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idInt = parseInt(params.id);

    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'Invalid pump ID' }, { status: 400 });
    }

    // Check if pump exists
    const pump = await prisma.pumpModel.findUnique({
      where: { id: idInt },
    });

    if (!pump) {
      return NextResponse.json(
        { error: 'Pump not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { partNumber, description, quantity, unit, supplier, parentId } = data;

    if (!partNumber || !description || quantity === undefined || !unit) {
      return NextResponse.json(
        { error: 'Missing required BOM item fields' },
        { status: 400 }
      );
    }
    
    // If parentId is provided, verify it exists and belongs to the same pump
    if (parentId) {
      const parentBOMItem = await prisma.bOMItem.findUnique({
        where: { id: parentId },
      });
      if (!parentBOMItem) {
        return NextResponse.json(
          { error: 'Parent BOM item not found' },
          { status: 400 }
        );
      }
      // Optional: Check if parentBOMItem.pumpModelId matches the current pumpId
      // This check is important if BOM items could be moved or if parentId could be from another pump's BOM.
      // For now, we assume parentId is validly referring to an item within the same pump's BOM structure.
    }

    const newBOMItem = await prisma.bOMItem.create({
      data: {
        partNumber,
        description,
        quantity: parseInt(quantity),
        unit,
        supplier: supplier || null,
        pumpModelId: idInt, // Associate with the pump
        parentId: parentId ? parseInt(parentId) : null, // Associate with parent if provided
      },
      include: {
        customFields: true, // Include custom fields in the response
      }
    });

    return NextResponse.json(newBOMItem, { status: 201 });
  } catch (error) {
    console.error(`Failed to add BOM item to pump ${params.id}:`, error);
    // @ts-ignore
    if (error.code === 'P2002') { // Prisma unique constraint violation (e.g. if partNumber should be unique per pump)
        return NextResponse.json({ error: 'BOM item with this part number already exists for this pump.' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to add BOM item' },
      { status: 500 }
    );
  }
}
