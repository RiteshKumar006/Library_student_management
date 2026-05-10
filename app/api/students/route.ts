import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { Student, FeeRecord, ApiResponse } from '@/types';
import { PAYMENT_METHODS } from '@/lib/constants';

function calculateStatus(nextDueDate: Date): 'active' | 'overdue' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);
  return today > dueDate ? 'overdue' : 'active';
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDefaultFeePaidTillDate(joiningDate: Date, isInitialFeePaid: boolean) {
  if (!isInitialFeePaid) {
    return addDays(joiningDate, -1);
  }

  const paidTillDate = new Date(joiningDate);
  paidTillDate.setMonth(paidTillDate.getMonth() + 1);
  paidTillDate.setDate(paidTillDate.getDate() - 1);
  return paidTillDate;
}

function getCoveredMonths(startDate: Date, paidTillDate: Date) {
  const months: { month: number; year: number }[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(paidTillDate.getFullYear(), paidTillDate.getMonth(), 1);

  while (cursor <= end) {
    months.push({ month: cursor.getMonth(), year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

// GET - List all students with optional search/filter
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
    const studentsCollection = db.collection('students');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await studentsCollection.find(query).toArray();

    const enrichedStudents = students
      .map((student: any) => ({
        ...student,
        status: calculateStatus(student.nextDueDate),
      }))
      .filter((student: any) => !status || status === 'all' || student.status === status);

    return NextResponse.json(
      {
        success: true,
        data: enrichedStudents,
        message: 'Students fetched successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST - Create new student
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
    const {
      name,
      phone,
      joiningDate,
      monthlyFee,
      seatNumber,
      parentPhone,
      aadharNumber,
      photoUrl,
      admittedBy,
      feePaidTillDate,
      initialFeeStatus = 'paid',
      paymentMethod = 'cash',
    } = body;

    if (!name || !phone || !monthlyFee) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const studentsCollection = db.collection('students');
    const paymentsCollection = db.collection('payments');
    const feeRecordsCollection = db.collection('feeRecords');

    // Check for duplicate phone
    const existingStudent = await studentsCollection.findOne({ phone });
    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: 'Phone number already exists' } as ApiResponse,
        { status: 400 }
      );
    }

    const joining = new Date(joiningDate || new Date());
    const monthlyFeeAmount = parseFloat(monthlyFee);
    const normalizedAadharNumber = String(aadharNumber || '').replace(/\s/g, '');
    const hasManualPaidTillDate = Boolean(feePaidTillDate);
    const isInitialFeePaid = initialFeeStatus === 'paid' || hasManualPaidTillDate;
    if (normalizedAadharNumber && !/^\d{12}$/.test(normalizedAadharNumber)) {
      return NextResponse.json(
        { success: false, message: 'Aadhaar number must be 12 digits' } as ApiResponse,
        { status: 400 }
      );
    }

    if (isInitialFeePaid && !PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment method' } as ApiResponse,
        { status: 400 }
      );
    }

    const paidTillDate = feePaidTillDate
      ? new Date(feePaidTillDate)
      : getDefaultFeePaidTillDate(joining, isInitialFeePaid);
    paidTillDate.setHours(0, 0, 0, 0);

    const nextDueDate = addDays(paidTillDate, 1);
    const coveredMonths =
      isInitialFeePaid && paidTillDate >= joining
        ? hasManualPaidTillDate
          ? getCoveredMonths(joining, paidTillDate)
          : [{ month: joining.getMonth(), year: joining.getFullYear() }]
        : [];
    const initialPaymentAmount = coveredMonths.length * monthlyFeeAmount;

    const newStudent = {
      name,
      phone,
      joiningDate: joining,
      feePaidTillDate: paidTillDate,
      nextDueDate,
      monthlyFee: monthlyFeeAmount,
      seatNumber: seatNumber ? parseInt(seatNumber) : null,
      parentPhone: parentPhone || '',
      aadharNumber: normalizedAadharNumber,
      photoUrl: photoUrl || '',
      admittedBy: admittedBy || '',
      status: 'active' as const,
      paidMonths: coveredMonths.map(({ month, year }) => ({ month, year, paidDate: joining })),
      totalFeesCollected: initialPaymentAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await studentsCollection.insertOne(newStudent);
    const studentId = result.insertedId.toString();

    if (coveredMonths.length > 0) {
      const payment = await paymentsCollection.insertOne({
        studentId,
        amount: initialPaymentAmount,
        paymentDate: joining,
        paymentMethod,
        notes: `Initial fee paid through ${paidTillDate.toLocaleDateString('en-IN')}`,
        monthsCovered: coveredMonths,
        createdAt: new Date(),
      });

      const paymentId = payment.insertedId.toString();

      for (const { month, year } of coveredMonths) {
        const dueDate = new Date(year, month + 1, 0);
        const feeRecord: FeeRecord = {
          studentId,
          month,
          year,
          amount: monthlyFeeAmount,
          status: 'paid',
          paymentId,
          dueDate,
          paidDate: joining,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await feeRecordsCollection.insertOne(feeRecord);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { _id: result.insertedId, ...newStudent },
        message: isInitialFeePaid
          ? 'Student created and initial payment recorded'
          : 'Student created with pending fee',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
