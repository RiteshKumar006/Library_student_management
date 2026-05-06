'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Users, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, Activity, CreditCard, Calendar, Clock, ReceiptText, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardSummary } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RecentPayment {
  id: number;
  student: string;
  amount: number;
  method: string;
  date: string;
  status: string;
}

interface RecentEnrollment {
  id: number;
  name: string;
  phone: string;
  seat: string;
  date: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Demo chart data - in real app would come from API
  const monthlyTrendData = [
    { name: 'Jan', collection: 12500, expenses: 8200 },
    { name: 'Feb', collection: 15800, expenses: 9100 },
    { name: 'Mar', collection: 14200, expenses: 7800 },
    { name: 'Apr', collection: 18900, expenses: 8500 },
    { name: 'May', collection: 12400, expenses: 7200 },
    { name: 'Jun', collection: 0, expenses: 0 },
  ];

  const studentStatusData = [
    { name: 'Active', value: summary?.activeStudents || 28, color: '#22c55e' },
    { name: 'Overdue', value: summary?.overdueStudents || 2, color: '#ef4444' },
    { name: 'Inactive', value: (summary?.totalStudents || 32) - (summary?.activeStudents || 28) - (summary?.overdueStudents || 2), color: '#94a3b8' },
  ];

  const recentPayments: RecentPayment[] = [
    { id: 1, student: 'Aarav Sharma', amount: 2500, method: 'UPI', date: '2 hours ago', status: 'completed' },
    { id: 2, student: 'Priya Patel', amount: 5000, method: 'Cash', date: '5 hours ago', status: 'completed' },
    { id: 3, student: 'Rahul Verma', amount: 2500, method: 'Online', date: '1 day ago', status: 'completed' },
  ];

