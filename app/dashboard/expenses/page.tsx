'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiResponse, Expense } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CalendarDays, IndianRupee, Plus, ReceiptText, Trash2 } from 'lucide-react';

type ExpenseCategory = Expense['category'];
type ExpenseFilter = 'all' | ExpenseCategory;

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'salary', label: 'Salary' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'internet', label: 'Internet' },
  { value: 'other', label: 'Other' },
];

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'online', label: 'Online' },
  { value: 'check', label: 'Check' },
];

const initialForm = {
  title: '',
  amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
  category: 'rent' as ExpenseCategory,
  paymentMethod: 'cash' as Expense['paymentMethod'],
  notes: '',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ExpenseFilter>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const filteredExpenses =
    filter === 'all' ? expenses : expenses.filter((expense) => expense.category === filter);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );
  const thisMonthExpense = useMemo(() => {
    const now = new Date();
    return expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.expenseDate);
      if (expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()) {
        return sum + Number(expense.amount || 0);
      }
      return sum;
    }, 0);
  }, [expenses]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expenses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as ApiResponse<Expense[]>;
      if (response.ok) {
        setExpenses(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Failed to load expenses');
      }
    } catch (err) {
      console.error('[v0] Expenses fetch error:', err);
      setError('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Failed to record expense');
      }

      setFormData(initialForm);
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId?: string) => {
    if (!expenseId) return;

    try {
      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete expense');
      }

      setExpenses((currentExpenses) => currentExpenses.filter((expense) => expense._id !== expenseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Library Expenses</h1>
          <p className="text-gray-600 mt-2">Record and review day-to-day library spending</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Expenses" value={totalExpense} icon={IndianRupee} />
        <SummaryCard title="This Month" value={thisMonthExpense} icon={CalendarDays} />
        <SummaryCard title="Entries" value={expenses.length} icon={ReceiptText} isCount />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              Add Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Expense Title
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Electricity bill"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount}
                    onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                    placeholder="2500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="expenseDate" className="text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={(event) => setFormData({ ...formData, expenseDate: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(event) =>
                      setFormData({ ...formData, category: event.target.value as ExpenseCategory })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                    Payment
                  </label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        paymentMethod: event.target.value as Expense['paymentMethod'],
                      })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  placeholder="Bill number, vendor, or any detail"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Saving...' : 'Save Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Expense History</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    type="button"
                    variant={filter === category.value ? 'default' : 'outline'}
                    onClick={() => setFilter(category.value)}
                    className={filter === category.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading expenses...</p>
                </div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-gray-600">No expenses recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{expense.title}</h3>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">
                          {expense.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(expense.expenseDate).toLocaleDateString('en-IN')} ·{' '}
                        <span className="capitalize">{expense.paymentMethod}</span>
                      </p>
                      {expense.notes && <p className="mt-2 text-sm text-gray-500">{expense.notes}</p>}
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <p className="text-xl font-bold text-gray-900">
                        Rs. {Number(expense.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
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

function SummaryCard({
  title,
  value,
  icon: Icon,
  isCount = false,
}: {
  title: string;
  value: number;
  icon: typeof IndianRupee;
  isCount?: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <Icon size={26} className="text-blue-600" />
          {isCount ? value : `Rs. ${value.toLocaleString('en-IN')}`}
        </div>
      </CardContent>
    </Card>
  );
}
