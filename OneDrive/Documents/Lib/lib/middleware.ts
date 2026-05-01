import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './auth';

export async function authMiddleware(request: NextRequest) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }

  // Add user info to request headers for use in API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-email', decoded.email);

  return null; // Middleware passed
}

export function withAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const authError = await authMiddleware(request);
    if (authError) {
      return authError;
    }
    return handler(request);
  };
}
