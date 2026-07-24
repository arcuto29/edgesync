'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { JournalEntry, TiltLevel, SessionRating } from '@/types';
import { format, parseISO } from 'date-fns';
import { BookOpen, Plus, Brain, AlertTriangle, CheckCircle, X } from 'lucide-react';

const TILT_COLORS: Record<TiltLevel, string> = {
  none: 'bg-green-500/20 text-green-400',
  low: 'bg-yellow-500/20 text-yellow-400',
  medium: 'bg-orange-500/20 text-orange-400',
  high: 'bg-red-500/20 text-red-400',
  extreme: 'bg-red-700/20 text-red-300',
};

const EMOTIONAL_STATES = [
  'Calm & Focused',
  'Confident',
  'Anxious',
  'FOMO',
  'Frustrated',
  'Revenge Mindset',
  'Euphoric/Overconfident',
  'Bored/Forcing',
  'Tired/Fatigued',
  'Distracted',
  'Patient',
  'Disciplined',
];

export default function JournalPage() {
  const journalEntries = useStore((state) => state.journalEntries);
  const addJournalEntry = useStore((state) => state.addJournalEntry);
  const deleteJournalEntry = useStore((state) => state.deleteJournalEntry);
  const [showAdd, setShowAdd] = useState(false);

  const [entry, setEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    // Pre-session
    preSleepQuality: 3 as SessionRating,
    preEnergyLevel: 3 as SessionRating,
    preMoodRating: 3 as SessionRating,
    preMarketBias: '',
    preGamePlan: '',
    preConfidence: 3 as SessionRating,
    // Post-session
    postSessionRating: 3 as SessionRating,
    postTiltLevel: 'none' as TiltLevel,
    postFollowedPlan: true,
    postEmotionalState: '',
    postLessonsLearned: '',
    postNotes: '',
  });

  const handleSave = () => {
    const newEntry: JournalEntry = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      ...entry,
    };
    addJournalEntry(newEntry);
    setShowAdd(false);
  };

  const RatingSelector = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (v: SessionRating) => void;
    label: string;
  }) => (
    <div>
      <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v as SessionRating)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
              value === v
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-white'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  const sortedEntries = [...journalEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            Track your psychology, mindset, and trading discipline
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      {/* Journal Entries */}
      {sortedEntries.length > 0 ? (
        <div className="space-y-4">
          {sortedEntries.map((je) => (
            <div
              key={je.id}
              className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--secondary))]">
                    <BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {format(parseISO(je.date), 'EEEE, MMM dd yyyy')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {je.postTiltLevel && (
                        <span className={`text-xs px-2 py-0.5 rounded ${TILT_COLORS[je.postTiltLevel]}`}>
                          Tilt: {je.postTiltLevel}
                        </span>
                      )}
                      {je.postFollowedPlan !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          je.postFollowedPlan
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {je.postFollowedPlan ? 'Followed Plan' : 'Deviated'}
                        </span>
                      )}
                      {je.postSessionRating && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          Session: {je.postSessionRating}/5
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteJournalEntry(je.id)}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--loss))]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Entry Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {je.preGamePlan && (
                  <div className="rounded-lg bg-[hsl(var(--secondary))] p-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Game Plan</p>
                    <p className="text-sm text-white">{je.preGamePlan}</p>
                  </div>
                )}
                {je.postLessonsLearned && (
                  <div className="rounded-lg bg-[hsl(var(--secondary))] p-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Lessons Learned</p>
                    <p className="text-sm text-white">{je.postLessonsLearned}</p>
                  </div>
                )}
                {je.postEmotionalState && (
                  <div className="rounded-lg bg-[hsl(var(--secondary))] p-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Emotional State</p>
                    <p className="text-sm text-white">{je.postEmotionalState}</p>
                  </div>
                )}
                {je.postNotes && (
                  <div className="rounded-lg bg-[hsl(var(--secondary))] p-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Notes</p>
                    <p className="text-sm text-white">{je.postNotes}</p>
                  </div>
                )}
              </div>

              {/* Pre-session ratings */}
              <div className="mt-3 flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                {je.preSleepQuality && <span>Sleep: {je.preSleepQuality}/5</span>}
                {je.preEnergyLevel && <span>Energy: {je.preEnergyLevel}/5</span>}
                {je.preMoodRating && <span>Mood: {je.preMoodRating}/5</span>}
                {je.preConfidence && <span>Confidence: {je.preConfidence}/5</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-16 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-50" />
          <p className="text-lg font-medium text-[hsl(var(--muted-foreground))]">No journal entries yet</p>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Start tracking your mindset before and after each session
          </p>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">New Journal Entry</h2>
              <button onClick={() => setShowAdd(false)} className="text-[hsl(var(--muted-foreground))] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Date</label>
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                  className="rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                />
              </div>

              {/* PRE-SESSION */}
              <div>
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--primary))]" />
                  Pre-Session Check-in
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RatingSelector
                    label="Sleep Quality"
                    value={entry.preSleepQuality}
                    onChange={(v) => setEntry({ ...entry, preSleepQuality: v })}
                  />
                  <RatingSelector
                    label="Energy Level"
                    value={entry.preEnergyLevel}
                    onChange={(v) => setEntry({ ...entry, preEnergyLevel: v })}
                  />
                  <RatingSelector
                    label="Mood"
                    value={entry.preMoodRating}
                    onChange={(v) => setEntry({ ...entry, preMoodRating: v })}
                  />
                  <RatingSelector
                    label="Confidence"
                    value={entry.preConfidence}
                    onChange={(v) => setEntry({ ...entry, preConfidence: v })}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Game Plan</label>
                  <textarea
                    value={entry.preGamePlan}
                    onChange={(e) => setEntry({ ...entry, preGamePlan: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] resize-none"
                    placeholder="What's your plan for today? Key levels, setups to watch, max loss..."
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Market Bias</label>
                  <input
                    type="text"
                    value={entry.preMarketBias}
                    onChange={(e) => setEntry({ ...entry, preMarketBias: e.target.value })}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))]"
                    placeholder="Bullish, bearish, neutral, choppy..."
                  />
                </div>
              </div>

              {/* POST-SESSION */}
              <div>
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                  Post-Session Review
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RatingSelector
                    label="Session Rating"
                    value={entry.postSessionRating}
                    onChange={(v) => setEntry({ ...entry, postSessionRating: v })}
                  />
                  <div>
                    <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">Tilt Level</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['none', 'low', 'medium', 'high', 'extreme'] as TiltLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setEntry({ ...entry, postTiltLevel: level })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            entry.postTiltLevel === level
                              ? TILT_COLORS[level]
                              : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm text-[hsl(var(--muted-foreground))]">Followed Plan?</label>
                  <button
                    onClick={() => setEntry({ ...entry, postFollowedPlan: !entry.postFollowedPlan })}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium ${
                      entry.postFollowedPlan
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {entry.postFollowedPlan ? 'Yes' : 'No'}
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Emotional State</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOTIONAL_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => setEntry({ ...entry, postEmotionalState: state })}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          entry.postEmotionalState === state
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-white'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Lessons Learned</label>
                  <textarea
                    value={entry.postLessonsLearned}
                    onChange={(e) => setEntry({ ...entry, postLessonsLearned: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] resize-none"
                    placeholder="What did you learn today? What would you do differently?"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1">Additional Notes</label>
                  <textarea
                    value={entry.postNotes}
                    onChange={(e) => setEntry({ ...entry, postNotes: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm text-white border border-[hsl(var(--border))] resize-none"
                    placeholder="Anything else worth noting..."
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
