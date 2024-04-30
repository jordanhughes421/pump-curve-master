import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/utils/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { addHours } from 'date-fns'; 



//Login
export async function POST(req: NextRequest) {
    const { email, submittiedpassword } = await req.json();

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ message: 'User not found' }), { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(submittiedpassword, user.password);
        if (!isPasswordValid) {
            return new NextResponse(JSON.stringify({ message: 'Invalid password' }), { status: 400 });
        }

        const sessionToken = randomBytes(64).toString('hex');
        const accessToken = randomBytes(64).toString('hex');

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                expires: addHours(new Date(), 2),
                sessionToken,
                accessToken,
            },
        });

        const { password, ...userWithoutPassword } = user;
        
        const response = new NextResponse(JSON.stringify({ message: 'Login successful', userWithoutPassword }), {
            status: 200
        });
        response.cookies.set('token', sessionToken, { httpOnly: true, path: '/', expires: session.expires });

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

//Read User
export async function GET(req: NextRequest) {
  // Retrieve user ID from URL query parameters instead of request body
  const userId = req.nextUrl.searchParams.get('id');

  if (!userId) {
    return new NextResponse(JSON.stringify({ message: "User ID is required" }), { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, name: true, email: true } // Exclude sensitive data
    });

    if (!user) {
        return new NextResponse(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    return new NextResponse(JSON.stringify({ user }), { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    // Handle possible parsing errors or other issues
    return new NextResponse(JSON.stringify({ message: "Error processing your request" }), { status: 500 });
  }
}

//Update User
export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();

  try {
      const user = await prisma.user.update({
          where: { id },
          data
      });
      return new NextResponse(JSON.stringify({ message: "User updated successfully", user }), { status: 200 });
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

//Delete User
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('id');
  if (!userId) return new NextResponse(JSON.stringify({ message: "User ID is required" }), { status: 400 });

  try {
      await prisma.user.delete({
          where: { id: parseInt(userId) }
      });
      return new NextResponse(JSON.stringify({ message: "User deleted successfully" }), { status: 200 });
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
