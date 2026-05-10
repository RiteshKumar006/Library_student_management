import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken, hashPassword, verifyPassword } from '@/lib/auth';
import { ApiResponse } from '@/types';

// PUT - Change admin password
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' } as ApiResponse,
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const adminsCollection = db.collection('admins');

    // Find admin by email
    const admin = await adminsCollection.findOne({ email: decoded.email });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' } as ApiResponse,
        { status: 401 }
      );
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    const result = await adminsCollection.updateOne(
      { email: decoded.email },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Password changed successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
