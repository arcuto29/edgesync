'use client';

import { useStore } from '@/store';
import { StrategyStats, TimeOfDayStats } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, parseISO, getHours } from 'date-fns';
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const trades = useStore((state) => state.trades);
  const closedTrades = trades.filter((t) => t.status === 'closed');

  // ==================== STRATEGY PERFORMANCE ====================
  const strategyMap = new Map<string, { wins: number; losses: number; totalPnl: number; trades: number }>();
  closedTrades.forEach((t) => {
    const strat = t.strategy || 'Untagged';
    const existing = strategyMap.get(strat) || { wins: 0, losses: 0, totalPnl: 0, trades: 0 };
    existing.trades++;
    existing.totalPnl += t.netPnl || 0;
    if ((t.netPnl || 0) > 0) existing.wins++;
    else existing.losses++;
    strategyMap.set(strat, existing);
  });

  const strategyData: StrategyStats[] = Array.from(strategyMap.entries()).map(([strategy, data]) => ({
    strategy,
    totalTrades: data.trades,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    avgPnl: data.trades > 0 ? data.totalPnl / data.trades : 0,
    totalPnl: data.totalPnl,
    avgRMultiple: 0,
    profitFactor: data.losses > 0 ? data.wins / data.losses : data.wins,
  })).sort((a, b) => b.totalPnl - a.totalPnl);

  // ==================== TIME OF DAY ANALYSIS ====================
  const hourMap = new Map<number, { trades: number; wins: number; totalPnl: number }>();
  closedTrades.forEach((t) => {
    if (!t.entryTime) return;
    const hour = getHours(parseISO(t.entryTime));
    const existing = hourMap.get(hour) || { trades: 0, wins: 0, totalPnl: 0 };
    existing.trades++;
    existing.totalPnl += t.netPnl || 0;
    if ((t.netPnl || 0) > 0) existing.wins++;
    hourMap.set(hour, existing);
  });

  const timeData: TimeOfDayStats[] = Array.from(hourMap.entries())
    .map(([hour, data]) => ({
      hour,
      tradeCount: data.trades,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      avgPnl: data.trades > 0 ? data.totalPnl / data.trades : 0,
      totalPnl: data.totalPnl,
    }))
    .sort((a, b) => a.hour - b.hour);

  // ==================== WIN/LOSS DISTRIBUTION ====================
  const winCount = closedTrades.filter((t) => (t.netPnl || 0) > 0).length;
  const lossCount = closedTrades.filter((t) => (t.netPnl || 0) < 0).length;
  const breakEven = closedTrades.filter((t) => (t.netPnl || 0) === 0).length;

  const winLossData = [
    { name: 'Wins', value: winCount, color: 'hsl(142, 76%, 46%)' },
    { name: 'Losses', value: lossCount, color: 'hsl(0, 84%, 60%)' },
    { name: 'Break Even', value: breakEven, color: 'hsl(215, 20%, 55%)' },
  ].filter((d) => d.value > 0);

  // ==================== DRAWDOWN CURVE ====================
  const sortedByDate = [...closedTrades].sort(
    (a, b) => (a.exitTime || '').localeCompare(b.exitTime || '')
  );
  
  let peak = 0;
  let runningPnl = 0;
  const drawdownData = sortedByDate.map((t) => {
    runningPnl += t.netPnl || 0;
    if (runningPnl > peak) peak = runningPnl;
    const drawdown = peak - runningPnl;
    return {
      date: t.exitTime ? format(parseISO(t.exitTime), 'MMM dd') : '',
      equity: runningPnl,
      drawdown: -drawdown,
    };
  });

  // ==================== SYMBOL PERFORMANCE ====================
  const symbolMap = new Map<string, { trades: number; pnl: number; wins: number }>();
  closedTrades.forEach((t) => {
    const existing = symbolMap.get(t.symbol) || { trades: 0, pnl: 0, wins: 0 };
    existing.trades++;
    existing.pnl += t.netPnl || 0;
    if ((t.netPnl || 0) > 0) existing.wins++;
    symbolMap.set(t.symbol, existing);
  });

  const symbolData = Array.from(symbolMap.entries())
    .map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      pnl: data.pnl,
      winRate: (data.wins / data.trades) * 100,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const hasData = closedTrades.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          Deep dive into your trading performance
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-16 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-50" />
          <p className="text-lg font-medium text-[hsl(var(--muted-foreground))]">No data to analyze yet</p>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Add some trades to see your analytics
          </p>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Profit Factor</p>
              <p className="text-xl font-bold text-white mt-1">
                {(() => {
                  const grossProfit = closedTrades
                    .filter((t) => (t.netPnl || 0) > 0)
                    .reduce((sum, t) => sum + (t.netPnl || 0), 0);
                  const grossLoss = Math.abs(
                    closedTrades
                      .filter((t) => (t.netPnl || 0) < 0)
                      .reduce((sum, t) => sum + (t.netPnl || 0), 0)
                  );
                  return grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : 'N/A';
                })()}
              </p>
            </div>
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg Winner</p>
              <p className="text-xl font-bold text-[hsl(var(--profit))] mt-1">
                +${closedTrades.filter((t) => (t.netPnl || 0) > 0).length > 0
                  ? (closedTrades.filter((t) => (t.netPnl || 0) > 0).reduce((sum, t) => sum + (t.netPnl || 0), 0) / closedTrades.filter((t) => (t.netPnl || 0) > 0).length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg Loser</p>
              <p className="text-xl font-bold text-[hsl(var(--loss))] mt-1">
                -${closedTrades.filter((t) => (t.netPnl || 0) < 0).length > 0
                  ? Math.abs(closedTrades.filter((t) => (t.netPnl || 0) < 0).reduce((sum, t) => sum + (t.netPnl || 0), 0) / closedTrades.filter((t) => (t.netPnl || 0) < 0).length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Largest Win</p>
              <p className="text-xl font-bold text-[hsl(var(--profit))] mt-1">
                +${Math.max(...closedTrades.map((t) => t.netPnl || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy Performance */}
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
                Strategy Performance
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={strategyData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis dataKey="strategy" stroke="hsl(215, 20%, 55%)" fontSize={10} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220, 20%, 9%)',
                      border: '1px solid hsl(220, 20%, 18%)',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Bar dataKey="totalPnl" fill="hsl(142, 76%, 46%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Win/Loss Distribution */}
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Win/Loss Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time of Day */}
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[hsl(var(--primary))]" />
                Performance by Time of Day
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis
                    dataKey="hour"
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={11}
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220, 20%, 9%)',
                      border: '1px solid hsl(220, 20%, 18%)',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    labelFormatter={(h) => `${h}:00 - ${h}:59`}
                  />
                  <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                    {timeData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.totalPnl >= 0 ? 'hsl(142, 76%, 46%)' : 'hsl(0, 84%, 60%)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown Chart */}
            <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--loss))]" />
                Drawdown
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220, 20%, 9%)',
                      border: '1px solid hsl(220, 20%, 18%)',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="drawdown"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Symbol Performance Table */}
          <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Symbol</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Symbol</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Trades</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Win Rate</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">Total P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {symbolData.map((s) => (
                    <tr key={s.symbol} className="border-b border-[hsl(var(--border))]">
                      <td className="px-4 py-2 text-sm font-medium text-white">{s.symbol}</td>
                      <td className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]">{s.trades}</td>
                      <td className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]">{s.winRate.toFixed(1)}%</td>
                      <td className={`px-4 py-2 text-sm font-semibold ${s.pnl >= 0 ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}`}>
                        {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
