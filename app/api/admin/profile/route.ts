import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ApiResponse, Admin } from '@/types';

// GET - Fetch admin profile
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' } as ApiResponse,
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const adminsCollection = db.collection('admins');

    // Find admin by email (from token)
    const admin = await adminsCollection.findOne({ email: decoded.email });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Return admin without password
    const { password, ...adminWithoutPassword } = admin;
    return NextResponse.json(
      { success: true, data: adminWithoutPassword, message: 'Admin profile fetched successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT - Update admin profile
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, libraryName, address } = body;

    // Only allow updating these fields
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (libraryName !== undefined) updateData.libraryName = libraryName;
    if (address !== undefined) updateData.address = address;

    const db = await getDatabase();
    const adminsCollection = db.collection('admins');

    const result = await adminsCollection.updateOne(
      { email: decoded.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Fetch updated admin
    const updatedAdmin = await adminsCollection.findOne({ email: decoded.email });
    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch updated profile' } as ApiResponse,
        { status: 500 }
      );
    }

    const { password, ...adminWithoutPassword } = updatedAdmin;

    return NextResponse.json(
      { success: true, data: adminWithoutPassword, message: 'Profile updated successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
