import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Edit2, Trash2, CheckCircle2, Clock, Eye } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  onView?: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

function getDaysUntilDue(dueDate: Date | string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Student</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Phone</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-900">Seat</th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900">Paid Till</th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900">Collected</th>
            <th className="px-6 py-4 text-center font-semibold text-gray-900">Status</th>
            <th className="px-6 py-4 text-right font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const paidTillDate =
              student.feePaidTillDate ||
              new Date(new Date(student.nextDueDate).getTime() - 24 * 60 * 60 * 1000);
            const daysUntilDue = getDaysUntilDue(student.nextDueDate);
            const statusColor = 
              student.status === 'overdue'
                ? 'bg-red-100 text-red-700'
                : student.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700';

            const dueDateColor = 
              daysUntilDue < 0
                ? 'text-red-600 font-semibold'
                : daysUntilDue <= 3
                  ? 'text-yellow-600 font-semibold'
                  : 'text-gray-700';

            return (
              <tr
                key={student._id}
                className="border-b hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{student.phone}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">{student.seatNumber || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <div className={dueDateColor}>
                    {new Date(paidTillDate).toLocaleDateString('en-IN')}
                    <p className="text-xs text-gray-600 mt-1">
                      {daysUntilDue < 0 
                        ? `${Math.abs(daysUntilDue)}d overdue`
                        : daysUntilDue === 0
                          ? 'Due today'
                          : `${daysUntilDue}d left`
                      }
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div>
                    <p className="font-semibold text-green-700">₹{(student.totalFeesCollected || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-600">{student.paidMonths?.length || 0} months</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {student.status === 'overdue' && <AlertTriangle size={14} />}
                    {student.status === 'active' && <CheckCircle2 size={14} />}
                    {student.status === 'overdue' ? 'Overdue' : 'Active'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      onView?.(student);
                    }}
                    title="View details"
                    className="h-8 px-3"
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(student);
                    }}
                    title="Edit student"
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
                    title="Delete student"
                    className="h-8 px-3"
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
