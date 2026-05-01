import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ApiResponse } from '@/types';

// GET - Payment history for student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection('payments');

    const payments = await paymentsCollection
      .find({ studentId })
      .sort({ paymentDate: -1 })
      .toArray();

    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return NextResponse.json(
      {
        success: true,
        data: { payments, total },
        message: 'Payment history fetched successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
