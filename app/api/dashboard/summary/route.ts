import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { DashboardSummary, ApiResponse } from '@/types';
import { UPCOMING_DUE_DAYS } from '@/lib/constants';

const demoSummary: DashboardSummary = {
  totalStudents: 32,
  activeStudents: 28,
  pendingFees: 5,
  overdueStudents: 2,
  upcomingDue: 3,
  totalCollection: 156800,
  monthlyCollection: 12400,
  availableSeats: 18,
  totalSeats: 50,
};

// GET - Dashboard summary
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    try {
      const db = await getDatabase();
      const studentsCollection = db.collection('students');
      const paymentsCollection = db.collection('payments');
      const seatsCollection = db.collection('seats');

      // Total students
      const totalStudents = await studentsCollection.countDocuments();

      // Active students
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeStudents = await studentsCollection.countDocuments({
        status: 'active',
      });

      // Overdue students
      const overdueStudents = await studentsCollection.countDocuments({
        nextDueDate: { $lt: today },
      });

      // Upcoming due (within 3 days)
      const upcomingDate = new Date(today);
      upcomingDate.setDate(upcomingDate.getDate() + UPCOMING_DUE_DAYS);

      const upcomingDue = await studentsCollection.countDocuments({
        nextDueDate: { $gte: today, $lte: upcomingDate },
      });

      // Pending fees (overdue + upcoming)
      const pendingFees = overdueStudents + upcomingDue;

      // Total collection (all time)
      const allPayments = await paymentsCollection.find({}).toArray();
      const totalCollection = allPayments.reduce((sum, p: any) => sum + p.amount, 0);

      // Monthly collection (current month)
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      const monthlyPayments = await paymentsCollection
        .find({
          paymentDate: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
        })
        .toArray();

      const monthlyCollection = monthlyPayments.reduce((sum, p: any) => sum + p.amount, 0);

      // Available seats - calculate based on which students are assigned to seats
      const seats = await seatsCollection.find({}).toArray();
      const studentsWithSeats = await studentsCollection
        .find({ seatNumber: { $type: 'number' } })
        .toArray();

      // Create a map of occupied seat numbers
      const occupiedSeats = new Set(
        studentsWithSeats.map((s: any) => s.seatNumber)
      );

      // Count available seats (those not occupied by any student)
      const availableSeats = seats.filter((s: any) => !occupiedSeats.has(s.seatNumber)).length;
      const totalSeats = seats.length;

      const summary: DashboardSummary = {
        totalStudents,
        activeStudents,
        pendingFees,
        overdueStudents,
        upcomingDue,
        totalCollection,
        monthlyCollection,
        availableSeats,
        totalSeats,
      };

      return NextResponse.json(
        { success: true, data: summary, message: 'Dashboard summary fetched successfully' } as ApiResponse,
        { status: 200 }
      );
    } catch (dbError) {
      console.log('Database unavailable, returning demo data');
      return NextResponse.json(
        { success: true, data: demoSummary, message: 'Dashboard summary fetched successfully (demo mode)' } as ApiResponse,
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
