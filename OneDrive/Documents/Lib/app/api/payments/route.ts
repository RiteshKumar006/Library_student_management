import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { Payment, ApiResponse } from '@/types';
import { ObjectId } from 'mongodb';

// POST - Record payment
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, amount, paymentDate, paymentMethod, notes } = body;

    if (!studentId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection('payments');
    const studentsCollection = db.collection('students');

    // Verify student exists
    const student = await studentsCollection.findOne({
      _id: new ObjectId(studentId),
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' } as ApiResponse,
        { status: 404 }
      );
    }

    const newPayment: Payment = {
      studentId,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod,
      notes: notes || '',
      createdAt: new Date(),
    };

    const result = await paymentsCollection.insertOne(newPayment);

    // Update student's next due date (add one month from today)
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      {
        $set: {
          nextDueDate,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      { success: true, data: { _id: result.insertedId, ...newPayment }, message: 'Payment recorded successfully' } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// GET - List all payments
export async function GET(request: NextRequest) {
  try {
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
      .find({})
      .sort({ paymentDate: -1 })
      .toArray();

    return NextResponse.json(
      { success: true, data: payments, message: 'Payments fetched successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
