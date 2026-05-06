'use client';

import { useEffect, useState } from 'react';
import { Seat } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, User, Users, Armchair, TrendingUp, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied'>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const totalSeats = seats.length || 50;
  const occupiedSeats = seats.filter((seat) => !seat.isAvailable);

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

  // Filter seats based on search and status
  const filteredSeats = seats.filter((seat) => {
    const matchesSearch = seat.seatNumber.toString().includes(searchQuery) ||
      (seat.assignedStudent?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'available' && seat.isAvailable) ||
      (filterStatus === 'occupied' && !seat.isAvailable);
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading seat map...</p>
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
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Seat Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            View seat availability and student assignments
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-sm border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400">
          <Armchair className="w-3 h-3 mr-1" />
          Total: {totalSeats} seats
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{availableCount}</div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
              {Math.round((availableCount / totalSeats) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Occupied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{occupiedSeats.length}</div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
              {Math.round((occupiedSeats.length / totalSeats) * 100)}% occupancy
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {Math.round((occupiedSeats.length / totalSeats) * 100)}%
            </div>
            <div className="mt-2 h-1.5 w-full bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(occupiedSeats.length / totalSeats) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{occupiedSeats.length}</div>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
              Currently seated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search seat number or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'available', 'occupied'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                    filterStatus === filter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seat Grid */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Armchair className="w-5 h-5 text-blue-600" />
            Seat Layout
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Click on any seat to view details
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
            {filteredSeats.map((seat) => (
              <button
                key={seat.seatNumber}
                className={`
                  min-h-20 flex flex-col items-center justify-center gap-1.5 rounded-xl p-2.5 text-center font-medium transition-all
                  border-2
                  ${
                    seat.isAvailable
                      ? 'bg-green-50/80 dark:bg-green-950/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/20 hover:border-green-400 dark:hover:border-green-600 hover:scale-[1.03]'
                      : 'bg-blue-50/80 dark:bg-blue-950/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600 hover:scale-[1.03]'
                  }
                `}
                title={
                  seat.isAvailable
                    ? `Seat ${seat.seatNumber} - Available`
                    : `Seat ${seat.seatNumber} - Occupied by ${seat.assignedStudent?.name || 'student'}`
                }
              >
                <span className="text-sm font-bold leading-none">Seat</span>
                <span className="text-lg font-black">{seat.seatNumber}</span>
                {seat.isAvailable ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-400 text-green-600 dark:text-green-400 dark:border-green-600">
                    Free
                  </Badge>
                ) : (
                  <>
                    <User size={13} className="mt-0.5" />
                    <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
                      {seat.assignedStudent?.name || 'Occupied'}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>

          {filteredSeats.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <Armchair className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No seats match your filters</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-700 rounded-md" />
              <span className="text-gray-600 dark:text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-700 rounded-md" />
              <span className="text-gray-600 dark:text-gray-400">Occupied</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occupied Assignments */}
      {occupiedSeats.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4.5 h-4.5 text-blue-600" />
              Occupied Seat Assignments ({occupiedSeats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {occupiedSeats.map((seat) => (
                <div
                  key={`assignment-${seat.seatNumber}`}
                  className="group rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 p-3 hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                      Seat {seat.seatNumber}
                    </p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-none">
                      <User className="w-2.5 h-2.5 mr-0.5" />
                      Occupied
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {seat.assignedStudent?.name || 'Student assigned'}
                  </p>
                  {seat.assignedStudent?.phone && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                      {seat.assignedStudent.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 shadow-sm">
        <CardHeader className="pb-2.5">
          <CardTitle className="text-blue-900 dark:text-blue-300 text-base">About Seat Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p className="leading-relaxed">
            Seats are automatically managed when you add, edit, or delete students. Each student gets a unique seat,
            and no seat can be assigned to multiple students. Removing a student immediately frees their seat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
