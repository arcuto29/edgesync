'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { parseTradesFromCSV } from '@/lib/csv-parsers';
import { Trade, Platform, PLATFORM_LABELS, PROP_FIRMS, LIVE_BROKERS, FUTURES_SYMBOLS, DEFAULT_STRATEGIES } from '@/types';
import { format, parseISO } from 'date-fns';
import {
  Upload,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function TradesPage() {
  const trades = useStore((state) => state.trades);
  const accounts = useStore((state) => state.accounts);
  const addTrades = useStore((state) => state.addTrades);
  const addTrade = useStore((state) => state.addTrade);
  const deleteTrade = useStore((state) => state.deleteTrade);

  const [showImport, setShowImport] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [importPlatform, setImportPlatform] = useState<Platform>('tradovate');
  const [importAccountId, setImportAccountId] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual trade form state
  const [newTrade, setNewTrade] = useState({
    symbol: 'ES',
    direction: 'long' as 'long' | 'short',
    entryPrice: '',
    exitPrice: '',
    quantity: '1',
    entryTime: '',
    exitTime: '',
    strategy: '',
    notes: '',
    accountId: '',
  });

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importAccountId) {
      setImportStatus('Please select an account first');
      return;
    }

    setImportStatus('Parsing...');
    const { trades: parsedTrades, errors } = await parseTradesFromCSV(
      file,
      importPlatform,
      importAccountId
    );

    if (parsedTrades.length > 0) {
      addTrades(parsedTrades);
      setImportStatus(`Successfully imported ${parsedTrades.length} trades!`);
    } else {
      setImportStatus(`No trades found. ${errors.join(', ')}`);
    }
  };

  const handleAddManualTrade = () => {
    if (!newTrade.accountId || !newTrade.entryPrice) return;

    const entryPrice = parseFloat(newTrade.entryPrice);
    const exitPrice = parseFloat(newTrade.exitPrice) || undefined;
    const quantity = parseInt(newTrade.quantity) || 1;

    // Calculate P&L
    let pnl = 0;
    if (exitPrice) {
      const symbol = FUTURES_SYMBOLS.find((s) => s.symbol === newTrade.symbol);
      const tickValue = symbol?.tickValue || 12.5;
      const tickSize = symbol?.tickSize || 0.25;
      const ticks = (exitPrice - entryPrice) / tickSize;
      pnl = ticks * tickValue * quantity * (newTrade.direction === 'long' ? 1 : -1);
    }

    const trade: Trade = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      accountId: newTrade.accountId,
      symbol: newTrade.symbol,
      assetClass: 'futures',
      direction: newTrade.direction,
      status: exitPrice ? 'closed' : 'open',
      entryPrice,
      exitPrice,
      quantity,
      entryTime: newTrade.entryTime || new Date().toISOString(),
      exitTime: newTrade.exitTime || (exitPrice ? new Date().toISOString() : undefined),
      pnl,
      fees: 0,
      netPnl: pnl,
      strategy: newTrade.strategy || undefined,
      notes: newTrade.notes || undefined,
    };

    addTrade(trade);
    setShowAddTrade(false);
    setNewTrade({
      symbol: 'ES',
      direction: 'long',
      entryPrice: '',
      exitPrice: '',
      quantity: '1',
      entryTime: '',
      exitTime: '',
      strategy: '',
      notes: '',
      accountId: '',
    });
  };

  const filteredTrades = filterAccount === 'all'
    ? trades
    : trades.filter((t) => t.accountId === filterAccount);

  const sortedTrades = [...filteredTrades].sort(
    (a, b) => (b.entryTime || '').localeCompare(a.entryTime || '')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trades</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {trades.length} total trades recorded
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg bg-[hsl(var(--secondary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--secondary))]/80 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddTrade(true)}
            className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Trade
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] overflow-hidden">
        {sortedTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Entry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Exit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    P&L
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Strategy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                          trade.direction === 'long'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {trade.direction === 'long' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                      {trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                      {trade.exitPrice?.toFixed(2) || '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                      {trade.quantity}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-semibold ${
                          (trade.netPnl || 0) >= 0
                            ? 'text-[hsl(var(--profit))]'
                            : 'text-[hsl(var(--loss))]'
                        }`}
                      >
                        {(trade.netPnl || 0) >= 0 ? '+' : ''}$
                        {(trade.netPnl || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                      {trade.strategy || '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                      {trade.entryTime
                        ? format(parseISO(trade.entryTime), 'MMM dd, HH:mm')
                        : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteTrade(trade.id)}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--loss))] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
            <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No trades yet</p>
            <p className="text-sm mt-1">Import a CSV or add trades manually to get started</p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Import Trades</h2>
              <button
                onClick={() => { setShowImport(false); setImportStatus(''); }}
                className="text-[hsl(var(--muted-foreground))] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Platform Select */}
              <div>
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">
                  Platform
                </label>
                <select
                  value={importPlatform}
                  onChange={(e) => setImportPlatform(e.target.value as Platform)}
                  className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                >
                  <optgroup label="Prop Firms">
                    {PROP_FIRMS.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABELS[p]}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Live Brokers">
                    {LIVE_BROKERS.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABELS[p]}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Account Select */}
              <div>
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">
                  Account
                </label>
                <select
                  value={importAccountId}
                  onChange={(e) => setImportAccountId(e.target.value)}
                  className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                >
                  <option value="">Select account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="text-xs text-[hsl(var(--warning))] mt-1">
                    Add an account first in the Accounts page
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">
                  CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] file:mr-4 file:rounded file:border-0 file:bg-[hsl(var(--primary))] file:px-3 file:py-1 file:text-sm file:text-black file:font-medium"
                />
              </div>

              {importStatus && (
                <p className={`text-sm ${importStatus.includes('Success') ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--warning))]'}`}>
                  {importStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Trade Modal */}
      {showAddTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add Trade</h2>
              <button
                onClick={() => setShowAddTrade(false)}
                className="text-[hsl(var(--muted-foreground))] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Account */}
              <div>
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Account</label>
                <select
                  value={newTrade.accountId}
                  onChange={(e) => setNewTrade({ ...newTrade, accountId: e.target.value })}
                  className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                >
                  <option value="">Select account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Symbol & Direction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Symbol</label>
                  <select
                    value={newTrade.symbol}
                    onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                  >
                    {FUTURES_SYMBOLS.map((s) => (
                      <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Direction</label>
                  <select
                    value={newTrade.direction}
                    onChange={(e) => setNewTrade({ ...newTrade, direction: e.target.value as 'long' | 'short' })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                  >
                    <option value="long">LONG</option>
                    <option value="short">SHORT</option>
                  </select>
                </div>
              </div>

              {/* Entry & Exit Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.entryPrice}
                    onChange={(e) => setNewTrade({ ...newTrade, entryPrice: e.target.value })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                    placeholder="5450.25"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Exit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.exitPrice}
                    onChange={(e) => setNewTrade({ ...newTrade, exitPrice: e.target.value })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                    placeholder="5455.00"
                  />
                </div>
              </div>

              {/* Quantity & Strategy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newTrade.quantity}
                    onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Strategy</label>
                  <select
                    value={newTrade.strategy}
                    onChange={(e) => setNewTrade({ ...newTrade, strategy: e.target.value })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                  >
                    <option value="">Select strategy...</option>
                    {DEFAULT_STRATEGIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Notes</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] resize-none"
                  placeholder="What was your thesis? How did the trade play out?"
                />
              </div>

              <button
                onClick={handleAddManualTrade}
                disabled={!newTrade.accountId || !newTrade.entryPrice}
                className="w-full rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
