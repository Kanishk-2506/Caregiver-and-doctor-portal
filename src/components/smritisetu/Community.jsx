import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PenLine, ArrowUp, Eye, Flag, ArrowLeft, Check, Trash2, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastProvider';
import { usePatient } from '../../context/PatientProvider';
import { supabase, isConfigured } from '../../lib/supabase';
import {
  listCommunityPosts, createCommunityPost, moderateCommunityPost, bumpCommunity,
} from '../../lib/api';
import { NotConfigured } from './ReminderVault';

const CATEGORIES = ['Article', 'Experience', 'Thought', 'Caregiving Practice', 'Positive Experience', 'Helpful Info'];
const LANGUAGES = ['English', 'Assamese', 'Bengali', 'Manipuri', 'Bodo', 'Khasi', 'Hindi'];

const rankScore = (p) => p.upvotes * 3 + p.comments * 2 + p.views * 0.1;
const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(0, mins)}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
};
const initials = (name) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const inputStyle = { background: '#FFFFFF', borderColor: '#E7E7E7', color: '#26343B' };

function useCommunityPosts() {
  const [posts, setPosts] = useState([]);

  const refetch = useCallback(async () => {
    if (!isConfigured) return;
    try { setPosts(await listCommunityPosts()); } catch (e) { console.warn('[community]', e.message); }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (!isConfigured) return undefined;
    const ch = supabase
      .channel('community_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, (payload) => {
        setPosts((prev) => {
          if (payload.eventType === 'DELETE') return prev.filter((p) => p.id !== payload.old.id);
          const row = payload.new;
          const idx = prev.findIndex((p) => p.id === row.id);
          return idx === -1 ? [row, ...prev] : prev.map((p) => (p.id === row.id ? row : p));
        });
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  return { posts, refetch };
}

export default function Community() {
  const { showToast } = useToast();
  const { role, patient, patientId, doctor, configured } = usePatient();
  const { posts } = useCommunityPosts();

  const [view, setView] = useState('feed'); // 'feed' | 'compose'
  const [sort, setSort] = useState('top');
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [upvotedIds, setUpvotedIds] = useState(() => loadUpvotes());
  const viewedRef = useRef(new Set());

  if (!configured) return <NotConfigured />;

  const authorName = role === 'doctor' ? (doctor?.name || 'Doctor') : (patient?.caregiver_name || 'Caregiver');

  const approved = posts.filter((p) => p.status === 'approved');
  const pending = posts.filter((p) => p.status === 'pending' || p.status === 'review');

  let feed = approved.filter((p) => filter === 'All' || p.category === filter);
  feed = [...feed].sort((a, b) =>
    (sort === 'top' ? rankScore(b) - rankScore(a) : new Date(b.created_at) - new Date(a.created_at)));

  const openPost = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
    if (!viewedRef.current.has(id)) {
      viewedRef.current.add(id);
      bumpCommunity(id, 'views', 1).catch(() => {});
    }
  };

  const toggleUpvote = (id) => {
    const has = upvotedIds.includes(id);
    const next = has ? upvotedIds.filter((x) => x !== id) : [...upvotedIds, id];
    setUpvotedIds(next);
    saveUpvotes(next);
    bumpCommunity(id, 'upvotes', has ? -1 : 1).catch(() => {});
  };

  const approvePost = (id) => moderateCommunityPost(id, { status: 'approved' }).then(() => showToast('Post approved'));
  const removePost = (id) => moderateCommunityPost(id, { status: 'removed' }).then(() => showToast('Post removed', 'info'));
  const reportPost = (id) => {
    moderateCommunityPost(id, { status: 'review' }).catch(() => {});
    showToast('Reported to the moderation team', 'info');
  };
  const togglePatientVisible = (p) =>
    moderateCommunityPost(p.id, { patient_visible: !p.patient_visible }).then(() =>
      showToast(p.patient_visible ? 'Hidden from the patient app' : 'Now visible in the patient app'));

  if (view === 'compose') {
    return (
      <ComposePage
        authorName={authorName}
        onCancel={() => setView('feed')}
        onSubmit={async (form) => {
          try {
            await createCommunityPost({
              author: authorName,
              author_role: role,
              patient_id: patientId,
              title: form.title.trim(),
              body: form.body.trim(),
              excerpt: form.body.trim().slice(0, 140),
              category: form.category,
              language: form.language,
            });
            showToast('Story submitted — pending moderation review', 'info');
            setView('feed');
          } catch (e) {
            showToast(e.message || 'Could not submit', 'info');
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Community</h1>
          <p className="text-sm" style={{ color: '#5F6F78' }}>Stories &amp; knowledge shared between caregivers</p>
        </div>
        <button onClick={() => setView('compose')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ background: '#E88A2D' }}>
          <PenLine className="w-4 h-4" />
          Share a Story
        </button>
      </div>

      {pending.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4" style={{ color: '#5F8FA3' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#26343B' }}>Awaiting review ({pending.length})</h2>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" style={{ color: '#26343B' }}>{p.title}</div>
                  <div className="text-xs" style={{ color: '#5F6F78' }}>{p.author} · {p.category}</div>
                </div>
                <button onClick={() => approvePost(p.id)} className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: '#DDF1EC', color: '#3E8E7E' }}>Approve</button>
                <button onClick={() => removePost(p.id)} className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: '#FDE4E4', color: '#E74C4C' }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)} className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: filter === c ? '#26343B' : '#FFFFFF', color: filter === c ? '#FFFFFF' : '#5F6F78', border: '1px solid #E7E7E7' }}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #E7E7E7' }}>
          {[{ id: 'top', label: 'Top' }, { id: 'recent', label: 'Recent' }].map((o) => (
            <button key={o.id} onClick={() => setSort(o.id)} className="px-3 py-1 text-xs font-medium"
              style={{ background: sort === o.id ? '#F2F2F3' : '#FFFFFF', color: '#26343B' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {feed.length === 0 && (
          <div className="glass-card p-6 rounded-xl text-center text-sm" style={{ color: '#5F6F78' }}>No stories yet.</div>
        )}
        {feed.map((p) => {
          const open = expandedId === p.id;
          const upvoted = upvotedIds.includes(p.id);
          return (
            <article key={p.id} className="glass-card rounded-xl px-4 py-3">
              <button onClick={() => openPost(p.id)} className="w-full text-left flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: '#F2F2F3', color: '#26343B' }}>
                  {initials(p.author)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-snug" style={{ color: '#26343B' }}>{p.title}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: '#5F6F78' }}>
                    <span>{p.author}</span><span>·</span><span>{p.category}</span><span>·</span><span>{timeAgo(p.created_at)} ago</span>
                    {p.patient_visible && <span style={{ color: '#3E8E7E' }}>· in patient app</span>}
                  </div>
                  {!open && <p className="text-xs mt-1 truncate" style={{ color: '#8A97A0' }}>{p.excerpt || p.body}</p>}
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: '#5F8FA3' }}>{open ? 'Show less' : 'Read more'}</span>
              </button>

              {open && (
                <div className="mt-3 pl-11">
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#4A5A62' }}>{p.body}</p>
                  <div className="flex items-center gap-3 mt-3 pt-2.5 flex-wrap" style={{ borderTop: '1px solid #F0F0F0' }}>
                    <button onClick={() => toggleUpvote(p.id)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                      style={{ background: upvoted ? '#DDF1EC' : '#F6F6F7', color: upvoted ? '#3E8E7E' : '#5F6F78', border: '1px solid #E7E7E7' }}>
                      <ArrowUp className="w-3.5 h-3.5" /> {p.upvotes}
                    </button>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6F78' }}><Eye className="w-3.5 h-3.5" /> {p.views}</span>
                    <button onClick={() => togglePatientVisible(p)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                      style={{ background: p.patient_visible ? '#DDF1EC' : '#F6F6F7', color: p.patient_visible ? '#3E8E7E' : '#5F6F78', border: '1px solid #E7E7E7' }}>
                      <Check className="w-3.5 h-3.5" /> {p.patient_visible ? 'Patient-visible' : 'Show to patient'}
                    </button>
                    <button onClick={() => reportPost(p.id)} className="flex items-center gap-1 text-xs ml-auto" style={{ color: '#B0483F' }}>
                      <Flag className="w-3.5 h-3.5" /> Report
                    </button>
                    <button onClick={() => removePost(p.id)} className="flex items-center gap-1 text-xs" style={{ color: '#B0483F' }}>
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ComposePage({ authorName, onCancel, onSubmit }) {
  const [form, setForm] = useState({ title: '', body: '', category: 'Experience', language: 'English' });
  const [busy, setBusy] = useState(false);
  const valid = form.title.trim() && form.body.trim();

  return (
    <div className="max-w-2xl">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm mb-5" style={{ color: '#5F6F78' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </button>

      <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Share a Story</h1>
      <p className="text-sm mb-6" style={{ color: '#5F6F78' }}>
        Posting as <span className="font-medium" style={{ color: '#26343B' }}>{authorName}</span>.
        Your story is reviewed by a moderator before it appears in the feed.
      </p>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Give your story a clear title"
            className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none" style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none" style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Language</label>
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none" style={inputStyle}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Your writing</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows="10"
            placeholder="Share your experience, a practice that helped, a thought, or useful information for other caregivers…"
            className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none resize-none" style={inputStyle} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => { setBusy(true); await onSubmit(form); setBusy(false); }}
            disabled={!valid || busy}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: '#E88A2D' }}
          >
            {busy ? 'Submitting…' : 'Submit for Review'}
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#5F6F78', border: '1px solid #E7E7E7' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function loadUpvotes() {
  try { return JSON.parse(localStorage.getItem('smritisetu.upvotes') || '[]'); } catch { return []; }
}
function saveUpvotes(ids) {
  try { localStorage.setItem('smritisetu.upvotes', JSON.stringify(ids)); } catch { /* ignore */ }
}
