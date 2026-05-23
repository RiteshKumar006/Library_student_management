'use client';

import { useEffect, useState } from 'react';
import { Admin } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit3,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Moon,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [admin, setAdmin] = useState<Partial<Admin>>({
    name: '',
    email: '',
    phone: '',
    libraryName: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    if (token) {
      fetchAdminProfile();
    }
  }, [token]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleDarkMode = () => {
    const nextDarkMode = !darkMode;
    setDarkMode(nextDarkMode);
    localStorage.setItem('darkMode', nextDarkMode.toString());
    document.documentElement.classList.toggle('dark', nextDarkMode);
    showSuccess('Appearance updated successfully');
  };

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
        setErrorMessage('');
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

  const handleProfileUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
        setAdmin(data.data || admin);
        setIsEditing(false);
        showSuccess('Profile updated successfully');
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
    setSuccessMessage('');

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
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showSuccess('Password changed successfully');
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

  const profileCompletion = getProfileCompletion(admin);

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <section className="overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#eef9f6_55%,#fff7ed_100%)] shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_22rem] lg:p-7">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-50">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Workspace Settings
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white/70 text-slate-600">
                {darkMode ? 'Dark theme' : 'Light theme'}
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage admin details, account security, and library preferences from one clean place.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Profile readiness</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{profileCompletion}%</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-700" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {admin.libraryName || 'Library profile'} is connected to {admin.email || 'your admin account'}.
            </p>
          </div>
        </div>
      </section>

      {successMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-3 border-teal-100 border-t-teal-700" />
            <p className="text-sm text-slate-600">Loading settings...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-950">
                    <User className="h-5 w-5 text-teal-700" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Details used across your admin workspace.</CardDescription>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={() => handleProfileUpdate()} disabled={isSaving} className="bg-teal-700 hover:bg-teal-800">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-slate-950 hover:bg-slate-800">
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleProfileUpdate} className="grid gap-5 sm:grid-cols-2">
                  <SettingsField
                    icon={<User className="h-4 w-4" />}
                    label="Full Name"
                    value={admin.name}
                    isEditing={isEditing}
                  >
                    <Input
                      value={admin.name || ''}
                      onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                      placeholder="Enter your name"
                      className="h-11 border-slate-200"
                    />
                  </SettingsField>

                  <SettingsField
                    icon={<Mail className="h-4 w-4" />}
                    label="Email Address"
                    value={admin.email}
                    helper="Email is used for login"
                    isEditing={false}
                  />

                  <SettingsField
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone Number"
                    value={admin.phone}
                    isEditing={isEditing}
                  >
                    <Input
                      type="tel"
                      value={admin.phone || ''}
                      onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="h-11 border-slate-200"
                    />
                  </SettingsField>

                  <SettingsField
                    icon={<Building className="h-4 w-4" />}
                    label="Library Name"
                    value={admin.libraryName}
                    isEditing={isEditing}
                  >
                    <Input
                      value={admin.libraryName || ''}
                      onChange={(e) => setAdmin({ ...admin, libraryName: e.target.value })}
                      placeholder="Your Library Hub"
                      className="h-11 border-slate-200"
                    />
                  </SettingsField>

                  <div className="sm:col-span-2">
                    <SettingsField
                      icon={<MapPin className="h-4 w-4" />}
                      label="Address"
                      value={admin.address}
                      isEditing={isEditing}
                    >
                      <Textarea
                        value={admin.address || ''}
                        onChange={(e) => setAdmin({ ...admin, address: e.target.value })}
                        placeholder="Library address"
                        rows={3}
                        className="resize-none border-slate-200"
                      />
                    </SettingsField>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  <LockKeyhole className="h-5 w-5 text-teal-700" />
                  Account Security
                </CardTitle>
                <CardDescription>Update your password when access needs to be refreshed.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePasswordChange} className="grid gap-4 lg:grid-cols-3">
                  <PasswordField
                    id="current-password"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(value) => setPasswordData({ ...passwordData, currentPassword: value })}
                    placeholder="Current password"
                  />
                  <PasswordField
                    id="new-password"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={(value) => setPasswordData({ ...passwordData, newPassword: value })}
                    placeholder="At least 6 characters"
                  />
                  <PasswordField
                    id="confirm-password"
                    label="Confirm Password"
                    value={passwordData.confirmPassword}
                    onChange={(value) => setPasswordData({ ...passwordData, confirmPassword: value })}
                    placeholder="Confirm password"
                  />
                  <div className="lg:col-span-3">
                    <Button type="submit" disabled={isChangingPassword} variant="outline" className="border-slate-300 bg-white">
                      {isChangingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LockKeyhole className="h-4 w-4" />
                      )}
                      {isChangingPassword ? 'Updating...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  {darkMode ? <Moon className="h-5 w-5 text-slate-700" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  Appearance
                </CardTitle>
                <CardDescription>Choose the workspace theme.</CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                      {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                      <p className="text-sm text-slate-500">{darkMode ? 'Tap to switch off' : 'Tap to switch on'}</p>
                    </div>
                  </div>
                  <span
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      darkMode ? 'bg-teal-700' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  <Building className="h-5 w-5 text-teal-700" />
                  Library Setup
                </CardTitle>
                <CardDescription>Quick operating snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <ConfigTile icon={<Building className="h-4 w-4" />} label="Library" value={admin.libraryName || 'Your Library Hub'} tone="teal" />
                <ConfigTile icon={<User className="h-4 w-4" />} label="Admin" value={admin.name || 'Not set'} tone="sky" />
                <ConfigTile icon={<CircleDollarSign className="h-4 w-4" />} label="Fee Schedule" value="Monthly" tone="amber" />
                <ConfigTile icon={<Clock3 className="h-4 w-4" />} label="Version" value="1.0.0" tone="slate" />
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}

function SettingsField({
  icon,
  label,
  value,
  helper,
  isEditing,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  helper?: string;
  isEditing: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {label}
      </label>
      {isEditing && children ? (
        children
      ) : (
        <div className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900">
          {value || 'Not set'}
        </div>
      )}
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 border-slate-200"
        required
      />
    </div>
  );
}

function ConfigTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'teal' | 'sky' | 'amber' | 'slate';
}) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function getProfileCompletion(admin: Partial<Admin>) {
  const fields = [admin.name, admin.email, admin.phone, admin.libraryName, admin.address];
  const filled = fields.filter((field) => String(field || '').trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}
