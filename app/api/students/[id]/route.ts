import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { ObjectId } from 'mongodb';

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

    if (body.seatNumber) {
      updateData.seatNumber = parseInt(body.seatNumber);
    }

    if (body.monthlyFee) {
      updateData.monthlyFee = parseFloat(body.monthlyFee);
    }

    if (body.joiningDate) {
      updateData.joiningDate = new Date(body.joiningDate);
    }

    if (
      body.joiningDate &&
      new Date(body.joiningDate).toDateString() !== new Date(currentStudent.joiningDate).toDateString()
    ) {
      const joiningDateObj = new Date(body.joiningDate);
      const nextDueDate = new Date(joiningDateObj);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      updateData.nextDueDate = nextDueDate;
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
