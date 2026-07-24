'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrendingUp,
} from 'lucide-react';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

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
    const { trades: parsedTrades, errors } = await parseTradesFromCSV(file, importPlatform, importAccountId);
    if (parsedTrades.length > 0) {
      addTrades(parsedTrades);
      setImportStatus(`Successfully imported ${parsedTrades.length} trades`);
    } else {
      setImportStatus(`No trades found. ${errors.join(', ')}`);
    }
  };

  const handleAddManualTrade = () => {
    if (!newTrade.accountId || !newTrade.entryPrice) return;
    const entryPrice = parseFloat(newTrade.entryPrice);
    const exitPrice = parseFloat(newTrade.exitPrice) || undefined;
    const quantity = parseInt(newTrade.quantity) || 1;

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
    setNewTrade({ symbol: 'ES', direction: 'long', entryPrice: '', exitPrice: '', quantity: '1', entryTime: '', exitTime: '', strategy: '', notes: '', accountId: '' });
  };

  const filteredTrades = filterAccount === 'all' ? trades : trades.filter((t) => t.accountId === filterAccount);
  const sortedTrades = [...filteredTrades].sort((a, b) => (b.entryTime || '').localeCompare(a.entryTime || ''));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trades</h1>
          <p className="text-muted-foreground text-sm mt-1">{trades.length} total trades recorded</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-xl bg-secondary border border-border/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-secondary/80 transition-all duration-200"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddTrade(true)}
            className="flex items-center gap-2 rounded-xl bg-primary/90 hover:bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:shadow-[0_0_20px_-5px] hover:shadow-primary/30"
          >
            <Plus className="h-4 w-4" />
            Add Trade
          </button>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="rounded-xl bg-secondary/50 border border-border/50 px-4 py-2 text-sm text-white focus:border-primary/30"
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl bg-card border border-border/50 overflow-hidden"
      >
        {sortedTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Side</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Entry</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Exit</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">P&L</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Strategy</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade, i) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-white">{trade.symbol}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        trade.direction === 'long'
                          ? 'bg-profit/10 text-profit'
                          : 'bg-loss/10 text-loss'
                      }`}>
                        {trade.direction === 'long' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">{trade.entryPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">{trade.exitPrice?.toFixed(2) || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{trade.quantity}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-semibold tabular-nums ${(trade.netPnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {(trade.netPnl || 0) >= 0 ? '+' : ''}${(trade.netPnl || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{trade.strategy || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {trade.entryTime ? format(parseISO(trade.entryTime), 'MMM dd, HH:mm') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => deleteTrade(trade.id)} className="text-muted-foreground hover:text-loss transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-muted-foreground">No trades yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Import a CSV or add trades manually</p>
          </div>
        )}
      </motion.div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-md rounded-2xl bg-card border border-border/50 p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Import Trades</h2>
                <button onClick={() => { setShowImport(false); setImportStatus(''); }} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Platform</label>
                  <select value={importPlatform} onChange={(e) => setImportPlatform(e.target.value as Platform)} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white">
                    <optgroup label="Prop Firms">{PROP_FIRMS.map((p) => (<option key={p} value={p}>{PLATFORM_LABELS[p]}</option>))}</optgroup>
                    <optgroup label="Live Brokers">{LIVE_BROKERS.map((p) => (<option key={p} value={p}>{PLATFORM_LABELS[p]}</option>))}</optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Account</label>
                  <select value={importAccountId} onChange={(e) => setImportAccountId(e.target.value)} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white">
                    <option value="">Select account...</option>
                    {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
                  </select>
                  {accounts.length === 0 && <p className="text-xs text-warning mt-2">Add an account first in the Accounts page</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">CSV File</label>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileImport} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-primary/80 file:px-3 file:py-1 file:text-sm file:text-primary-foreground file:font-medium file:cursor-pointer" />
                </div>
                {importStatus && <p className={`text-sm font-medium ${importStatus.includes('Success') ? 'text-profit' : 'text-warning'}`}>{importStatus}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Trade Modal */}
      <AnimatePresence>
        {showAddTrade && (
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-lg rounded-2xl bg-card border border-border/50 p-7 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Add Trade</h2>
                <button onClick={() => setShowAddTrade(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Account</label>
                  <select value={newTrade.accountId} onChange={(e) => setNewTrade({ ...newTrade, accountId: e.target.value })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white">
                    <option value="">Select account...</option>
                    {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Symbol</label>
                    <select value={newTrade.symbol} onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white">
                      {FUTURES_SYMBOLS.map((s) => (<option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Direction</label>
                    <select value={newTrade.direction} onChange={(e) => setNewTrade({ ...newTrade, direction: e.target.value as 'long' | 'short' })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white">
                      <option value="long">LONG</option>
                      <option value="short">SHORT</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Entry Price</label>
                    <input type="number" step="0.01" value={newTrade.entryPrice} onChange={(e) => setNewTrade({ ...newTrade, entryPrice: e.target.value })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white" placeholder="5450.25" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Exit Price</label>
                    <input type="number" step="0.01" value={newTrade.exitPrice} onChange={(e) => setNewTrade({ ...newTrade, exitPrice: e.target.value })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white" placeholder="5455.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Quantity</label>
                    <input type="number" value={newTrade.quantity} onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Strategy</label>
                    <select value={newTrade.strategy} onChange={(e) => setNewTrade({ ...newTrade, strategy: e.target.value })} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white">
                      <option value="">Select...</option>
                      {DEFAULT_STRATEGIES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</label>
                  <textarea value={newTrade.notes} onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })} rows={3} className="w-full rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-white resize-none" placeholder="Trade thesis, how it played out..." />
                </div>
                <button onClick={handleAddManualTrade} disabled={!newTrade.accountId || !newTrade.entryPrice} className="w-full rounded-xl bg-primary/90 hover:bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_-5px] hover:shadow-primary/30">
                  Add Trade
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
