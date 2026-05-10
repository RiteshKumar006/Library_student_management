import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { Payment, FeeRecord, ApiResponse } from '@/types';
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
    const { studentId, amount, paymentDate, paymentMethod, notes, monthsCovered, feePaidTillDate } = body;

    if (!studentId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
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

    const newPayment: Payment = {
      studentId,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod,
      notes: notes || '',
      monthsCovered: monthsCovered || [],
      createdAt: new Date(),
    };

    const result = await paymentsCollection.insertOne(newPayment);
    const paymentId = result.insertedId.toString();

    // Create or update fee records for covered months
    if (monthsCovered && monthsCovered.length > 0) {
      for (const { month, year } of monthsCovered) {
        const dueDate = new Date(year, month + 1, 0); // Last day of the month

        // Check if fee record already exists
        const existingRecord = await feeRecordsCollection.findOne({
          studentId,
          month,
          year,
        });

        if (existingRecord) {
          // Update existing record
          await feeRecordsCollection.updateOne(
            { _id: existingRecord._id },
            {
              $set: {
                status: 'paid',
                paymentId,
                paidDate: new Date(paymentDate),
                updatedAt: new Date(),
              },
            }
          );
        } else {
          // Create new fee record
          const feeRecord: FeeRecord = {
            studentId,
            month,
            year,
            amount: student.monthlyFee,
            status: 'paid',
            paymentId,
            dueDate,
            paidDate: new Date(paymentDate),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await feeRecordsCollection.insertOne(feeRecord);
        }
      }

      // Update student's next due date to the month after the last paid month
      const lastPaidMonth = monthsCovered.reduce((latest, current) => {
        const currentDate = new Date(current.year, current.month);
        const latestDate = new Date(latest.year, latest.month);
        return currentDate > latestDate ? current : latest;
      });

      const paidTillDate = feePaidTillDate
        ? new Date(feePaidTillDate)
        : new Date(lastPaidMonth.year, lastPaidMonth.month + 1, 0);
      paidTillDate.setHours(0, 0, 0, 0);
      const nextDueDate = new Date(paidTillDate);
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      const paymentDateObj = new Date(paymentDate);

      // Prepare paid months array to add to student record
      const paidMonthsToAdd = monthsCovered.map((m: any) => ({
        month: m.month,
        year: m.year,
        paidDate: paymentDateObj,
      }));

      // Get current student to merge paid months
      const currentStudent = await studentsCollection.findOne(
        { _id: new ObjectId(studentId) },
        { projection: { paidMonths: 1, totalFeesCollected: 1 } }
      );

      const existingPaidMonths = currentStudent?.paidMonths || [];
      const existingTotal = currentStudent?.totalFeesCollected || 0;

      // Merge paid months (avoid duplicates)
      const mergedPaidMonths = [...existingPaidMonths];
      for (const newMonth of paidMonthsToAdd) {
        const exists = mergedPaidMonths.some(
          (m: any) => m.month === newMonth.month && m.year === newMonth.year
        );
        if (!exists) {
          mergedPaidMonths.push(newMonth);
        }
      }

      // Update student record with paid months and total fees collected
      await studentsCollection.updateOne(
        { _id: new ObjectId(studentId) },
        {
          $set: {
            feePaidTillDate: paidTillDate,
            nextDueDate,
            paidMonths: mergedPaidMonths,
            totalFeesCollected: existingTotal + parseFloat(amount),
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Legacy behavior: treat the payment as covering one month from today.
      const feePaidTillDate = new Date();
      feePaidTillDate.setMonth(feePaidTillDate.getMonth() + 1);
      const nextDueDate = new Date(feePaidTillDate);
      nextDueDate.setDate(nextDueDate.getDate() + 1);

      const currentStudent = await studentsCollection.findOne(
        { _id: new ObjectId(studentId) },
        { projection: { totalFeesCollected: 1 } }
      );

      const existingTotal = currentStudent?.totalFeesCollected || 0;

      await studentsCollection.updateOne(
        { _id: new ObjectId(studentId) },
        {
          $set: {
            feePaidTillDate,
            nextDueDate,
            totalFeesCollected: existingTotal + parseFloat(amount),
            updatedAt: new Date(),
          },
        }
      );
    }

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
