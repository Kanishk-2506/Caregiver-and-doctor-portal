import React, { useState } from 'react';
import { Flame, Clock, Zap, Bell, Volume2, Check, TrendingUp, RefreshCw } from 'lucide-react';
import PathwayProgress from './PathwayProgress';
import TrendChart from './TrendChart';
import { useToast } from './ToastProvider';

const initialReminders = [
  { id: 1, title: 'Morning Medication', time: '8:00 AM', status: 'completed' },
  { id: 2, title: 'Afternoon Walk', time: '2:00 PM', status: 'pending' },
  { id: 3, title: 'Evening Tea & Stories', time: '5:00 PM', status: 'pending' },
  { id: 4, title: 'Bedtime Routine', time: '9:00 PM', status: 'pending' },
];

const formatSync = (date) => {
  const diffMin = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  const rel =
    diffMin < 1 ? 'just now'
    : diffMin < 60 ? `${diffMin} min ago`
    : `${Math.round(diffMin / 60)} h ago`;
  const abs = date.toLocaleString(undefined, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return { rel, abs };
};

export default function DashboardView() {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState(initialReminders);
  const [lastSync, setLastSync] = useState(() => new Date(Date.now() - 12 * 60 * 1000));
  const [syncing, setSyncing] = useState(false);

  const toggleReminder = (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, status: r.status === 'completed' ? 'pending' : 'completed' } : r));
  };

  const sendVoiceNote = (title) => {
    showToast(`Voice note sent for "${title}"`);
  };

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setLastSync(new Date());
      setSyncing(false);
      showToast('Data synced — everything is up to date');
    }, 1200);
  };

  const sync = formatSync(lastSync);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: '#5F6F78' }}>Daily progress overview</p>
        </div>

        {/* Last sync date & time */}
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: syncing ? '#E88A2D' : '#3E8E7E', animation: syncing ? 'sos-pulse 1.4s infinite' : 'none' }}
          />
          <div className="leading-tight">
            <div className="text-[11px] font-semibold" style={{ color: '#26343B' }}>
              {syncing ? 'Syncing…' : `Last synced ${sync.rel}`}
            </div>
            <div className="text-[10px]" style={{ color: '#5F6F78' }}>{sync.abs}</div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(168,199,216,0.15)', border: '1px solid #A8C7D8', color: '#26343B' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} style={{ color: '#5F8FA3' }} />
            Sync now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak */}
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,138,45,0.12)', border: '1px solid rgba(232,138,45,0.25)' }}>
              <Flame className="w-5 h-5" style={{ color: '#E88A2D' }} />
            </div>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: '#FCE5CC', color: '#E88A2D' }}>Active Streak</span>
          </div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>18 Days</div>
          <div className="text-xs mt-1" style={{ color: '#5F6F78' }}>Consistent daily play streak</div>
        </div>

        {/* Playtime */}
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,199,216,0.2)', border: '1px solid rgba(168,199,216,0.35)' }}>
              <Clock className="w-5 h-5" style={{ color: '#5F8FA3' }} />
            </div>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(168,199,216,0.2)', color: '#5F8FA3' }}>80% of target</span>
          </div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>24 mins</div>
          <div className="text-xs mt-1" style={{ color: '#5F6F78' }}>Today's active playtime · 30m target</div>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: '#D6E0E5' }}>
            <div className="h-full rounded-full" style={{ width: '80%', background: '#3E8E7E' }} />
          </div>
        </div>

        {/* Cognitive Focus */}
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(95,143,163,0.12)', border: '1px solid rgba(95,143,163,0.25)' }}>
              <Zap className="w-5 h-5" style={{ color: '#5F8FA3' }} />
            </div>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(95,143,163,0.12)', color: '#5F8FA3' }}>Optimal</span>
          </div>
          <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>32s avg</div>
          <div className="text-xs mt-1" style={{ color: '#5F6F78' }}>Cognitive focus & response speed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5" style={{ color: '#A8C7D8' }} />
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Today's Pathway Progress</h2>
            </div>
            <PathwayProgress />
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Cognitive Stability Trend</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>6-week response speed & accuracy</p>
            </div>
            <TrendChart />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5" style={{ color: '#A8C7D8' }} />
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Daily Reminders</h2>
            </div>
            <div className="space-y-3">
              {reminders.map(reminder => (
                <div key={reminder.id} className="p-3 rounded-lg flex items-center gap-3" style={{
                  background: reminder.status === 'completed' ? '#DDF1EC' : '#FCE5CC',
                  border: `1px solid ${reminder.status === 'completed' ? 'rgba(62,142,126,0.2)' : 'rgba(232,138,45,0.2)'}`,
                }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#26343B' }}>{reminder.title}</div>
                    <div className="text-xs" style={{ color: '#5F6F78' }}>{reminder.time}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{
                    background: reminder.status === 'completed' ? '#3E8E7E' : '#E88A2D',
                    color: '#FFFFFF',
                  }}>
                    {reminder.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => sendVoiceNote(reminder.title)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(168,199,216,0.2)', border: '1px solid #A8C7D8' }}
                      title="Send Voice Note"
                    >
                      <Volume2 className="w-3.5 h-3.5" style={{ color: '#5F8FA3' }} />
                    </button>
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: reminder.status === 'completed' ? 'rgba(62,142,126,0.15)' : 'rgba(255,255,255,0.5)',
                        border: reminder.status === 'completed' ? '1px solid rgba(62,142,126,0.3)' : '1px solid #D6E0E5',
                      }}
                      title="Mark Done"
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: reminder.status === 'completed' ? '#3E8E7E' : '#5F6F78' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
