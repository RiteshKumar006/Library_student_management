'use client';

import { useEffect, useState } from 'react';
import { Student, Payment, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

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
        setStudents(data.data?.students || []);
      }
    } catch (err) {
      console.error('[v0] Students fetch error:', err);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const exportStudentsCSV = () => {
    const data = students.map((student) => ({
      Name: student.name,
      Phone: student.phone,
      'Seat Number': student.seatNumber,
      'Monthly Fee': student.monthlyFee,
      'Joining Date': new Date(student.joiningDate).toLocaleDateString('en-IN'),
      'Next Due Date': new Date(student.nextDueDate).toLocaleDateString('en-IN'),
      Status: student.status,
      'Parent Phone': student.parentPhone || '',
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, 'students-report.csv');
  };

  const exportOverdueCSV = () => {
    const overdueStudents = students.filter((s) => s.status === 'overdue');
    const data = overdueStudents.map((student) => ({
      Name: student.name,
      Phone: student.phone,
      'Monthly Fee': student.monthlyFee,
      'Due Date': new Date(student.nextDueDate).toLocaleDateString('en-IN'),
      'Days Overdue': Math.ceil(
        (new Date().getTime() - new Date(student.nextDueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      'Parent Phone': student.parentPhone || '',
    }));

    const csv = Papa.unparse(data);
    downloadCSV(csv, 'overdue-students-report.csv');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const overdueCount = students.filter((s) => s.status === 'overdue').length;
  const totalFees = students.reduce((sum, s) => sum + s.monthlyFee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Generate and export reports</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overdueCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Expected Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{totalFees.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Utilization Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {Math.round((students.length / 50) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">All Students Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download a complete list of all students with their details
              </p>
              <Button
                onClick={exportStudentsCSV}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export as CSV
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Overdue Students Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download list of students with overdue fees
              </p>
              <Button
                onClick={exportOverdueCSV}
                disabled={isLoading || overdueCount === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export as CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Students List */}
      {overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Overdue Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-red-200">
                    <th className="px-4 py-2 text-left font-semibold text-red-900">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-red-900">Phone</th>
                    <th className="px-4 py-2 text-left font-semibold text-red-900">Due Date</th>
                    <th className="px-4 py-2 text-left font-semibold text-red-900">Days Overdue</th>
                    <th className="px-4 py-2 text-left font-semibold text-red-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter((s) => s.status === 'overdue')
                    .map((student) => (
                      <tr key={student._id} className="border-b border-red-200">
                        <td className="px-4 py-2 text-red-900 font-medium">{student.name}</td>
                        <td className="px-4 py-2 text-red-900">{student.phone}</td>
                        <td className="px-4 py-2 text-red-900">
                          {new Date(student.nextDueDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-red-900">
                          {Math.ceil(
                            (new Date().getTime() - new Date(student.nextDueDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </td>
                        <td className="px-4 py-2 font-semibold text-red-900">
                          ₹{student.monthlyFee}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
