import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isConfigured } from './supabase';
import { listBy, insertRow, updateRow, deleteRow } from './api';

/**
 * Live view of one patient-scoped table.
 *
 *   const { rows, loading, insert, update, remove, refetch } =
 *     useCollection('reminders', patientId, { orderBy: 'created_at' });
 *
 * - Fetches `where patient_id = <patientId>` once.
 * - Subscribes to realtime INSERT/UPDATE/DELETE for that patient and keeps
 *   `rows` in sync, so an edit in the mobile app (or another portal tab)
 *   shows up here without a refresh.
 * - insert/update/remove are optimistic-free: they write, and the realtime
 *   echo updates local state. When Supabase is not configured they no-op and
 *   the component keeps whatever fallback data it seeded itself.
 */
export function useCollection(table, patientId, opts = {}) {
  const { orderBy = 'created_at', ascending = true, enabled = true } = opts;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const sortRef = useRef({ orderBy, ascending });
  sortRef.current = { orderBy, ascending };

  const sortRows = useCallback((list) => {
    const { orderBy: key, ascending: asc } = sortRef.current;
    return [...list].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (asc ? 1 : -1);
    });
  }, []);

  const refetch = useCallback(async () => {
    if (!isConfigured || !patientId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listBy(table, patientId, { orderBy, ascending });
      setRows(data);
      setReady(true);
    } catch (e) {
      console.warn(`[useCollection:${table}]`, e.message);
    } finally {
      setLoading(false);
    }
  }, [table, patientId, orderBy, ascending, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!isConfigured || !patientId || !enabled) return undefined;
    const channel = supabase
      .channel(`col:${table}:${patientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `patient_id=eq.${patientId}` },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((r) => r.id !== payload.old.id);
            }
            const row = payload.new;
            const idx = prev.findIndex((r) => r.id === row.id);
            const next = idx === -1 ? [...prev, row] : prev.map((r) => (r.id === row.id ? row : r));
            return sortRows(next);
          });
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [table, patientId, enabled, sortRows]);

  const insert = useCallback(
    async (row) => {
      if (!isConfigured || !patientId) return null;
      const created = await insertRow(table, { patient_id: patientId, ...row });
      setRows((prev) => (prev.some((r) => r.id === created.id) ? prev : sortRows([...prev, created])));
      return created;
    },
    [table, patientId, sortRows],
  );

  const update = useCallback(
    async (id, patch) => {
      if (!isConfigured) return null;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))); // snappy
      return updateRow(table, id, patch);
    },
    [table],
  );

  const remove = useCallback(
    async (id) => {
      if (!isConfigured) return;
      setRows((prev) => prev.filter((r) => r.id !== id));
      await deleteRow(table, id);
    },
    [table],
  );

  return { rows, loading, ready, insert, update, remove, refetch, setRows };
}
