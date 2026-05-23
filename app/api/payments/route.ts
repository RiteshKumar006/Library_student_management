import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { Payment, FeeRecord, ApiResponse } from '@/types';
import { ObjectId } from 'mongodb';
import { PAYMENT_METHODS } from '@/lib/constants';
import {
  addDays,
  getCoveredBillingCycles,
  getNextDueDate,
  getPaidTillDateForMonths,
  toDateOnly,
} from '@/lib/fee-calculation';

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
    const { studentId, amount, paymentDate, paymentMethod, notes, feePaidTillDate } = body;

    if (!studentId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid student ID' } as ApiResponse,
        { status: 400 }
      );
    }

    const paymentAmount = parseFloat(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount must be greater than 0' } as ApiResponse,
        { status: 400 }
      );
    }

    const paymentDateObj = toDateOnly(paymentDate);
    if (Number.isNaN(paymentDateObj.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment date' } as ApiResponse,
        { status: 400 }
      );
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment method' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection('payments');
    const studentsCollection = db.collection('students');
    const feeRecordsCollection = db.collection('feeRecords');

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

    const currentPaidTillDate = student.feePaidTillDate
      ? toDateOnly(student.feePaidTillDate)
      : addDays(toDateOnly(student.nextDueDate), -1);
    const paidTillDate = feePaidTillDate
      ? toDateOnly(feePaidTillDate)
      : getPaidTillDateForMonths(addDays(currentPaidTillDate, 1), 1);

    if (Number.isNaN(paidTillDate.getTime()) || paidTillDate <= currentPaidTillDate) {
      return NextResponse.json(
        { success: false, message: 'Fees paid till date must cover at least one unpaid month' } as ApiResponse,
        { status: 400 }
      );
    }

    const coveredCycles = getCoveredBillingCycles(addDays(currentPaidTillDate, 1), paidTillDate);
    if (coveredCycles.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Fees paid till date must cover at least one full billing month' } as ApiResponse,
        { status: 400 }
      );
    }

    const expectedAmount = coveredCycles.length * student.monthlyFee;
    if (Math.abs(paymentAmount - expectedAmount) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          message: `Amount must be Rs. ${expectedAmount} for ${coveredCycles.length} month${coveredCycles.length === 1 ? '' : 's'}`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    const monthsCovered = coveredCycles.map(({ month, year }) => ({ month, year }));
    const newPayment: Payment = {
      studentId,
      amount: paymentAmount,
      paymentDate: paymentDateObj,
      paymentMethod,
      notes: notes || '',
      monthsCovered,
      createdAt: new Date(),
    };

    const result = await paymentsCollection.insertOne(newPayment as any);
    const paymentId = result.insertedId.toString();

    // Create or update fee records for covered months
    for (const { month, year, dueDate } of coveredCycles) {
      const existingRecord = await feeRecordsCollection.findOne({
        studentId,
        month,
        year,
      });

      if (existingRecord) {
        await feeRecordsCollection.updateOne(
          { _id: existingRecord._id },
          {
            $set: {
              amount: student.monthlyFee,
              status: 'paid',
              paymentId,
              dueDate,
              paidDate: paymentDateObj,
              updatedAt: new Date(),
            },
          }
        );
      } else {
        const feeRecord: FeeRecord = {
          studentId,
          month,
          year,
          amount: student.monthlyFee,
          status: 'paid',
          paymentId,
          dueDate,
          paidDate: paymentDateObj,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await feeRecordsCollection.insertOne(feeRecord as any);
      }
    }

    const nextDueDate = getNextDueDate(paidTillDate);
    const paidMonthsToAdd = monthsCovered.map((m: any) => ({
      month: m.month,
      year: m.year,
      paidDate: paymentDateObj,
    }));

    const existingPaidMonths = student.paidMonths || [];
    const existingTotal = student.totalFeesCollected || 0;
    const mergedPaidMonths = [...existingPaidMonths];
    for (const newMonth of paidMonthsToAdd) {
      const exists = mergedPaidMonths.some(
        (m: any) => m.month === newMonth.month && m.year === newMonth.year
      );
      if (!exists) {
        mergedPaidMonths.push(newMonth);
      }
    }

    await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      {
        $set: {
          feePaidTillDate: paidTillDate,
          nextDueDate,
          paidMonths: mergedPaidMonths,
          totalFeesCollected: existingTotal + paymentAmount,
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
