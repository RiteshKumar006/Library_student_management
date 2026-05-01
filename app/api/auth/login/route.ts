import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyPassword, generateToken, createAuthResponse } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Demo credentials for testing
    const DEMO_EMAIL = 'admin@library.com';
    const DEMO_PASSWORD = 'admin123';

    // Try to connect to MongoDB first
    let isValid = false;
    try {
      const db = await getDatabase();
      const adminsCollection = db.collection('admins');
      const admin = await adminsCollection.findOne({ email });

      if (admin) {
        isValid = await verifyPassword(password, admin.password);
      }
    } catch (dbError) {
      // Database connection failed, fall back to demo mode
      console.log('Database connection failed, using demo mode');
    }

    // Fall back to demo credentials if database is unavailable
    if (!isValid && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' } as ApiResponse,
        { status: 401 }
      );
    }

    const token = generateToken(email);
    return createAuthResponse(token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
