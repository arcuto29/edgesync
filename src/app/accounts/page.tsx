'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { TradingAccount, Platform, AccountType, PLATFORM_LABELS, PROP_FIRMS, LIVE_BROKERS } from '@/types';
import { Wallet, Plus, X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function AccountsPage() {
  const accounts = useStore((state) => state.accounts);
  const trades = useStore((state) => state.trades);
  const addAccount = useStore((state) => state.addAccount);
  const deleteAccount = useStore((state) => state.deleteAccount);
  const updateAccount = useStore((state) => state.updateAccount);
  const [showAdd, setShowAdd] = useState(false);

  const [newAccount, setNewAccount] = useState({
    name: '',
    platform: 'topstepx' as Platform,
    type: 'prop' as AccountType,
    startingBalance: '',
    maxDrawdown: '',
    profitTarget: '',
    dailyLossLimit: '',
  });

  const handleAdd = () => {
    if (!newAccount.name) return;
    const account: TradingAccount = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      name: newAccount.name,
      platform: newAccount.platform,
      type: newAccount.type,
      balance: parseFloat(newAccount.startingBalance) || 0,
      startingBalance: parseFloat(newAccount.startingBalance) || 0,
      maxDrawdown: newAccount.maxDrawdown ? parseFloat(newAccount.maxDrawdown) : undefined,
      profitTarget: newAccount.profitTarget ? parseFloat(newAccount.profitTarget) : undefined,
      dailyLossLimit: newAccount.dailyLossLimit ? parseFloat(newAccount.dailyLossLimit) : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    addAccount(account);
    setShowAdd(false);
    setNewAccount({
      name: '',
      platform: 'topstepx',
      type: 'prop',
      startingBalance: '',
      maxDrawdown: '',
      profitTarget: '',
      dailyLossLimit: '',
    });
  };

  const getAccountPnl = (accountId: string) => {
    return trades
      .filter((t) => t.accountId === accountId && t.status === 'closed')
      .reduce((sum, t) => sum + (t.netPnl || 0), 0);
  };

  const getAccountTradeCount = (accountId: string) => {
    return trades.filter((t) => t.accountId === accountId).length;
  };

  const propAccounts = accounts.filter((a) => a.type === 'prop');
  const liveAccounts = accounts.filter((a) => a.type === 'live');
  const demoAccounts = accounts.filter((a) => a.type === 'demo');

  const AccountCard = ({ account }: { account: TradingAccount }) => {
    const pnl = getAccountPnl(account.id);
    const tradeCount = getAccountTradeCount(account.id);
    const currentBalance = account.startingBalance + pnl;
    const drawdownUsed = account.maxDrawdown
      ? ((account.startingBalance - Math.min(currentBalance, account.startingBalance)) / account.maxDrawdown) * 100
      : 0;

    return (
      <div className="rounded-2xl bg-card border border-border/50 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white">{account.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {PLATFORM_LABELS[account.platform]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              account.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {account.isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={() => deleteAccount(account.id)}
              className="text-muted-foreground hover:text-loss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-lg font-bold text-white">${currentBalance.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">P&L</p>
            <p className={`text-lg font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-secondary p-2">
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-sm font-medium text-white">{tradeCount}</p>
          </div>
          {account.maxDrawdown && (
            <div className="rounded-xl bg-secondary p-2">
              <p className="text-xs text-muted-foreground">Max DD</p>
              <p className="text-sm font-medium text-white">${account.maxDrawdown}</p>
            </div>
          )}
          {account.profitTarget && (
            <div className="rounded-xl bg-secondary p-2">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-medium text-white">${account.profitTarget}</p>
            </div>
          )}
        </div>

        {/* Drawdown progress bar for prop accounts */}
        {account.maxDrawdown && account.type === 'prop' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Drawdown Used</span>
              <span>{drawdownUsed.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  drawdownUsed > 75 ? 'bg-red-500' : drawdownUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(drawdownUsed, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Profit target progress for prop accounts */}
        {account.profitTarget && account.type === 'prop' && pnl > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Profit Target</span>
              <span>{((pnl / account.profitTarget) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min((pnl / account.profitTarget) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your prop and live trading accounts
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Prop Accounts */}
      {propAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Prop Accounts ({propAccounts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {propAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>
        </div>
      )}

      {/* Live Accounts */}
      {liveAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />
            Live Accounts ({liveAccounts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>
        </div>
      )}

      {/* Demo Accounts */}
      {demoAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Demo Accounts ({demoAccounts.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="rounded-2xl bg-card border border-border/50 p-16 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No accounts yet</p>
          <p className="text-sm mt-1 text-muted-foreground">
            Add your trading accounts to start tracking P&L per account
          </p>
        </div>
      )}

      {/* Add Account Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                  placeholder="e.g., TopstepX 50k #1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Type</label>
                  <select
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                  >
                    <option value="prop">Prop</option>
                    <option value="live">Live</option>
                    <option value="demo">Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Platform</label>
                  <select
                    value={newAccount.platform}
                    onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value as Platform })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                  >
                    <optgroup label="Prop Firms">
                      {PROP_FIRMS.map((p) => (
                        <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Live Brokers">
                      {LIVE_BROKERS.map((p) => (
                        <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Starting Balance</label>
                <input
                  type="number"
                  value={newAccount.startingBalance}
                  onChange={(e) => setNewAccount({ ...newAccount, startingBalance: e.target.value })}
                  className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                  placeholder="50000"
                />
              </div>

              {newAccount.type === 'prop' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Max Drawdown</label>
                      <input
                        type="number"
                        value={newAccount.maxDrawdown}
                        onChange={(e) => setNewAccount({ ...newAccount, maxDrawdown: e.target.value })}
                        className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                        placeholder="2500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Profit Target</label>
                      <input
                        type="number"
                        value={newAccount.profitTarget}
                        onChange={(e) => setNewAccount({ ...newAccount, profitTarget: e.target.value })}
                        className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                        placeholder="3000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Daily Loss Limit</label>
                    <input
                      type="number"
                      value={newAccount.dailyLossLimit}
                      onChange={(e) => setNewAccount({ ...newAccount, dailyLossLimit: e.target.value })}
                      className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border/50"
                      placeholder="1000"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAdd}
                disabled={!newAccount.name}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
