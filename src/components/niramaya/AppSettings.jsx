import React, { useEffect, useState } from 'react';
import { User, Languages, Stethoscope, Copy, Check, KeyRound } from 'lucide-react';
import { useToast } from './ToastProvider';
import { usePatient } from '../../context/PatientProvider';
import { updatePatient, getCaregiver, upsertCaregiver, getDoctor, addDoctor } from '../../lib/api';
import { supabase, isConfigured } from '../../lib/supabase';
import { NotConfigured } from './ReminderVault';

const REGIONS = ['Assam', 'West Bengal', 'Maharashtra', 'Kerala', 'Punjab', 'Tamil Nadu'];
const LANGUAGES = ['Assamese', 'Bengali', 'Manipuri', 'Bodo', 'Khasi', 'Hindi', 'English'];
const inputStyle = { background: '#FFFFFF', borderColor: '#E7E7E7', color: '#26343B' };

export default function AppSettings() {
  const { showToast } = useToast();
  const { patient, patientId, configured, setPatient } = usePatient();

  const [profile, setProfile] = useState({ name: '', caregiver_name: '', region: '', language: '' });
  const [caregiver, setCaregiver] = useState({ name: '', relation: 'Primary caregiver', phone: '' });
  const [doctor, setDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({ name: '', hospital: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!patient) return;
    setProfile({
      name: patient.name || '',
      caregiver_name: patient.caregiver_name || '',
      region: patient.region || '',
      language: patient.language || '',
    });
  }, [patient]);

  useEffect(() => {
    if (!patientId || !configured) return;
    getCaregiver(patientId).then((c) => c && setCaregiver({ name: c.name, relation: c.relation, phone: c.phone }));
    getDoctor(patientId).then(setDoctor);
  }, [patientId, configured]);

  // Live sync: pick up caregiver / doctor edits made in the patient app.
  useEffect(() => {
    if (!patientId || !isConfigured) return undefined;
    const ch = supabase
      .channel(`settings-sync:${patientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregivers', filter: `patient_id=eq.${patientId}` },
        () => getCaregiver(patientId).then((c) => c && setCaregiver({ name: c.name, relation: c.relation, phone: c.phone })))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors', filter: `patient_id=eq.${patientId}` },
        () => getDoctor(patientId).then(setDoctor))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [patientId]);

  if (!configured) return <NotConfigured />;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updatePatient(patientId, {
        name: profile.name,
        caregiver_name: caregiver.name || profile.caregiver_name,
        region: profile.region,
        language: profile.language,
      });
      setPatient(updated);
      await upsertCaregiver(patientId, caregiver);
      showToast('Profile updated — synced to the patient app');
    } catch (e) {
      showToast(e.message || 'Save failed', 'info');
    } finally {
      setSaving(false);
    }
  };

  const createDoctor = async () => {
    if (!doctorForm.name) return;
    try {
      const created = await addDoctor(patientId, doctorForm);
      setDoctor(created);
      setDoctorForm({ name: '', hospital: '' });
      showToast('Doctor added — share the access code below');
    } catch (e) {
      showToast(e.message || 'Could not add doctor', 'info');
    }
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>App Settings</h1>
        <p className="text-sm" style={{ color: '#5F6F78' }}>Patient profile, caregiver details and doctor access</p>
      </div>

      {/* Access code */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5" style={{ color: '#C9C9C9' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Patient Access Code</h2>
        </div>
        <div className="flex items-center gap-3">
          <code className="text-lg font-bold tracking-widest px-4 py-2 rounded-lg" style={{ background: '#F6F6F7', color: '#26343B' }}>{patient?.access_code}</code>
          <button onClick={() => copy(patient?.access_code, 'ac')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#F6F6F7', border: '1px solid #C9C9C9', color: '#26343B' }}>
            {copied === 'ac' ? <Check className="w-3.5 h-3.5" style={{ color: '#3E8E7E' }} /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'ac' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: '#5F6F78' }}>Caregivers use this to connect to the patient's account.</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5" style={{ color: '#C9C9C9' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Profile Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patient Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
          <Field label="Caregiver Name" value={caregiver.name} onChange={(v) => setCaregiver({ ...caregiver, name: v })} />
          <Field label="Caregiver Phone" value={caregiver.phone} onChange={(v) => setCaregiver({ ...caregiver, phone: v })} />
          <Field label="Caregiver Relation" value={caregiver.relation} onChange={(v) => setCaregiver({ ...caregiver, relation: v })} />
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Region</label>
            <select value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" style={inputStyle}>
              <option value="">Select…</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Language</label>
            <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm" style={inputStyle}>
              <option value="">Select…</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40" style={{ background: '#E88A2D' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Doctor management (spec §21.5) */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5" style={{ color: '#C9C9C9' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Doctor Access</h2>
        </div>
        {doctor ? (
          <div className="p-4 rounded-lg" style={{ background: '#F6F6F7', border: '1px solid #E7E7E7' }}>
            <div className="text-sm font-semibold" style={{ color: '#26343B' }}>{doctor.name}</div>
            <div className="text-xs mb-3" style={{ color: '#5F6F78' }}>{doctor.hospital}</div>
            <div className="flex items-center gap-3">
              <code className="text-base font-bold tracking-widest px-3 py-1.5 rounded-lg" style={{ background: '#FFFFFF', color: '#26343B' }}>{doctor.access_code}</code>
              <button onClick={() => copy(doctor.access_code, 'dc')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#F6F6F7', border: '1px solid #C9C9C9', color: '#26343B' }}>
                {copied === 'dc' ? <Check className="w-3.5 h-3.5" style={{ color: '#3E8E7E' }} /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'dc' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: '#5F6F78' }}>Share this code with the doctor so they can open the Doctor Portal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Doctor Name" value={doctorForm.name} onChange={(v) => setDoctorForm({ ...doctorForm, name: v })} placeholder="Dr. …" />
            <Field label="Hospital / Clinic" value={doctorForm.hospital} onChange={(v) => setDoctorForm({ ...doctorForm, hospital: v })} />
            <div className="md:col-span-2">
              <button onClick={createDoctor} disabled={!doctorForm.name} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40" style={{ background: '#E88A2D' }}>
                Add Doctor &amp; Generate Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Language packs — informational */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="w-5 h-5" style={{ color: '#C9C9C9' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Regional Content Pack</h2>
        </div>
        <p className="text-sm" style={{ color: '#5F6F78' }}>
          Active pack: <span className="font-semibold" style={{ color: '#26343B' }}>{patient?.region || '—'} · {patient?.language || '—'}</span>.
          The patient app downloads the matching pack automatically for offline use.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
    </div>
  );
}
