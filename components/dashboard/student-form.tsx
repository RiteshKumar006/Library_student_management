'use client';

import { useEffect, useState } from 'react';
import { ApiResponse, Seat, Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, X, User, Phone, Users, Calendar, DollarSign, CreditCard, Check, ArrowRight } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';

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
    joiningDate: student?.joiningDate
      ? new Date(student.joiningDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    monthlyFee: student?.monthlyFee || '',
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
  const availableSeats = seats.filter(
    (seat) => seat.isAvailable || seat.seatNumber === currentSeatNumber
  );

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

    const normalizedAadhar = formData.aadharNumber.replace(/\s/g, '');
    if (normalizedAadhar && !/^\d{12}$/.test(normalizedAadhar)) {
      setError('Aadhaar number must be 12 digits');
      return;
    }

    try {
      await onSubmit({ ...formData, aadharNumber: normalizedAadhar });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-6 flex flex-row items-center justify-between space-y-0 rounded-t-lg">
        <div>
          <CardTitle className="text-white text-2xl">{student ? '✏️ Edit Student' : '➕ Add New Student'}</CardTitle>
          <p className="text-blue-100 text-sm mt-1">{student ? 'Update student information' : 'Register a new student to the library'}</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all">
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
          <FormSection title="Seat & Schedule" icon={<Calendar size={18} />} description="Assign seat and enrollment date">
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
                  <option value="">{isSeatsLoading ? 'Loading seats...' : `Select a seat (${availableSeats.length} available)`}</option>
                  {availableSeats.map((seat) => (
                    <option key={seat.seatNumber} value={seat.seatNumber}>
                      Seat {seat.seatNumber} {!seat.isAvailable && '(Current)'}
                    </option>
                  ))}
                </select>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex gap-3">
                  {['paid', 'pending'].map((status) => (
                    <label
                      key={status}
                      className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                        className="mr-2"
                      />
                      <span className="font-medium">
                        {status === 'paid' ? '💳 Paid Now' : '⏳ Not Paid Yet'}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
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
                            className="hidden"
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
            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="px-6">
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

           
