import React, { useState, useRef } from 'react';
import {
  Users, PenLine, X, ArrowUp, Eye, MessageCircle, Flag, ShieldCheck,
  Clock3, Sparkles, Globe, TrendingUp, Award,
} from 'lucide-react';
import { useToast } from './ToastProvider';

const CATEGORIES = [
  'Article',
  'Experience',
  'Thought',
  'Caregiving Practice',
  'Positive Experience',
  'Helpful Info',
];

const LANGUAGES = ['English', 'Assamese', 'Bengali', 'Manipuri', 'Bodo', 'Khasi', 'Hindi'];

const CATEGORY_COLOR = {
  Article: '#5F8FA3',
  Experience: '#E88A2D',
  Thought: '#8E7CC3',
  'Caregiving Practice': '#3E8E7E',
  'Positive Experience': '#E0A93B',
  'Helpful Info': '#5F6F78',
};

const minsAgo = (m) => Date.now() - m * 60 * 1000;

const seedPosts = [
  {
    id: 1,
    author: 'Priya Sharma',
    language: 'English',
    category: 'Caregiving Practice',
    title: 'A morning routine that reduced my mother’s confusion',
    body: 'We started keeping the curtains open from 6am and playing the same Bihu songs she grew up with while making tea. Within two weeks her early-morning agitation dropped noticeably. The trick was consistency — same order, same songs, same cup. I also placed a large printed clock and a photo of my father next to her bed so the first things she sees are familiar. On difficult days I keep my own voice slow and low, and never correct her memory directly — I redirect gently instead.',
    views: 412, upvotes: 58, comments: 12, upvoted: false, status: 'approved', createdAt: minsAgo(60 * 26),
  },
  {
    id: 2,
    author: 'Nabanita Das',
    language: 'Assamese',
    category: 'Positive Experience',
    title: 'দেউতাই আজি মোৰ নাম ললে (Today my father said my name)',
    body: 'After months of not recognising me, this morning he looked up and said my name clearly. We sat together for an hour looking at old family photos from Sualkuchi. I am writing this down so I never forget that these moments still come. To every caregiver having a hard week — the good days have not stopped, they are just further apart. Hold on for them.',
    views: 706, upvotes: 121, comments: 27, upvoted: false, status: 'approved', createdAt: minsAgo(60 * 9),
  },
  {
    id: 3,
    author: 'Dr. R. Menon (Caregiver)',
    language: 'English',
    category: 'Helpful Info',
    title: 'Checklist: preparing for a neurologist appointment',
    body: 'Bring: current medicine list with doses and timings, a short written note of new behaviours (with dates), sleep pattern for the last 2 weeks, and one specific question you most want answered. Record the consultation on your phone with permission — you will not remember everything. Ask directly whether any current medicine could be worsening confusion. Keep a single notebook that goes to every appointment.',
    views: 289, upvotes: 44, comments: 6, upvoted: false, status: 'approved', createdAt: minsAgo(60 * 50),
  },
  {
    id: 4,
    author: 'Imran K.',
    language: 'Hindi',
    category: 'Experience',
    title: 'रात में जागना — क्या काम आया',
    body: 'मेरे पिताजी रात 2 बजे उठकर बाहर जाने की कोशिश करते थे। हमने दरवाज़े पर एक हल्की घंटी लगाई, दिन में उन्हें ज़्यादा धूप और टहलना शुरू कराया, और शाम के बाद चाय-कॉफ़ी बंद कर दी। तीन हफ़्ते में रात की बेचैनी काफ़ी कम हो गई। हर किसी के लिए एक जैसा हल नहीं है, पर दिन की दिनचर्या सबसे ज़्यादा काम आई।',
    views: 174, upvotes: 22, comments: 4, upvoted: false, status: 'approved', createdAt: minsAgo(60 * 33),
  },
  {
    id: 5,
    author: 'Meghna B.',
    language: 'Bengali',
    category: 'Thought',
    title: 'যত্ন নেওয়ার সময় নিজের যত্ন',
    body: 'ছয় মাস একটানা যত্ন নেওয়ার পর আমি বুঝলাম, নিজে ভেঙে পড়লে কারও উপকার হয় না। সপ্তাহে একদিন দু’ঘণ্টার জন্য একজন এসে দায়িত্ব নেন, আর সেই সময়টা আমি শুধু হাঁটি। এইটুকু বিরতিই আমাকে ধরে রেখেছে।',
    views: 233, upvotes: 39, comments: 9, upvoted: false, status: 'approved', createdAt: minsAgo(60 * 71),
  },
  {
    id: 6,
    author: 'Tenzing L.',
    language: 'English',
    category: 'Article',
    title: 'Making the home safer without making it feel like a hospital',
    body: 'Small changes matter more than big renovations: contrasting tape on step edges, removing loose rugs, motion night-lights on the route to the bathroom, and labelled cupboards with pictures not just words. Keep frequently used items in the same visible place. We kept the house looking like home — just quietly safer.',
    views: 158, upvotes: 19, comments: 3, upvoted: false, status: 'approved', createdAt: minsAgo(60 * 100),
  },
];

