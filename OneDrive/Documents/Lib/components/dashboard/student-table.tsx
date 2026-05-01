import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Edit2, Trash2 } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  onView?: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function StudentTable({ students, onView, onEdit, onDelete, isLoading }: StudentTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No students found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Phone</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Seat</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Fee</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Due Date</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student._id}
              onClick={() => onView?.(student)}
              className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
              <td className="px-6 py-4 text-gray-700">{student.phone}</td>
              <td className="px-6 py-4 text-gray-700">{student.seatNumber}</td>
              <td className="px-6 py-4 text-gray-700">₹{student.monthlyFee}</td>
              <td className="px-6 py-4 text-gray-700">
                {new Date(student.nextDueDate).toLocaleDateString('en-IN')}
              </td>
              <td className="px-6 py-4">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    student.status === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : student.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {student.status === 'overdue' && <AlertTriangle size={14} />}
                  {student.status === 'overdue' ? 'Overdue' : 'Active'}
                </div>
              </td>
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(student);
                  }}
                  className="h-8 px-3"
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(student._id!);
                  }}
                  className="h-8 px-3"
                >
                  <Trash2 size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
