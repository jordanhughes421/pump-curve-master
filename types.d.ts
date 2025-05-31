// types.d.ts
import 'next';
import { PrismaClient } from '@prisma/client';

export interface PumpCurve {
  id: number;
  pumpModelId: number;
  speed: number;
  points: string; // Format: "flow1,head1,eff1,power1;flow2,head2,eff2,power2;..."
  isScaled?: boolean;
  originalCurveId?: number | null;
  speedRatio?: number | null;
  diameterRatio?: number | null;
  createdAt: Date; // Assuming Date objects are used in TypeScript
  updatedAt: Date; // Assuming Date objects are used in TypeScript
}

declare module 'next' {
  export interface NextApiRequest {
    userId?: number; // Add custom properties here
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient;
    }
  }
}