const rankScore = (p) => p.upvotes * 3 + p.comments * 2 + p.views * 0.1;

const timeAgo = (ts) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const initials = (name) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export default function Community() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState(seedPosts);
  const [sort, setSort] = useState('top'); // 'top' | 'recent'
  const [filter, setFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');
  const [expanded, setExpanded] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'Experience', language: 'English' });
  const viewedRef = useRef(new Set());

  const approved = posts.filter(p => p.status === 'approved');
  const pending = posts.filter(p => p.status === 'pending');

  let feed = approved.filter(p =>
    (filter === 'All' || p.category === filter) &&
    (langFilter === 'All' || p.language === langFilter)
  );
  feed = [...feed].sort((a, b) => (sort === 'top' ? rankScore(b) - rankScore(a) : b.createdAt - a.createdAt));

  const contributors = new Set(approved.map(p => p.author)).size;
  const languagesUsed = new Set(approved.map(p => p.language)).size;

  const toggleExpand = (id) => {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
    if (!viewedRef.current.has(id)) {
      viewedRef.current.add(id);
      setPosts(ps => ps.map(p => (p.id === id ? { ...p, views: p.views + 1 } : p)));
    }
  };

  const toggleUpvote = (id) => {
    setPosts(ps => ps.map(p =>
      p.id === id ? { ...p, upvoted: !p.upvoted, upvotes: p.upvotes + (p.upvoted ? -1 : 1) } : p
    ));
  };

  const reportPost = (id) => {
    setPosts(ps => ps.map(p => (p.id === id ? { ...p, status: 'review' } : p)));
    showToast('Post reported — sent to the moderation team', 'info');
  };

  const submitPost = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const id = Date.now();
    setPosts(ps => [
      ...ps,
      {
        id,
        author: 'You (Priya Sharma)',
        language: form.language,
        category: form.category,
        title: form.title.trim(),
        body: form.body.trim(),
        views: 0, upvotes: 0, comments: 0, upvoted: false,
        status: 'pending', createdAt: Date.now(),
      },
    ]);
    setForm({ title: '', body: '', category: 'Experience', language: 'English' });
    setShowForm(false);
    showToast('Story submitted — pending moderation review', 'info');

    // Simulate the moderation + ranking pipeline.
    setTimeout(() => {
      setPosts(ps => ps.map(p =>
        p.id === id ? { ...p, status: 'approved', views: 3 } : p
      ));
      showToast('Your story passed review and is now live in the community');
    }, 2600);
  };

  const inputStyle = { background: '#FFFFFF', borderColor: '#D6E0E5', color: '#26343B' };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Community</h1>
          <p className="text-sm" style={{ color: '#5F6F78' }}>Stories, experiences &amp; knowledge sharing between caregivers</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Share a Story'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Sparkles, label: 'Stories shared', value: approved.length, color: '#E88A2D' },
          { icon: Users, label: 'Contributors', value: contributors, color: '#3E8E7E' },
          { icon: Globe, label: 'Languages', value: languagesUsed, color: '#5F8FA3' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,199,216,0.15)' }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{s.value}</div>
                <div className="text-[11px]" style={{ color: '#5F6F78' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Moderation explainer */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(62,142,126,0.08)', border: '1px solid rgba(62,142,126,0.2)' }}>
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#3E8E7E' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#3E6F63' }}>
          <span className="font-semibold">How the Community works: </span>
          Caregiver writes a post → moderation review → engagement &amp; ranking (views, upvotes, response) →
          approved content becomes visible to caregivers and doctors, and appropriately-moderated content is surfaced
          in a simple format inside the patient app. Strong positive engagement raises a post&rsquo;s ranking and visibility;
          harmful, abusive or irrelevant posts are removed by moderators.
        </p>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Give your story a clear title" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Language</label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Your writing</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows="5" placeholder="Share your experience, a practice that helped, a thought, or useful information for other caregivers…" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors resize-none" style={inputStyle} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={submitPost} disabled={!form.title.trim() || !form.body.trim()} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}>
              Submit for Review
            </button>
            <span className="text-xs" style={{ color: '#5F6F78' }}>Posts are checked by moderators before appearing in the community feed.</span>
          </div>
        </div>
      )}

      {/* Pending (author's own submissions) */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: '#5F6F78' }}>Your submissions in review</h2>
          {pending.map(p => (
            <div key={p.id} className="glass-card p-4 rounded-xl flex items-center gap-3" style={{ borderLeft: '3px solid #E88A2D' }}>
              <Clock3 className="w-4 h-4 flex-shrink-0" style={{ color: '#E88A2D' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#26343B' }}>{p.title}</div>
                <div className="text-xs" style={{ color: '#5F6F78' }}>{p.category} · {p.language}</div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: '#FCE5CC', color: '#E88A2D' }}>In review</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CATEGORIES].map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === c ? 'rgba(168,199,216,0.3)' : '#FFFFFF',
                border: filter === c ? '1px solid #A8C7D8' : '1px solid #D6E0E5',
                color: '#26343B',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none"
            style={inputStyle}
          >
            <option value="All">All languages</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #D6E0E5' }}>
            {[
              { id: 'top', label: 'Top ranked', icon: TrendingUp },
              { id: 'recent', label: 'Recent', icon: Clock3 },
            ].map(o => {
              const Icon = o.icon;
              return (
                <button
                  key={o.id}
                  onClick={() => setSort(o.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ background: sort === o.id ? 'rgba(168,199,216,0.3)' : '#FFFFFF', color: '#26343B' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {feed.length === 0 && (
          <div className="glass-card p-8 rounded-xl text-center text-sm" style={{ color: '#5F6F78' }}>
            No posts match this filter yet.
          </div>
        )}
        {feed.map((p, i) => {
          const isTop = sort === 'top' && i < 3;
          const catColor = CATEGORY_COLOR[p.category] || '#5F6F78';
          const open = expanded[p.id];
          return (
            <article key={p.id} className="glass-card p-5 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(168,199,216,0.3)', color: '#26343B' }}>
                  {initials(p.author)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: '#26343B' }}>{p.author}</span>
                    <span className="text-xs" style={{ color: '#5F6F78' }}>· {p.language} · {timeAgo(p.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${catColor}1a`, color: catColor }}>{p.category}</span>
                    {isTop && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#FCE5CC', color: '#C96D16' }}>
                        <Award className="w-3 h-3" />
                        {i === 0 ? 'Top ranked' : `#${i + 1} rising`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-base font-semibold mt-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>{p.title}</h3>
              <p className="text-sm mt-1.5 leading-relaxed whitespace-pre-line" style={{ color: '#4A5A62', ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>
                {p.body}
              </p>
              <button onClick={() => toggleExpand(p.id)} className="text-xs font-medium mt-1.5" style={{ color: '#5F8FA3' }}>
                {open ? 'Show less' : 'Read more'}
              </button>

              <div className="flex items-center gap-4 mt-4 pt-3 flex-wrap" style={{ borderTop: '1px solid #EAF0F2' }}>
                <button
                  onClick={() => toggleUpvote(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  style={{
                    background: p.upvoted ? 'rgba(62,142,126,0.15)' : '#EAF3F7',
                    border: `1px solid ${p.upvoted ? 'rgba(62,142,126,0.4)' : '#D6E0E5'}`,
                    color: p.upvoted ? '#3E8E7E' : '#5F6F78',
                  }}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  {p.upvotes}
                </button>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6F78' }}>
                  <Eye className="w-3.5 h-3.5" /> {p.views}
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6F78' }}>
                  <MessageCircle className="w-3.5 h-3.5" /> {p.comments}
                </span>
                <span className="text-[11px] ml-auto" style={{ color: '#9AAAB2' }}>
                  rank score {Math.round(rankScore(p))}
                </span>
                <button
                  onClick={() => reportPost(p.id)}
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-100"
                  style={{ color: '#B0483F', opacity: 0.7 }}
                  title="Report to moderators"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
