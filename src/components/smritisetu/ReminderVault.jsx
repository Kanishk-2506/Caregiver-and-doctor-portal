import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic, Square, Plus, X, Clock, Volume2, CalendarClock, MapPin, User, Check, Stethoscope, Activity, Pill, Sparkles } from 'lucide-react';
import { useToast } from './ToastProvider';

const initialRoutines = [
  { id: 1, title: 'Morning Greeting', time: '07:00', active: false, hasVoice: true },
  { id: 2, title: 'Lunch Reminder', time: '12:30', active: false, hasVoice: true },
  { id: 3, title: 'Evening Story', time: '18:00', active: false, hasVoice: false },
];

const APPT_TYPES = {
  Medical: { icon: Stethoscope, color: '#E74C4C', bg: '#FDE4E4' },
  Therapy: { icon: Activity, color: '#5F8FA3', bg: 'rgba(95,143,163,0.14)' },
  Medication: { icon: Pill, color: '#E88A2D', bg: '#FCE5CC' },
  Activity: { icon: Sparkles, color: '#3E8E7E', bg: '#DDF1EC' },
};

const initialAppointments = [
  { id: 1, title: 'Morning Medication', time: '08:00', type: 'Medication', with: '', location: '', status: 'done' },
  { id: 2, title: 'Neurologist Consultation', time: '09:30', type: 'Medical', with: 'Dr. Sharma', location: 'City Care Clinic', status: 'upcoming' },
  { id: 3, title: 'Physiotherapy Session', time: '11:00', type: 'Therapy', with: 'Anjali (PT)', location: 'Home visit', status: 'upcoming' },
  { id: 4, title: 'Memory Games Activity', time: '16:00', type: 'Activity', with: 'Caregiver', location: 'Living room', status: 'upcoming' },
  { id: 5, title: 'Evening Medication', time: '20:00', type: 'Medication', with: '', location: '', status: 'upcoming' },
];

const formatTime = (time) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

const inputStyle = { background: '#FFFFFF', borderColor: '#D6E0E5', color: '#26343B' };

