import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { findPatientByAccessCode, findPatientByDoctorCode, getPatient } from '../lib/api';

const PatientContext = createContext(null);

const SESSION_KEY = 'niramaya.session.v1';

/**
 * Holds the portal's connection to ONE patient.
 *
 *   status : 'idle' | 'connecting' | 'connected' | 'error'
 *   role   : 'caregiver' | 'doctor'
 *   patient / patientId : the connected patient row (live — refreshed by realtime)
 *   doctor : { id, name, hospital } when role === 'doctor'
 *
 * connect(code, role) resolves the code to a patient and starts a realtime
 * subscription to that patient row. disconnect() tears it down.
 */
export function PatientProvider({ children }) {
  const [status, setStatus] = useState('idle');
  const [role, setRole] = useState('caregiver');
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const teardown = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const watchPatientRow = useCallback((patientId) => {
    teardown();
    if (!isConfigured) return;
    channelRef.current = supabase
      .channel(`patient:${patientId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'patients', filter: `id=eq.${patientId}` },
        (payload) => setPatient(payload.new),
      )
      .subscribe();
  }, [teardown]);

  const connect = useCallback(async (code, nextRole = 'caregiver') => {
    if (!isConfigured) {
      setError('Supabase is not configured (see web-portal/.env). Running on demo data.');
      setStatus('error');
      return { ok: false, demo: true };
    }
    setStatus('connecting');
    setError(null);
    try {
      let resolvedPatient = null;
      let resolvedDoctor = null;
      if (nextRole === 'doctor') {
        const res = await findPatientByDoctorCode(code);
        if (res) {
          resolvedPatient = res.patient;
          resolvedDoctor = res.doctor;
        }
      } else {
        resolvedPatient = await findPatientByAccessCode(code);
      }
      if (!resolvedPatient) {
        setError(
          nextRole === 'doctor'
            ? 'No patient found for that doctor access code.'
            : 'No patient found for that access code.',
        );
        setStatus('error');
        return { ok: false };
      }
      setRole(nextRole);
      setPatient(resolvedPatient);
      setDoctor(resolvedDoctor);
      setStatus('connected');
      watchPatientRow(resolvedPatient.id);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ code, role: nextRole }));
      } catch {
        /* ignore */
      }
      return { ok: true };
    } catch (e) {
      setError(e.message || 'Could not connect');
      setStatus('error');
      return { ok: false };
    }
  }, [watchPatientRow]);

  const disconnect = useCallback(() => {
    teardown();
    setPatient(null);
    setDoctor(null);
    setStatus('idle');
    setError(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [teardown]);

  const refresh = useCallback(async () => {
    if (!patient?.id || !isConfigured) return;
    try {
      setPatient(await getPatient(patient.id));
    } catch {
      /* ignore transient */
    }
  }, [patient?.id]);

  // Restore a session on reload.
  useEffect(() => {
    if (!isConfigured) return;
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      saved = null;
    }
    if (saved?.code) connect(saved.code, saved.role || 'caregiver');
    return teardown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      configured: isConfigured,
      status,
      role,
      patient,
      patientId: patient?.id ?? null,
      doctor,
      error,
      connect,
      disconnect,
      refresh,
      setPatient,
    }),
    [status, role, patient, doctor, error, connect, disconnect, refresh],
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside <PatientProvider>');
  return ctx;
}
