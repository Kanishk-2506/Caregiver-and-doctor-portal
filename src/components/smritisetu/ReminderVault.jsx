import React, { useState } from 'react';
import {
  Plus, X, Clock, CalendarClock, MapPin, User, Check, Trash2,
  Stethoscope, Activity, Pill, Sparkles, Bell,
} from 'lucide-react';
import { useToast } from './ToastProvider';
import { usePatient } from '../../context/PatientProvider';
import { useCollection } from '../../lib/useCollection';

const APPT_TYPES = {
  Medical: { icon: Stethoscope, color: '#E74C4C', bg: '#FDE4E4' },
  Therapy: { icon: Activity, color: '#5F8FA3', bg: 'rgba(95,143,163,0.14)' },
  Medication: { icon: Pill, color: '#E88A2D', bg: '#FCE5CC' },
  Activity: { icon: Sparkles, color: '#3E8E7E', bg: '#DDF1EC' },
};

const REMINDER_KINDS = {
  medication: { label: 'Medication', icon: Pill, color: '#E88A2D' },
  activity: { label: 'Activity', icon: Sparkles, color: '#3E8E7E' },
  appointment: { label: 'Appointment', icon: CalendarClock, color: '#5F8FA3' },
};

const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return time; // already "5:00 PM"
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

const inputStyle = { background: '#FFFFFF', borderColor: '#E7E7E7', color: '#26343B' };

