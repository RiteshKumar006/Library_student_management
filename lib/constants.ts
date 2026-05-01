export const SEAT_RANGE = 50; // Total seats in the library
export const FEE_PLANS = {
  monthly: 1,
  quarterly: 3,
  halfYearly: 6,
  yearly: 12,
};

export const PAYMENT_METHODS = ['cash', 'upi', 'check', 'online'] as const;

export const STUDENT_STATUS = {
  active: 'active',
  inactive: 'inactive',
  overdue: 'overdue',
} as const;

export const UPCOMING_DUE_DAYS = 3; // Alert students 3 days before due date
export const OVERDUE_DAYS = 0; // Student is overdue if current date > nextDueDate

export const JWT_EXPIRY = '7d';

export const ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  STUDENTS: {
    LIST: '/api/students',
    CREATE: '/api/students',
    GET: (id: string) => `/api/students/${id}`,
    UPDATE: (id: string) => `/api/students/${id}`,
    DELETE: (id: string) => `/api/students/${id}`,
  },
  PAYMENTS: {
    CREATE: '/api/payments',
    HISTORY: (studentId: string) => `/api/payments/${studentId}`,
    ANALYTICS: '/api/analytics/fees',
  },
  SEATS: {
    LIST: '/api/seats',
    ASSIGN: '/api/seats/assign',
    FREE: (seatNumber: number) => `/api/seats/${seatNumber}`,
  },
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
  },
};
