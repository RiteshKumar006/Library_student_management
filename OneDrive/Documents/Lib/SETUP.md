# Library Sitting Management System - Setup Guide

## Overview

LibraryHub is a full-stack web application for managing library sitting facilities, student accounts, fee collections, and seat assignments. Built with Next.js 16, React 19, and MongoDB.

## Features

✅ **Admin Authentication** - Secure login with JWT tokens and httpOnly cookies
✅ **Student Management** - Add, edit, delete students with automatic seat assignment
✅ **Fee Tracking** - Record payments, view payment history, track overdue fees
✅ **Seat Management** - Visual seat layout with real-time availability status
✅ **Dashboard** - KPI cards showing key metrics and utilization rates
✅ **Reports** - Export student lists and overdue reports as CSV
✅ **Smart Notifications** - Alerts for overdue fees and upcoming due dates
✅ **Responsive Design** - Works seamlessly on desktop and mobile devices

## Prerequisites

- Node.js 18+ and pnpm (already installed)
- MongoDB (local or cloud Atlas)
- Git (optional)

## Installation & Setup

### 1. Install Dependencies

Dependencies are already installed. If needed, run:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/library_db

# Option B: MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/library_db

# Change this to a secure random string in production!
JWT_SECRET=your-secret-key-change-in-production

NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start MongoDB

**Option A: Local MongoDB (if installed)**

```bash
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

### 4. Initialize Database with Demo Data

Run the setup script to create the demo admin account and initialize seats:

```bash
pnpm run setup-db
```

This will:
- Create a demo admin account
- Initialize 50 seats
- Print login credentials

**Demo Credentials:**
- Email: `admin@library.com`
- Password: `admin123`

### 5. Start Development Server

```bash
pnpm dev
```

The app will be available at: `http://localhost:3000`

## Usage Guide

### Login

1. Navigate to http://localhost:3000/login
2. Enter credentials:
   - Email: `admin@library.com`
   - Password: `admin123`

### Dashboard

View key metrics:
- Total students
- Overdue fees count
- Monthly collection
- Available seats
- Seat utilization percentage

### Students Page

- **Add Student**: Click "Add Student" button
  - Enter name, phone, seat number, joining date, monthly fee
  - System auto-calculates next due date (1 month from joining)
  - Seat is automatically marked as occupied

- **Edit Student**: Click edit icon on student card
  - Modify any student details
  - Changing seat number updates availability

- **Delete Student**: Click delete icon
  - Confirms deletion
  - Seat is immediately freed up

- **Search & Filter**: 
  - Search by name or phone
  - Filter by status (Active/Overdue)

### Fees & Payments

- **Record Payment**: Select a student and click "Record Payment"
  - Enter amount, payment date, method
  - Add optional notes
  - Next due date auto-updates to 1 month from today

- **View History**: Payment history shows all transactions
  - Includes amount, date, method

### Seats

- **Visual Layout**: See all 50 seats in a grid
  - Green = Available
  - Blue = Occupied
- **Utilization**: Track occupancy percentage

### Reports

- **Export Student List**: Download CSV with all student details
- **Export Overdue Students**: Download list of students with unpaid dues
- **Quick Stats**: See summary metrics

### Settings

- **Theme**: Toggle between light and dark mode
- **Account Info**: View admin account status

## API Endpoints

All endpoints require JWT token in `Authorization: Bearer <token>` header.

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout

### Students

- `GET /api/students` - List all students (supports search & filter)
- `POST /api/students` - Create new student
- `GET /api/students/[id]` - Get single student
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Payments

- `POST /api/payments` - Record payment
- `GET /api/payments/[studentId]` - Get payment history

### Seats

- `GET /api/seats` - List all seats with availability

### Dashboard

- `GET /api/dashboard/summary` - Get dashboard metrics

## Database Schema

### admins
```javascript
{
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### students
```javascript
{
  name: String,
  phone: String,
  seatNumber: Number,
  joiningDate: Date,
  monthlyFee: Number,
  nextDueDate: Date,
  status: String ('active' | 'overdue'),
  parentPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### payments
```javascript
{
  studentId: String (ObjectId reference),
  amount: Number,
  paymentDate: Date,
  paymentMethod: String ('cash' | 'upi' | 'check' | 'online'),
  notes: String,
  createdAt: Date
}
```

### seats
```javascript
{
  seatNumber: Number,
  isAvailable: Boolean,
  assignedStudentId: String (ObjectId reference),
  createdAt: Date,
  updatedAt: Date
}
```

## Key Features Explained

### Automatic Status Calculation

Students are automatically marked as:
- **Active**: Next due date is in the future
- **Overdue**: Next due date is in the past

### Upcoming Due Alerts

Students with due dates within 3 days show a warning alert.

### Fee Due Date Logic

- When a student joins: `nextDueDate = joiningDate + 1 month`
- When a payment is recorded: `nextDueDate = today + 1 month`

### Seat Management

- Each student must have a unique seat
- Seats are freed when student is deleted/seat is changed
- System prevents duplicate seat assignments

## Troubleshooting

### Cannot connect to MongoDB

**Check:**
1. MongoDB service is running (`mongod` for local)
2. Connection string in `.env.local` is correct
3. Network access allowed (MongoDB Atlas requires IP whitelist)

### Login fails with "Invalid email or password"

**Solution:**
1. Verify demo credentials are correct
2. Run setup script again: `pnpm run setup-db`
3. Check MongoDB contains the admin user: `db.admins.find()`

### Student creation fails

**Check:**
1. Phone number is not already registered
2. Seat number is available
3. All required fields are filled

### API endpoints return 401 Unauthorized

**Solution:**
1. Token may be expired (7-day expiry)
2. Login again and get a fresh token
3. Check token is properly stored in localStorage

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Security Considerations

- ✅ Passwords are hashed with bcrypt
- ✅ JWT tokens are httpOnly (not accessible via JavaScript)
- ✅ Tokens expire in 7 days
- ✅ All API routes require authentication
- ⚠️ Change `JWT_SECRET` in production!
- ⚠️ Use HTTPS in production
- ⚠️ Set up MongoDB IP whitelist for Atlas

## Support & Maintenance

### Database Backups

For MongoDB Atlas:
1. Enable automatic backups in cluster settings
2. Configure backup frequency and retention

For Local MongoDB:
```bash
mongodump --uri="mongodb://localhost:27017/library_db"
```

### Monitoring

Monitor key metrics:
- Total revenue
- Student growth
- Seat utilization
- Overdue payments

### Regular Tasks

- Review overdue students weekly
- Archive old payment records (optional)
- Update security credentials quarterly

## License & Credits

Built with:
- Next.js 16
- React 19
- MongoDB
- Tailwind CSS
- shadcn/ui components

---

For issues or questions, check the application logs: `pnpm dev`
