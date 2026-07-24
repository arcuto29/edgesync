'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Target,
  AlertTriangle,
  Moon,
  Activity,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import PnlChart from '@/components/dashboard/PnlChart';
import CalendarHeatmap from '@/components/dashboard/CalendarHeatmap';
import RecentTrades from '@/components/dashboard/RecentTrades';
import HeroRing from '@/components/dashboard/HeroRing';
import { useStore } from '@/store';
import { generateDemoAccounts, generateDemoTrades, generateDemoHealthData, generateDemoJournalEntries } from '@/lib/demo-data';

export default function Dashboard() {
  const trades = useStore((state) => state.trades);
  const accounts = useStore((state) => state.accounts);
  const healthData = useStore((state) => state.healthData);
  const addAccount = useStore((state) => state.addAccount);
  const addTrades = useStore((state) => state.addTrades);
  const addHealthData = useStore((state) => state.addHealthData);
  const addJournalEntry = useStore((state) => state.addJournalEntry);

  const [demoLoaded, setDemoLoaded] = useState(false);

  const loadDemoData = () => {
    const demoAccounts = generateDemoAccounts();
    demoAccounts.forEach((a) => addAccount(a));
    const demoTrades = generateDemoTrades(demoAccounts);
    addTrades(demoTrades);
    const demoHealth = generateDemoHealthData();
    demoHealth.forEach((h) => addHealthData(h));
    const demoJournal = generateDemoJournalEntries();
    demoJournal.forEach((j) => addJournalEntry(j));
    setDemoLoaded(true);
  };

  const closedTrades = trades.filter((t) => t.status === 'closed');
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const winningTrades = closedTrades.filter((t) => (t.netPnl || 0) > 0);
  const winRate = closedTrades.length > 0
    ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1)
    : '0';
  
  const avgRMultiple = closedTrades.length > 0
    ? (closedTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / closedTrades.length).toFixed(2)
    : '0';

  // Max drawdown calculation
  let maxDrawdown = 0;
  let peak = 0;
  let runningPnl = 0;
  const sortedTrades = [...closedTrades].sort((a, b) => 
    (a.exitTime || '').localeCompare(b.exitTime || '')
  );
  for (const trade of sortedTrades) {
    runningPnl += trade.netPnl || 0;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Latest health data
  const latestHealth = healthData.length > 0
    ? healthData[healthData.length - 1]
    : null;

  return (
    <div className="space-y-8">
      {/* Hero Ring Section */}
      <HeroRing />

      {/* Demo Data CTA — only shows when app is empty */}
      {trades.length === 0 && !demoLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex justify-center"
        >
          <button
            onClick={loadDemoData}
            className="flex items-center gap-2 rounded-xl bg-secondary border border-border/50 px-6 py-3 text-sm font-medium text-white hover:border-primary/30 hover:bg-secondary/80 transition-all duration-300 group"
          >
            <Zap className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            Load Demo Data — See Everything in Action
          </button>
        </motion.div>
      )}

      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your trading performance at a glance
        </p>
      </motion.div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total P&L"
          value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`}
          change={`${closedTrades.length} total trades`}
          changeType={totalPnl >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
          delay={0}
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          change={`${winningTrades.length}W / ${closedTrades.length - winningTrades.length}L`}
          changeType={Number(winRate) >= 50 ? 'positive' : 'negative'}
          icon={Target}
          delay={0.05}
        />
        <StatCard
          title="Avg R-Multiple"
          value={`${Number(avgRMultiple) >= 0 ? '+' : ''}${avgRMultiple}R`}
          change="Risk-adjusted return"
          changeType={Number(avgRMultiple) >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          delay={0.1}
        />
        <StatCard
          title="Max Drawdown"
          value={`-$${maxDrawdown.toFixed(2)}`}
          change="Peak to trough"
          changeType={maxDrawdown > 0 ? 'negative' : 'neutral'}
          icon={AlertTriangle}
          delay={0.15}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Accounts"
          value={`${accounts.filter((a) => a.isActive).length}`}
          subtitle={`${accounts.filter((a) => a.type === 'prop').length} prop / ${accounts.filter((a) => a.type === 'live').length} live`}
          icon={BarChart3}
          delay={0.2}
        />
        <StatCard
          title="Avg Duration"
          value="--"
          subtitle="Coming with more data"
          icon={Clock}
          delay={0.25}
        />
        <StatCard
          title="Sleep Score"
          value={latestHealth?.sleepScore ? `${latestHealth.sleepScore}` : '--'}
          subtitle={latestHealth ? 'Latest from ring' : 'Connect your ring'}
          changeType={latestHealth?.sleepScore && latestHealth.sleepScore >= 75 ? 'positive' : 'neutral'}
          icon={Moon}
          delay={0.3}
        />
        <StatCard
          title="Readiness"
          value={latestHealth?.readinessScore ? `${latestHealth.readinessScore}` : '--'}
          subtitle={latestHealth ? 'Latest from ring' : 'Connect your ring'}
          changeType={latestHealth?.readinessScore && latestHealth.readinessScore >= 75 ? 'positive' : 'neutral'}
          icon={Activity}
          delay={0.35}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PnlChart />
        </div>
        <div className="lg:col-span-2">
          <RecentTrades />
        </div>
      </div>

      {/* Calendar Heatmap */}
      <CalendarHeatmap />
    </div>
  );
}
