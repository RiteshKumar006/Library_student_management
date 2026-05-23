'use client';

import { useEffect, useState } from 'react';
import { Student, Payment, ApiResponse } from '@/types';
import { PaymentForm } from '@/components/dashboard/payment-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  IndianRupee,
  Plus,
  ReceiptText,
  Sparkles,
  Users,
} from 'lucide-react';

type FeeFilter = 'all' | 'paid' | 'pending' | 'overdue' | 'enrolled';

const filterOptions: { value: FeeFilter; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'paid', label: 'Paid / Current' },
  { value: 'pending', label: 'Due / Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'enrolled', label: 'Recently Enrolled' },
];

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
  const collectionPotential = students.reduce((sum, student) => sum + Number(student.monthlyFee || 0), 0);

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
    const selectedStatus = getFeeStatus(selectedStudent);

    return (
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <section className="overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#eef9f6_58%,#fff7ed_100%)] shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStudent(null);
                  setPaymentHistory([]);
                }}
                className="border-slate-200 bg-white/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Fees
              </Button>
              <div>
                <Badge className={`${getStatusStyle(selectedStatus).badge} mb-3`}>
                  {getStatusStyle(selectedStatus).label}
                </Badge>
                <h1 className="text-3xl font-bold tracking-normal text-slate-950">Record Payment</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Manage fee collection for {selectedStudent.name}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[22rem]">
              <MiniMetric label="Monthly Fee" value={`Rs. ${formatAmount(selectedStudent.monthlyFee)}`} />
              <MiniMetric label="Paid Till" value={formatDate(getPaidTillDate(selectedStudent))} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <PaymentForm
            student={selectedStudent}
            onSubmit={handleRecordPayment}
            onCancel={() => {
              setSelectedStudent(null);
              setPaymentHistory([]);
            }}
          />

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-950">
                <ReceiptText className="h-5 w-5 text-teal-700" />
                Payment History
              </CardTitle>
              <CardDescription>Recent receipts for this student.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {paymentHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <ReceiptText className="mx-auto mb-3 h-7 w-7 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">No payments recorded</p>
                  <p className="mt-1 text-xs text-slate-500">New receipts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment._id}
                      className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-slate-950">Rs. {formatAmount(payment.amount)}</p>
                          <p className="mt-1 text-sm text-slate-500">{formatDate(payment.paymentDate)}</p>
                        </div>
                        <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 capitalize">
                          {payment.paymentMethod}
                        </Badge>
                      </div>
                      {payment.notes && <p className="mt-3 text-sm text-slate-600">{payment.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <section className="overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#eef9f6_55%,#fff7ed_100%)] shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_22rem] lg:p-7">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-50">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Fee Workspace
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white/70 text-slate-600">
                {students.length} enrolled
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Fees & Payments</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Track current students, upcoming dues, overdue fees, and payment history in one light workspace.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Monthly potential</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">Rs. {formatAmount(collectionPotential)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <HeroChip label="Current" value={paidStudents.length} tone="teal" />
              <HeroChip label="Pending" value={pendingStudents.length} tone="amber" />
              <HeroChip label="Overdue" value={overdueStudents.length} tone="rose" />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-3 border-teal-100 border-t-teal-700" />
            <p className="text-sm text-slate-600">Loading students...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SummaryCard title="Paid / Current" value={paidStudents.length} icon="paid" />
            <SummaryCard title="Due / Pending" value={pendingStudents.length} icon="pending" />
            <SummaryCard title="Overdue" value={overdueStudents.length} icon="overdue" />
            <SummaryCard title="Enrolled" value={students.length} icon="enrolled" />
          </div>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={filter === value ? 'default' : 'ghost'}
                    onClick={() => setFilter(value)}
                    className={
                      filter === value
                        ? 'bg-slate-950 text-white hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {displayedStudents.length === 0 ? (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="py-12 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="font-medium text-slate-700">No students found for this status.</p>
                <p className="mt-1 text-sm text-slate-500">Try another filter to view fee records.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    paid: {
      icon: 'bg-teal-50 text-teal-700',
      text: 'text-teal-700',
      border: 'border-teal-100',
    },
    pending: {
      icon: 'bg-amber-50 text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    overdue: {
      icon: 'bg-rose-50 text-rose-700',
      text: 'text-rose-700',
      border: 'border-rose-100',
    },
    enrolled: {
      icon: 'bg-sky-50 text-sky-700',
      text: 'text-sky-700',
      border: 'border-sky-100',
    },
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
    <Card className={`border-slate-200 bg-white shadow-sm ${styles[icon].border}`}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${styles[icon].text}`}>{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${styles[icon].icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function FeeStudentCard({ student, onClick }: { student: Student; onClick: () => void }) {
  const status = getFeeStatus(student);
  const daysUntilDue = getDaysUntilDue(student.nextDueDate);
  const paidTillDate = getPaidTillDate(student);
  const style = getStatusStyle(status);

  return (
    <Card
      className="group cursor-pointer border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-950">{student.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{student.phone}</p>
            </div>
            <Badge className={style.badge}>{style.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoTile label="Monthly Fee" value={`Rs. ${formatAmount(student.monthlyFee)}`} />
            <InfoTile label="Seat" value={student.seatNumber ? String(student.seatNumber) : 'Not set'} />
            <InfoTile label="Enrolled" value={formatDate(student.joiningDate)} />
            <InfoTile label="Paid Till" value={formatDate(paidTillDate)} />
          </div>

          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${style.notice}`}>
            {status === 'overdue' ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Fee overdue by {Math.abs(daysUntilDue)} day
                  {Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                </span>
              </>
            ) : status === 'pending' ? (
              <>
                <Clock className="h-4 w-4" />
                <span>
                  {daysUntilDue === 0
                    ? 'Fee due today'
                    : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Fee paid and current</span>
              </>
            )}
          </div>

          <Button className="w-full bg-slate-950 text-white hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroChip({ label, value, tone }: { label: string; value: number; tone: 'teal' | 'amber' | 'rose' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-lg px-3 py-2 ${tones[tone]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function getPaidTillDate(student: Student) {
  return (
    student.feePaidTillDate ||
    new Date(new Date(student.nextDueDate).getTime() - 24 * 60 * 60 * 1000)
  );
}

function getStatusStyle(status: Exclude<FeeFilter, 'all' | 'enrolled'>) {
  const styles = {
    paid: {
      label: 'Paid',
      badge: 'border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-50',
      notice: 'border-teal-100 bg-teal-50 text-teal-700',
    },
    pending: {
      label: 'Pending',
      badge: 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50',
      notice: 'border-amber-100 bg-amber-50 text-amber-700',
    },
    overdue: {
      label: 'Overdue',
      badge: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50',
      notice: 'border-rose-100 bg-rose-50 text-rose-700',
    },
  };

  return styles[status];
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN');
}

function formatAmount(amount: number) {
  return Number(amount || 0).toLocaleString('en-IN');
}
