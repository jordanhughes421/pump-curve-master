import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const curves = await prisma.pumpCurve.findMany({
      where: {
        pumpModelId: parseInt(params.id),
      },
      orderBy: {
        speed: 'asc',
      },
    });

    return NextResponse.json(curves);
  } catch (error) {
    console.error('Failed to fetch pump curves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pump curves' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { speed, points } = await request.json();

    // Validate that points is a valid JSON string
    try {
      JSON.parse(points);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid points data format' },
        { status: 400 }
      );
    }

    const curve = await prisma.pumpCurve.create({
      data: {
        speed,
        points,
        pumpModel: {
          connect: {
            id: parseInt(params.id)
          }
        }
      },
    });

    return NextResponse.json(curve);
  } catch (error) {
    console.error('Failed to create pump curve:', error);
    return NextResponse.json(
      { error: 'Failed to create pump curve' },
      { status: 500 }
    );
  }
} 