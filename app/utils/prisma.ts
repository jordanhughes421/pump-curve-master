// utils/prisma.ts

import { PrismaClient } from '@prisma/client';

declare const global: NodeJS.Global;

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    // In production mode, always create a new instance
    prisma = new PrismaClient();
} else {
    // In development, use a global instance to prevent too many connections
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}

export default prisma;
