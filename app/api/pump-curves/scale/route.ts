import { NextResponse } from 'next/server';
import { PrismaClient, PumpCurve } from '@prisma/client';

const prisma = new PrismaClient();

interface ScaledPoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalCurveId, pumpModelId, newSpeed, diameterRatio: inputDiameterRatio } = body;

    // Validate input
    if (!originalCurveId || !pumpModelId || newSpeed === undefined || newSpeed === null) {
      return NextResponse.json(
        { error: 'Missing required fields: originalCurveId, pumpModelId, and newSpeed are required.' },
        { status: 400 }
      );
    }

    const diameterRatio = inputDiameterRatio === undefined || inputDiameterRatio === null ? 1 : Number(inputDiameterRatio);
    const parsedNewSpeed = Number(newSpeed);

    if (isNaN(parsedNewSpeed) || parsedNewSpeed <= 0) {
      return NextResponse.json(
        { error: 'Invalid newSpeed. Must be a positive number.' },
        { status: 400 }
      );
    }

    if (isNaN(diameterRatio) || diameterRatio <= 0) {
      return NextResponse.json(
        { error: 'Invalid diameterRatio. Must be a positive number if provided.' },
        { status: 400 }
      );
    }

    // Fetch the original curve
    let originalCurve: PumpCurve;
    try {
      originalCurve = await prisma.pumpCurve.findUniqueOrThrow({
        where: { id: originalCurveId },
      });
    } catch (error) {
      console.error('Error fetching original curve:', error);
      return NextResponse.json(
        { error: `Original curve with id ${originalCurveId} not found.` },
        { status: 404 }
      );
    }

    if (originalCurve.speed === null || originalCurve.speed === undefined) {
      return NextResponse.json(
        { error: 'Original curve speed is not defined.' },
        { status: 400 }
      );
    }

    if (originalCurve.speed === 0) {
      return NextResponse.json(
        { error: 'Original curve speed cannot be zero for scaling.' },
        { status: 400 }
      );
    }

    const speedRatio = parsedNewSpeed / originalCurve.speed;

    // Parse originalCurve.points
    if (!originalCurve.points || typeof originalCurve.points !== 'string') {
        return NextResponse.json(
            { error: 'Original curve points are missing or invalid.' },
            { status: 400 }
        );
    }
    const originalPointsArray = originalCurve.points.split(';').map(pointStr => {
      const [flow, head, efficiency, power] = pointStr.split(',').map(Number);
      if (isNaN(flow) || isNaN(head) || isNaN(efficiency) || isNaN(power)) {
        throw new Error('Invalid point data in original curve');
      }
      return { flow, head, efficiency, power };
    });

    if (originalPointsArray.some(p => p === null) || originalPointsArray.length === 0) {
         return NextResponse.json(
            { error: 'Failed to parse original curve points or no points found.' },
            { status: 400 }
        );
    }

    // Calculate scaled points
    const scaledPoints: ScaledPoint[] = originalPointsArray.map(p => {
      const scaledFlow = p.flow * speedRatio * diameterRatio;
      const scaledHead = p.head * Math.pow(speedRatio, 2) * Math.pow(diameterRatio, 2);
      // Efficiency remains the same
      const scaledEfficiency = p.efficiency;
      // Power calculation: originalPower * (speedRatio^3) * (diameterRatio^3)
      const scaledPower = p.power * Math.pow(speedRatio, 3) * Math.pow(diameterRatio, 3);

      return {
        flow: parseFloat(scaledFlow.toFixed(2)),
        head: parseFloat(scaledHead.toFixed(2)),
        efficiency: parseFloat(scaledEfficiency.toFixed(2)),
        power: parseFloat(scaledPower.toFixed(2)),
      };
    });

    // Format scaled points back into string
    const scaledPointsString = scaledPoints
      .map(p => `${p.flow},${p.head},${p.efficiency},${p.power}`)
      .join(';');

    // Create the scaled curve
    const scaledCurve = await prisma.pumpCurve.create({
      data: {
        pumpModelId,
        points: scaledPointsString,
        isScaled: true,
        originalCurveId,
        speedRatio: parseFloat(speedRatio.toFixed(4)), // Store with precision
        diameterRatio: parseFloat(diameterRatio.toFixed(4)), // Store with precision
        speed: parsedNewSpeed,
      },
    });

    return NextResponse.json(scaledCurve);
  } catch (error: any) {
    console.error('Error creating scaled curve:', error);
    if (error.message && error.message.includes('Invalid point data')) {
        return NextResponse.json(
            { error: 'Invalid point data in original curve. Ensure points are in format "flow,head,efficiency,power;..."' },
            { status: 400 }
          );
    }
    return NextResponse.json(
      { error: 'Failed to create scaled curve. ' + (error.message || '') },
      { status: 500 }
    );
  }
}