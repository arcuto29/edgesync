'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { HealthData, HealthSource, HEALTH_SOURCE_LABELS, SessionRating } from '@/types';
import { parseHealthDataFromCSV, SUPPORTED_DEVICES } from '@/lib/health-import';
import { format, parseISO } from 'date-fns';
import {
  Heart,
  Moon,
  Activity,
  Zap,
  Plus,
  X,
  Coffee,
  Wine,
  Brain,
  Upload,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

export default function HealthPage() {
  const healthData = useStore((state) => state.healthData);
  const trades = useStore((state) => state.trades);
  const addHealthData = useStore((state) => state.addHealthData);
  const ouraApiToken = useStore((state) => state.ouraApiToken);
  const setOuraApiToken = useStore((state) => state.setOuraApiToken);


  const [showAdd, setShowAdd] = useState(false);
  const [showImportDevice, setShowImportDevice] = useState(false);
  const [showOuraSetup, setShowOuraSetup] = useState(false);
  const [ouraToken, setOuraToken] = useState('');
  const [importDevice, setImportDevice] = useState<HealthSource>('oura');
  const [importStatus, setImportStatus] = useState('');
  const [showDeviceInfo, setShowDeviceInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    sleepScore: '',
    sleepDuration: '',
    readinessScore: '',
    hrvAvg: '',
    restingHR: '',
    spo2: '',
    steps: '',
    caffeineIntake: '',
    alcoholServings: '',
    stressLevel: 3 as SessionRating,
  });

  const handleAddManual = () => {
    const entry: HealthData = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      date: newEntry.date,
      source: 'manual',
      sleepScore: newEntry.sleepScore ? parseInt(newEntry.sleepScore) : undefined,
      sleepDuration: newEntry.sleepDuration ? parseInt(newEntry.sleepDuration) : undefined,
      readinessScore: newEntry.readinessScore ? parseInt(newEntry.readinessScore) : undefined,
      hrvAvg: newEntry.hrvAvg ? parseInt(newEntry.hrvAvg) : undefined,
      restingHR: newEntry.restingHR ? parseInt(newEntry.restingHR) : undefined,
      spo2: newEntry.spo2 ? parseInt(newEntry.spo2) : undefined,
      steps: newEntry.steps ? parseInt(newEntry.steps) : undefined,
      caffeineIntake: newEntry.caffeineIntake ? parseInt(newEntry.caffeineIntake) : undefined,
      alcoholServings: newEntry.alcoholServings ? parseInt(newEntry.alcoholServings) : undefined,
      stressLevel: newEntry.stressLevel,
    };
    addHealthData(entry);
    setShowAdd(false);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Parsing...');
    const { data, errors } = await parseHealthDataFromCSV(file, importDevice);

    if (data.length > 0) {
      data.forEach((d) => addHealthData(d));
      setImportStatus(`Imported ${data.length} days of health data from ${HEALTH_SOURCE_LABELS[importDevice]}!`);
    } else {
      setImportStatus(`No data found. ${errors.join(', ')}`);
    }
  };

  const handleConnectOura = () => {
    if (ouraToken) {
      setOuraApiToken(ouraToken);
      setShowOuraSetup(false);
    }
  };


  // Correlation data: health scores vs trading P&L
  const correlationData = healthData.map((h) => {
    const dayTrades = trades.filter(
      (t) => t.exitTime && t.exitTime.startsWith(h.date) && t.status === 'closed'
    );
    const dayPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    return {
      date: h.date,
      sleepScore: h.sleepScore || 0,
      readiness: h.readinessScore || 0,
      hrv: h.hrvAvg || 0,
      pnl: dayPnl,
      tradeCount: dayTrades.length,
    };
  }).filter((d) => d.tradeCount > 0);

  const sortedHealth = [...healthData].sort((a, b) => b.date.localeCompare(a.date));

  // Count by device
  const deviceCounts = healthData.reduce((acc, h) => {
    acc[h.source] = (acc[h.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Health & Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track how your body affects your trading — works with any smart ring
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportDevice(true)}
            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
          >
            <Upload className="h-4 w-4" />
            Import Data
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Manual Entry
          </button>
        </div>
      </div>


      {/* Supported Devices Banner */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          Supported Devices
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SUPPORTED_DEVICES.map((device) => (
            <div
              key={device.id}
              className="relative flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs"
            >
              <span className={`w-2 h-2 rounded-full ${deviceCounts[device.id] ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span className="text-white font-medium">{device.name}</span>
              {!device.hasSubscription && (
                <span className="text-[10px] px-1 py-0 rounded bg-green-500/20 text-green-400">Free</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Health Stats */}
      {healthData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-muted-foreground">Avg Sleep Score</p>
            </div>
            <p className="text-xl font-bold text-white">
              {healthData.filter((h) => h.sleepScore).length > 0
                ? Math.round(healthData.filter((h) => h.sleepScore).reduce((sum, h) => sum + (h.sleepScore || 0), 0) / healthData.filter((h) => h.sleepScore).length)
                : '--'}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <p className="text-xs text-muted-foreground">Avg Readiness</p>
            </div>
            <p className="text-xl font-bold text-white">
              {healthData.filter((h) => h.readinessScore).length > 0
                ? Math.round(healthData.filter((h) => h.readinessScore).reduce((sum, h) => sum + (h.readinessScore || 0), 0) / healthData.filter((h) => h.readinessScore).length)
                : '--'}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-400" />
              <p className="text-xs text-muted-foreground">Avg HRV</p>
            </div>
            <p className="text-xl font-bold text-white">
              {healthData.filter((h) => h.hrvAvg).length > 0
                ? Math.round(healthData.filter((h) => h.hrvAvg).reduce((sum, h) => sum + (h.hrvAvg || 0), 0) / healthData.filter((h) => h.hrvAvg).length)
                : '--'}
              <span className="text-sm text-muted-foreground ml-1">ms</span>
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-400" />
              <p className="text-xs text-muted-foreground">Avg Resting HR</p>
            </div>
            <p className="text-xl font-bold text-white">
              {healthData.filter((h) => h.restingHR).length > 0
                ? Math.round(healthData.filter((h) => h.restingHR).reduce((sum, h) => sum + (h.restingHR || 0), 0) / healthData.filter((h) => h.restingHR).length)
                : '--'}
              <span className="text-sm text-muted-foreground ml-1">bpm</span>
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-muted-foreground">Avg SpO2</p>
            </div>
            <p className="text-xl font-bold text-white">
              {healthData.filter((h) => h.spo2).length > 0
                ? Math.round(healthData.filter((h) => h.spo2).reduce((sum, h) => sum + (h.spo2 || 0), 0) / healthData.filter((h) => h.spo2).length)
                : '--'}
              <span className="text-sm text-muted-foreground ml-1">%</span>
            </p>
          </div>
        </div>
      )}


      {/* Correlation Chart */}
      {correlationData.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Sleep Score vs Trading P&L
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Each dot = 1 trading day. See if better sleep = better trades.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
              <XAxis dataKey="sleepScore" name="Sleep Score" stroke="hsl(215, 20%, 55%)" fontSize={11} />
              <YAxis dataKey="pnl" name="P&L" stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 20%, 9%)', border: '1px solid hsl(220, 20%, 18%)', borderRadius: '8px', color: 'white' }}
                formatter={(value: any, name: any) => [name === 'pnl' ? `$${Number(value).toFixed(2)}` : value, name === 'pnl' ? 'P&L' : 'Sleep Score']}
              />
              <Scatter data={correlationData} fill="hsl(142, 76%, 46%)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Health Trend Chart */}
      {healthData.length > 1 && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Health Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[...healthData].sort((a, b) => a.date.localeCompare(b.date))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
              <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(d) => { try { return format(parseISO(d), 'MMM dd'); } catch { return d; } }} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 20%, 9%)', border: '1px solid hsl(220, 20%, 18%)', borderRadius: '8px', color: 'white' }} />
              <Line type="monotone" dataKey="sleepScore" stroke="#a78bfa" strokeWidth={2} dot={false} name="Sleep" />
              <Line type="monotone" dataKey="readinessScore" stroke="#fbbf24" strokeWidth={2} dot={false} name="Readiness" />
              <Line type="monotone" dataKey="hrvAvg" stroke="#34d399" strokeWidth={2} dot={false} name="HRV" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}


      {/* Health Log */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Health Log</h3>
        {sortedHealth.length > 0 ? (
          <div className="space-y-3">
            {sortedHealth.slice(0, 30).map((h) => (
              <div key={h.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium text-white">{format(parseISO(h.date), 'MMM dd, yyyy')}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {HEALTH_SOURCE_LABELS[h.source]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {h.sleepScore && <span className="text-purple-400">Sleep: {h.sleepScore}</span>}
                  {h.readinessScore && <span className="text-yellow-400">Ready: {h.readinessScore}</span>}
                  {h.hrvAvg && <span className="text-green-400">HRV: {h.hrvAvg}ms</span>}
                  {h.restingHR && <span className="text-red-400">HR: {h.restingHR}bpm</span>}
                  {h.spo2 && <span className="text-blue-400">SpO2: {h.spo2}%</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No health data yet</p>
            <p className="text-sm mt-1">Import from your smart ring or add data manually</p>
          </div>
        )}
      </div>


      {/* Import Device Modal */}
      {showImportDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Import Health Data</h2>
              <button onClick={() => { setShowImportDevice(false); setImportStatus(''); }} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Device Selection */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Select Your Device</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_DEVICES.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => { setImportDevice(device.id); setShowDeviceInfo(device.id); }}
                      className={`flex flex-col items-start rounded-xl p-3 text-left text-xs transition-colors ${
                        importDevice === device.id
                          ? 'bg-primary/20 border border-primary text-white'
                          : 'bg-secondary border border-border text-muted-foreground hover:text-white'
                      }`}
                    >
                      <span className="font-medium text-sm">{device.name}</span>
                      <span className="mt-0.5 opacity-70">
                        {device.hasSubscription ? 'Subscription req.' : 'No subscription'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions for selected device */}
              {showDeviceInfo && (
                <div className="rounded-xl bg-secondary p-4">
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    How to export from {SUPPORTED_DEVICES.find(d => d.id === showDeviceInfo)?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {SUPPORTED_DEVICES.find(d => d.id === showDeviceInfo)?.csvExportInstructions}
                  </p>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {SUPPORTED_DEVICES.find(d => d.id === showDeviceInfo)?.dataAvailable.map((d) => (
                      <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-card text-muted-foreground">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Upload CSV</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:text-black file:font-medium"
                />
              </div>

              {/* Oura API option */}
              {importDevice === 'oura' && (
                <button
                  onClick={() => { setShowImportDevice(false); setShowOuraSetup(true); }}
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm font-medium text-white hover:opacity-80 transition-opacity"
                >
                  Or connect via Oura API (auto-sync)
                </button>
              )}

              {importStatus && (
                <p className={`text-sm ${importStatus.includes('Imported') ? 'text-profit' : 'text-warning'}`}>
                  {importStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Manual Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add Health Data</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date</label>
                <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Sleep Score (0-100)</label>
                  <input type="number" value={newEntry.sleepScore} onChange={(e) => setNewEntry({ ...newEntry, sleepScore: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="85" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Sleep Hours</label>
                  <input type="number" step="0.5" value={newEntry.sleepDuration} onChange={(e) => setNewEntry({ ...newEntry, sleepDuration: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="7.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Readiness (0-100)</label>
                  <input type="number" value={newEntry.readinessScore} onChange={(e) => setNewEntry({ ...newEntry, readinessScore: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="80" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">HRV (ms)</label>
                  <input type="number" value={newEntry.hrvAvg} onChange={(e) => setNewEntry({ ...newEntry, hrvAvg: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="45" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Resting HR (bpm)</label>
                  <input type="number" value={newEntry.restingHR} onChange={(e) => setNewEntry({ ...newEntry, restingHR: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="58" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">SpO2 (%)</label>
                  <input type="number" value={newEntry.spo2} onChange={(e) => setNewEntry({ ...newEntry, spo2: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="97" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Coffee className="h-3 w-3" /> Caffeine (mg)
                  </label>
                  <input type="number" value={newEntry.caffeineIntake} onChange={(e) => setNewEntry({ ...newEntry, caffeineIntake: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="200" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Wine className="h-3 w-3" /> Alcohol (drinks)
                  </label>
                  <input type="number" value={newEntry.alcoholServings} onChange={(e) => setNewEntry({ ...newEntry, alcoholServings: e.target.value })}
                    className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border" placeholder="0" />
                </div>
              </div>
              <button onClick={handleAddManual}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                Save Health Data
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Oura API Setup Modal */}
      {showOuraSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Connect Oura Ring API</h2>
              <button onClick={() => setShowOuraSetup(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary p-4">
                <h4 className="text-sm font-medium text-white mb-2">How to get your token:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to cloud.ouraring.com/personal-access-tokens</li>
                  <li>Sign in with your Oura account</li>
                  <li>Create a new Personal Access Token</li>
                  <li>Copy the token and paste it below</li>
                </ol>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">API Token</label>
                <input type="password" value={ouraToken} onChange={(e) => setOuraToken(e.target.value)}
                  className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-white border border-border"
                  placeholder="Paste your Oura personal access token" />
              </div>
              {ouraApiToken && <p className="text-xs text-profit">Oura Ring is currently connected</p>}
              <button onClick={handleConnectOura} disabled={!ouraToken}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                Connect Oura Ring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
