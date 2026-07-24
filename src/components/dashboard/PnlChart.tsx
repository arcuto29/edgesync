'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/store';
import { format, subDays, parseISO } from 'date-fns';

export default function PnlChart() {
  const trades = useStore((state) => state.trades);

  // Generate last 30 days of P&L data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    const dayTrades = trades.filter(
      (t) => t.exitTime && t.exitTime.startsWith(date) && t.status === 'closed'
    );
    const pnl = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    return {
      date: format(subDays(new Date(), 29 - i), 'MMM dd'),
      pnl,
      trades: dayTrades.length,
    };
  });

  // Cumulative P&L
  let cumPnl = 0;
  const cumulativeData = last30Days.map((d) => {
    cumPnl += d.pnl;
    return { ...d, cumPnl };
  });

  const hasData = trades.length > 0;

  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Equity Curve (30 Days)</h3>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
            Daily P&L
          </span>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={cumulativeData}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 46%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
            <XAxis
              dataKey="date"
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 20%, 9%)',
                border: '1px solid hsl(220, 20%, 18%)',
                borderRadius: '8px',
                color: 'white',
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cumulative P&L']}
            />
            <Area
              type="monotone"
              dataKey="cumPnl"
              stroke="hsl(142, 76%, 46%)"
              fill="url(#pnlGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[280px] text-[hsl(var(--muted-foreground))]">
          <div className="text-center">
            <p className="text-lg">No trade data yet</p>
            <p className="text-sm mt-1">Import trades or add them manually to see your equity curve</p>
          </div>
        </div>
      )}
    </div>
  );
}
