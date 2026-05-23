'use client';

import { useState, useEffect, useMemo } from 'react';
import { Student, FeeRecord, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';
import {
  addDays,
  formatDateInput,
  getCoveredBillingMonths,
  getPaidTillDateForMonths,
} from '@/lib/fee-calculation';

interface PaymentFormProps {
  student: Student;
  onSubmit: (data: {
    studentId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
    feePaidTillDate?: string;
    monthsCovered?: { month: number; year: number }[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PaymentForm({
  student,
  onSubmit,
  onCancel,
  isLoading,
}: PaymentFormProps) {
  const currentPaidTillDate = useMemo(
    () => getPaidTillDate(student),
    [student.feePaidTillDate, student.nextDueDate]
  );
  const defaultPaidTillDate = useMemo(
    () => getPaidTillDateForMonths(addDays(currentPaidTillDate, 1), 1),
    [currentPaidTillDate]
  );
  const [formData, setFormData] = useState({
    amount: student.monthlyFee,
    paymentDate: formatDateInput(new Date()),
    feePaidTillDate: formatDateInput(defaultPaidTillDate),
    paymentMethod: 'cash',
    notes: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loadingFeeRecords, setLoadingFeeRecords] = useState(true);

  // Fetch fee records for this student
  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        setLoadingFeeRecords(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/fee-records?studentId=${student._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as ApiResponse<FeeRecord[]>;
          setFeeRecords(Array.isArray(data.data) ? data.data : []);
        }
      } catch (err) {
        console.error('Error fetching fee records:', err);
      } finally {
        setLoadingFeeRecords(false);
      }
    };

    if (student._id) {
      fetchFeeRecords();
    }
  }, [student._id]);

  // Check if a month is already paid
  const isMonthPaid = (month: number, year: number) => {
    return feeRecords.some(
      (record: FeeRecord) => record.month === month && record.year === year && record.status === 'paid'
    );
  };

  const selectedPaidTillDate = useMemo(
    () => (formData.feePaidTillDate ? parseDateInput(formData.feePaidTillDate) : null),
    [formData.feePaidTillDate]
  );
  const selectedMonths = useMemo(() => {
    if (!selectedPaidTillDate || selectedPaidTillDate <= currentPaidTillDate) {
      return [];
    }

    return getCoveredBillingMonths(addDays(currentPaidTillDate, 1), selectedPaidTillDate).filter(
      ({ month, year }) => !isMonthPaid(month, year)
    );
  }, [formData.feePaidTillDate, feeRecords, currentPaidTillDate]);

  const visibleMonths = useMemo(() => {
    const paidMonths = feeRecords
      .filter((record) => record.status === 'paid')
      .map((record) => ({ month: record.month, year: record.year }));
    const uniqueMonths = [...paidMonths, ...selectedMonths].filter(
      (month, index, months) =>
        months.findIndex((item) => item.month === month.month && item.year === month.year) === index
    );

    return uniqueMonths.sort((a, b) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime());
  }, [feeRecords, selectedMonths]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const calculateTotalAmount = () => {
    if (selectedMonths.length === 0) return student.monthlyFee;
    return selectedMonths.length * student.monthlyFee;
  };

  useEffect(() => {
    const amount = calculateTotalAmount();
    setFormData(prev => (prev.amount === amount ? prev : { ...prev, amount }));
  }, [selectedMonths, student.monthlyFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.amount || parseFloat(formData.amount as any) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (selectedMonths.length === 0) {
      setError('Fees paid till date must cover at least one unpaid month');
      return;
    }

    try {
      await onSubmit({
        studentId: student._id!,
        amount: parseFloat(formData.amount as any),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        feePaidTillDate: formData.feePaidTillDate,
        monthsCovered: selectedMonths,
      });
      setSuccess(true);
      setTimeout(() => onCancel(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle>Record Payment</CardTitle>
          <p className="text-sm text-gray-600 mt-1">{student.name}</p>
        </div>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X size={20} />
        </button>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment recorded successfully
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                Amount (₹) *
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-600">
                Monthly fee: ₹{student.monthlyFee}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentDate" className="text-sm font-medium text-gray-700">
                Payment Date *
              </label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="feePaidTillDate" className="text-sm font-medium text-gray-700">
                Fees Paid Till Date *
              </label>
              <Input
                id="feePaidTillDate"
                name="feePaidTillDate"
                type="date"
                min={formatDateInput(addDays(currentPaidTillDate, 1))}
                value={formData.feePaidTillDate}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-600">
                Current paid till: {currentPaidTillDate.toLocaleDateString('en-IN')}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Months to Cover
                </label>
              </div>
              
              {/* Month Grid */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {visibleMonths.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-600">
                    Select a later paid till date to calculate covered months.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {visibleMonths.map(({ month, year }) => {
                    const paid = isMonthPaid(month, year);
                    const isSelected = selectedMonths.some(m => m.month === month && m.year === year);
                    const date = new Date(year, month, 1);
                    const label = date.toLocaleDateString('en-US', { month: 'short' });
                    const fullLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    
                    return (
                      <button
                        key={`${year}-${month}`}
                        type="button"
                        disabled
                        title={fullLabel}
                        className={`relative p-3 rounded-lg font-medium text-sm transition-all duration-200 border-2 ${
                          paid
                            ? 'bg-green-100 border-green-400 text-green-700 cursor-not-allowed shadow-sm'
                            : isSelected
                              ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                              : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{label}</span>
                          {paid && (
                            <CheckCircle2 size={14} className="text-green-600" />
                          )}
                          {isSelected && !paid && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-green-100 border-2 border-green-400 rounded-md flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-green-600" />
                  </div>
                  <span className="text-gray-600">Paid</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600 rounded-md"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-md"></div>
                  <span className="text-gray-600">Available</span>
                </div>
              </div>

              {/* Selection Summary */}
              {selectedMonths.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedMonths.length} month{selectedMonths.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-lg font-bold text-blue-700 mt-1">
                    Total: ₹{calculateTotalAmount().toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedMonths
                      .slice()
                      .sort((a, b) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime())
                      .map(m => {
                        const monthName = new Date(m.year, m.month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        return monthName;
                      })
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getPaidTillDate(student: Student) {
  const paidTillDate = student.feePaidTillDate
    ? new Date(student.feePaidTillDate)
    : addDays(new Date(student.nextDueDate), -1);
  paidTillDate.setHours(0, 0, 0, 0);
  return paidTillDate;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
