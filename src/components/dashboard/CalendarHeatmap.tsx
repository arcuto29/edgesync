'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { format, subDays } from 'date-fns';

export default function CalendarHeatmap() {
  const trades = useStore((state) => state.trades);

  // Generate last 90 days
  const today = new Date();
  const days = Array.from({ length: 90 }, (_, i) => {
    const date = subDays(today, 89 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTrades = trades.filter(
      (t) => t.exitTime && t.exitTime.startsWith(dateStr) && t.status === 'closed'
    );
    const pnl = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    return {
      date: dateStr,
      pnl,
      trades: dayTrades.length,
      label: format(date, 'MMM dd'),
    };
  });

  const getColor = (pnl: number, tradeCount: number) => {
    if (tradeCount === 0) return 'bg-secondary/40';
    if (pnl > 500) return 'bg-green-400/90';
    if (pnl > 200) return 'bg-green-500/70';
    if (pnl > 0) return 'bg-green-600/50';
    if (pnl > -200) return 'bg-red-600/50';
    if (pnl > -500) return 'bg-red-500/70';
    return 'bg-red-400/90';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl bg-card border border-border/50 p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 90 days of trading</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Loss</span>
          <div className="flex gap-[2px]">
            <div className="w-2.5 h-2.5 rounded-[3px] bg-red-400/90" />
            <div className="w-2.5 h-2.5 rounded-[3px] bg-red-600/50" />
            <div className="w-2.5 h-2.5 rounded-[3px] bg-secondary/40" />
            <div className="w-2.5 h-2.5 rounded-[3px] bg-green-600/50" />
            <div className="w-2.5 h-2.5 rounded-[3px] bg-green-400/90" />
          </div>
          <span>Profit</span>
        </div>
      </div>
      
      <div className="flex gap-[3px] flex-wrap">
        {days.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, delay: i * 0.005 }}
            className={`heatmap-cell w-[14px] h-[14px] ${getColor(day.pnl, day.trades)} cursor-pointer`}
            title={`${day.label}: ${day.trades > 0 ? `$${day.pnl.toFixed(0)} (${day.trades} trades)` : 'No trades'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
