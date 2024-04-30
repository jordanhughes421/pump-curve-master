import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/utils/prisma';



//Read User from session token and refresh session
export async function GET(req: NextRequest) {
    const submittedToken = req.cookies.get('token');
    const token = submittedToken?.value;

    if (typeof token !== 'string') {
        return new NextResponse(JSON.stringify({ message: "Token not provided or not proivided as string", token: token}), { status: 401 });
    }
    try {
        const session = await prisma.session.findUnique({
            where: { sessionToken: token },
            include: { user: true }
        });

        if (!session) {
            return new NextResponse(JSON.stringify({ message: "Session not found" }), { status: 404 });
        }

        const response = new NextResponse(JSON.stringify({ message: "Logged out successfully" }), { status: 200 });
        response.cookies.delete('token');  // Correct usage of deleting the cookie
        return response;
    } catch (error) {
        console.error("Error fetching user:", error);
        // Handle possible parsing errors or other issues
        return new NextResponse(JSON.stringify({ message: "Error processing your request" }), { status: 500 });
    }
  }