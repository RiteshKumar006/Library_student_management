export interface Admin {
  _id?: string;
  email: string;
  password: string;
  createdAt?: Date;
}

export interface Student {
  _id?: string;
  name: string;
  phone: string;
  seatNumber: number;
  joiningDate: Date;
  monthlyFee: number;
  nextDueDate: Date;
  status: 'active' | 'inactive' | 'overdue';
  parentPhone?: string;
  aadharNumber?: string;
  photoUrl?: string;
  admittedBy?: string;
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
