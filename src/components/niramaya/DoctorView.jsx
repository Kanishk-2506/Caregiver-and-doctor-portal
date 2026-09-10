import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Flame, Gamepad2, TrendingUp, Info } from 'lucide-react';
import PathwayProgress from './PathwayProgress';
import TrendChart from './TrendChart';
import { usePatient } from '../../context/PatientProvider';
import { useCollection } from '../../lib/useCollection';
import { getRecentResults } from '../../lib/api';
import { NotConfigured } from './ReminderVault';

const unlockedGameCount = (m) => Math.min(8, 4 + Math.floor((m || 0) / 2));

const GAME_TITLES = {
  'memory-flip': 'Memory Flow', 'pattern-recognition': 'Pattern Recognition',
  'sequence-recall': 'Sequence Recall', 'jigsaw-puzzle': 'Jigsaw Puzzle',
  'musical-sequence': 'Musical Sequence', 'flow-free': 'Northeast Trails',
  'rule-switch': 'Rule Switch', 'picture-recall': 'Picture Detection',
};

export default function DoctorView() {
  const { patient, patientId, doctor, configured } = usePatient();

  const progress = useCollection('game_progress', patientId, { orderBy: 'game_id', enabled: !!patientId });
  const daily = useCollection('daily_records', patientId, { orderBy: 'date', enabled: !!patientId });
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!patientId || !configured) return;
    getRecentResults(patientId, 20).then(setResults).catch(() => {});
  }, [patientId, configured]);

  const trend = useMemo(() => {
    const rows = daily.rows;
    if (rows.length < 2) return null;
    const first = rows[0].avg_accuracy;
    const last = rows[rows.length - 1].avg_accuracy;
    return { first, last, delta: last - first };
  }, [daily.rows]);

  if (!configured) return <NotConfigured />;

  const gamesUnlocked = unlockedGameCount(patient?.milestone);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Patient Analysis</h1>
        <p className="text-sm" style={{ color: '#5F6F78' }}>
          {patient?.name} · read-only clinical view · {doctor?.name}
        </p>
      </div>

      <div className="glass-card rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#5F8FA3' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#4A6470' }}>
          The Doctor Portal shows cognitive-performance trends only. It does not expose the patient's
          personal settings, contacts or photos. Cognitive-training data is supporting information for
          assessment — the platform does not diagnose or treat dementia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat icon={Flame} color="#E88A2D" value={`${patient?.streak ?? 0} days`} label="Current streak" />
        <Stat icon={Gamepad2} color="#3E8E7E" value={`${gamesUnlocked} / 8`} label={`Games unlocked · milestone ${patient?.milestone ?? 0}`} />
        <Stat icon={TrendingUp} color="#5F8FA3"
          value={trend ? `${trend.delta >= 0 ? '+' : ''}${trend.delta}%` : '—'}
          label={trend ? `Accuracy change (${trend.first}% → ${trend.last}%)` : 'Accuracy trend'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" style={{ color: '#C9C9C9' }} />
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Cognitive Stability Trend</h2>
            </div>
            <TrendChart records={daily.rows} />
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Recent Sessions</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {results.length === 0 && <p className="text-sm" style={{ color: '#5F6F78' }}>No sessions recorded yet.</p>}
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: '#F6F6F7' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#26343B' }}>{GAME_TITLES[r.game_id] || r.game_id}</div>
                    <div className="text-xs" style={{ color: '#5F6F78' }}>{new Date(r.played_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#DDF1EC', color: '#3E8E7E' }}>L{r.level}</span>
                  <span className="text-sm font-bold" style={{ color: r.accuracy >= 70 ? '#3E8E7E' : r.accuracy >= 50 ? '#E88A2D' : '#E74C4C' }}>{r.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Per-Game Progress</h2>
            <PathwayProgress progress={progress.rows} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, color, value, label }) {
  return (
    <div className="glass-card p-5 rounded-xl">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}1f`, border: `1px solid ${color}33` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: '#5F6F78' }}>{label}</div>
    </div>
  );
}
