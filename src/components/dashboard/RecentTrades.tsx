'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function RecentTrades() {
  const trades = useStore((state) => state.trades);
  const accounts = useStore((state) => state.accounts);

  const recentTrades = [...trades]
    .filter((t) => t.status === 'closed')
    .sort((a, b) => (b.exitTime || '').localeCompare(a.exitTime || ''))
    .slice(0, 6);

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Unknown';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl bg-card border border-border/50 p-6 h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Recent Trades</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{trades.length} total</p>
        </div>
        <a
          href="/trades"
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All →
        </a>
      </div>

      {recentTrades.length > 0 ? (
        <div className="space-y-1">
          {recentTrades.map((trade, i) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * i }}
              className="flex items-center justify-between py-3 border-b border-border/30 last:border-0 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 ${
                    trade.direction === 'long'
                      ? 'bg-profit/10 text-profit group-hover:bg-profit/15'
                      : 'bg-loss/10 text-loss group-hover:bg-loss/15'
                  }`}
                >
                  {trade.direction === 'long' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {trade.symbol}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {trade.exitTime
                      ? format(parseISO(trade.exitTime), 'MMM dd, HH:mm')
                      : '--'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    (trade.netPnl || 0) >= 0 ? 'text-profit' : 'text-loss'
                  }`}
                >
                  {(trade.netPnl || 0) >= 0 ? '+' : ''}$
                  {(trade.netPnl || 0).toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[280px]">
          <div className="w-14 h-14 mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No trades yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Your recent activity will appear here</p>
        </div>
      )}
    </motion.div>
  );
}
