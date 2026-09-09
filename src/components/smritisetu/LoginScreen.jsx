import React, { useMemo, useState } from 'react';
import { Flame, Loader2, ArrowRight, CheckCircle2, HeartHandshake, Stethoscope, AlertCircle } from 'lucide-react';
import { usePatient } from '../../context/PatientProvider';

export default function LoginScreen() {
  const { connect, status, error, configured } = usePatient();
  const [role, setRole] = useState('caregiver');
  const [code, setCode] = useState('');

  const connecting = status === 'connecting';

  // Access codes are XXXX-9999 (patient) / XXXX-9999 (doctor). Accept with or
  // without the dash and any case; also accept a plain 8-char string.
  const normalized = useMemo(() => code.trim().toUpperCase().replace(/\s+/g, ''), [code]);
  const looksValid = normalized.replace('-', '').length >= 6;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!looksValid || connecting) return;
    await connect(normalized, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#FFFFFF' }}>
      <div className="w-full max-w-[420px]">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
              background: '#F1F1F2',
              border: '1px solid #C9C9C9',
            }}>
              <Flame className="w-8 h-8" style={{ color: '#3E8E7E' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>SmritiSetu</h1>
            <p className="text-xs mt-1" style={{ color: '#5F6F78' }}>
              {role === 'doctor' ? 'Doctor Portal · NER' : 'Caregiver Portal · NER'}
            </p>
          </div>

          {/* Role switch */}
          <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: '1px solid #E7E7E7' }}>
            {[
              { id: 'caregiver', label: 'Caregiver', icon: HeartHandshake },
              { id: 'doctor', label: 'Doctor', icon: Stethoscope },
            ].map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all"
                  style={{ background: active ? '#EDEDED' : '#FFFFFF', color: active ? '#26343B' : '#5F6F78' }}
                >
                  <Icon className="w-4 h-4" />
                  {r.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            <label className="text-xs mb-2 block" style={{ color: '#5F6F78' }}>
              {role === 'doctor' ? 'Doctor Access Code' : 'Patient Access Code'}
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={connecting}
              placeholder={role === 'doctor' ? 'e.g. DRSH-2024' : 'e.g. KAML-1234'}
              className="w-full px-4 py-3 rounded-xl border text-center text-lg font-bold tracking-widest focus:outline-none focus:border-[#C9C9C9] transition-all"
              style={{ background: '#FFFFFF', borderColor: code ? '#C9C9C9' : '#E7E7E7', color: '#26343B' }}
            />

            {error && (
              <div className="flex items-start gap-2 mt-3 text-xs" style={{ color: '#C0392B' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!looksValid || connecting}
              className="w-full mt-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: looksValid && !connecting ? '#E88A2D' : '#F6F6F7',
                color: looksValid && !connecting ? '#FFFFFF' : '#5F6F78',
                border: '1px solid #E7E7E7',
              }}
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <span>Connect to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-2 justify-center text-xs" style={{ color: configured ? '#3E8E7E' : '#C97A1B' }}>
            {configured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>
              {configured
                ? 'Connected to Supabase backend'
                : 'Backend not configured — add keys to web-portal/.env'}
            </span>
          </div>

          <p className="text-center text-xs mt-3" style={{ color: '#5F6F78' }}>
            Demo: caregiver <b>KAML-1234</b> · doctor <b>DRSH-2024</b>
          </p>
        </div>
      </div>
    </div>
  );
}
