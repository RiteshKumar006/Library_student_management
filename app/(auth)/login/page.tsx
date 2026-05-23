'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { message: `Login request failed with status ${response.status}` };

      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('[v0] Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef9f6_48%,#fff7ed_100%)] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/70 p-8 shadow-sm backdrop-blur">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e,#f59e0b,#2563eb)]" />

            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Welcome back to</p>
                <h1 className="text-3xl font-bold tracking-normal text-slate-950">LibraryHub</h1>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Today</p>
                  <p className="text-2xl font-bold text-slate-950">Admin Desk</p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Open
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  ['Students', 'Active records ready', 'bg-teal-50 text-teal-700'],
                  ['Fees', 'Payments and dues synced', 'bg-amber-50 text-amber-700'],
                  ['Seats', 'Availability at a glance', 'bg-sky-50 text-sky-700'],
                ].map(([title, subtitle, tone]) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="text-sm text-slate-500">{subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-lg border border-teal-100 bg-teal-50/80 p-4 text-teal-900">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p className="text-sm">Secure staff access for daily library operations.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">LibraryHub</p>
              <h1 className="text-2xl font-bold text-slate-950">Admin Login</h1>
            </div>
          </div>

          <Card className="border border-white/80 bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-950">Sign in</CardTitle>
                <CardDescription className="mt-2 text-slate-500">
                  Enter your admin credentials to continue.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 border-slate-200 bg-white pl-10 focus-visible:ring-teal-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 border-slate-200 bg-white pl-10 focus-visible:ring-teal-600"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full bg-teal-700 font-semibold text-white shadow-sm hover:bg-teal-800"
                >
                  {isLoading ? (
                    'Signing in...'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-xs text-slate-600">
                  <strong>Demo Credentials:</strong>
                </p>
                <p className="mb-1 text-xs text-slate-600">Email: admin@library.com</p>
                <p className="text-xs text-slate-600">Password: admin123</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
