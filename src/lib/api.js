import { supabase, isConfigured, FAMILY_PHOTO_BUCKET } from './supabase';

/**
 * All backend calls the portal makes, in one place.
 * Every function throws if Supabase is not configured — callers should check
 * `isConfigured` (from ./supabase) first, or catch and fall back to demo data.
 */

function client() {
  if (!isConfigured) throw new Error('Supabase is not configured');
  return supabase;
}

// ---------------------------------------------------------------------------
//  Connecting a portal session to a patient
// ---------------------------------------------------------------------------

/** Caregiver login: resolve a patient by their access code. */
export async function findPatientByAccessCode(code) {
  const { data, error } = await client()
    .from('patients')
    .select('*')
    .eq('access_code', code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data; // null if not found
}

/** Doctor login: resolve the patient behind a doctor access code. */
export async function findPatientByDoctorCode(code) {
  const { data, error } = await client()
    .from('doctors')
    .select('*, patient:patients(*)')
    .eq('access_code', code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { doctor: { id: data.id, name: data.name, hospital: data.hospital }, patient: data.patient };
}

export async function getPatient(patientId) {
  const { data, error } = await client().from('patients').select('*').eq('id', patientId).single();
  if (error) throw error;
  return data;
}

export async function updatePatient(patientId, patch) {
  const { data, error } = await client()
    .from('patients')
    .update(patch)
    .eq('id', patientId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
//  Generic per-patient collection helpers
// ---------------------------------------------------------------------------

export async function listBy(table, patientId, { orderBy = 'created_at', ascending = true } = {}) {
  const { data, error } = await client()
    .from(table)
    .select('*')
    .eq('patient_id', patientId)
    .order(orderBy, { ascending });
  if (error) throw error;
  return data ?? [];
}

export async function insertRow(table, row) {
  const { data, error } = await client().from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, patch) {
  const { data, error } = await client().from(table).update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id) {
  const { error } = await client().from(table).delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
//  Caregiver / doctor
// ---------------------------------------------------------------------------

export async function getCaregiver(patientId) {
  const { data, error } = await client()
    .from('caregivers')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function upsertCaregiver(patientId, patch) {
  const existing = await getCaregiver(patientId);
  if (existing) return updateRow('caregivers', existing.id, patch);
  return insertRow('caregivers', { patient_id: patientId, ...patch });
}

export async function getDoctor(patientId) {
  const { data, error } = await client()
    .from('doctors')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

/** Caregiver adds a doctor (spec §21.5) and gets back a shareable access code. */
export async function addDoctor(patientId, { name, hospital }) {
  const code = makeCode(name || 'DR');
  return insertRow('doctors', { patient_id: patientId, name, hospital, access_code: code });
}

// ---------------------------------------------------------------------------
//  Performance data (doctor + caregiver dashboards)
// ---------------------------------------------------------------------------

export async function getDailyRecords(patientId, days = 42) {
  const { data, error } = await client()
    .from('daily_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: true })
    .limit(days);
  if (error) throw error;
  return data ?? [];
}

export async function getGameProgress(patientId) {
  const { data, error } = await client()
    .from('game_progress')
    .select('*')
    .eq('patient_id', patientId);
  if (error) throw error;
  return data ?? [];
}

export async function getRecentResults(patientId, limit = 30) {
  const { data, error } = await client()
    .from('game_results')
    .select('*')
    .eq('patient_id', patientId)
    .order('played_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** All session rows over a window — feeds the Cognitive Report aggregations. */
export async function getGameResults(patientId, sinceDays = 120) {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { data, error } = await client()
    .from('game_results')
    .select('*')
    .eq('patient_id', patientId)
    .gte('played_at', since)
    .order('played_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
//  Doctor: next appointment (spec §25.3)
// ---------------------------------------------------------------------------

export async function setNextAppointment(patientId, appointment) {
  return updatePatient(patientId, { next_appointment: appointment });
}

// ---------------------------------------------------------------------------
//  Community (spec §22–§24)
// ---------------------------------------------------------------------------

export async function listCommunityPosts() {
  const { data, error } = await client()
    .from('community_posts')
    .select('*')
    .neq('status', 'removed')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCommunityPost(post) {
  return insertRow('community_posts', {
    status: 'pending',
    patient_visible: false,
    ...post,
  });
}

export async function moderateCommunityPost(id, patch) {
  return updateRow('community_posts', id, patch);
}

export async function bumpCommunity(id, field, delta) {
  const { error } = await client().rpc('community_bump', { post_id: id, field, delta });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
//  Family photo upload → Storage → patients.family_photo_url
// ---------------------------------------------------------------------------

export async function uploadFamilyPhoto(patientId, file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const path = `${patientId}/${Date.now()}.${ext}`;
  const { error: upErr } = await client()
    .storage.from(FAMILY_PHOTO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
  if (upErr) throw upErr;
  const { data } = client().storage.from(FAMILY_PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
//  helpers
// ---------------------------------------------------------------------------

function makeCode(seed) {
  const clean = seed.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${clean}-${n}`;
}
