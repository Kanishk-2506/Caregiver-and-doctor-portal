import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid,
} from 'recharts';
import { Activity, Timer, LogOut, Layers } from 'lucide-react';
import { usePatient } from '../../context/PatientProvider';
import { getGameResults } from '../../lib/api';
import { NotConfigured } from './ReminderVault';

// game_id -> cognitive domain (brain lobe). Mirrors game_domain() in the DB.
const GAME_DOMAIN = {
  'memory-flip': 'memory', 'sequence-recall': 'memory', 'musical-sequence': 'memory',
  'pattern-recognition': 'logic', 'rule-switch': 'logic',
  'flow-free': 'spatial', 'jigsaw-puzzle': 'spatial',
  'picture-recall': 'visual', 'memory-chest': 'memory',
};
const DOMAIN_AXES = [
  { key: 'logic', label: 'Logic · Frontal' },
  { key: 'memory', label: 'Memory · Temporal' },
  { key: 'spatial', label: 'Spatial · Parietal' },
  { key: 'visual', label: 'Visual · Occipital' },
];

const INK = '#26343B';
const MUTED = '#5F6F78';
const ACCENT = '#3E8E7E';   // accuracy
const ACCENT2 = '#C97A1B';  // reaction time
const HEAT = ['#F0F0F0', '#DCEAE5', '#A9D5C8', '#66B5A0', '#3E8E7E']; // none → L1 → L3

const DAY = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const weekKey = (d) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // back to Sunday
  return x.getTime();
};

