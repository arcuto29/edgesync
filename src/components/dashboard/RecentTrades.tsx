'use client';

import { useStore } from '@/store';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function RecentTrades() {
  const trades = useStore((state) => state.trades);
  const accounts = useStore((state) => state.accounts);

  const recentTrades = [...trades]
    .filter((t) => t.status === 'closed')
    .sort((a, b) => (b.exitTime || '').localeCompare(a.exitTime || ''))
    .slice(0, 8);

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Unknown';
  };

  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
        <a href="/trades" className="text-xs text-[hsl(var(--primary))] hover:underline">
          View All
        </a>
      </div>

      {recentTrades.length > 0 ? (
        <div className="space-y-3">
          {recentTrades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between py-2 border-b border-[hsl(var(--border))] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    trade.direction === 'long'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
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
                    {trade.symbol} {trade.direction.toUpperCase()}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {getAccountName(trade.accountId)} &middot;{' '}
                    {trade.exitTime
                      ? format(parseISO(trade.exitTime), 'MMM dd, HH:mm')
                      : '--'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    (trade.netPnl || 0) >= 0
                      ? 'text-[hsl(var(--profit))]'
                      : 'text-[hsl(var(--loss))]'
                  }`}
                >
                  {(trade.netPnl || 0) >= 0 ? '+' : ''}$
                  {(trade.netPnl || 0).toFixed(2)}
                </p>
                {trade.rMultiple && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-[hsl(var(--muted-foreground))]">
          <div className="text-center">
            <p>No trades yet</p>
            <p className="text-sm mt-1">Add your first trade to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
