'use client';

import { useEffect, useState } from 'react';
import { ApiResponse, Seat, Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, X, User, Phone, Users, Calendar, DollarSign, CreditCard, Check, ArrowRight, Clock } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';
import { PART_TIME_SHIFTS, Shift, getShiftMeta, normalizeShift, suggestedShiftFee } from '@/lib/shifts';

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StudentForm({ student, onSubmit, onCancel, isLoading }: StudentFormProps) {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    phone: student?.phone || '',
    seatNumber: student?.seatNumber || '',
    shift: normalizeShift(student?.shift),
    joiningDate: student?.joiningDate
      ? new Date(student.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    // Full-day rate the fee is derived from
    monthlyFee: student?.baseMonthlyFee || student?.monthlyFee || '',
    // Effective rate charged while the student is on a part-time shift
    partTimeFee:
      student && normalizeShift(student.shift) !== 'full' ? student.monthlyFee || '' : '',
    feePaidTillDate: student?.feePaidTillDate
      ? new Date(student.feePaidTillDate).toISOString().split('T')[0]
      : '',
    parentPhone: student?.parentPhone || '',
    aadharNumber: student?.aadharNumber || '',
    photoUrl: student?.photoUrl || '',
    admittedBy: student?.admittedBy || '',
    initialFeeStatus: student ? 'skip' : 'paid',
    paymentMethod: 'cash',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isSeatsLoading, setIsSeatsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  // Once the admin edits the part-time fee we stop auto-suggesting over it
  const [feeTouched, setFeeTouched] = useState(
    Boolean(student && normalizeShift(student.shift) !== 'full')
  );

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setIsSeatsLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/seats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load seats');
        }

        const result = (await response.json()) as ApiResponse<{ seats: Seat[] }>;
        setSeats(result.data?.seats || []);
      } catch (err) {
        console.error('[v0] Seats fetch error:', err);
        setError('Unable to load available seats');
      } finally {
        setIsSeatsLoading(false);
      }
    };

    fetchSeats();
  }, []);

  const currentSeatNumber = student?.seatNumber ? Number(student.seatNumber) : null;
  const selectedShift = formData.shift as Shift;
  const isPartTime = selectedShift !== 'full';

  // Only seats whose chosen shift is still open (plus the student's own seat)
  const availableSeats = seats.filter((seat) => {
    if (seat.seatNumber === currentSeatNumber) return true;
    const openShifts = seat.openShifts || (seat.isAvailable ? ['full', 'morning', 'afternoon', 'evening'] : []);
    return openShifts.includes(selectedShift);
  });

  const seatMatesFor = (seatNumber: number) =>
    (seats.find((seat) => seat.seatNumber === seatNumber)?.occupants || []).filter(
      (occupant) => occupant._id !== student?._id
    );

  const handleShiftChange = (shift: Shift) => {
    setError('');
    setFormData((prev) => {
      // Drop the seat if it isn't free for the newly picked hours
      const seat = seats.find((item) => item.seatNumber === Number(prev.seatNumber));
      const stillValid =
        !prev.seatNumber ||
        Number(prev.seatNumber) === currentSeatNumber ||
        (seat?.openShifts || []).includes(shift);

      // Re-suggest the part-time fee unless the admin typed their own figure
      const partTimeFee =
        shift === 'full'
          ? ''
          : feeTouched
            ? prev.partTimeFee
            : suggestedShiftFee(Number(prev.monthlyFee || 0), shift);

      return {
        ...prev,
        shift,
        partTimeFee,
        seatNumber: stillValid ? prev.seatNumber : '',
      };
    });
  };

  // The amount this student will actually be billed each month
  const effectiveMonthlyFee = isPartTime
    ? Number(formData.partTimeFee || 0)
    : Number(formData.monthlyFee || 0);
  const suggestedFee = suggestedShiftFee(Number(formData.monthlyFee || 0), selectedShift);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processPhotoFile(file);
  };

  const processPhotoFile = (file: File | undefined) => {
    setError('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Photo must be smaller than 1 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photoUrl: String(reader.result || '') }));
    };
    reader.onerror = () => {
      setError('Unable to read selected photo');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone is required');
      return;
    }

    if (!formData.seatNumber) {
      setError('Seat number is required');
      return;
    }

    if (!formData.monthlyFee) {
      setError('Monthly fee is required');
      return;
    }

    if (isPartTime && !(Number(formData.partTimeFee) > 0)) {
      setError(`Enter the monthly fee for the ${getShiftMeta(selectedShift).label} shift`);
      return;
    }

    const normalizedAadhar = formData.aadharNumber.replace(/\s/g, '');
    if (normalizedAadhar && !/^\d{12}$/.test(normalizedAadhar)) {
      setError('Aadhaar number must be 12 digits');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        aadharNumber: normalizedAadhar,
        // monthlyFee is the full-day rate; the server derives what is actually billed
        baseMonthlyFee: formData.monthlyFee,
        partTimeFee: isPartTime ? formData.partTimeFee : '',
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-6 flex flex-row items-center justify-between space-y-0 rounded-t-lg">
        <div className="min-w-0">
          <CardTitle className="truncate text-xl text-white sm:text-2xl">
            {student ? '✏️ Edit Student' : '➕ Add New Student'}
          </CardTitle>
          <p className="mt-1 text-sm text-blue-100">
            {student ? 'Update student information' : 'Register a new student to the library'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="shrink-0 rounded-full p-2 transition-all hover:bg-white/20"
        >
          <X size={24} />
        </button>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✓ Student {student ? 'updated' : 'created'} successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Section */}
          <PhotoUploadSection
            photoUrl={formData.photoUrl}
            isLoading={isLoading}
            onPhotoChange={handlePhotoChange}
            onPhotoClear={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
            onDrag={handleDrag}
            onDrop={handleDrop}
            dragActive={dragActive}
          />

          {/* Personal Information */}
          <FormSection title="Personal Information" icon={<User size={18} />} description="Basic student details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Student Name"
                name="name"
                type="text"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
                icon={<User size={16} />}
              />
              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="10-digit mobile"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                required
                icon={<Phone size={16} />}
              />
              <FormField
                label="Parent Phone"
                name="parentPhone"
                type="tel"
                placeholder="Optional"
                value={formData.parentPhone}
                onChange={handleChange}
                disabled={isLoading}
                icon={<Phone size={16} />}
              />
              <FormField
                label="Aadhaar Number"
                name="aadharNumber"
                type="text"
                placeholder="12-digit Aadhaar"
                value={formData.aadharNumber}
                onChange={handleChange}
                disabled={isLoading}
                maxLength={12}
                icon={<Users size={16} />}
              />
            </div>
          </FormSection>

          {/* Seat & Schedule */}
          <FormSection title="Seat & Schedule" icon={<Calendar size={18} />} description="Assign seat, hours and enrollment date">
            {/* Full day vs part-time toggle */}
            <div className="mb-4 rounded-lg border-2 border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <div className="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Part-time seat sharing</p>
                    <p className="text-xs text-gray-600">
                      Turn on if the student attends only for a few hours, so the same seat can be
                      reused by someone in another shift.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isPartTime}
                  aria-label="Part-time seat sharing"
                  disabled={isLoading}
                  onClick={() => handleShiftChange(isPartTime ? 'full' : 'morning')}
                  className={`relative mt-0.5 inline-block h-7 w-14 shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isPartTime ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      isPartTime ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isPartTime ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Select shift</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {PART_TIME_SHIFTS.map((shift) => (
                      <button
                        key={shift.value}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleShiftChange(shift.value)}
                        className={`rounded-lg border-2 p-3 text-left transition-all ${
                          selectedShift === shift.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {shift.icon} {shift.label}
                        </span>
                        <p className="mt-0.5 text-xs text-gray-600">{shift.time}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  ☀️ Full Day — seat is reserved all day and cannot be shared.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users size={16} />
                  Seat Number <span className="text-red-500">*</span>
                </label>
                <select
                  name="seatNumber"
                  value={formData.seatNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">
                    {isSeatsLoading
                      ? 'Loading seats...'
                      : `Select a seat (${availableSeats.length} free for ${getShiftMeta(selectedShift).label})`}
                  </option>
                  {availableSeats.map((seat) => {
                    const mates = seatMatesFor(seat.seatNumber);
                    return (
                      <option key={seat.seatNumber} value={seat.seatNumber}>
                        Seat {seat.seatNumber}
                        {seat.seatNumber === currentSeatNumber && ' (Current)'}
                        {mates.length > 0 &&
                          ` — shared with ${mates
                            .map((mate) => `${mate.name} (${getShiftMeta(mate.shift).label})`)
                            .join(', ')}`}
                      </option>
                    );
                  })}
                </select>
                {!isSeatsLoading && availableSeats.length === 0 && (
                  <p className="text-xs text-red-600">
                    No seat is free for the {getShiftMeta(selectedShift).label} shift. Try another
                    shift.
                  </p>
                )}
              </div>
              <FormField
                label="Joining Date"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
                disabled={isLoading}
                required
                icon={<Calendar size={16} />}
              />
            </div>
          </FormSection>

          {/* Fee Information */}
          <FormSection title="Fee Information" icon={<DollarSign size={18} />} description="Monthly fee and paid-through date">
            {isPartTime && (
              <div className="mb-4 space-y-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    label="Full Day Fee (₹)"
                    name="monthlyFee"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.monthlyFee}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    icon={<DollarSign size={16} />}
                  />
                  <div className="space-y-2">
                    <label htmlFor="partTimeFee" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <DollarSign size={16} className="text-gray-500" />
                      {getShiftMeta(selectedShift).label} Fee (₹)
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="partTimeFee"
                      name="partTimeFee"
                      type="number"
                      step="0.01"
                      min="1"
                      value={formData.partTimeFee}
                      onChange={(event) => {
                        setFeeTouched(true);
                        handleChange(event);
                      }}
                      disabled={isLoading}
                      required
                      className="border-2 border-amber-300 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-2">
                  <p className="text-xs text-amber-800">
                    This student is billed <strong>₹{effectiveMonthlyFee.toLocaleString('en-IN')}/month</strong>{' '}
                    for the {getShiftMeta(selectedShift).label} shift — not the full-day rate.
                  </p>
                  {Number(formData.partTimeFee) !== suggestedFee && suggestedFee > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFeeTouched(false);
                        setFormData((prev) => ({
                          ...prev,
                          partTimeFee: suggestedShiftFee(Number(prev.monthlyFee || 0), selectedShift),
                        }));
                      }}
                      className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Use half (₹{suggestedFee.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isPartTime && (
                <FormField
                  label="Monthly Fee (₹)"
                  name="monthlyFee"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.monthlyFee}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  icon={<DollarSign size={16} />}
                />
              )}
              <FormField
                label="Fees Paid Till Date"
                name="feePaidTillDate"
                type="date"
                value={formData.feePaidTillDate}
                onChange={handleChange}
                disabled={isLoading}
                icon={<Calendar size={16} />}
              />
              <FormField
                label="Admitted By"
                name="admittedBy"
                type="text"
                placeholder="Staff/Admin name"
                value={formData.admittedBy}
                onChange={handleChange}
                disabled={isLoading}
                icon={<User size={16} />}
              />
            </div>
          </FormSection>

          {/* Initial Payment Section (Only for new students) */}
          {!student && (
            <FormSection title="Initial Payment" icon={<CreditCard size={18} />} description="First month fee payment">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {['paid', 'pending'].map((status) => (
                    <label
                      key={status}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        formData.initialFeeStatus === status
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="initialFeeStatus"
                        value={status}
                        checked={formData.initialFeeStatus === status}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="font-medium">
                        {status === 'paid' ? '💳 Paid Now' : '⏳ Not Paid Yet'}
                      </span>
                      <p className="mt-1 text-xs text-gray-600">
                        {status === 'paid' ? 'Record payment on enrollment' : 'Collect later'}
                      </p>
                    </label>
                  ))}
                </div>

                {formData.initialFeeStatus === 'paid' && (
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CreditCard size={16} />
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method}
                          className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                            formData.paymentMethod === method
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={formData.paymentMethod === method}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium capitalize">
                            {method === 'cash' && '💵'}
                            {method === 'upi' && '📱'}
                            {method === 'check' && '📋'}
                            {method === 'online' && '🏦'}
                            {' ' + method}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  {student ? '✏️ Update Student' : '➕ Add Student'}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  required = false,
  icon,
  maxLength,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  maxLength?: number;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        step={step}
        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
    </div>
  );
}

function PhotoUploadSection({
  photoUrl,
  isLoading,
  onPhotoChange,
  onPhotoClear,
  onDrag,
  onDrop,
  dragActive,
}: {
  photoUrl: string;
  isLoading?: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoClear: () => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  dragActive: boolean;
}) {
  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Upload size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Student Photo</h3>
          <p className="text-xs text-gray-600">Upload a clear profile photo (Max 1MB)</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Photo Preview */}
        <div
          className={`flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
            photoUrl
              ? 'border-green-300 bg-green-50'
              : dragActive
                ? 'border-blue-500 border-dashed bg-blue-50'
                : 'border-gray-300 bg-white'
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="Student preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Drag here</p>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <div className="relative">
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              disabled={isLoading}
              className="hidden"
            />
            <label
              htmlFor="photo"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg cursor-pointer transition-all font-medium text-sm"
            >
              <Upload size={16} />
              Choose Photo
            </label>
          </div>

          {photoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPhotoClear}
              disabled={isLoading}
              className="w-full"
            >
              ✕ Remove Photo
            </Button>
          )}

          <p className="text-xs text-gray-600">
            💡 Tip: You can also drag and drop an image onto the preview area
          </p>
        </div>
      </div>
    </div>
  );
}

           
