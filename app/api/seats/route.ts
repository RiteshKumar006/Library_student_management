import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { Seat, ApiResponse } from '@/types';
import { SEAT_RANGE } from '@/lib/constants';

// GET - List all seats with availability
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
    const seatsCollection = db.collection('seats');
    const studentsCollection = db.collection('students');

    // Initialize seats if not exists
    const existingSeats = await seatsCollection.countDocuments();

    if (existingSeats === 0) {
      const initialSeats = Array.from({ length: SEAT_RANGE }, (_, i) => ({
        seatNumber: i + 1,
        isAvailable: true,
        assignedStudentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await seatsCollection.insertMany(initialSeats);
    }

    const [seats, assignedStudents] = await Promise.all([
      seatsCollection.find({}).sort({ seatNumber: 1 }).toArray(),
      studentsCollection
        .find(
          { seatNumber: { $type: 'number' } },
          { projection: { name: 1, phone: 1, seatNumber: 1, status: 1 } }
        )
        .toArray(),
    ]);

    const studentsBySeat = new Map(
      assignedStudents.map((student: any) => [
        student.seatNumber,
        {
          _id: student._id.toString(),
          name: student.name,
          phone: student.phone,
          status: student.status,
        },
      ])
    );

    const enrichedSeats = seats.map((seat: any) => {
      const assignedStudent = studentsBySeat.get(seat.seatNumber);

      return {
        ...seat,
        _id: seat._id.toString(),
        isAvailable: !assignedStudent,
        assignedStudentId: assignedStudent?._id || null,
        assignedStudent: assignedStudent || null,
      };
    });

    const availableCount = enrichedSeats.filter((seat) => seat.isAvailable).length;

    return NextResponse.json(
      {
        success: true,
        data: { seats: enrichedSeats, availableCount, totalSeats: SEAT_RANGE },
        message: 'Seats fetched successfully',
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
