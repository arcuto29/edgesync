'use client';

import { motion } from 'framer-motion';
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
import { format, subDays } from 'date-fns';

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
  const isPositive = cumPnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl bg-card border border-border/50 p-6 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Equity Curve</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 30 days cumulative P&L</p>
        </div>
        {hasData && (
          <div className={`text-right`}>
            <p className={`text-lg font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
              {isPositive ? '+' : ''}${cumPnl.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </div>
        )}
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cumulativeData}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity={0.25} />
                <stop offset="100%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.015 260)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="oklch(0.45 0.02 260)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.45 0.02 260)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.14 0.012 260)',
                border: '1px solid oklch(0.28 0.015 260)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '12px',
                boxShadow: '0 10px 40px -10px oklch(0 0 0 / 0.5)',
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cumulative P&L']}
            />
            <Area
              type="monotone"
              dataKey="cumPnl"
              stroke={isPositive ? '#4ade80' : '#f87171'}
              fill="url(#pnlGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'oklch(0.14 0.012 260)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[260px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">No trade data yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Import trades to see your equity curve</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
