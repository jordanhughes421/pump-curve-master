import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalCurveId, pumpModelId, speedRatio, diameterRatio, points } = body;

    // Validate input
    if (!originalCurveId || !pumpModelId || !points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the scaled curve
    const scaledCurve = await prisma.pumpCurve.create({
      data: {
        pumpModelId,
        points,
        isScaled: true,
        originalCurveId,
        speedRatio: speedRatio || null,
        diameterRatio: diameterRatio || null,
        speed: Math.round(JSON.parse(points)[0].speed * (speedRatio || 1)), // Approximate speed based on first point
      },
    });

    return NextResponse.json(scaledCurve);
  } catch (error) {
    console.error('Error creating scaled curve:', error);
    return NextResponse.json(
      { error: 'Failed to create scaled curve' },
      { status: 500 }
    );
  }
} 