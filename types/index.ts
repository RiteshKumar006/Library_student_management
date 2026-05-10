export interface Admin {
  _id?: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  libraryName?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeeRecord {
  _id?: string;
  studentId: string;
  month: number; // 0-11 (January = 0)
  year: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentId?: string; // Reference to payment that covered this fee
  dueDate: Date;
  paidDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Student {
  _id?: string;
  name: string;
  phone: string;
  seatNumber: number;
  joiningDate: Date;
  monthlyFee: number;
  feePaidTillDate?: Date;
  nextDueDate: Date;
  status: 'active' | 'inactive' | 'overdue';
  parentPhone?: string;
  aadharNumber?: string;
  photoUrl?: string;
  admittedBy?: string;
  paidMonths?: { month: number; year: number; paidDate: Date }[]; // Track paid months
  totalFeesCollected?: number; // Total amount collected
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Payment {
  _id?: string;
  studentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'upi' | 'check' | 'online';
  notes?: string;
  monthsCovered?: { month: number; year: number }[]; // Months this payment covers
  createdAt?: Date;
}

export interface Expense {
  _id?: string;
  title: string;
  amount: number;
  expenseDate: Date;
  category: 'rent' | 'electricity' | 'maintenance' | 'salary' | 'supplies' | 'internet' | 'other';
  paymentMethod: 'cash' | 'upi' | 'check' | 'online';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Seat {
  _id?: string;
  seatNumber: number;
  isAvailable: boolean;
  assignedStudentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DashboardSummary {
  totalStudents: number;
  activeStudents: number;
  pendingFees: number;
  overdueStudents: number;
  upcomingDue: number;
  totalCollection: number;
  monthlyCollection: number;
  availableSeats: number;
  totalSeats: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}
