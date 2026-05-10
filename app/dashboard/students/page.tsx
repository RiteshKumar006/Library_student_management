'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Student, Payment, ApiResponse } from '@/types';
import { StudentTable } from '@/components/dashboard/student-table';
import { StudentForm } from '@/components/dashboard/student-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CalendarDays, CheckCircle2, CreditCard, Phone, Plus, Search, UserRound, Users, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isPaymentHistoryLoading, setIsPaymentHistoryLoading] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, statusFilter]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'all') query.append('status', statusFilter);

      const response = await fetch(`/api/students?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        const fetchedStudents = Array.isArray(data.data) ? data.data : data.data?.students || [];
        setStudents(fetchedStudents);
        setError('');
        return fetchedStudents as Student[];
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      console.error('[v0] Students fetch error:', err);
      setError('An error occurred while loading students');
    } finally {
      setIsLoading(false);
    }

    return [] as Student[];
  };

  const handleAddStudent = async (data: any) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as ApiResponse;

      if (response.ok) {
        setShowForm(false);
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to add student');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateStudent = async (data: Partial<Student>) => {
    if (!editingStudent?._id) return;

    try {
      const response = await fetch(`/api/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as ApiResponse;

      if (response.ok) {
        setEditingStudent(undefined);
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to update student');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    setPaymentHistory([]);

    if (!student._id) return;

    try {
      setIsPaymentHistoryLoading(true);
      const response = await fetch(`/api/payments/${student._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        setPaymentHistory(data.data?.payments || []);
      }
    } catch (err) {
      console.error('[v0] Payment history fetch error:', err);
    } finally {
      setIsPaymentHistoryLoading(false);
    }
  };

  const fetchPaymentHistory = async (studentId: string) => {
    try {
      setIsPaymentHistoryLoading(true);
      const response = await fetch(`/api/payments/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        const payments = data.data?.payments || [];
        setPaymentHistory(payments);
        return payments as Payment[];
      }
    } catch (err) {
      console.error('[v0] Payment history fetch error:', err);
    } finally {
      setIsPaymentHistoryLoading(false);
    }

    return [] as Payment[];
  };

  const handleMarkCurrentMonthPaid = async (student: Student) => {
    if (!student._id) return;

    try {
      setIsMarkingPaid(true);
      setError('');

      const today = new Date();
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student._id,
          amount: student.monthlyFee,
          paymentDate: today.toISOString().split('T')[0],
          paymentMethod: 'cash',
          notes: 'Current month fee marked paid',
          monthsCovered: [{ month: today.getMonth(), year: today.getFullYear() }],
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark fee as paid');
      }

      await fetchPaymentHistory(student._id);
      const fetchedStudents = await fetchStudents();
      const updatedStudent = fetchedStudents.find((item) => item._id === student._id);
      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark fee as paid');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchStudents();
      } else {
        setError('Failed to delete student');
      }
    } catch (err) {
      console.error('[v0] Delete error:', err);
      setError('An error occurred while deleting student');
    }
  };

  // Calculate statistics
  const activeStudents = students.filter(s => s.status === 'active').length;
  const overdueStudents = students.filter(s => s.status === 'overdue').length;
  const totalFeesCollected = students.reduce((sum, s) => sum + (s.totalFeesCollected || 0), 0);

  if (editingStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
        </div>

        <StudentForm
          student={editingStudent}
          onSubmit={handleUpdateStudent}
          onCancel={() => {
            setShowForm(false);
            setEditingStudent(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">Manage all library students</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus size={18} />
          Add Student
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Students" 
          value={students.length} 
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard 
          title="Active Students" 
          value={activeStudents} 
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard 
          title="Overdue Students" 
          value={overdueStudents} 
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <SummaryCard 
          title="Total Collected" 
          value={`₹${totalFeesCollected.toLocaleString('en-IN')}`} 
          icon={<CreditCard className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl" showCloseButton={false}>
          <StudentForm
            onSubmit={handleAddStudent}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStudent(null);
            setPaymentHistory([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {selectedStudent && (
            <StudentDetails
              student={selectedStudent}
              payments={paymentHistory}
              isPaymentHistoryLoading={isPaymentHistoryLoading}
              isMarkingPaid={isMarkingPaid}
              onMarkCurrentMonthPaid={() => handleMarkCurrentMonthPaid(selectedStudent)}
              onEdit={() => {
                setEditingStudent(selectedStudent);
                setSelectedStudent(null);
                setPaymentHistory([]);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
            >
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Directory</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {students.length > 0 ? `${students.length} student${students.length !== 1 ? 's' : ''} found` : 'No students'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <StudentTable
            students={students}
            onView={handleViewStudent}
            onEdit={(student) => setEditingStudent(student)}
            onDelete={handleDeleteStudent}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'border-l-blue-600 bg-blue-50',
    green: 'border-l-green-600 bg-green-50',
    red: 'border-l-red-600 bg-red-50',
    purple: 'border-l-purple-600 bg-purple-50',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <Card className={`border-l-4 ${colorClasses[color]}`}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentDetails({
  student,
  payments,
  isPaymentHistoryLoading,
  isMarkingPaid,
  onMarkCurrentMonthPaid,
  onEdit,
}: {
  student: Student;
  payments: Payment[];
  isPaymentHistoryLoading: boolean;
  isMarkingPaid: boolean;
  onMarkCurrentMonthPaid: () => void;
  onEdit: () => void;
}) {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const hasCurrentMonthPayment = payments.some((payment) => isCurrentMonth(payment.paymentDate));
  const statusClasses =
    student.status === 'overdue'
      ? 'bg-red-100 text-red-700'
      : student.status === 'active'
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-700';

  // Calculate days until due
  const feePaidTillDate =
    student.feePaidTillDate ||
    new Date(new Date(student.nextDueDate).getTime() - 24 * 60 * 60 * 1000);
  const daysUntilDue = calculateDaysUntilDue(student.nextDueDate);
  const daysClass = daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Student Details</DialogTitle>
      </DialogHeader>

      {/* Header Card */}
      <div className="flex flex-col gap-5 rounded-lg border p-4 sm:flex-row sm:items-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-blue-200 bg-white shadow-sm">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-10 w-10 text-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses}`}>
              {student.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-md">
              <Phone size={16} className="text-blue-600" />
              {student.phone}
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-md">
              <UserRound size={16} className="text-blue-600" />
              Seat {student.seatNumber}
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-md text-xs">
              Admitted by <span className="font-medium">{student.admittedBy || 'N/A'}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={onMarkCurrentMonthPaid}
            disabled={isMarkingPaid || isPaymentHistoryLoading || hasCurrentMonthPayment}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 size={16} />
            {isMarkingPaid
              ? 'Marking...'
              : hasCurrentMonthPayment
                ? 'Paid'
                : 'Mark Paid'}
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard 
          title="Monthly Fee" 
          value={`₹${student.monthlyFee}`} 
          icon={<CreditCard size={18} />}
          color="blue"
        />
        <MetricCard
          title="Paid Till"
          value={new Date(feePaidTillDate).toLocaleDateString('en-IN')}
          subtitle={`${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} ${daysUntilDue < 0 ? 'overdue' : 'left'}`}
          icon={<CalendarDays size={18} />}
          color={daysUntilDue < 0 ? 'red' : daysUntilDue <= 3 ? 'yellow' : 'green'}
        />
        <MetricCard
          title="Total Paid"
          value={`₹${totalPaid.toLocaleString('en-IN')}`}
          subtitle={`${payments.length} payment${payments.length !== 1 ? 's' : ''}`}
          icon={<CreditCard size={18} />}
          color="green"
        />
        <MetricCard
          title="Fees Collected"
          value={`₹${(student.totalFeesCollected || 0).toLocaleString('en-IN')}`}
          subtitle={`${student.paidMonths?.length || 0} month${(student.paidMonths?.length || 0) !== 1 ? 's' : ''} covered`}
          icon={<TrendingUp size={18} />}
          color="purple"
        />
      </div>

      {/* Details & History Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="Full Name" value={student.name} />
              <InfoRow label="Phone" value={student.phone} />
              <InfoRow label="Parent Phone" value={student.parentPhone || 'Not added'} />
              <InfoRow label="Aadhaar" value={student.aadharNumber || 'Not added'} />
              <InfoRow label="Joining Date" value={new Date(student.joiningDate).toLocaleDateString('en-IN')} />
              <InfoRow label="Fees Paid Till" value={new Date(feePaidTillDate).toLocaleDateString('en-IN')} />
              <InfoRow label="Monthly Fee" value={`₹${student.monthlyFee}`} />
            </div>
          </CardContent>
        </Card>

        {/* Fee Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-700 mt-1">₹{(student.totalFeesCollected || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Months Covered</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{student.paidMonths?.length || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Payment Transactions</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isPaymentHistoryLoading ? (
            <div className="py-6 text-center">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-gray-600">No payments recorded</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment._id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-600">{new Date(payment.paymentDate).toLocaleDateString('en-IN')} • {payment.paymentMethod.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  {payment.notes && <p className="text-sm text-gray-600 sm:max-w-xs sm:text-right italic">{payment.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  color 
}: { 
  title: string; 
  value: string;
  subtitle?: string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-gray-50 px-3 py-2">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function isCurrentMonth(date: Date | string) {
  const paymentDate = new Date(date);
  const today = new Date();

  return (
    paymentDate.getFullYear() === today.getFullYear() &&
    paymentDate.getMonth() === today.getMonth()
  );
}

function calculateDaysUntilDue(dueDate: Date | string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
