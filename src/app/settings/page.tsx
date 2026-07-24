'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Settings, Key, Database, Download, Trash2, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const ouraApiToken = useStore((state) => state.ouraApiToken);
  const setOuraApiToken = useStore((state) => state.setOuraApiToken);
  const trades = useStore((state) => state.trades);
  const accounts = useStore((state) => state.accounts);
  const journalEntries = useStore((state) => state.journalEntries);
  const healthData = useStore((state) => state.healthData);

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      accounts,
      trades,
      journalEntries,
      healthData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edgesync-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    localStorage.removeItem('edgesync-storage');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          Configure your trading journal
        </p>
      </div>

      {/* API Connections */}
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-[hsl(var(--primary))]" />
          API Connections
        </h3>

        <div className="space-y-4">
          {/* Oura Ring */}
          <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))]">
            <div>
              <p className="text-sm font-medium text-white">Oura Ring</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {ouraApiToken ? 'Connected - syncing sleep & readiness data' : 'Not connected'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ouraApiToken ? 'bg-green-500' : 'bg-red-500'}`} />
              {ouraApiToken && (
                <button
                  onClick={() => setOuraApiToken(null)}
                  className="text-xs text-[hsl(var(--loss))] hover:underline"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Tradovate */}
          <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))]">
            <div>
              <p className="text-sm font-medium text-white">Tradovate API</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Auto-sync trades from Tradovate (coming soon)
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
              Coming Soon
            </span>
          </div>

          {/* Interactive Brokers */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-white">Interactive Brokers API</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Auto-sync trades from IBKR (coming soon)
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-[hsl(var(--primary))]" />
          Data Management
        </h3>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 text-center">
              <p className="text-lg font-bold text-white">{accounts.length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Accounts</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 text-center">
              <p className="text-lg font-bold text-white">{trades.length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Trades</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 text-center">
              <p className="text-lg font-bold text-white">{journalEntries.length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Journal Entries</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--secondary))] p-3 text-center">
              <p className="text-lg font-bold text-white">{healthData.length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Health Records</p>
            </div>
          </div>

          {/* Export */}
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 rounded-lg bg-[hsl(var(--secondary))] px-4 py-2.5 text-sm font-medium text-white hover:bg-[hsl(var(--secondary))]/80 transition-colors w-full justify-center"
          >
            <Download className="h-4 w-4" />
            Export All Data (JSON)
          </button>

          {/* Reset */}
          <div className="pt-4 border-t border-[hsl(var(--border))]">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors w-full justify-center"
              >
                <Trash2 className="h-4 w-4" />
                Reset All Data
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[hsl(var(--loss))]">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetAll}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 rounded-lg bg-[hsl(var(--secondary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--secondary))]/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
        <h3 className="text-lg font-semibold text-white mb-2">About EdgeSync</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          A free, open-source trading journal that syncs your health data with your trading
          performance. Find your edge through data — futures & options.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
            v1.0.0
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
            Next.js 15
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
            Free Forever
          </span>
        </div>
      </div>
    </div>
  );
}
