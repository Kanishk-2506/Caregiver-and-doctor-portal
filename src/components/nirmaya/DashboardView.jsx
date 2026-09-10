import React, { useMemo } from 'react';
import { Flame, Zap, Bell, Check, TrendingUp, Gamepad2, CalendarClock } from 'lucide-react';
import PathwayProgress from './PathwayProgress';
import TrendChart from './TrendChart';
import { usePatient } from '../../context/PatientProvider';
import { useCollection } from '../../lib/useCollection';
import { NotConfigured } from './ReminderVault';

// Same unlock curve the patient app uses (data/games.ts).
const unlockedGameCount = (milestone) => Math.min(8, 4 + Math.floor((milestone || 0) / 2));

export default function DashboardView() {
  const { patient, patientId, configured } = usePatient();
  const reminders = useCollection('reminders', patientId, { orderBy: 'created_at', ascending: true });
  const progress = useCollection('game_progress', patientId, { orderBy: 'game_id', ascending: true, enabled: !!patientId });
  const daily = useCollection('daily_records', patientId, { orderBy: 'date', ascending: true, enabled: !!patientId });

  const avgAccuracy = useMemo(() => {
    const rows = progress.rows;
    if (!rows.length) return 0;
    return Math.round(rows.reduce((s, r) => s + (r.best_accuracy || 0), 0) / rows.length);
  }, [progress.rows]);

  if (!configured) return <NotConfigured />;

  const gamesUnlocked = unlockedGameCount(patient?.milestone);
  const appt = patient?.next_appointment;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: '#5F6F78' }}>
            {patient?.name ? `${patient.name}'s daily progress` : 'Daily progress overview'} · live from the patient app
          </p>
        </div>
        {appt && (
          <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
            <CalendarClock className="w-4 h-4" style={{ color: '#5F8FA3' }} />
            <div className="leading-tight">
              <div className="text-[11px] font-semibold" style={{ color: '#26343B' }}>Next appointment</div>
              <div className="text-[10px]" style={{ color: '#5F6F78' }}>{appt.date} · {appt.doctorName}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Flame} iconBg="rgba(232,138,45,0.12)" iconColor="#E88A2D" tag="Active Streak" tagBg="#FCE5CC" tagColor="#E88A2D"
          value={`${patient?.streak ?? 0} Days`} sub="Consecutive daily play streak" />
        <StatCard icon={Zap} iconBg="rgba(95,143,163,0.12)" iconColor="#5F8FA3" tag="Best accuracy" tagBg="rgba(95,143,163,0.12)" tagColor="#5F8FA3"
          value={`${avgAccuracy}%`} sub="Average of best score per game" />
        <StatCard icon={Gamepad2} iconBg="rgba(62,142,126,0.12)" iconColor="#3E8E7E" tag="Progression" tagBg="#DDF1EC" tagColor="#3E8E7E"
          value={`${gamesUnlocked} / 8`} sub={`Games unlocked · milestone ${patient?.milestone ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5" style={{ color: '#C9C9C9' }} />
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Per-Game Progress</h2>
            </div>
            <PathwayProgress progress={progress.rows} />
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Daily Accuracy Trend</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>Average accuracy across each completed daily set</p>
            </div>
            <TrendChart records={daily.rows} />
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Games Completed per Day</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>Whether the daily training set was finished</p>
            </div>
            <DayBars records={daily.rows} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5" style={{ color: '#C9C9C9' }} />
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Today&rsquo;s Reminders</h2>
            </div>
            <div className="space-y-3">
              {reminders.rows.length === 0 && (
                <p className="text-sm" style={{ color: '#5F6F78' }}>No reminders configured yet.</p>
              )}
              {reminders.rows.filter((r) => r.active).map((r) => {
                const done = r.acknowledged;
                return (
                  <div key={r.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: '#FFFFFF', border: '1px solid #ECECEC' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: done ? '#3E8E7E' : '#E88A2D' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#26343B' }}>{r.title}</div>
                      <div className="text-xs" style={{ color: '#5F6F78' }}>{r.time}</div>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: done ? '#3E8E7E' : '#9AAAB2' }}>
                      {done ? 'Done' : 'Pending'}
                    </span>
                    {done && <Check className="w-3.5 h-3.5" style={{ color: '#3E8E7E' }} />}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] mt-4" style={{ color: '#9AAAB2' }}>
              Status updates automatically when the patient acknowledges a reminder in the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayBars({ records = [] }) {
  const data = records.slice(-14);
  if (data.length === 0) {
    return <p className="text-sm py-6 text-center" style={{ color: '#5F6F78' }}>No daily records yet.</p>;
  }
  const max = Math.max(4, ...data.map((d) => d.games_completed ?? 0));
  const finishedDays = data.filter((d) => (d.games_completed ?? 0) >= 4).length;

  return (
    <div>
      <div className="flex gap-2 h-40">
        {data.map((d) => {
          const g = d.games_completed ?? 0;
          const acc = d.avg_accuracy ?? 0;
          const full = g >= 4;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end min-w-0"
              title={`${new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} — ${g} games, ${acc}% avg accuracy`}
            >
              <span className="text-[10px] font-bold mb-1" style={{ color: full ? '#3E8E7E' : '#9AAAB2' }}>{g}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${Math.max(4, (g / max) * 100)}%`, background: full ? '#3E8E7E' : '#DBE4E1' }}
              />
              <span className="text-[10px] mt-1.5" style={{ color: '#9AAAB2' }}>
                {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: '#5F6F78' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#3E8E7E' }} /> full set (4+ games)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#DBE4E1' }} /> partial day
        </span>
        <span className="ml-auto">{finishedDays} / {data.length} days completed</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, tag, tagBg, tagColor, value, sub }) {
  return (
    <div className="glass-card p-5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg, border: `1px solid ${iconColor}33` }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: tagBg, color: tagColor }}>{tag}</span>
      </div>
      <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: '#5F6F78' }}>{sub}</div>
    </div>
  );
}