export default function CognitiveReport() {
  const { patient, patientId, configured } = usePatient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !configured) { setLoading(false); return; }
    setLoading(true);
    getGameResults(patientId, 120)
      .then((r) => setRows(r.map((x) => ({ ...x, domain: x.domain || GAME_DOMAIN[x.game_id] || 'logic' }))))
      .catch((e) => console.warn('[report]', e.message))
      .finally(() => setLoading(false));
  }, [patientId, configured]);

  const games = useMemo(() => rows.filter((r) => r.source !== 'memory_chest'), [rows]);
  const memoryChest = useMemo(() => rows.filter((r) => r.source === 'memory_chest'), [rows]);
  const completed = useMemo(() => games.filter((r) => !r.abandoned), [games]);

  // ---- raw-metric summary (the payload the games capture) -------------------
  const summary = useMemo(() => {
    if (completed.length === 0) return null;
    const now = Date.now();
    const recent = completed.filter((r) => now - new Date(r.played_at) < 30 * DAY);
    const older = completed.filter((r) => now - new Date(r.played_at) >= 60 * DAY);
    const rt = (list) => Math.round(avg(list.map((r) => r.reaction_ms).filter(Boolean)));
    return {
      reactionNow: rt(recent) || rt(completed),
      reactionThen: rt(older) || rt(completed),
      errorRate: Math.round(avg(completed.map((r) => (r.error_rate ?? (100 - r.accuracy) / 100))) * 100),
      abandonRate: Math.round((games.filter((r) => r.abandoned).length / Math.max(1, games.length)) * 100),
      threshold: Math.max(1, ...completed.map((r) => r.adaptive_threshold || r.level || 1)),
    };
  }, [completed, games]);

  // ---- 1. radar: this week vs baseline by domain ---------------------------
  const radarData = useMemo(() => {
    const now = Date.now();
    const week = completed.filter((r) => now - new Date(r.played_at) < 7 * DAY);
    const base = completed.filter((r) => now - new Date(r.played_at) >= 45 * DAY);
    return DOMAIN_AXES.map(({ key, label }) => ({
      domain: label,
      week: Math.round(avg(week.filter((r) => r.domain === key).map((r) => r.accuracy))) || 0,
      baseline: Math.round(avg(base.filter((r) => r.domain === key).map((r) => r.accuracy))) || 70,
    }));
  }, [completed]);

  // ---- 2. longitudinal reaction vs accuracy (weekly) ----------------------
  const trendData = useMemo(() => {
    const byWeek = new Map();
    completed.forEach((r) => {
      const k = weekKey(r.played_at);
      if (!byWeek.has(k)) byWeek.set(k, { acc: [], rt: [] });
      byWeek.get(k).acc.push(r.accuracy);
      if (r.reaction_ms) byWeek.get(k).rt.push(r.reaction_ms);
    });
    return [...byWeek.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => ({
        label: new Date(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        accuracy: Math.round(avg(v.acc)),
        reaction: +(avg(v.rt) / 1000).toFixed(2),
      }));
  }, [completed]);

  // ---- 3. daily consistency heatmap (13 weeks) ---------------------------
  const heat = useMemo(() => {
    const byDay = new Map();
    games.forEach((r) => {
      const k = startOfDay(r.played_at).getTime();
      const cur = byDay.get(k) || { level: 0, abandonedOnly: true };
      if (!r.abandoned) { cur.level = Math.max(cur.level, r.adaptive_threshold || r.level || 1); cur.abandonedOnly = false; }
      byDay.set(k, cur);
    });
    const weeks = 13;
    const end = startOfDay(Date.now());
    end.setDate(end.getDate() + (6 - end.getDay())); // to Saturday
    const cols = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const col = [];
      for (let dow = 0; dow < 7; dow++) {
        const day = new Date(end);
        day.setDate(day.getDate() - w * 7 - (6 - dow));
        const rec = byDay.get(startOfDay(day).getTime());
        let color = HEAT[0];
        let title = `${day.toLocaleDateString()} · no session`;
        if (rec && !rec.abandonedOnly) {
          color = HEAT[Math.min(4, rec.level + 1)];
          title = `${day.toLocaleDateString()} · level ${rec.level} sustained`;
        } else if (rec && rec.abandonedOnly) {
          color = '#CFCFCF';
          title = `${day.toLocaleDateString()} · session abandoned`;
        }
        col.push({ color, title, future: day > new Date() });
      }
      cols.push(col);
    }
    return cols;
  }, [games]);

  // ---- 4. memory chest vs synthetic games (weekly) ----------------------
  const compareData = useMemo(() => {
    const byWeek = new Map();
    const add = (k, field, val) => {
      if (!byWeek.has(k)) byWeek.set(k, { chest: [], synthetic: [] });
      byWeek.get(k)[field].push(val);
    };
    completed.forEach((r) => add(weekKey(r.played_at), 'synthetic', r.accuracy));
    memoryChest.forEach((r) => add(weekKey(r.played_at), 'chest', r.accuracy));
    return [...byWeek.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-8)
      .map(([k, v]) => ({
        label: new Date(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        'Memory Chest': v.chest.length ? Math.round(avg(v.chest)) : null,
        'Puzzle games': v.synthetic.length ? Math.round(avg(v.synthetic)) : null,
      }));
  }, [completed, memoryChest]);

  if (!configured) return <NotConfigured />;

  const empty = !loading && rows.length === 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: INK }}>Cognitive Report</h1>
        <p className="text-sm" style={{ color: MUTED }}>
          {patient?.name ? `${patient.name} · ` : ''}per-session metrics from the training games · not a diagnosis
        </p>
      </div>

      {empty && (
        <div className="glass-card rounded-xl p-8 text-center text-sm" style={{ color: MUTED }}>
          No session data yet. Once the patient plays a few game sets (and after running
          <code> supabase/migration_cognitive.sql</code>), the charts fill in here.
        </div>
      )}

      {!empty && (
        <>
          {/* raw-metric summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric icon={Timer} label="Response time" value={`${(summary.reactionNow / 1000).toFixed(1)}s`}
                sub={`was ${(summary.reactionThen / 1000).toFixed(1)}s`} warn={summary.reactionNow > summary.reactionThen * 1.15} />
              <Metric icon={Activity} label="Error rate" value={`${summary.errorRate}%`} sub="incorrect interactions" />
              <Metric icon={LogOut} label="Task abandonment" value={`${summary.abandonRate}%`} sub="sessions quit early"
                warn={summary.abandonRate > 15} />
              <Metric icon={Layers} label="Adaptive threshold" value={`L${summary.threshold}`} sub="highest level sustained" />
            </div>
          )}

          {/* 1 + 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Cognitive domains" subtitle="This week vs baseline — shape shows which lobe is declining fastest">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#ECECEC" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: MUTED, fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#B7BFC4', fontSize: 9 }} axisLine={false} />
                  <Radar name="Baseline" dataKey="baseline" stroke="#B7BFC4" fill="#B7BFC4" fillOpacity={0.12} />
                  <Radar name="This week" dataKey="week" stroke={ACCENT} fill={ACCENT} fillOpacity={0.28} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Response time vs accuracy" subtitle="Accuracy can hold flat while response time keeps climbing — decline is still active">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#ECECEC' }} />
                  <YAxis yAxisId="acc" domain={[0, 100]} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                  <YAxis yAxisId="rt" orientation="right" tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} unit="s" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="acc" type="monotone" dataKey="accuracy" name="Accuracy" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                  <Line yAxisId="rt" type="monotone" dataKey="reaction" name="Response (s)" stroke={ACCENT2} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          {/* 3 */}
          <Panel title="Daily consistency" subtitle="Highest difficulty sustained each day · grey = session abandoned">
            <div className="flex gap-[3px] overflow-x-auto pb-1">
              {heat.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {col.map((cell, ri) => (
                    <div key={ri} title={cell.title}
                      className="w-3.5 h-3.5 rounded-[3px]"
                      style={{ background: cell.future ? 'transparent' : cell.color }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px]" style={{ color: MUTED }}>
              <span>Less</span>
              {HEAT.map((c) => <span key={c} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />)}
              <span>More</span>
              <span className="ml-3 w-3 h-3 rounded-[3px]" style={{ background: '#CFCFCF' }} /> <span>Abandoned</span>
            </div>
          </Panel>

          {/* 4 */}
          <Panel title="Memory Chest vs puzzle games" subtitle="Deep / emotional memory vs short-term task memory — if puzzles drop but the Chest holds, lean on family & cultural cues">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={compareData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#F2F2F2" />
                <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#ECECEC' }} />
                <YAxis domain={[0, 100]} tick={{ fill: MUTED, fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Memory Chest" fill={ACCENT} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Puzzle games" fill="#BFD8D0" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </>
      )}
    </div>
  );
}

const tooltipStyle = { background: '#FFFFFF', border: '1px solid #E7E7E7', borderRadius: 8, fontSize: 12 };

function Panel({ title, subtitle, children }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: INK }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5 mb-4" style={{ color: MUTED }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, warn }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: warn ? '#C0392B' : '#9AAAB2' }} />
        <span className="text-[11px]" style={{ color: MUTED }}>{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: warn ? '#C0392B' : INK }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: '#9AAAB2' }}>{sub}</div>
    </div>
  );
}
