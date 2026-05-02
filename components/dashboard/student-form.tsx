'use client';

import { useState } from 'react';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, X } from 'lucide-react';
import { PAYMENT_METHODS, SEAT_RANGE } from '@/lib/constants';

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
    parentPhone: student?.parentPhone || '',
    aadharNumber: student?.aadharNumber || '',
    photoUrl: student?.photoUrl || '',
    admittedBy: student?.admittedBy || '',
    initialFeeStatus: student ? 'skip' : 'paid',
    paymentMethod: 'cash',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle>{student ? 'Edit Student' : 'Add New Student'}</CardTitle>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X size={20} />
        </button>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Student {student ? 'updated' : 'created'} successfully
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="photo" className="text-sm font-medium text-gray-700">
                Student Photo
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-300 bg-gray-50">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Student preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Upload className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isLoading}
                  />
                  {formData.photoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                      disabled={isLoading}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Student Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter student name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="seatNumber" className="text-sm font-medium text-gray-700">
                Seat Number *
              </label>
              <select
                id="seatNumber"
                name="seatNumber"
                value={formData.seatNumber}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a seat</option>
                {Array.from({ length: SEAT_RANGE }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Seat {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="joiningDate" className="text-sm font-medium text-gray-700">
                Joining Date *
              </label>
              <Input
                id="joiningDate"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="monthlyFee" className="text-sm font-medium text-gray-700">
                Monthly Fee (₹) *
              </label>
              <Input
                id="monthlyFee"
                name="monthlyFee"
                type="number"
                step="0.01"
                value={formData.monthlyFee}
                onChange={handleChange}
                placeholder="Enter monthly fee"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="parentPhone" className="text-sm font-medium text-gray-700">
                Parent Phone Number
              </label>
              <Input
                id="parentPhone"
                name="parentPhone"
                type="tel"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="Optional parent contact"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="aadharNumber" className="text-sm font-medium text-gray-700">
                Aadhaar Number
              </label>
              <Input
                id="aadharNumber"
                name="aadharNumber"
                type="text"
                inputMode="numeric"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="12-digit Aadhaar number"
                maxLength={12}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admittedBy" className="text-sm font-medium text-gray-700">
                Admitted By
              </label>
              <Input
                id="admittedBy"
                name="admittedBy"
                type="text"
                value={formData.admittedBy}
                onChange={handleChange}
                placeholder="Enter staff/admin name"
                disabled={isLoading}
              />
            </div>

            {!student && (
              <>
                <div className="space-y-2">
                  <label htmlFor="initialFeeStatus" className="text-sm font-medium text-gray-700">
                    First Month Fee *
                  </label>
                  <select
                    id="initialFeeStatus"
                    name="initialFeeStatus"
                    value={formData.initialFeeStatus}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="paid">Paid now</option>
                    <option value="pending">Not paid yet</option>
                  </select>
                </div>

                {formData.initialFeeStatus === 'paid' && (
                  <div className="space-y-2">
                    <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                      Payment Method *
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
