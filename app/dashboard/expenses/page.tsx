'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiResponse, Expense } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CalendarDays, IndianRupee, Plus, ReceiptText, Trash2, WalletCards, Search, TrendingDown, Edit, X } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

type ExpenseCategory = Expense['category'];
type ExpenseFilter = 'all' | ExpenseCategory;

const categories: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'rent', label: 'Rent', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'electricity', label: 'Electricity', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'salary', label: 'Salary', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'supplies', label: 'Supplies', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'internet', label: 'Internet', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'online', label: 'Online', icon: '🌐' },
  { value: 'check', label: 'Check', icon: '🏦' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState(initialForm);
  const [isUpdating, setIsUpdating] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const filteredExpenses =
    filter === 'all' ? expenses : expenses.filter((expense) => expense.category === filter);

  // Filter with search
  const searchedFilteredExpenses = filteredExpenses.filter(expense =>
    expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Chart data: last 7 days expenses
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    return last7Days.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayExpenses = expenses.filter(exp => exp.expenseDate === dateStr);
      const total = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      
      // Safely format date
      let formattedDate = '';
      try {
        formattedDate = date.toLocaleDateString('en-IN', { day: 'short', month: 'short' });
      } catch (e) {
        formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
      
      return {
        date: formattedDate,
        amount: total,
      };
    });
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

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingExpense?._id) return;

    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/expenses?id=${editingExpense._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update expense');
      }

      // Update the expense in the list
      setExpenses((currentExpenses) =>
        currentExpenses.map((exp) =>
          exp._id === editingExpense._id
            ? { ...exp, ...editFormData, amount: Number(editFormData.amount) }
            : exp
        )
      );
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Library Expenses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Track and manage library expenditures
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-sm border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
          <WalletCards className="w-3 h-3 mr-1" />
          {expenses.length} records • {categories.length} categories
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              ₹{totalExpense.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
              ₹{thisMonthExpense.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <WalletCards className="w-3.5 h-3.5" />
              Largest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              ₹{largestExpense.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ReceiptText className="w-3.5 h-3.5" />
              Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">{expenses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      {/* {expenses.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-emerald-600" />
              7-Day Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="date" fontSize={12} stroke="#6b7280" />
                <YAxis fontSize={12} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )} */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        {/* Add Expense Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 p-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Add New Expense
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Record a new library expenditure
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Expense Title
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Electricity bill"
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="amount" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Amount (₹)
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
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="expenseDate" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={(event) => setFormData({ ...formData, expenseDate: event.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="category" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(event) =>
                      setFormData({ ...formData, category: event.target.value as ExpenseCategory })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="paymentMethod" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
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
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Notes (optional)
                </label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  placeholder="Bill number, vendor, or any detail"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow transition-all"
              >
                {isSubmitting ? 'Saving...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expense History */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg">Expense History</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {searchedFilteredExpenses.length} of {expenses.length} records
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs w-40 sm:w-48"
                  />
                </div>
                <div className="flex gap-1">
                  {(['grid', 'list'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`p-1.5 rounded-md text-xs transition-colors ${
                        viewMode === mode ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      title={mode === 'grid' ? 'Grid view' : 'List view'}
                    >
                      {mode === 'grid' ? '⊞' : '☰'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                  filter === 'all'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setFilter(category.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                    filter === category.value
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-emerald-600"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Loading expenses...</p>
                </div>
              </div>
            ) : searchedFilteredExpenses.length === 0 ? (
              <div className="py-12 text-center">
                <ReceiptText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {searchQuery ? 'No expenses match your search' : 'No expenses recorded yet.'}
                </p>
                {searchQuery && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchedFilteredExpenses.map((expense) => (
                  <article
                    key={expense._id}
                    className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                          {expense.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} •{' '}
                          <span className="capitalize">{expense.paymentMethod}</span>
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0.5 shrink-0 ${categories.find(c => c.value === expense.category)?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                      >
                        {expense.category}
                      </Badge>
                    </div>
                    {expense.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {expense.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                        ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(expense)}
                          className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          aria-label={`Edit ${expense.title}`}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense._id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          aria-label={`Delete ${expense.title}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {searchedFilteredExpenses.map((expense) => (
                  <article
                    key={expense._id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {expense.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 ${categories.find(c => c.value === expense.category)?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                        >
                          {expense.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} •{' '}
                        <span className="capitalize">{expense.paymentMethod}</span>
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t pt-2 sm:border-t-0 sm:pt-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                        ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(expense)}
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        aria-label={`Edit ${expense.title}`}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense._id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
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

        {/* Edit Expense Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                  <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Edit Expense
              </DialogTitle>
              <DialogDescription>
                Update the expense details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expense Title
                </label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Electricity bill"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (₹)
                  </label>
                  <Input
                    id="edit-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editFormData.expenseDate}
                    onChange={(e) => setEditFormData({ ...editFormData, expenseDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as ExpenseCategory })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-payment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Method
                  </label>
                  <select
                    id="edit-payment"
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value as Expense['paymentMethod'] })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes (optional)
                </label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Bill number, vendor, or any detail"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? 'Updating...' : 'Update Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
