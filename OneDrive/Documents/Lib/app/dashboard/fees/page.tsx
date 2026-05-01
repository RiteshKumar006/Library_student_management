'use client';

import { useEffect, useState } from 'react';
import { Student, Payment, ApiResponse } from '@/types';
import { PaymentForm } from '@/components/dashboard/payment-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Clock, AlertTriangle, CheckCircle2, Users } from 'lucide-react';

type FeeFilter = 'all' | 'paid' | 'pending' | 'overdue' | 'enrolled';

function getDaysUntilDue(nextDueDate: Date | string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getFeeStatus(student: Student): Exclude<FeeFilter, 'all' | 'enrolled'> {
  const daysUntilDue = getDaysUntilDue(student.nextDueDate);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 3) return 'pending';
  return 'paid';
}

export default function FeesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FeeFilter>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const paidStudents = students.filter((student) => getFeeStatus(student) === 'paid');
  const pendingStudents = students.filter((student) => getFeeStatus(student) === 'pending');
  const overdueStudents = students.filter((student) => getFeeStatus(student) === 'overdue');
  const enrolledStudents = [...students].sort(
    (a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime()
  );
  const displayedStudents =
    filter === 'all'
      ? students
      : filter === 'enrolled'
        ? enrolledStudents
        : students.filter((student) => getFeeStatus(student) === filter);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/students', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        setStudents(Array.isArray(data.data) ? data.data : data.data?.students || []);
        setError('');
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      console.error('[v0] Students fetch error:', err);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    await fetchPaymentHistory(student._id!);
  };

  const fetchPaymentHistory = async (studentId: string) => {
    try {
      const response = await fetch(`/api/payments/${studentId}`, {
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
    }
  };

  const handleRecordPayment = async (data: any) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as ApiResponse;

      if (response.ok) {
        await fetchPaymentHistory(data.studentId);
        await fetchStudents();
      } else {
        throw new Error(result.message || 'Failed to record payment');
      }
    } catch (err) {
      throw err;
    }
  };

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-600 mt-2">Manage fees for {selectedStudent.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStudent(null);
              setPaymentHistory([]);
            }}
          >
            Back
          </Button>
        </div>

        <PaymentForm
          student={selectedStudent}
          onSubmit={handleRecordPayment}
          onCancel={() => {
            setSelectedStudent(null);
            setPaymentHistory([]);
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No payments recorded</p>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Rs. {payment.amount}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {payment.paymentMethod}
                      </p>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-gray-600 max-w-xs text-right">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-gray-600 mt-2">Track who paid, who is pending, and who enrolled</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Paid / Current" value={paidStudents.length} icon="paid" />
            <SummaryCard title="Due / Pending" value={pendingStudents.length} icon="pending" />
            <SummaryCard title="Overdue" value={overdueStudents.length} icon="overdue" />
            <SummaryCard title="Enrolled" value={students.length} icon="enrolled" />
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {[
                  ['all', 'All Students'],
                  ['paid', 'Paid / Current'],
                  ['pending', 'Due / Pending'],
                  ['overdue', 'Overdue'],
                  ['enrolled', 'Recently Enrolled'],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={filter === value ? 'default' : 'outline'}
                    onClick={() => setFilter(value as FeeFilter)}
                    className={filter === value ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {displayedStudents.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-600">
                No students found for this status.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedStudents.map((student) => (
                <FeeStudentCard
                  key={student._id}
                  student={student}
                  onClick={() => handleSelectStudent(student)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: 'paid' | 'pending' | 'overdue' | 'enrolled';
}) {
  const styles = {
    paid: 'border-l-green-600 text-green-600',
    pending: 'border-l-yellow-500 text-yellow-600',
    overdue: 'border-l-red-600 text-red-600',
    enrolled: 'border-l-blue-600 text-blue-600',
  };
  const Icon =
    icon === 'paid'
      ? CheckCircle2
      : icon === 'pending'
        ? Clock
        : icon === 'overdue'
          ? AlertTriangle
          : Users;

  return (
    <Card className={`border-l-4 ${styles[icon]}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center gap-2 text-3xl font-bold ${styles[icon]}`}>
          <Icon size={26} />
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function FeeStudentCard({ student, onClick }: { student: Student; onClick: () => void }) {
  const status = getFeeStatus(student);
  const daysUntilDue = getDaysUntilDue(student.nextDueDate);
  const isOverdue = status === 'overdue';
  const isPending = status === 'pending';

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isOverdue
          ? 'border-red-200 bg-red-50'
          : isPending
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-green-200'
      }`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-600">{student.phone}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isOverdue
                  ? 'bg-red-100 text-red-700'
                  : isPending
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }`}
            >
              {isOverdue ? 'Overdue' : isPending ? 'Pending' : 'Paid'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <p className="text-xs text-gray-600">Monthly Fee</p>
              <p className="font-semibold text-gray-900">Rs. {student.monthlyFee}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Seat</p>
              <p className="font-semibold text-gray-900">{student.seatNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <p className="text-xs text-gray-600 mb-2">Enrolled</p>
              <p className="font-semibold text-gray-900">
                {new Date(student.joiningDate).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Next Due</p>
              <p className="font-semibold text-gray-900">
                {new Date(student.nextDueDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t">
            {isOverdue ? (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertTriangle size={14} />
                <span>
                  Fee overdue by {Math.abs(daysUntilDue)} day
                  {Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                </span>
              </div>
            ) : isPending ? (
              <div className="flex items-center gap-1 text-yellow-600 text-xs">
                <Clock size={14} />
                <span>
                  {daysUntilDue === 0
                    ? 'Fee due today'
                    : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle2 size={14} />
                <span>Fee paid and current</span>
              </div>
            )}
          </div>

          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" />
            Record Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
