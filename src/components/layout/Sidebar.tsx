'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  BarChart3,
  Wallet,
  Settings,
  Heart,
  Activity,
} from 'lucide-react';
import { useStore } from '@/store';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: TrendingUp },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Health', href: '/health', icon: Heart },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const trades = useStore((state) => state.trades);
  const accounts = useStore((state) => state.accounts);

  // Calculate today's P&L
  const today = new Date().toISOString().split('T')[0];
  const todayPnl = trades
    .filter((t) => t.exitTime && t.exitTime.startsWith(today) && t.status === 'closed')
    .reduce((sum, t) => sum + (t.netPnl || 0), 0);

  const activeAccounts = accounts.filter((a) => a.isActive).length;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] glass-strong flex flex-col">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Activity className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <span className="text-lg font-semibold text-white tracking-tight">EdgeSync</span>
          <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Trading Intelligence</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Navigation */}
      <nav className="mt-6 px-3 flex-1">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`relative h-[18px] w-[18px] transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`relative transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
                      layoutId="sidebar-indicator"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Stats */}
      <div className="p-4 space-y-3">
        {/* Active accounts pill */}
        {activeAccounts > 0 && (
          <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-secondary/50">
            <span className="text-xs text-muted-foreground">Active Accounts</span>
            <span className="text-xs font-medium text-white">{activeAccounts}</span>
          </div>
        )}

        {/* Today's P&L card */}
        <div className="rounded-xl bg-secondary/50 border border-border/50 p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Today&apos;s P&L</p>
          <p className={`text-xl font-bold mt-1 stat-value ${
            todayPnl > 0 ? 'text-profit' : todayPnl < 0 ? 'text-loss' : 'text-muted-foreground'
          }`}>
            {todayPnl !== 0 ? `${todayPnl > 0 ? '+' : ''}$${todayPnl.toFixed(2)}` : '--'}
          </p>
        </div>
      </div>
    </aside>
  );
}