export default function ReminderVault() {
  const { showToast } = useToast();
  const { patientId, configured } = usePatient();

  const appts = useCollection('appointments', patientId, { orderBy: 'time', ascending: true });
  const reminders = useCollection('reminders', patientId, { orderBy: 'created_at', ascending: true });

  // ---- appointment form ----
  const [showApptForm, setShowApptForm] = useState(false);
  const [apptForm, setApptForm] = useState({ title: '', time: '', type: 'Medical', with_whom: '', location: '' });

  const addAppointment = async () => {
    if (!apptForm.title || !apptForm.time) return;
    await appts.insert({ ...apptForm, status: 'upcoming' });
    setApptForm({ title: '', time: '', type: 'Medical', with_whom: '', location: '' });
    setShowApptForm(false);
    showToast('Appointment added to today’s schedule');
  };

  const toggleAppt = (a) =>
    appts.update(a.id, { status: a.status === 'done' ? 'upcoming' : 'done' });

  const remaining = appts.rows.filter((a) => a.status !== 'done').length;

  // ---- reminder form ----
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', time: '', kind: 'medication', note: '' });

  const addReminder = async () => {
    if (!form.title || !form.time) return;
    await reminders.insert({
      title: form.title,
      time: formatTime(form.time),
      kind: form.kind,
      note: form.note || null,
      active: true,
      acknowledged: false,
    });
    setForm({ title: '', time: '', kind: 'medication', note: '' });
    setShowForm(false);
    showToast('Reminder sent to the patient app');
  };

  if (!configured) return <NotConfigured />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Reminder Vault</h1>
        <p className="text-sm" style={{ color: '#5F6F78' }}>
          Reminders and appointments — changes here appear live in the patient app
        </p>
      </div>

      {/* ---- Reminders delivered by the patient app (spec §18) ---- */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: '#C9C9C9' }} />
            <div>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Patient Reminders</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>
                Delivered in-app — the game pauses and the avatar speaks the reminder
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#E88A2D' }}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Reminder'}
          </button>
        </div>

        {showForm && (
          <div className="p-4 rounded-xl mb-5 space-y-4" style={{ background: '#F6F6F7', border: '1px solid #E7E7E7' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Take Donepezil 5mg" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Type</label>
                <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle}>
                  {Object.entries(REMINDER_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Note (optional)</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g., with water, after food" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
            </div>
            <button onClick={addReminder} disabled={!form.title || !form.time} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40" style={{ background: '#E88A2D' }}>
              Add Reminder
            </button>
          </div>
        )}

        <div className="space-y-3">
          {reminders.rows.length === 0 && (
            <p className="text-sm" style={{ color: '#5F6F78' }}>No reminders yet. Add one above.</p>
          )}
          {reminders.rows.map((r) => {
            const meta = REMINDER_KINDS[r.kind] || REMINDER_KINDS.activity;
            const Icon = meta.icon;
            return (
              <div key={r.id} className="p-4 rounded-xl flex items-center gap-4" style={{ background: '#FFFFFF', border: '1px solid #E7E7E7', opacity: r.active ? 1 : 0.55 }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1a` }}>
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: '#26343B' }}>{r.title}</div>
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#5F6F78' }}>
                    <Clock className="w-3 h-3" /> {r.time}
                    {r.note && <span className="ml-1">· {r.note}</span>}
                    {r.acknowledged && <span className="ml-1" style={{ color: '#3E8E7E' }}>· done today</span>}
                  </div>
                </div>
                <button
                  onClick={() => reminders.update(r.id, { active: !r.active })}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                  style={{ background: r.active ? 'rgba(62,142,126,0.12)' : '#F1F5F7', color: r.active ? '#3E8E7E' : '#5F6F78', border: '1px solid #E7E7E7' }}
                >
                  {r.active ? 'Active' : 'Paused'}
                </button>
                <button onClick={() => reminders.remove(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FDE4E4', border: '1px solid rgba(231,76,76,0.3)' }} title="Delete">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: '#E74C4C' }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Today's task appointments (caregiver schedule) ---- */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" style={{ color: '#C9C9C9' }} />
            <div>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Today&rsquo;s Task Appointments</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · {remaining} remaining
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowApptForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: '#F6F6F7', border: '1px solid #C9C9C9', color: '#26343B' }}
          >
            {showApptForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showApptForm ? 'Cancel' : 'Add appointment'}
          </button>
        </div>

        {showApptForm && (
          <div className="p-4 rounded-xl mb-5 space-y-4" style={{ background: '#F6F6F7', border: '1px solid #E7E7E7' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Title</label>
                <input value={apptForm.title} onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })} placeholder="e.g., Blood test" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Time</label>
                <input type="time" value={apptForm.time} onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Type</label>
                <select value={apptForm.type} onChange={(e) => setApptForm({ ...apptForm, type: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle}>
                  {Object.keys(APPT_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>With</label>
                <input value={apptForm.with_whom} onChange={(e) => setApptForm({ ...apptForm, with_whom: e.target.value })} placeholder="e.g., Dr. Rao" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Location</label>
                <input value={apptForm.location} onChange={(e) => setApptForm({ ...apptForm, location: e.target.value })} placeholder="e.g., City Care Clinic / Home visit" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
              </div>
            </div>
            <button onClick={addAppointment} disabled={!apptForm.title || !apptForm.time} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40" style={{ background: '#E88A2D' }}>
              Add to Schedule
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {appts.rows.map((appt) => {
            const meta = APPT_TYPES[appt.type] || APPT_TYPES.Activity;
            const Icon = meta.icon;
            const done = appt.status === 'done';
            return (
              <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: done ? '#F1F5F7' : '#FFFFFF', border: '1px solid #E7E7E7', opacity: done ? 0.7 : 1 }}>
                <div className="text-center flex-shrink-0" style={{ width: '58px' }}>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{formatTime(appt.time).split(' ')[0]}</div>
                  <div className="text-[10px]" style={{ color: '#5F6F78' }}>{formatTime(appt.time).split(' ')[1]}</div>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                  <Icon style={{ color: meta.color, width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#26343B', textDecoration: done ? 'line-through' : 'none' }}>{appt.title}</div>
                  <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: '#5F6F78' }}>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: meta.bg, color: meta.color }}>{appt.type}</span>
                    {appt.with_whom && <span className="flex items-center gap-1 truncate"><User className="w-3 h-3" />{appt.with_whom}</span>}
                    {appt.location && <span className="hidden sm:flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{appt.location}</span>}
                  </div>
                </div>
                <button onClick={() => toggleAppt(appt)} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: done ? 'rgba(62,142,126,0.15)' : 'rgba(255,255,255,0.6)', border: done ? '1px solid rgba(62,142,126,0.35)' : '1px solid #E7E7E7' }} title={done ? 'Mark as upcoming' : 'Mark as done'}>
                  <Check className="w-4 h-4" style={{ color: done ? '#3E8E7E' : '#5F6F78' }} />
                </button>
                <button onClick={() => appts.remove(appt.id)} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FDE4E4', border: '1px solid rgba(231,76,76,0.3)' }} title="Delete">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: '#E74C4C' }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function NotConfigured() {
  return (
    <div className="glass-card p-8 rounded-xl max-w-lg">
      <h1 className="text-lg font-bold mb-2" style={{ color: '#26343B' }}>Backend not configured</h1>
      <p className="text-sm" style={{ color: '#5F6F78' }}>
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
        <code> web-portal/.env</code>, then restart <code>npm run dev</code>. Until then
        the portal cannot sync with the patient app.
      </p>
    </div>
  );
}
