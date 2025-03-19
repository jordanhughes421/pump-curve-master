import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; curveId: string } }
) {
  try {
    const pumpId = parseInt(params.id);
    const curveId = parseInt(params.curveId);

    if (isNaN(pumpId) || isNaN(curveId)) {
      return NextResponse.json(
        { error: 'Invalid pump or curve ID' },
        { status: 400 }
      );
    }

    // Verify the curve belongs to the pump
    const curve = await prisma.pumpCurve.findFirst({
      where: {
        id: curveId,
        pumpModelId: pumpId,
      },
    });

    if (!curve) {
      return NextResponse.json(
        { error: 'Curve not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { speed, points } = body;

    if (!speed || !points) {
      return NextResponse.json(
        { error: 'Speed and points are required' },
        { status: 400 }
      );
    }

    // Update the curve
    const updatedCurve = await prisma.pumpCurve.update({
      where: {
        id: curveId,
      },
      data: {
        speed: parseFloat(speed),
        points,
      },
    });

    return NextResponse.json(updatedCurve);
  } catch (error) {
    console.error('Error updating curve:', error);
    return NextResponse.json(
      { error: 'Failed to update curve' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; curveId: string } }
) {
  try {
    const pumpId = parseInt(params.id);
    const curveId = parseInt(params.curveId);

    if (isNaN(pumpId) || isNaN(curveId)) {
      return NextResponse.json(
        { error: 'Invalid pump or curve ID' },
        { status: 400 }
      );
    }

    // Verify the curve belongs to the pump
    const curve = await prisma.pumpCurve.findFirst({
      where: {
        id: curveId,
        pumpModelId: pumpId,
      },
    });

    if (!curve) {
      return NextResponse.json(
        { error: 'Curve not found' },
        { status: 404 }
      );
    }

    // Delete the curve
    await prisma.pumpCurve.delete({
      where: {
        id: curveId,
      },
    });

    return NextResponse.json({ message: 'Curve deleted successfully' });
  } catch (error) {
    console.error('Error deleting curve:', error);
    return NextResponse.json(
      { error: 'Failed to delete curve' },
      { status: 500 }
    );
  }
} 