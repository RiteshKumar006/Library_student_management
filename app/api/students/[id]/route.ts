import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { ObjectId } from 'mongodb';
import {
  addDays,
  getCoveredBillingMonths,
  getNextDueDate,
  toDateOnly,
} from '@/lib/fee-calculation';
import { normalizeShift, suggestedShiftFee } from '@/lib/shifts';
import { findSeatShiftConflict } from '@/lib/seat-allocation';

function calculateStatus(nextDueDate: Date): 'active' | 'overdue' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);
  return today > dueDate ? 'overdue' : 'active';
}

function isValidStudentId(id: string) {
  return ObjectId.isValid(id);
}

// GET - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const studentsCollection = db.collection('students');

    if (!isValidStudentId(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid student ID' } as ApiResponse,
        { status: 400 }
      );
    }

    const student = await studentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...student, status: calculateStatus(student.nextDueDate) },
        message: 'Student fetched successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await request.json();
    const normalizedAadharNumber = String(body.aadharNumber || '').replace(/\s/g, '');

    if (normalizedAadharNumber && !/^\d{12}$/.test(normalizedAadharNumber)) {
      return NextResponse.json(
        { success: false, message: 'Aadhaar number must be 12 digits' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const studentsCollection = db.collection('students');

    if (!isValidStudentId(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid student ID' } as ApiResponse,
        { status: 400 }
      );
    }

    const currentStudent = await studentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!currentStudent) {
      return NextResponse.json(
        { success: false, message: 'Student not found' } as ApiResponse,
        { status: 404 }
      );
    }

    const updateData: any = {
      name: body.name,
      phone: body.phone,
      parentPhone: body.parentPhone || '',
      aadharNumber: normalizedAadharNumber,
      photoUrl: body.photoUrl || '',
      admittedBy: body.admittedBy || '',
      updatedAt: new Date(),
    };

    const nextShift = normalizeShift(body.shift ?? currentStudent.shift);
    const nextSeatNumber = body.seatNumber
      ? parseInt(body.seatNumber)
      : currentStudent.seatNumber;

    // Re-check sharing rules whenever the seat or the hours change
    if (nextSeatNumber) {
      const conflict = await findSeatShiftConflict(
        studentsCollection,
        nextSeatNumber,
        nextShift,
        id
      );
      if (conflict) {
        return NextResponse.json(
          { success: false, message: conflict } as ApiResponse,
          { status: 400 }
        );
      }
    }

    updateData.shift = nextShift;

    if (body.seatNumber) {
      updateData.seatNumber = parseInt(body.seatNumber);
    }

    // monthlyFee from the form is the full-day rate; part-time students are
    // billed their shift rate from here on. Past months keep the rate they were
    // charged at (fee records + payments are never repriced).
    if (body.monthlyFee || body.baseMonthlyFee || body.partTimeFee) {
      const baseFee = parseFloat(
        body.baseMonthlyFee ?? body.monthlyFee ?? currentStudent.baseMonthlyFee ?? currentStudent.monthlyFee
      );
      const partTimeFee = parseFloat(body.partTimeFee);
      const effectiveFee =
        nextShift !== 'full'
          ? Number.isFinite(partTimeFee) && partTimeFee > 0
            ? partTimeFee
            : suggestedShiftFee(baseFee, nextShift)
          : baseFee;

      if (Number.isFinite(baseFee) && baseFee > 0) {
        updateData.baseMonthlyFee = baseFee;
      }
      if (Number.isFinite(effectiveFee) && effectiveFee > 0) {
        updateData.monthlyFee = effectiveFee;
      }
    }

    if (body.joiningDate) {
      updateData.joiningDate = toDateOnly(body.joiningDate);
    }

    if (body.feePaidTillDate) {
      const feePaidTillDate = toDateOnly(body.feePaidTillDate);
      const joiningDate = updateData.joiningDate || toDateOnly(currentStudent.joiningDate);
      const monthlyFee = updateData.monthlyFee ?? currentStudent.monthlyFee;
      const coveredMonths =
        feePaidTillDate >= joiningDate ? getCoveredBillingMonths(joiningDate, feePaidTillDate) : [];

      // Each month keeps the amount it was actually billed at, so switching a
      // student between full-day and part-time never reprices their history.
      // The current rate applies only to months that were never billed before.
      const feeRecords = await db
        .collection('feeRecords')
        .find({ studentId: id })
        .toArray();

      updateData.feePaidTillDate = feePaidTillDate;
      updateData.nextDueDate = getNextDueDate(feePaidTillDate);
      updateData.paidMonths = coveredMonths.map(({ month, year }) => ({
        month,
        year,
        paidDate: currentStudent.joiningDate,
      }));
      updateData.totalFeesCollected = coveredMonths.reduce((sum, { month, year }) => {
        const billed = feeRecords.find(
          (record: any) => record.month === month && record.year === year
        );
        return sum + Number(billed ? billed.amount : monthlyFee);
      }, 0);
    } else if (
      body.joiningDate &&
      new Date(body.joiningDate).toDateString() !== new Date(currentStudent.joiningDate).toDateString()
    ) {
      const joiningDateObj = toDateOnly(body.joiningDate);
      updateData.feePaidTillDate = addDays(joiningDateObj, -1);
      updateData.nextDueDate = joiningDateObj;
      updateData.paidMonths = [];
      updateData.totalFeesCollected = 0;
    }

    const updatedStudent = await studentsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedStudent) {
      return NextResponse.json(
        { success: false, message: 'Student not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...updatedStudent, status: calculateStatus(updatedStudent.nextDueDate) },
        message: 'Student updated successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const studentsCollection = db.collection('students');

    if (!isValidStudentId(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid student ID' } as ApiResponse,
        { status: 400 }
      );
    }

    const student = await studentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' } as ApiResponse,
        { status: 404 }
      );
    }

    await studentsCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      { success: true, message: 'Student deleted successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
