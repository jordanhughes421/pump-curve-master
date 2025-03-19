import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const pumps = await prisma.pumpModel.findMany({
      include: {
        curves: true,
        documents: true,
        bom: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(pumps);
  } catch (error) {
    console.error('Failed to fetch pumps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pumps' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true }
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const pump = await prisma.pumpModel.create({
      data: {
        name: data.name,
        type: data.type,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        maxFlow: data.maxFlow,
        maxHead: data.maxHead,
        maxSpeed: data.maxSpeed,
        description: data.description,
        createdBy: {
          connect: {
            id: session.user.id
          }
        }
      },
    });

    return NextResponse.json(pump);
  } catch (error) {
    console.error('Failed to create pump:', error);
    return NextResponse.json(
      { error: 'Failed to create pump' },
      { status: 500 }
    );
  }
} 