import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TradingAccount,
  Trade,
  JournalEntry,
  HealthData,
  DailyStats,
} from '@/types';

interface AppState {
  // Accounts
  accounts: TradingAccount[];
  addAccount: (account: TradingAccount) => void;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => void;
  deleteAccount: (id: string) => void;

  // Trades
  trades: Trade[];
  addTrade: (trade: Trade) => void;
  addTrades: (trades: Trade[]) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Health Data
  healthData: HealthData[];
  addHealthData: (data: HealthData) => void;
  updateHealthData: (id: string, updates: Partial<HealthData>) => void;

  // Settings
  ouraApiToken: string | null;
  setOuraApiToken: (token: string | null) => void;

  // UI State
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Accounts
      accounts: [],
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      // Trades
      trades: [],
      addTrade: (trade) =>
        set((state) => ({ trades: [...state.trades, trade] })),
      addTrades: (trades) =>
        set((state) => ({ trades: [...state.trades, ...trades] })),
      updateTrade: (id, updates) =>
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        })),

      // Journal
      journalEntries: [],
      addJournalEntry: (entry) =>
        set((state) => ({ journalEntries: [...state.journalEntries, entry] })),
      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id),
        })),

      // Health Data
      healthData: [],
      addHealthData: (data) =>
        set((state) => ({ healthData: [...state.healthData, data] })),
      updateHealthData: (id, updates) =>
        set((state) => ({
          healthData: state.healthData.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      // Settings
      ouraApiToken: null,
      setOuraApiToken: (token) => set({ ouraApiToken: token }),

      // UI State
      selectedAccountId: null,
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),
    }),
    {
      name: 'edgesync-storage',
    }
  )
);

// ==================== SELECTORS ====================

export const getAccountTrades = (state: AppState, accountId: string) =>
  state.trades.filter((t) => t.accountId === accountId);

export const getDailyStats = (state: AppState, date: string): DailyStats => {
  const dayTrades = state.trades.filter(
    (t) => t.exitTime && t.exitTime.startsWith(date) && t.status === 'closed'
  );

  const wins = dayTrades.filter((t) => (t.netPnl || 0) > 0);
  const losses = dayTrades.filter((t) => (t.netPnl || 0) < 0);
  const totalPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);

  let maxDrawdown = 0;
  let peak = 0;
  let runningPnl = 0;
  for (const trade of dayTrades) {
    runningPnl += trade.netPnl || 0;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const journal = state.journalEntries.find((j) => j.date === date);
  const health = state.healthData.find((h) => h.date === date);

  return {
    date,
    totalPnl,
    tradeCount: dayTrades.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: dayTrades.length > 0 ? (wins.length / dayTrades.length) * 100 : 0,
    avgRMultiple:
      dayTrades.length > 0
        ? dayTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) /
          dayTrades.length
        : 0,
    maxDrawdown,
    bestTrade: dayTrades.length > 0
      ? Math.max(...dayTrades.map((t) => t.netPnl || 0))
      : 0,
    worstTrade: dayTrades.length > 0
      ? Math.min(...dayTrades.map((t) => t.netPnl || 0))
      : 0,
    healthScore: health?.readinessScore || health?.sleepScore,
    tiltLevel: journal?.postTiltLevel,
  };
};
