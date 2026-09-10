import React, { useEffect, useState } from 'react';
import { CalendarClock, Save, ArrowRight, MapPin, User } from 'lucide-react';
import { useToast } from './ToastProvider';
import { usePatient } from '../../context/PatientProvider';
import { setNextAppointment } from '../../lib/api';
import { NotConfigured } from './ReminderVault';

const inputStyle = { background: '#FFFFFF', borderColor: '#E7E7E7', color: '#26343B' };

/**
 * Doctor-only page: set / update the patient's next appointment (spec §25.3).
 * Doctor Portal → backend → caregiver portal + patient app (becomes a reminder).
 */
export default function AppointmentView() {
  const { showToast } = useToast();
  const { patient, patientId, doctor, configured, setPatient } = usePatient();

  const [appt, setAppt] = useState({ date: '', doctorName: '', hospital: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient?.next_appointment) setAppt(patient.next_appointment);
    else if (doctor) setAppt((a) => ({ ...a, doctorName: doctor.name, hospital: doctor.hospital }));
  }, [patient?.next_appointment, doctor]);

  if (!configured) return <NotConfigured />;

  const current = patient?.next_appointment;

  const save = async () => {
    if (!appt.date) return;
    setSaving(true);
    try {
      const updated = await setNextAppointment(patientId, {
        date: appt.date,
        doctorName: appt.doctorName || doctor?.name || 'Doctor',
        hospital: appt.hospital || doctor?.hospital || '',
      });
      setPatient(updated);
      showToast('Appointment set — synced to caregiver + patient');
    } catch (e) {
      showToast(e.message || 'Could not save', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Appointment</h1>
        <p className="text-sm" style={{ color: '#5F6F78' }}>
          {patient?.name ? `${patient.name}'s ` : ''}next appointment · set by {doctor?.name || 'the doctor'}
        </p>
      </div>

      {/* current appointment */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-5 h-5" style={{ color: '#5F8FA3' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Current appointment</h2>
        </div>
        {current ? (
          <div className="rounded-lg p-4" style={{ background: '#F6F6F7' }}>
            <div className="text-lg font-bold" style={{ color: '#26343B' }}>{current.date}</div>
            <div className="flex items-center gap-4 text-sm mt-1.5" style={{ color: '#5F6F78' }}>
              {current.doctorName && <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{current.doctorName}</span>}
              {current.hospital && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{current.hospital}</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#5F6F78' }}>No appointment set yet.</p>
        )}
      </div>

      {/* set / update */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>
          {current ? 'Update appointment' : 'Set appointment'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Date &amp; time (as shown to the patient)</label>
            <input value={appt.date} onChange={(e) => setAppt({ ...appt, date: e.target.value })} placeholder="e.g. Mon 22 Sep, 11:30 AM"
              className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Doctor</label>
              <input value={appt.doctorName} onChange={(e) => setAppt({ ...appt, doctorName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Hospital / clinic</label>
              <input value={appt.hospital} onChange={(e) => setAppt({ ...appt, hospital: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
            </div>
          </div>
          <button onClick={save} disabled={!appt.date || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: '#E88A2D' }}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : current ? 'Update Appointment' : 'Set Appointment'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: '#9AAAB2' }}>
        <span>Doctor Portal</span><ArrowRight className="w-3.5 h-3.5" />
        <span>backend</span><ArrowRight className="w-3.5 h-3.5" />
        <span>caregiver portal + patient app (becomes a reminder)</span>
      </div>
    </div>
  );
}
