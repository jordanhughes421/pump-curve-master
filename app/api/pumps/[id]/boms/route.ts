import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/pumps/[id]/boms - Create a new BOM for a pump
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'BOM name is required' }, { status: 400 });
    }

    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'Invalid Pump ID' }, { status: 400 });
    }

    // Check if pump exists
    const pump = await prisma.pumpModel.findUnique({
      where: { id: idInt },
    });

    if (!pump) {
      return NextResponse.json({ error: 'Pump not found' }, { status: 404 });
    }

    const newBOM = await prisma.bOM.create({
      data: {
        name,
        pumpModelId: idInt,
      },
    });

    return NextResponse.json(newBOM, { status: 201 });
  } catch (error) {
    console.error('Error creating BOM:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/pumps/[id]/boms - List all BOMs for a pump
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const idInt = parseInt(id, 10);

    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'Invalid Pump ID' }, { status: 400 });
    }

    // Optional: Check if pump exists before fetching BOMs, though not strictly necessary
    // if you only want to return an empty array for non-existent/invalid pumpId.
    const pump = await prisma.pumpModel.findUnique({
      where: { id: idInt },
    });

    if (!pump) {
      // Depending on desired behavior, could also return empty array
      return NextResponse.json({ error: 'Pump not found' }, { status: 404 });
    }

    const boms = await prisma.bOM.findMany({
      where: {
        pumpModelId: idInt,
      },
      orderBy: {
        createdAt: 'desc', // Optional: order by creation date
      }
    });

    return NextResponse.json(boms);
  } catch (error) {
    console.error('Error fetching BOMs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
