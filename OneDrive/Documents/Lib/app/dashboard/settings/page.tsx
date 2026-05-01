'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your preferences and library settings</p>
      </div>

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-600">
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
          </div>
        </CardContent>
      </Card>

      {/* Library Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Library Configuration</CardTitle>
          <CardDescription>Basic library settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Library Name:</strong> Your Library Hub
              </p>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Total Seats:</strong> 50
              </p>
              <p className="text-sm text-gray-700 mb-4">
                <strong>Fee Schedule:</strong> Monthly
              </p>
              <p className="text-xs text-gray-600">
                To update library configuration, contact support at admin@library.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Account Status:</strong>{' '}
                <span className="text-green-600 font-medium">Active</span>
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Login Method:</strong> Email & Password
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Last Login:</strong> Today
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About LibraryHub</CardTitle>
          <CardDescription>System information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Platform:</strong> Next.js 16 with React 19
            </p>
            <p>
              <strong>Database:</strong> MongoDB
            </p>
            <p className="pt-2 text-xs text-gray-600">
              LibraryHub is a comprehensive library sitting management system designed to help
              administrators efficiently manage students, fees, seats, and generate detailed
              reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
