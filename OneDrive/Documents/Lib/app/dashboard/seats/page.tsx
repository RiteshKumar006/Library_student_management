'use client';

import { useEffect, useState } from 'react';
import { Seat } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User } from 'lucide-react';

interface SeatWithStudent extends Seat {
  assignedStudent?: {
    _id: string;
    name: string;
    phone: string;
    status?: string;
  } | null;
}

export default function SeatsPage() {
  const [seats, setSeats] = useState<SeatWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const totalSeats = seats.length || 50;
  const occupiedSeats = seats.filter((seat) => !seat.isAvailable);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSeats(data.data?.seats || []);
        setAvailableCount(data.data?.availableCount || 0);
      }
    } catch (err) {
      console.error('[v0] Seats fetch error:', err);
      setError('Failed to load seats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading seats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seat Management</h1>
        <p className="text-gray-600 mt-2">View seat availability and assignments</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Available Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Occupied Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{occupiedSeats.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round((occupiedSeats.length / totalSeats) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seat Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {seats.map((seat) => (
              <div
                key={seat.seatNumber}
                className={`
                  min-h-24 flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-center font-medium transition-all
                  ${
                    seat.isAvailable
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                      : 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  }
                `}
                title={
                  seat.isAvailable
                    ? `Seat ${seat.seatNumber} - Available`
                    : `Seat ${seat.seatNumber} - Occupied by ${seat.assignedStudent?.name || 'student'}`
                }
              >
                <span className="text-base font-bold">Seat {seat.seatNumber}</span>
                {seat.isAvailable ? (
                  <span className="text-xs font-medium">Available</span>
                ) : (
                  <>
                    <User size={15} className="mt-1" />
                    <span className="max-w-full truncate text-xs font-semibold">
                      {seat.assignedStudent?.name || 'Occupied'}
                    </span>
                    {seat.assignedStudent?.phone && (
                      <span className="max-w-full truncate text-[11px] font-normal text-blue-600">
                        {seat.assignedStudent.phone}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-sm text-gray-700">Occupied</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {occupiedSeats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Occupied Seat Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {occupiedSeats.map((seat) => (
                <div
                  key={`assignment-${seat.seatNumber}`}
                  className="rounded-md border border-blue-200 bg-blue-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-blue-900">Seat {seat.seatNumber}</p>
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      Occupied
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-gray-900">
                    {seat.assignedStudent?.name || 'Student assigned'}
                  </p>
                  {seat.assignedStudent?.phone && (
                    <p className="text-sm text-gray-600">{seat.assignedStudent.phone}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Seat Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <p>
            Seats are automatically managed when you add, edit, or delete students. Each student
            is assigned a unique seat number, and a seat cannot be assigned to multiple students
            simultaneously. When a student is removed, their seat is immediately available for
            reassignment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
