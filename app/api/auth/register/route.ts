// Import NextResponse from next/server
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server'
import prisma from '@/app/utils/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';


export async function POST(req: NextRequest) {
  const res = await req.json()
  const name = res.name as string
  const email = res.email as string
  const password = res.password as string
  


  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create a NextResponse object for successful user creation
    const response = new NextResponse(JSON.stringify({ message: 'User created successfully', user }), {
      status: 201
    });
    const sessionToken = randomBytes(64).toString('hex');

    // Example of setting a cookie
    response.cookies.set('session-token', sessionToken, { httpOnly: true });

    // Example of setting custom headers
    // response.headers.set('X-Custom-Header', 'CustomValue');

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Error creating user', error: error.message }), {
        status: 400
      });
    } else {
      return new NextResponse(JSON.stringify({ message: 'An unexpected error occurred' }), {
        status: 500
      });
    }
  }
}
