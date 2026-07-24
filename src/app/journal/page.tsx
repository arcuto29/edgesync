'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { JournalEntry, TiltLevel, SessionRating, Trade } from '@/types';
import { format, parseISO, subDays } from 'date-fns';
import {
  BookOpen,
  Plus,
  Brain,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
} from 'lucide-react';


const TILT_COLORS: Record<TiltLevel, string> = {
  none: 'bg-green-500/20 text-green-400',
  low: 'bg-yellow-500/20 text-yellow-400',
  medium: 'bg-orange-500/20 text-orange-400',
  high: 'bg-red-500/20 text-red-400',
  extreme: 'bg-red-700/20 text-red-300',
};

const EMOTIONAL_STATES = [
  'Calm & Focused', 'Confident', 'Anxious', 'FOMO',
  'Frustrated', 'Revenge Mindset', 'Euphoric/Overconfident',
  'Bored/Forcing', 'Tired/Fatigued', 'Distracted', 'Patient', 'Disciplined',
];

interface DayData {
  date: string;
  trades: Trade[];
  totalPnl: number;
  winCount: number;
  lossCount: number;
  tradeCount: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  journalEntry?: JournalEntry;
}


export default function JournalPage() {
  const trades = useStore((state) => state.trades);
  const journalEntries = useStore((state) => state.journalEntries);
  const addJournalEntry = useStore((state) => state.addJournalEntry);
  const updateJournalEntry = useStore((state) => state.updateJournalEntry);
  const deleteJournalEntry = useStore((state) => state.deleteJournalEntry);
  const accounts = useStore((state) => state.accounts);
  const healthData = useStore((state) => state.healthData);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showPsychForm, setShowPsychForm] = useState(false);


  // Auto-generate daily summaries from trades (like TradeZella)
  const tradingDays: DayData[] = useMemo(() => {
    const dayMap = new Map<string, Trade[]>();

    // Group trades by day
    trades.filter((t) => t.status === 'closed' && t.exitTime).forEach((trade) => {
      const day = trade.exitTime!.split('T')[0];
      const existing = dayMap.get(day) || [];
      existing.push(trade);
      dayMap.set(day, existing);
    });

    // Convert to DayData with stats
    const days: DayData[] = Array.from(dayMap.entries()).map(([date, dayTrades]) => {
      const wins = dayTrades.filter((t) => (t.netPnl || 0) > 0);
      const losses = dayTrades.filter((t) => (t.netPnl || 0) < 0);
      const totalPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
      const journal = journalEntries.find((j) => j.date === date);

      return {
        date,
        trades: dayTrades.sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || '')),
        totalPnl,
        winCount: wins.length,
        lossCount: losses.length,
        tradeCount: dayTrades.length,
        winRate: dayTrades.length > 0 ? (wins.length / dayTrades.length) * 100 : 0,
        bestTrade: dayTrades.length > 0 ? Math.max(...dayTrades.map((t) => t.netPnl || 0)) : 0,
        worstTrade: dayTrades.length > 0 ? Math.min(...dayTrades.map((t) => t.netPnl || 0)) : 0,
        journalEntry: journal,
      };
    });

    return days.sort((a, b) => b.date.localeCompare(a.date));
  }, [trades, journalEntries]);

  const selectedDayData = tradingDays.find((d) => d.date === selectedDay);
  const selectedHealth = healthData.find((h) => h.date === selectedDay);


  // Psychology form state
  const [psych, setPsych] = useState({
    preSleepQuality: 3 as SessionRating,
    preEnergyLevel: 3 as SessionRating,
    preMoodRating: 3 as SessionRating,
    preMarketBias: '',
    preGamePlan: '',
    preConfidence: 3 as SessionRating,
    postSessionRating: 3 as SessionRating,
    postTiltLevel: 'none' as TiltLevel,
    postFollowedPlan: true,
    postEmotionalState: '',
    postLessonsLearned: '',
    postNotes: '',
  });

  const handleSavePsych = () => {
    if (!selectedDay) return;
    const existing = journalEntries.find((j) => j.date === selectedDay);
    if (existing) {
      updateJournalEntry(existing.id, psych);
    } else {
      addJournalEntry({
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        date: selectedDay,
        ...psych,
      });
    }
    setShowPsychForm(false);
  };

  const openDayDetail = (date: string) => {
    setSelectedDay(date);
    const existing = journalEntries.find((j) => j.date === date);
    if (existing) {
      setPsych({
        preSleepQuality: existing.preSleepQuality || 3,
        preEnergyLevel: existing.preEnergyLevel || 3,
        preMoodRating: existing.preMoodRating || 3,
        preMarketBias: existing.preMarketBias || '',
        preGamePlan: existing.preGamePlan || '',
        preConfidence: existing.preConfidence || 3,
        postSessionRating: existing.postSessionRating || 3,
        postTiltLevel: existing.postTiltLevel || 'none',
        postFollowedPlan: existing.postFollowedPlan ?? true,
        postEmotionalState: existing.postEmotionalState || '',
        postLessonsLearned: existing.postLessonsLearned || '',
        postNotes: existing.postNotes || '',
      });
    } else {
      setPsych({
        preSleepQuality: 3, preEnergyLevel: 3, preMoodRating: 3,
        preMarketBias: '', preGamePlan: '', preConfidence: 3,
        postSessionRating: 3, postTiltLevel: 'none', postFollowedPlan: true,
        postEmotionalState: '', postLessonsLearned: '', postNotes: '',
      });
    }
  };

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || 'Unknown';

  const RatingSelector = ({ value, onChange, label }: { value: number; onChange: (v: SessionRating) => void; label: string }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} onClick={() => onChange(v as SessionRating)}
            className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all duration-200 ${
              value === v ? 'bg-primary text-primary-foreground scale-110' : 'bg-secondary text-muted-foreground hover:text-white hover:bg-secondary/80'
            }`}>{v}</button>
        ))}
      </div>
    </div>
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Journal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Auto-generated from your trades. Add psychology notes to each session.
          </p>
        </div>
      </motion.div>

      {tradingDays.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/50 p-16 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No trading days yet</p>
          <p className="text-sm mt-2 text-muted-foreground/70 max-w-md mx-auto">
            Import trades from your prop firm or broker and your journal will auto-populate with daily summaries. Then add your psychology notes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Day List */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Trading Days ({tradingDays.length})</p>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
              {tradingDays.map((day, i) => (
                <motion.button
                  key={day.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openDayDetail(day.date)}
                  className={`w-full text-left rounded-2xl p-4 transition-all duration-200 border ${
                    selectedDay === day.date
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card border-border/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{format(parseISO(day.date), 'EEE, MMM dd')}</p>
                    <span className={`text-sm font-bold tabular-nums ${day.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {day.totalPnl >= 0 ? '+' : ''}${day.totalPnl.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{day.tradeCount} trades</span>
                    <span>{day.winRate.toFixed(0)}% win</span>
                    {day.journalEntry && (
                      <span className="text-primary flex items-center gap-0.5">
                        <BookOpen className="h-3 w-3" /> noted
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>


          {/* Right: Day Detail */}
          <div className="lg:col-span-2">
            {selectedDayData ? (
              <motion.div key={selectedDay} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Day Header */}
                <div className="rounded-2xl bg-card border border-border/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{format(parseISO(selectedDayData.date), 'EEEE, MMMM dd yyyy')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Auto-generated from imported trades</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold tabular-nums ${selectedDayData.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {selectedDayData.totalPnl >= 0 ? '+' : ''}${selectedDayData.totalPnl.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Net P&L</p>
                    </div>
                  </div>

                  {/* Day Stats */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="rounded-xl bg-secondary/50 p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedDayData.tradeCount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Trades</p>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedDayData.winRate.toFixed(0)}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Win Rate</p>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-3 text-center">
                      <p className="text-lg font-bold text-profit">+${selectedDayData.bestTrade.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Best</p>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-3 text-center">
                      <p className="text-lg font-bold text-loss">${selectedDayData.worstTrade.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Worst</p>
                    </div>
                  </div>

                  {/* Health data for this day */}
                  {selectedHealth && (
                    <div className="flex gap-3 mt-3 text-xs">
                      {selectedHealth.sleepScore && <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400">Sleep {selectedHealth.sleepScore}</span>}
                      {selectedHealth.hrvAvg && <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400">HRV {selectedHealth.hrvAvg}ms</span>}
                      {selectedHealth.readinessScore && <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400">Ready {selectedHealth.readinessScore}</span>}
                    </div>
                  )}
                </div>

                {/* Trades List (auto from import) */}
                <div className="rounded-2xl bg-card border border-border/50 p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Trades</h3>
                  <div className="space-y-2">
                    {selectedDayData.trades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${trade.direction === 'long' ? 'bg-profit/10' : 'bg-loss/10'}`}>
                            {trade.direction === 'long' ? <ArrowUpRight className="h-3.5 w-3.5 text-profit" /> : <ArrowDownRight className="h-3.5 w-3.5 text-loss" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{trade.symbol} <span className="text-muted-foreground font-normal">{trade.direction.toUpperCase()}</span></p>
                            <p className="text-[11px] text-muted-foreground">{trade.strategy || 'No strategy'} · {trade.quantity} ct</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${(trade.netPnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {(trade.netPnl || 0) >= 0 ? '+' : ''}${(trade.netPnl || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>


                {/* Psychology Section */}
                <div className="rounded-2xl bg-card border border-border/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Brain className="h-4 w-4 text-accent" /> Psychology Notes
                    </h3>
                    <button
                      onClick={() => setShowPsychForm(true)}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {selectedDayData.journalEntry ? 'Edit' : '+ Add Notes'}
                    </button>
                  </div>

                  {selectedDayData.journalEntry ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedDayData.journalEntry.postTiltLevel && (
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${TILT_COLORS[selectedDayData.journalEntry.postTiltLevel]}`}>
                            Tilt: {selectedDayData.journalEntry.postTiltLevel}
                          </span>
                        )}
                        {selectedDayData.journalEntry.postFollowedPlan !== undefined && (
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${selectedDayData.journalEntry.postFollowedPlan ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {selectedDayData.journalEntry.postFollowedPlan ? 'Followed Plan' : 'Deviated'}
                          </span>
                        )}
                        {selectedDayData.journalEntry.postEmotionalState && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">
                            {selectedDayData.journalEntry.postEmotionalState}
                          </span>
                        )}
                      </div>
                      {selectedDayData.journalEntry.preGamePlan && (
                        <div className="rounded-xl bg-secondary/50 p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Game Plan</p>
                          <p className="text-sm text-white">{selectedDayData.journalEntry.preGamePlan}</p>
                        </div>
                      )}
                      {selectedDayData.journalEntry.postLessonsLearned && (
                        <div className="rounded-xl bg-secondary/50 p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Lessons Learned</p>
                          <p className="text-sm text-white">{selectedDayData.journalEntry.postLessonsLearned}</p>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                        <span>Sleep: {selectedDayData.journalEntry.preSleepQuality}/5</span>
                        <span>Energy: {selectedDayData.journalEntry.preEnergyLevel}/5</span>
                        <span>Mood: {selectedDayData.journalEntry.preMoodRating}/5</span>
                        <span>Session: {selectedDayData.journalEntry.postSessionRating}/5</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">No notes yet for this day</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Click "Add Notes" to record your mindset & lessons</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="rounded-2xl bg-card border border-border/50 p-16 text-center">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Select a trading day to view details</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Psychology Form Modal */}
      <AnimatePresence>
        {showPsychForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-lg rounded-2xl bg-card border border-border/50 p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Session Notes — {selectedDay && format(parseISO(selectedDay), 'MMM dd')}</h2>
                <button onClick={() => setShowPsychForm(false)} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Pre-Session</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <RatingSelector label="Sleep" value={psych.preSleepQuality} onChange={(v) => setPsych({ ...psych, preSleepQuality: v })} />
                    <RatingSelector label="Energy" value={psych.preEnergyLevel} onChange={(v) => setPsych({ ...psych, preEnergyLevel: v })} />
                    <RatingSelector label="Mood" value={psych.preMoodRating} onChange={(v) => setPsych({ ...psych, preMoodRating: v })} />
                    <RatingSelector label="Confidence" value={psych.preConfidence} onChange={(v) => setPsych({ ...psych, preConfidence: v })} />
                  </div>
                  <textarea value={psych.preGamePlan} onChange={(e) => setPsych({ ...psych, preGamePlan: e.target.value })} rows={2} className="w-full mt-3 rounded-xl bg-secondary/50 border border-border/50 px-3 py-2 text-sm text-white resize-none" placeholder="Game plan: key levels, setups, max loss..." />
                </div>

                <div className="h-px bg-border/30" />

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-warning" /> Post-Session</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <RatingSelector label="Session Rating" value={psych.postSessionRating} onChange={(v) => setPsych({ ...psych, postSessionRating: v })} />
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tilt Level</label>
                      <div className="flex gap-1 flex-wrap">
                        {(['none', 'low', 'medium', 'high', 'extreme'] as TiltLevel[]).map((level) => (
                          <button key={level} onClick={() => setPsych({ ...psych, postTiltLevel: level })} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${psych.postTiltLevel === level ? TILT_COLORS[level] : 'bg-secondary text-muted-foreground'}`}>{level}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs text-muted-foreground">Followed Plan?</label>
                    <button onClick={() => setPsych({ ...psych, postFollowedPlan: !psych.postFollowedPlan })} className={`px-3 py-1 rounded-lg text-xs font-medium ${psych.postFollowedPlan ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{psych.postFollowedPlan ? 'Yes' : 'No'}</button>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Emotional State</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {EMOTIONAL_STATES.map((state) => (
                        <button key={state} onClick={() => setPsych({ ...psych, postEmotionalState: state })} className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${psych.postEmotionalState === state ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-white'}`}>{state}</button>
                      ))}
                    </div>
                  </div>
                  <textarea value={psych.postLessonsLearned} onChange={(e) => setPsych({ ...psych, postLessonsLearned: e.target.value })} rows={2} className="w-full mt-3 rounded-xl bg-secondary/50 border border-border/50 px-3 py-2 text-sm text-white resize-none" placeholder="What did you learn? What would you do differently?" />
                  <textarea value={psych.postNotes} onChange={(e) => setPsych({ ...psych, postNotes: e.target.value })} rows={2} className="w-full mt-2 rounded-xl bg-secondary/50 border border-border/50 px-3 py-2 text-sm text-white resize-none" placeholder="Additional notes..." />
                </div>

                <button onClick={handleSavePsych} className="w-full rounded-xl bg-primary/90 hover:bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:shadow-[0_0_20px_-5px] hover:shadow-primary/30">Save Notes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
