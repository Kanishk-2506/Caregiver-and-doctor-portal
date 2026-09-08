import React, { useState } from 'react';
import { Upload, MapPin, Calendar, Trash2, Plus, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from './ToastProvider';

const initialMemories = [
  { id: 1, title: 'Red Lal Cha', location: 'Guwahati, Assam', date: '2024-03-15', tags: ['Family', 'Tea'], caption: 'Traditional red tea preparation every morning', image: '/__generating__/d7192ac3-0a58-412c-b07f-6c1676c87c01.png' },
  { id: 2, title: 'Golden Silk Loom', location: 'Sualkuchi, Assam', date: '2024-02-20', tags: ['Heritage', 'Craft'], caption: 'Handloom golden Muga silk weaving at family workshop', image: '/__generating__/38713cea-65ea-4196-bac2-26136ef50443.png' },
  { id: 3, title: 'Bihu Dance', location: 'Tezpur, Assam', date: '2024-04-14', tags: ['Festival', 'Dance'], caption: 'Rongali Bihu celebration with the whole family', image: '/__generating__/9c41c3b8-154e-4e90-b0f3-94683ff35024.png' },
];

const inputStyle = { background: '#FFFFFF', borderColor: '#D6E0E5', color: '#26343B' };

export default function MemoryVault() {
  const { showToast } = useToast();
  const [memories, setMemories] = useState(initialMemories);
  const [showForm, setShowForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({ title: '', location: '', date: '', tags: '', caption: '' });

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); showToast('Photo uploaded to offline storage'); };

  const handleSubmit = () => {
    if (!formData.title) return;
    const newMemory = {
      id: Date.now(),
      title: formData.title,
      location: formData.location || 'Unknown',
      date: formData.date || new Date().toISOString().split('T')[0],
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      caption: formData.caption,
      image: null,
    };
    setMemories([newMemory, ...memories]);
    setFormData({ title: '', location: '', date: '', tags: '', caption: '' });
    setShowForm(false);
    showToast('Memory card saved to vault');
  };

  const handleDelete = (id) => {
    setMemories(memories.filter(m => m.id !== id));
    showToast('Memory card removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Memory Vault</h1>
          <p className="text-sm" style={{ color: '#5F6F78' }}>Photos stored in offline database</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Memory'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all"
            style={{
              borderColor: dragActive ? '#A8C7D8' : '#D6E0E5',
              background: dragActive ? 'rgba(168,199,216,0.08)' : 'transparent',
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(168,199,216,0.15)' }}>
              <Upload className="w-6 h-6" style={{ color: '#5F8FA3' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#26343B' }}>Drag & drop a photo here</p>
            <p className="text-xs mt-1" style={{ color: '#5F6F78' }}>or tap to browse · stored locally offline</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Title</label>
              <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Morning Tea Ritual" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Location</label>
              <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Guwahati, Assam" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Relationship Tags</label>
              <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., Family, Tea, Morning" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Caption</label>
            <textarea value={formData.caption} onChange={e => setFormData({ ...formData, caption: e.target.value })} placeholder="Describe this memory..." rows="2" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors resize-none" style={inputStyle} />
          </div>
          <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}>
            Save Memory Card
          </button>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#5F6F78' }}>Active Gallery · {memories.length} cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map(memory => (
            <div key={memory.id} className="glass-card rounded-xl overflow-hidden group">
              <div className="aspect-[4/3] relative overflow-hidden" style={{ background: memory.image ? 'transparent' : 'linear-gradient(135deg, rgba(168,199,216,0.12), rgba(168,199,216,0.05))' }}>
                {memory.image ? (
                  <img src={memory.image} alt={memory.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12" style={{ color: '#A8C7D8' }} />
                  </div>
                )}
                <button onClick={() => handleDelete(memory.id)} className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110" style={{ background: '#FDE4E4', border: '1px solid rgba(231,76,76,0.3)' }}>
                  <Trash2 className="w-4 h-4" style={{ color: '#E74C4C' }} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#26343B' }}>{memory.title}</h3>
                <div className="flex items-center gap-3 text-xs mb-2" style={{ color: '#5F6F78' }}>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{memory.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{memory.date}</span>
                </div>
                {memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {memory.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#DDF1EC', color: '#3E8E7E' }}>{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs" style={{ color: '#5F6F78' }}>{memory.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



