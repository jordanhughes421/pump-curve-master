import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pump = await prisma.pumpModel.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        curves: true,
        documents: true,
        bom: true,
      },
    });

    if (!pump) {
      return NextResponse.json(
        { error: 'Pump not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pump);
  } catch (error) {
    console.error('Failed to fetch pump:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pump' },
      { status: 500 }
    );
  }
} 