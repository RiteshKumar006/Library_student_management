'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ReceiptText,
  Armchair,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', icon: Users },
  { href: '/dashboard/fees', label: 'Fees & Payments', icon: CreditCard },
  { href: '/dashboard/expenses', label: 'Library Expenses', icon: ReceiptText },
  { href: '/dashboard/seats', label: 'Seats', icon: Armchair },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950 lg:flex">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <div>
          <h1 className="text-lg font-bold text-slate-950">LibraryHub</h1>
          <p className="text-xs font-medium text-slate-500">Admin workspace</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,20rem)] flex-col overflow-hidden bg-slate-950 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h1 className="text-2xl font-bold">LibraryHub</h1>
                <p className="text-xs font-medium text-slate-400">Admin workspace</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)}>
                    <div
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-700 p-4">
              <Button
                onClick={() => {
                  setMobileNavOpen(false);
                  logout();
                }}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden h-screen flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-lg transition-all duration-300 lg:flex`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          {sidebarOpen && (
            <div>
              <h1 className="text-2xl font-bold">LibraryHub</h1>
              <p className="text-xs font-medium text-slate-400">Admin workspace</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  } ${sidebarOpen ? '' : 'justify-center px-3'}`}
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Button
            onClick={logout}
            variant="destructive"
            size="sm"
            className="flex w-full items-center justify-center gap-2"
          >
            <LogOut size={16} />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-auto">
        <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