  const recentEnrollments: RecentEnrollment[] = [
    { id: 1, name: 'Neha Gupta', phone: '+91 9876543210', seat: 'A-12', date: 'Today' },
    { id: 2, name: 'Krishna Yadav', phone: '+91 8765432109', seat: 'B-05', date: 'Yesterday' },
  ];

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
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <Link href="/dashboard/students">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Student
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-2 hover:bg-gray-50 dark:hover:bg-gray-900">
            <Link href="/dashboard/fees">
              <ReceiptText className="w-4 h-4 mr-2" />
              Record Payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Alerts */}
      {summary && (summary.overdueStudents > 0 || summary.upcomingDue > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.overdueStudents > 0 && (
            <Alert className="border-red-500/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 backdrop-blur-sm animate-pulse">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-sm font-medium">
                <span className="font-bold">{summary.overdueStudents}</span> student{summary.overdueStudents !== 1 ? 's' : ''} have overdue fees requiring immediate attention.
              </AlertDescription>
            </Alert>
          )}
          {summary.upcomingDue > 0 && (
            <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 backdrop-blur-sm">
              <Calendar className="h-5 w-5" />
              <AlertDescription className="text-sm font-medium">
                <span className="font-bold">{summary.upcomingDue}</span> student{summary.upcomingDue !== 1 ? 's' : ''} {summary.upcomingDue === 1 ? 'has' : 'have'} upcoming due dates within 3 days.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* KPI Cards with Gradient & Hover Effects */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-100">Total Students</CardTitle>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{summary?.totalStudents}</div>
            <div className="mt-2 flex items-center gap-1 text-sm text-blue-100">
              <ArrowUpRight className="w-4 h-4 text-green-300" />
              <span className="font-semibold">{summary?.activeStudents}</span> active
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-purple-300 opacity-50" />
        </Card>

        {/* Overdue Fees Card */}
        <Card className={`group relative overflow-hidden border-0 ${summary?.overdueStudents ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/80">Overdue Fees</CardTitle>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                <AlertTriangle className={`w-5 h-5 ${summary?.overdueStudents ? 'text-white' : 'text-green-200'}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{summary?.overdueStudents}</div>
            <div className="mt-2 flex items-center gap-1 text-sm text-white/80">
              {summary?.overdueStudents ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-200" />
                  <span>Action required</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-200" />
                  <span>All clear</span>
                </>
              )}
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 to-transparent opacity-50" />
        </Card>

        {/* Monthly Collection Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-100">Monthly Collection</CardTitle>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">₹{summary?.monthlyCollection.toLocaleString()}</div>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-100">
              <TrendingUp className="w-4 h-4" />
              <span>This month</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-300 to-emerald-300 opacity-50" />
        </Card>

        {/* Available Seats Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-100">Available Seats</CardTitle>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{summary?.availableSeats}</div>
            <div className="mt-2 flex items-center gap-1 text-sm text-purple-100">
              <span>of {summary?.totalSeats} seats vacant</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 to-pink-300 opacity-50" />
        </Card>
      </div>

      {/* Enhanced Stats Grid with Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Stats Card */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="w-6 h-6 text-blue-600" />
              Quick Stats
            </CardTitle>
            <CardDescription>Key financial and operational metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/10 p-4">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Pending Fees</div>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{summary?.pendingFees}</div>
                <div className="mt-2 h-1 w-full bg-orange-200 dark:bg-orange-900/30 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min((summary?.pendingFees || 0) / (summary?.totalStudents || 1) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 p-4">
                <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Upcoming Due</div>
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{summary?.upcomingDue}</div>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">Within 3 days</div>
              </div>
              <div className="rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10 p-4">
                <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Collected</div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">₹{(summary?.totalCollection || 0).toLocaleString()}</div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">All time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seat Utilization Card with Donut Chart */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Seat Utilization
            </CardTitle>
            <CardDescription>Occupancy overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="w-1/2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Occupied</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {(summary?.totalSeats || 0) - (summary?.availableSeats || 0)}/{summary?.totalSeats || 0}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${((((summary?.totalSeats || 0) - (summary?.availableSeats || 0)) / (summary?.totalSeats || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {`${Math.round(((((summary?.totalSeats || 0) - (summary?.availableSeats || 0)) / (summary?.totalSeats || 1)) * 100))}% occupancy`}
                  </Badge>
                </div>
              </div>
              <div className="w-1/2 flex justify-center">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie
                      data={studentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {studentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Collection Trend */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-6 h-6 text-blue-600" />
              Monthly Collection Trend
            </CardTitle>
            <CardDescription>Collections vs expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" fontSize={12} stroke="#6b7280" />
                <YAxis fontSize={12} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                />
                <Line type="monotone" dataKey="collection" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} name="Collection" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} activeDot={{ r: 7 }} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Distribution */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Student Status Distribution
            </CardTitle>
            <CardDescription>Overview of student categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" fontSize={12} stroke="#6b7280" />
                <YAxis fontSize={12} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {studentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-green-600" />
              Recent Payments
            </CardTitle>
            <CardDescription>Latest fee transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{payment.student}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{payment.method} • {payment.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">₹{payment.amount.toLocaleString()}</div>
                    <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Recent Enrollments
            </CardTitle>
            <CardDescription>Newly admitted students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEnrollments.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {student.seat}
                    </Badge>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{student.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Summary */}
      <div className="rounded-xl border-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">LibraryHub Pro</h3>
            <p className="text-blue-100 text-sm">Total Revenue: <span className="font-bold text-2xl">₹{(summary?.totalCollection || 0).toLocaleString()}</span></p>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <div className="text-blue-100">Students</div>
              <div className="text-2xl font-bold">{summary?.totalStudents}</div>
            </div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div>
              <div className="text-blue-100">Occupancy</div>
              <div className="text-2xl font-bold">{Math.round((((summary?.totalSeats || 0) - (summary?.availableSeats || 0)) / (summary?.totalSeats || 1)) * 100)}%</div>
            </div>
            <Separator orientation="vertical" className="h-10 bg-white/20" />
            <div>
              <div className="text-blue-100">This Month</div>
              <div className="text-2xl font-bold">₹{(summary?.monthlyCollection || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
