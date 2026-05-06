import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { FeeRecord, ApiResponse } from '@/types';
import { ObjectId } from 'mongodb';

// GET - List fee records for a student
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'Student ID is required' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const feeRecordsCollection = db.collection('feeRecords');

    const feeRecords = await feeRecordsCollection
      .find({ studentId })
      .sort({ year: -1, month: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        data: feeRecords,
        message: 'Fee records fetched successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching fee records:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST - Create fee record (for future months or manual entry)
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
    const { studentId, month, year, amount, dueDate } = body;

    if (!studentId || month === undefined || !year || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const feeRecordsCollection = db.collection('feeRecords');
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

    // Check if fee record already exists
    const existingRecord = await feeRecordsCollection.findOne({
      studentId,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (existingRecord) {
      return NextResponse.json(
        { success: false, message: 'Fee record already exists for this month' } as ApiResponse,
        { status: 400 }
      );
    }

    const feeRecord: FeeRecord = {
      studentId,
      month: parseInt(month),
      year: parseInt(year),
      amount: parseFloat(amount),
      status: 'pending',
      dueDate: new Date(dueDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await feeRecordsCollection.insertOne(feeRecord);

    return NextResponse.json(
      {
        success: true,
        data: { _id: result.insertedId, ...feeRecord },
        message: 'Fee record created successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating fee record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}