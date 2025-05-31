import { POST } from '../route'; // Adjust the path as necessary
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    pumpCurve: {
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init, status: init?.status || 200 })),
  },
}));

describe('API Route: /api/pump-curves/scale', () => {
  let prismaMock: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    const ActualPrismaClient = jest.requireActual('@prisma/client').PrismaClient;
    prismaMock = new ActualPrismaClient(); // This will use the mocked version due to jest.mock
  });

  const mockRequest = (body: any) => ({
    json: async () => body,
  } as unknown as Request);

  const baseOriginalCurve = {
    id: 'origCurve123',
    pumpModelId: 'pumpModelABC',
    speed: 1000,
    points: "10,100,80,5;20,90,85,10", // flow,head,efficiency,power
    isScaled: false,
    originalCurveId: null,
    speedRatio: null,
    diameterRatio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Successful Scaling Scenarios', () => {
    it('should scale correctly with valid inputs (newSpeed and diameterRatio)', async () => {
      prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue(baseOriginalCurve);
      prismaMock.pumpCurve.create.mockImplementation((args: any) => Promise.resolve({ ...args.data, id: 'scaledCurve456' }));

      const requestBody = {
        originalCurveId: 'origCurve123',
        pumpModelId: 'pumpModelABC',
        newSpeed: 1500,
        diameterRatio: 1.1,
      };
      const request = mockRequest(requestBody);

      await POST(request);

      expect(prismaMock.pumpCurve.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'origCurve123' } });

      const speedRatio = 1500 / 1000; // 1.5
      const diameterRatio = 1.1;

      // Point 1: 10,100,80,5
      const p1_flow = (10 * speedRatio * diameterRatio).toFixed(2); // 10 * 1.5 * 1.1 = 16.50
      const p1_head = (100 * Math.pow(speedRatio, 2) * Math.pow(diameterRatio, 2)).toFixed(2); // 100 * 2.25 * 1.21 = 272.25
      const p1_eff = (80).toFixed(2);
      const p1_power = (5 * Math.pow(speedRatio, 3) * Math.pow(diameterRatio, 3)).toFixed(2); // 5 * 3.375 * 1.331 = 22.44

      // Point 2: 20,90,85,10
      const p2_flow = (20 * speedRatio * diameterRatio).toFixed(2); // 20 * 1.5 * 1.1 = 33.00
      const p2_head = (90 * Math.pow(speedRatio, 2) * Math.pow(diameterRatio, 2)).toFixed(2); // 90 * 2.25 * 1.21 = 245.03 (245.025)
      const p2_eff = (85).toFixed(2);
      const p2_power = (10 * Math.pow(speedRatio, 3) * Math.pow(diameterRatio, 3)).toFixed(2); // 10 * 3.375 * 1.331 = 44.89 (44.889375)

      const expectedPointsString = `${p1_flow},${p1_head},${p1_eff},${p1_power};${p2_flow},${p2_head},${p2_eff},${p2_power}`;

      expect(prismaMock.pumpCurve.create).toHaveBeenCalledWith({
        data: {
          pumpModelId: 'pumpModelABC',
          points: expectedPointsString,
          isScaled: true,
          originalCurveId: 'origCurve123',
          speedRatio: parseFloat(speedRatio.toFixed(4)),
          diameterRatio: parseFloat(diameterRatio.toFixed(4)),
          speed: 1500,
        },
      });

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'scaledCurve456', points: expectedPointsString }),
        // Default status for NextResponse.json mock is 200 if not specified
      );
    });

    it('should scale correctly when diameterRatio is not provided (defaults to 1)', async () => {
        prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue(baseOriginalCurve);
        prismaMock.pumpCurve.create.mockImplementation((args: any) => Promise.resolve({ ...args.data, id: 'scaledCurve789' }));

        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 1200,
          // diameterRatio is omitted
        };
        const request = mockRequest(requestBody);
        await POST(request);

        const speedRatio = 1200 / 1000; // 1.2
        const diameterRatio = 1; // Default

        const p1_flow = (10 * speedRatio * diameterRatio).toFixed(2); // 12.00
        const p1_head = (100 * Math.pow(speedRatio, 2) * Math.pow(diameterRatio, 2)).toFixed(2); // 144.00
        const p1_power = (5 * Math.pow(speedRatio, 3) * Math.pow(diameterRatio, 3)).toFixed(2); // 8.64
        const expectedPointsStart = `${p1_flow},${p1_head},80.00,${p1_power}`;

        expect(prismaMock.pumpCurve.create).toHaveBeenCalledWith(
          expect.objectContaining({
            speed: 1200,
            speedRatio: parseFloat(speedRatio.toFixed(4)),
            diameterRatio: parseFloat(diameterRatio.toFixed(4)),
            points: expect.stringStartingWith(expectedPointsStart),
          })
        );
        expect(NextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'scaledCurve789' }),
        );
      });

      it('should scale correctly when newSpeed is same as original (speedRatio = 1)', async () => {
        prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue(baseOriginalCurve);
        prismaMock.pumpCurve.create.mockImplementation((args: any) => Promise.resolve({ ...args.data, id: 'scaledCurve101' }));

        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 1000,
          diameterRatio: 0.9,
        };
        const request = mockRequest(requestBody);
        await POST(request);

        const speedRatio = 1000 / 1000; // 1
        const diameterRatio = 0.9;

        const p1_flow = (10 * speedRatio * diameterRatio).toFixed(2); // 9.00
        const p1_head = (100 * Math.pow(speedRatio, 2) * Math.pow(diameterRatio, 2)).toFixed(2); // 81.00
        const p1_power = (5 * Math.pow(speedRatio, 3) * Math.pow(diameterRatio, 3)).toFixed(2); // 3.65 (3.645)
        const expectedPointsStart = `${p1_flow},${p1_head},80.00,${p1_power}`;

        expect(prismaMock.pumpCurve.create).toHaveBeenCalledWith(
          expect.objectContaining({
            speed: 1000,
            speedRatio: parseFloat(speedRatio.toFixed(4)), // 1.0000
            diameterRatio: parseFloat(diameterRatio.toFixed(4)), // 0.9000
            points: expect.stringStartingWith(expectedPointsStart),
          })
        );
         expect(NextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'scaledCurve101' }),
        );
      });
  });

  describe('Validation Error Scenarios', () => {
    it('should return 400 if newSpeed is missing', async () => {
      const requestBody = {
        originalCurveId: 'origCurve123',
        pumpModelId: 'pumpModelABC',
        // newSpeed is missing
        diameterRatio: 1.1,
      };
      const request = mockRequest(requestBody);
      await POST(request);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Missing required fields: originalCurveId, pumpModelId, and newSpeed are required.' },
        { status: 400 }
      );
    });

    it('should return 400 if newSpeed is invalid (e.g., 0 or negative)', async () => {
        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 0,
          diameterRatio: 1.1,
        };
        const request = mockRequest(requestBody);
        await POST(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: 'Invalid newSpeed. Must be a positive number.' },
          { status: 400 }
        );
      });

      it('should return 400 if diameterRatio is invalid (e.g., 0 or negative)', async () => {
        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 1500,
          diameterRatio: 0,
        };
        const request = mockRequest(requestBody);
        await POST(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: 'Invalid diameterRatio. Must be a positive number if provided.' },
          { status: 400 }
        );
      });
  });

  describe('Error Handling Scenarios', () => {
    it('should return 400 if original curve speed is 0', async () => {
      prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue({ ...baseOriginalCurve, speed: 0 });

      const requestBody = {
        originalCurveId: 'origCurve123',
        pumpModelId: 'pumpModelABC',
        newSpeed: 1500,
        diameterRatio: 1.1,
      };
      const request = mockRequest(requestBody);
      await POST(request);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Original curve speed cannot be zero for scaling.' },
        { status: 400 }
      );
    });

    it('should return 404 if original curve not found', async () => {
      const error = new Error("Record to delete does not exist."); // Prisma-like error
      prismaMock.pumpCurve.findUniqueOrThrow.mockRejectedValue(error);

      const requestBody = {
        originalCurveId: 'nonExistentCurve',
        pumpModelId: 'pumpModelABC',
        newSpeed: 1500,
        diameterRatio: 1.1,
      };
      const request = mockRequest(requestBody);
      await POST(request);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Original curve with id nonExistentCurve not found.' },
        { status: 404 }
      );
    });

    it('should return 400 if original curve points are malformed (not enough numbers)', async () => {
        prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue({
          ...baseOriginalCurve,
          points: "10,100,80;20,90,85,10" // First point is missing power
        });

        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 1500,
          diameterRatio: 1.1,
        };
        const request = mockRequest(requestBody);
        await POST(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: 'Invalid point data in original curve. Ensure points are in format "flow,head,efficiency,power;..."' },
          { status: 400 } // Changed from 500 as per API code for this specific error
        );
      });

      it('should return 400 if original curve points string is empty', async () => {
        prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue({
          ...baseOriginalCurve,
          points: ""
        });

        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 1500,
          diameterRatio: 1.1,
        };
        const request = mockRequest(requestBody);
        await POST(request);

        // The current implementation would throw "Invalid point data" because split on "" gives [""] and map then fails on Number(undefined)
        // Or "Failed to parse original curve points or no points found." if the array ends up empty or full of nulls
        // Let's check for the specific parsing error message
        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: 'Invalid point data in original curve. Ensure points are in format "flow,head,efficiency,power;..."'},
          { status: 400 }
        );
      });

      it('should return 400 if original curve speed is null', async () => {
        prismaMock.pumpCurve.findUniqueOrThrow.mockResolvedValue({ ...baseOriginalCurve, speed: null });

        const requestBody = {
          originalCurveId: 'origCurve123',
          pumpModelId: 'pumpModelABC',
          newSpeed: 1500,
          diameterRatio: 1.1,
        };
        const request = mockRequest(requestBody);
        await POST(request);

        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: 'Original curve speed is not defined.' },
          { status: 400 }
        );
      });
  });
});
