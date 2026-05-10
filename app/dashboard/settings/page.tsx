'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Moon, Sun, User, Mail, Phone, Building, MapPin, Lock, Save, X, Loader2, AlertCircle } from 'lucide-react';
import { Admin } from '@/types';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Admin profile state
  const [admin, setAdmin] = useState<Partial<Admin>>({
    name: '',
    email: '',
    phone: '',
    libraryName: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    // Check system preference or stored setting
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSuccessMessage('Theme updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Fetch admin profile
  const fetchAdminProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.data || {});
      } else {
        setErrorMessage('Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setErrorMessage('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check system preference or stored setting
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    // Fetch admin profile
    if (token) {
      fetchAdminProfile();
    }
  }, [token]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(admin),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Profile updated successfully');
        setIsEditing(false);
      } else {
        setErrorMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMessage('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setErrorMessage(data.message || 'Failed to change password');
      }
    } catch (err) {
      setErrorMessage('Failed to change password');
      console.error('Error changing password:', err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your preferences and library settings</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleProfileUpdate}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Loading settings...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-indigo-600" />
                Profile Information
              </CardTitle>
              <CardDescription>Manage your personal and library details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={admin.name || ''}
                      onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                      placeholder="Enter your name"
                      className="h-10"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                      {admin.name || 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={admin.email || ''}
                      onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                      placeholder="admin@library.com"
                      className="h-10"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                      {admin.email || 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={admin.phone || ''}
                      onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="h-10"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                      {admin.phone || 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    Library Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={admin.libraryName || ''}
                      onChange={(e) => setAdmin({ ...admin, libraryName: e.target.value })}
                      placeholder="Your Library Hub"
                      className="h-10"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
                      {admin.libraryName || 'Not set'}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Address
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={admin.address || ''}
                      onChange={(e) => setAdmin({ ...admin, address: e.target.value })}
                      placeholder="Library address"
                      rows={3}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-gray-100 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[3.5rem]">
                      {admin.address || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-indigo-600" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                <div className="space-y-2">
                  <label htmlFor="current-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Current Password
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="h-10"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="New password"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  variant="outline"
                  className="mt-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {darkMode ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-yellow-600" />}
                Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {darkMode ? 'Dark mode is enabled' : 'Switch to dark mode'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleDarkMode}
                  variant={darkMode ? 'default' : 'outline'}
                  className={darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  {darkMode ? 'On' : 'Off'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Library Configuration (Read-only) */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Library Configuration
              </CardTitle>
              <CardDescription>Basic library settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Library Name</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {admin.libraryName || 'Your Library Hub'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Seats</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">50</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fee Schedule</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Monthly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>About LibraryHub</CardTitle>
              <CardDescription>System information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Platform</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Next.js 16 with React 19</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Database</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">MongoDB</span>
                </div>
                <p className="pt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  LibraryHub is a comprehensive library sitting management system designed to help administrators efficiently manage students, fees, seats, and generate detailed reports.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
