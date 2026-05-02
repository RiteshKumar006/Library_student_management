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
import { AlertCircle, CalendarDays, CheckCircle2, CreditCard, Phone, Plus, Search, UserRound } from 'lucide-react';

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

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Students
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({students.length} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Student Details</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-5 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-10 w-10 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses}`}>
              {student.status}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <Phone size={16} />
              {student.phone}
            </span>
            <span>Seat {student.seatNumber}</span>
            <span>Admitted by {student.admittedBy || 'Not added'}</span>
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
                ? 'Current Month Paid'
                : 'Mark Current Month Paid'}
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DetailCard title="Monthly Fee" value={`Rs. ${student.monthlyFee}`} icon={<CreditCard size={18} />} />
        <DetailCard
          title="Next Due Date"
          value={new Date(student.nextDueDate).toLocaleDateString('en-IN')}
          icon={<CalendarDays size={18} />}
        />
        <DetailCard title="Total Paid" value={`Rs. ${totalPaid}`} icon={<CreditCard size={18} />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <InfoRow label="Student Name" value={student.name} />
            <InfoRow label="Phone Number" value={student.phone} />
            <InfoRow label="Parent Phone" value={student.parentPhone || 'Not added'} />
            <InfoRow label="Aadhaar Number" value={student.aadharNumber || 'Not added'} />
            <InfoRow label="Seat Number" value={String(student.seatNumber)} />
            <InfoRow label="Joining Date" value={new Date(student.joiningDate).toLocaleDateString('en-IN')} />
            <InfoRow label="Next Due Date" value={new Date(student.nextDueDate).toLocaleDateString('en-IN')} />
            <InfoRow label="Monthly Fee" value={`Rs. ${student.monthlyFee}`} />
            <InfoRow label="Admitted By" value={student.admittedBy || 'Not added'} />
            <InfoRow label="Created At" value={student.createdAt ? new Date(student.createdAt).toLocaleString('en-IN') : 'Not available'} />
            <InfoRow label="Updated At" value={student.updatedAt ? new Date(student.updatedAt).toLocaleString('en-IN') : 'Not available'} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee History</CardTitle>
        </CardHeader>
        <CardContent>
          {isPaymentHistoryLoading ? (
            <p className="py-6 text-center text-gray-600">Loading fee history...</p>
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-gray-600">No payments recorded</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment._id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Rs. {payment.amount}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs capitalize text-gray-500">{payment.paymentMethod}</p>
                  </div>
                  {payment.notes && <p className="text-sm text-gray-600 sm:max-w-xs sm:text-right">{payment.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="rounded-md bg-blue-50 p-2 text-blue-600">{icon}</div>
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
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