export default function ReminderVault() {
  const { showToast } = useToast();

  // --- Daily task appointments ---
  const [appointments, setAppointments] = useState(initialAppointments);
  const [showApptForm, setShowApptForm] = useState(false);
  const [apptForm, setApptForm] = useState({ title: '', time: '', type: 'Medical', with: '', location: '' });

  const toggleAppt = (id) => {
    setAppointments(appts => appts.map(a =>
      a.id === id ? { ...a, status: a.status === 'done' ? 'upcoming' : 'done' } : a
    ));
  };

  const addAppointment = () => {
    if (!apptForm.title || !apptForm.time) return;
    setAppointments(appts => [
      ...appts,
      { id: Date.now(), ...apptForm, status: 'upcoming' },
    ]);
    setApptForm({ title: '', time: '', type: 'Medical', with: '', location: '' });
    setShowApptForm(false);
    showToast('Appointment added to today’s schedule');
  };

  const sortedAppts = [...appointments].sort((a, b) => a.time.localeCompare(b.time));
  const remaining = appointments.filter(a => a.status !== 'done').length;

  // --- Voice routines ---
  const [routines, setRoutines] = useState(initialRoutines);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', time: '' });
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const recordTimerRef = useRef(null);

  const togglePlay = (id) => {
    setRoutines(routines.map(r => (r.id === id ? { ...r, active: !r.active } : { ...r, active: false })));
  };

  const startRecording = () => {
    setRecording(true);
    setRecordSeconds(0);
    setHasRecording(false);
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds(s => {
        if (s >= 5) {
          clearInterval(recordTimerRef.current);
          setRecording(false);
          setHasRecording(true);
          showToast('Voice recording captured · 6s');
          return 6;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(recordTimerRef.current);
    setRecording(false);
    setHasRecording(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.time) return;
    setRoutines([...routines, {
      id: Date.now(), title: formData.title, time: formData.time, active: false, hasVoice: hasRecording,
    }]);
    setFormData({ title: '', time: '' });
    setHasRecording(false);
    setShowForm(false);
    showToast('Reminder routine added to vault');
  };

  useEffect(() => () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Reminder Vault</h1>
        <p className="text-sm" style={{ color: '#5F6F78' }}>Daily task appointments, alarm routines &amp; voice reminders</p>
      </div>

      {/* ---- Today's Task Appointments ---- */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" style={{ color: '#A8C7D8' }} />
            <div>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Today&rsquo;s Task Appointments</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · {remaining} remaining
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowApptForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(168,199,216,0.15)', border: '1px solid #A8C7D8', color: '#26343B' }}
          >
            {showApptForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showApptForm ? 'Cancel' : 'Add appointment'}
          </button>
        </div>

        {showApptForm && (
          <div className="p-4 rounded-xl mb-5 space-y-4" style={{ background: '#EAF3F7', border: '1px solid #D6E0E5' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Title</label>
                <input value={apptForm.title} onChange={e => setApptForm({ ...apptForm, title: e.target.value })} placeholder="e.g., Blood test" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Time</label>
                <input type="time" value={apptForm.time} onChange={e => setApptForm({ ...apptForm, time: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Type</label>
                <select value={apptForm.type} onChange={e => setApptForm({ ...apptForm, type: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle}>
                  {Object.keys(APPT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>With</label>
                <input value={apptForm.with} onChange={e => setApptForm({ ...apptForm, with: e.target.value })} placeholder="e.g., Dr. Rao" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Location</label>
                <input value={apptForm.location} onChange={e => setApptForm({ ...apptForm, location: e.target.value })} placeholder="e.g., City Care Clinic / Home visit" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
              </div>
            </div>
            <button onClick={addAppointment} disabled={!apptForm.title || !apptForm.time} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}>
              Add to Schedule
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {sortedAppts.map(appt => {
            const meta = APPT_TYPES[appt.type] || APPT_TYPES.Activity;
            const Icon = meta.icon;
            const done = appt.status === 'done';
            return (
              <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg" style={{
                background: done ? '#F1F5F7' : '#FFFFFF',
                border: '1px solid #D6E0E5',
                opacity: done ? 0.7 : 1,
              }}>
                <div className="text-center flex-shrink-0" style={{ width: '58px' }}>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{formatTime(appt.time).split(' ')[0]}</div>
                  <div className="text-[10px]" style={{ color: '#5F6F78' }}>{formatTime(appt.time).split(' ')[1]}</div>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: meta.color, width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#26343B', textDecoration: done ? 'line-through' : 'none' }}>{appt.title}</div>
                  <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: '#5F6F78' }}>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: meta.bg, color: meta.color }}>{appt.type}</span>
                    {appt.with && <span className="flex items-center gap-1 truncate"><User className="w-3 h-3" />{appt.with}</span>}
                    {appt.location && <span className="hidden sm:flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{appt.location}</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleAppt(appt.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
                  style={{
                    background: done ? 'rgba(62,142,126,0.15)' : 'rgba(255,255,255,0.6)',
                    border: done ? '1px solid rgba(62,142,126,0.35)' : '1px solid #D6E0E5',
                  }}
                  title={done ? 'Mark as upcoming' : 'Mark as done'}
                >
                  <Check className="w-4 h-4" style={{ color: done ? '#3E8E7E' : '#5F6F78' }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Alarm routines & voice reminders ---- */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" style={{ color: '#A8C7D8' }} />
            <div>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Alarm Routines &amp; Voice Reminders</h2>
              <p className="text-xs" style={{ color: '#5F6F78' }}>Spoken alarms in a familiar voice</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Routine'}
          </button>
        </div>

        {showForm && (
          <div className="p-5 rounded-xl mb-5 space-y-5" style={{ background: '#EAF3F7', border: '1px solid #D6E0E5' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Routine Title</label>
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Medicine Time" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Time</label>
                <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ background: '#FFF8EE', border: '1px solid #D6E0E5' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" style={{ color: '#3E8E7E' }} />
                  <span className="text-sm font-medium" style={{ color: '#26343B' }}>Voice Micro-Recorder</span>
                </div>
                {hasRecording && (
                  <span className="text-xs flex items-center gap-1" style={{ color: '#3E8E7E' }}>
                    <Volume2 className="w-3 h-3" />Recording ready
                  </span>
                )}
              </div>

              <div className="h-20 flex items-center justify-center gap-1 mb-4 rounded-lg" style={{ background: '#FFFFFF' }}>
                {recording ? (
                  Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className="w-1 rounded-full" style={{
                      height: '60%',
                      background: 'linear-gradient(to top, #3E8E7E, #5fae9e)',
                      animation: 'wave-bar 0.8s ease-in-out infinite',
                      animationDelay: `${i * 0.04}s`,
                      transformOrigin: 'center',
                    }} />
                  ))
                ) : hasRecording ? (
                  <div className="flex items-center gap-2" style={{ color: '#3E8E7E' }}>
                    <Volume2 className="w-5 h-5" />
                    <span className="text-sm">6s voice recording captured</span>
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: '#5F6F78' }}>Tap &ldquo;Start Recording&rdquo; to capture your voice</div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: '#5F6F78' }}>
                  {recording ? `0:0${recordSeconds} / 0:06` : hasRecording ? 'Recording complete' : '0:00 / 0:06'}
                </span>
                <div className="flex gap-2">
                  {!recording && !hasRecording && (
                    <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105" style={{ background: 'rgba(168,199,216,0.15)', border: '1px solid #A8C7D8', color: '#26343B' }}>
                      <Mic className="w-4 h-4" style={{ color: '#3E8E7E' }} />
                      Start Recording
                    </button>
                  )}
                  {recording && (
                    <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: '#FDE4E4', border: '1px solid rgba(231,76,76,0.3)', color: '#E74C4C' }}>
                      <Square className="w-4 h-4" />
                      Stop
                    </button>
                  )}
                  {hasRecording && (
                    <button onClick={() => { setHasRecording(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: 'rgba(168,199,216,0.15)', border: '1px solid #A8C7D8', color: '#26343B' }}>
                      <Mic className="w-4 h-4" style={{ color: '#3E8E7E' }} />
                      Re-record
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!formData.title || !formData.time} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}>
              Add Reminder Routine
            </button>
          </div>
        )}

        <div className="space-y-3">
          {routines.map(routine => (
            <div key={routine.id} className="p-4 rounded-xl flex items-center gap-4" style={{ background: '#FFFFFF', border: '1px solid #D6E0E5' }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: '#26343B' }}>{routine.title}</div>
                <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#5F6F78' }}>
                  <Clock className="w-3 h-3" />
                  {formatTime(routine.time)}
                  {routine.hasVoice && <span className="ml-2" style={{ color: '#3E8E7E' }}>· Voice linked</span>}
                </div>
              </div>

              {routine.active && (
                <div className="flex items-center gap-0.5 h-8">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-1 rounded-full" style={{
                      height: '70%',
                      background: '#3E8E7E',
                      animation: 'wave-bar 0.6s ease-in-out infinite',
                      animationDelay: `${i * 0.05}s`,
                      transformOrigin: 'center',
                    }} />
                  ))}
                </div>
              )}

              <button
                onClick={() => togglePlay(routine.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: routine.active ? 'rgba(62,142,126,0.15)' : 'rgba(168,199,216,0.12)',
                  border: routine.active ? '1px solid rgba(62,142,126,0.3)' : '1px solid #D6E0E5',
                }}
              >
                {routine.active ? <Pause className="w-4 h-4" style={{ color: '#3E8E7E' }} /> : <Play className="w-4 h-4" style={{ color: '#5F6F78' }} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
