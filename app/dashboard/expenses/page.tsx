'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiResponse, Expense } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CalendarDays, IndianRupee, Plus, ReceiptText, Trash2, WalletCards } from 'lucide-react';

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
  const largestExpense = useMemo(
    () => expenses.reduce((highest, expense) => Math.max(highest, Number(expense.amount || 0)), 0),
    [expenses]
  );

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
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <WalletCards size={14} />
              Expense ledger
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Library Expenses
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Record and review day-to-day library spending
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Categories</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{categories.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">Records</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{expenses.length}</p>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Expenses" value={totalExpense} icon={IndianRupee} accent="emerald" />
        <SummaryCard title="This Month" value={thisMonthExpense} icon={CalendarDays} accent="sky" />
        <SummaryCard title="Largest Entry" value={largestExpense} icon={WalletCards} accent="amber" />
        <SummaryCard title="Entries" value={expenses.length} icon={ReceiptText} accent="rose" isCount />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950 sm:text-xl">
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <Plus size={18} />
              </span>
              Add Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-slate-700">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium text-slate-700">
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
                  <label htmlFor="expenseDate" className="text-sm font-medium text-slate-700">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(event) =>
                      setFormData({ ...formData, category: event.target.value as ExpenseCategory })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentMethod" className="text-sm font-medium text-slate-700">
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
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <label htmlFor="notes" className="text-sm font-medium text-slate-700">
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
                className="w-full bg-slate-950 text-white hover:bg-slate-800"
              >
                {isSubmitting ? 'Saving...' : 'Save Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg text-slate-950 sm:text-xl">Expense History</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {filteredExpenses.length} of {expenses.length} records
                </p>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
                <Button
                  type="button"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                  className={filter === 'all' ? 'bg-slate-950 hover:bg-slate-800' : ''}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    type="button"
                    variant={filter === category.value ? 'default' : 'outline'}
                    onClick={() => setFilter(category.value)}
                    size="sm"
                    className={filter === category.value ? 'bg-slate-950 hover:bg-slate-800' : ''}
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
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-slate-950"></div>
                  <p className="text-slate-600">Loading expenses...</p>
                </div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-600">No expenses recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <article
                    key={expense._id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold text-slate-950">{expense.title}</h3>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium capitalize text-emerald-700">
                          {expense.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(expense.expenseDate).toLocaleDateString('en-IN')} -{' '}
                        <span className="capitalize">{expense.paymentMethod}</span>
                      </p>
                      {expense.notes && <p className="mt-2 break-words text-sm text-slate-500">{expense.notes}</p>}
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t pt-3 sm:border-t-0 sm:pt-0 lg:justify-end">
                      <p className="text-lg font-bold text-slate-950 sm:text-xl">
                        Rs. {Number(expense.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Delete ${expense.title}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </article>
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
  accent,
  isCount = false,
}: {
  title: string;
  value: number;
  icon: typeof IndianRupee;
  accent: 'emerald' | 'sky' | 'amber' | 'rose';
  isCount?: boolean;
}) {
  const accentStyles = {
    emerald: {
      border: 'border-l-emerald-500',
      icon: 'bg-emerald-50 text-emerald-700',
    },
    sky: {
      border: 'border-l-sky-500',
      icon: 'bg-sky-50 text-sky-700',
    },
    amber: {
      border: 'border-l-amber-500',
      icon: 'bg-amber-50 text-amber-700',
    },
    rose: {
      border: 'border-l-rose-500',
      icon: 'bg-rose-50 text-rose-700',
    },
  };

  return (
    <Card className={`border-l-4 border-slate-200 bg-white shadow-sm ${accentStyles[accent].border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
          <span className={`rounded-lg p-2 ${accentStyles[accent].icon}`}>
            <Icon size={18} />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-w-0 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {isCount ? value : `Rs. ${value.toLocaleString('en-IN')}`}
        </div>
      </CardContent>
    </Card>
  );
}
