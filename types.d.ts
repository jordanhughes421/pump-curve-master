// types.d.ts
import 'next';
import { PrismaClient } from '@prisma/client';

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