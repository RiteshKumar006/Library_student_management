'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CreditCard,
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
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col overflow-hidden shadow-lg`}
      >
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-2xl font-bold">LibraryHub</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-700 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors group">
                <item.icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={logout}
            variant="destructive"
            size="sm"
            className="w-full flex items-center gap-2 justify-center"
          >
            <LogOut size={16} />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
