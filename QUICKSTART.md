# Library Sitting Management System - Quick Start

Your Library Sitting Management System is now fully functional and running!

## How to Login

The application is running at **http://localhost:3000**

### Demo Credentials
- **Email:** `admin@library.com`
- **Password:** `admin123`

These credentials are displayed directly on the login page for your convenience.

## Features Available

Once logged in, you can access:

### 1. Dashboard
- View KPI cards: Total Students, Active Students, Pending Fees, Monthly Collection
- See available seats and seat utilization
- View overdue and upcoming due payment alerts

### 2. Students Management
- View all students with their details
- Add new students with name, phone, monthly fee, and seat number
- Search students by name or phone number
- Filter students by status (Active/Overdue)
- Edit student information
- Delete students from the system

### 3. Fees & Payments
- Record payments for students
- Select payment method (Cash, UPI, Check, Online)
- Add payment notes
- View payment history for each student
- Track overdue and upcoming payments

### 4. Seats Management
- View visual grid of all 50 library seats
- See seat availability in real-time
- Green = Available seats
- Blue = Occupied seats
- Quick reference of seat utilization

### 5. Reports
- Generate CSV export of all students
- Export overdue students report
- View date-wise revenue analytics
- Track monthly collection trends

### 6. Settings
- Access application preferences
- Configure dark mode (theme toggle)
- Manage admin settings

## Technical Details

### Architecture
- **Frontend:** Next.js 16 with React 19
- **Styling:** Tailwind CSS + shadcn/ui components
- **Authentication:** JWT tokens with secure HTTP-only cookies
- **Data:** Mock data for demo (no database setup required)

### API Endpoints
All endpoints are protected with JWT authentication:

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/students` - List all students
- `POST /api/students` - Add new student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student
- `GET /api/payments` - List all payments
- `POST /api/payments` - Record payment
- `GET /api/payments/[studentId]` - Get payment history
- `GET /api/seats` - List all seats
- `GET /api/dashboard/summary` - Dashboard KPI data

## Using the Application

### Adding a Student
1. Go to Students page
2. Click "Add Student"
3. Enter name, phone number, monthly fee, and seat number
4. Click "Add Student" to save

### Recording a Payment
1. Go to Fees & Payments
2. Select a student from the dropdown
3. Enter payment amount
4. Choose payment method
5. Add optional notes
6. Click "Record Payment"

### Viewing Seat Status
1. Go to Seats page
2. View the 50-seat grid
3. Green seats = Available
4. Blue seats = Occupied
5. Hover over a seat for details

### Generating Reports
1. Go to Reports
2. Click "Export Students" to download CSV of all students
3. Click "Export Overdue" to download overdue students report
4. View revenue analytics on the page

## Features & Calculations

- **Automatic Due Date Calculation:** Set to 30 days from joining date
- **Status Calculation:** Automatically marks students as "overdue" if next due date has passed
- **Seat Conflict Prevention:** System prevents duplicate seat assignments
- **Duplicate Phone Prevention:** Cannot register two students with same phone number
- **Overdue Alerts:** Displays alerts for students with overdue payments
- **Upcoming Due Alerts:** Alerts for payments due within 3 days

## Demo Data

The system comes pre-loaded with sample data:
- 5 sample students (some active, some overdue)
- 2 sample payment records
- 50 seats (first 5 occupied, rest available)
- Sample KPI metrics for dashboard

You can freely add, edit, and delete these records to test the system.

## Troubleshooting

### Login Not Working
- Ensure you're using the correct credentials: `admin@library.com` / `admin123`
- Check the browser console for any error messages
- Try refreshing the page

### Students Not Loading
- Ensure you're logged in first
- Check the browser's Network tab for API response errors
- The data is stored in memory, so it will reset if you refresh the page

### Pages Not Displaying
- Clear browser cache and reload
- Check that JavaScript is enabled in your browser
- Try a different browser if issues persist

## Next Steps

To make this production-ready:
1. Connect to MongoDB or your preferred database
2. Implement proper session management with database storage
3. Add email notifications for overdue payments
4. Create admin management for multiple users
5. Add SMS notifications for payment reminders
6. Implement backup and export functionality
7. Add audit logs for all transactions

## Support

For issues or questions, check the console logs in your browser's developer tools for detailed error messages.

Happy managing! 📚
