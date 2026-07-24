'use client';

import { useStore } from '@/store';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

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
      dayOfWeek: date.getDay(),
      pnl,
      trades: dayTrades.length,
      label: format(date, 'MMM dd'),
    };
  });

  const getColor = (pnl: number, tradeCount: number) => {
    if (tradeCount === 0) return 'bg-[hsl(var(--secondary))]';
    if (pnl > 500) return 'bg-green-400';
    if (pnl > 200) return 'bg-green-500';
    if (pnl > 0) return 'bg-green-700';
    if (pnl > -200) return 'bg-red-700';
    if (pnl > -500) return 'bg-red-500';
    return 'bg-red-400';
  };

  // Group by weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Trading Calendar (90 Days)</h3>
      
      <div className="flex gap-1 flex-wrap">
        {days.map((day) => (
          <div
            key={day.date}
            className={`heatmap-cell w-4 h-4 rounded-sm ${getColor(day.pnl, day.trades)} cursor-pointer`}
            title={`${day.label}: ${day.trades > 0 ? `$${day.pnl.toFixed(0)} (${day.trades} trades)` : 'No trades'}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
        <span>Loss</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <div className="w-3 h-3 rounded-sm bg-red-700" />
          <div className="w-3 h-3 rounded-sm bg-[hsl(var(--secondary))]" />
          <div className="w-3 h-3 rounded-sm bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
        </div>
        <span>Profit</span>
      </div>
    </div>
  );
}
