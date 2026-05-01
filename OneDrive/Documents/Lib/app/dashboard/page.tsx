'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardSummary } from '@/types';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/dashboard/summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSummary(data.data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('[v0] Dashboard fetch error:', err);
        setError('An error occurred while loading dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your library overview.</p>
      </div>

      {summary && summary.overdueStudents > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {summary.overdueStudents} student{summary.overdueStudents !== 1 ? 's' : ''} have overdue fees.
            Please collect payment soon.
          </AlertDescription>
        </Alert>
      )}

      {summary && summary.upcomingDue > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {summary.upcomingDue} student{summary.upcomingDue !== 1 ? 's' : ''} {summary.upcomingDue === 1 ? 'has' : 'have'} upcoming due dates within 3 days.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary?.totalStudents}</div>
            <p className="text-xs text-green-600 mt-1">
              <span className="font-semibold">{summary?.activeStudents}</span> active
            </p>
          </CardContent>
        </Card>

        {/* Overdue Fees */}
        <Card className={`border-l-4 ${summary?.overdueStudents ? 'border-l-red-600' : 'border-l-green-600'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Overdue Fees</CardTitle>
              <AlertTriangle className={`w-4 h-4 ${summary?.overdueStudents ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary?.overdueStudents}</div>
            <p className={`text-xs mt-1 ${summary?.overdueStudents ? 'text-red-600' : 'text-green-600'}`}>
              {summary?.overdueStudents ? 'Action required' : 'No overdue fees'}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Collection */}
        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Collection</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{summary?.monthlyCollection.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Available Seats */}
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Available Seats</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary?.availableSeats}</div>
            <p className="text-xs text-gray-600 mt-1">Seats vacant</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Pending Fees</span>
                <span className="text-2xl font-bold text-orange-600">{summary?.pendingFees}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Upcoming Due (3 days)</span>
                <span className="text-2xl font-bold text-yellow-600">{summary?.upcomingDue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Collected</span>
                <span className="text-2xl font-bold text-green-600">₹{summary?.totalCollection.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seat Utilization</CardTitle>
            <CardDescription>Occupancy overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Occupied</span>
                  <span className="font-semibold">
                    {50 - (summary?.availableSeats || 0)}/50
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${((50 - (summary?.availableSeats || 0)) / 50) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 text-center">
                <p className="text-sm text-gray-600">
                  {`${Math.round((((50 - (summary?.availableSeats || 0)) / 50) * 100))}% utilization`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
