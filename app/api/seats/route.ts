import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { Seat, ApiResponse } from '@/types';
import { SEAT_RANGE } from '@/lib/constants';
import { availableShifts, normalizeShift } from '@/lib/shifts';

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
          { projection: { name: 1, phone: 1, seatNumber: 1, status: 1, shift: 1 } }
        )
        .toArray(),
    ]);

    // A seat can hold several students as long as their shifts don't overlap
    const studentsBySeat = new Map<number, any[]>();
    for (const student of assignedStudents as any[]) {
      const occupants = studentsBySeat.get(student.seatNumber) || [];
      occupants.push({
        _id: student._id.toString(),
        name: student.name,
        phone: student.phone,
        status: student.status,
        shift: normalizeShift(student.shift),
      });
      studentsBySeat.set(student.seatNumber, occupants);
    }

    const enrichedSeats = seats.map((seat: any) => {
      const occupants = studentsBySeat.get(seat.seatNumber) || [];
      const takenShifts = occupants.map((occupant) => occupant.shift);
      const openShifts = availableShifts(takenShifts).map((shift) => shift.value);

      return {
        ...seat,
        _id: seat._id.toString(),
        // isAvailable keeps its original meaning: nobody is on this seat at all
        isAvailable: occupants.length === 0,
        // partially booked = some shifts taken, but others still bookable
        isPartiallyBooked: occupants.length > 0 && openShifts.length > 0,
        isFullyBooked: openShifts.length === 0,
        occupants,
        takenShifts,
        openShifts,
        assignedStudentId: occupants[0]?._id || null,
        assignedStudent: occupants[0] || null,
      };
    });

    const availableCount = enrichedSeats.filter((seat) => seat.isAvailable).length;
    const partiallyBookedCount = enrichedSeats.filter((seat) => seat.isPartiallyBooked).length;

    return NextResponse.json(
      {
        success: true,
        data: { seats: enrichedSeats, availableCount, partiallyBookedCount, totalSeats: SEAT_RANGE },
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
