import React, { useRef, useState } from 'react';
import { Upload, MapPin, Calendar, Trash2, Plus, Image as ImageIcon, X, Star, CheckCircle2 } from 'lucide-react';
import { useToast } from './ToastProvider';
import { usePatient } from '../../context/PatientProvider';
import { useCollection } from '../../lib/useCollection';
import { uploadFamilyPhoto, updatePatient } from '../../lib/api';
import { NotConfigured } from './ReminderVault';

const inputStyle = { background: '#FFFFFF', borderColor: '#E7E7E7', color: '#26343B' };

export default function MemoryVault() {
  const { showToast } = useToast();
  const { patientId, patient, configured, setPatient } = usePatient();
  const memories = useCollection('memories', patientId, { orderBy: 'created_at', ascending: false });

  const [showForm, setShowForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formData, setFormData] = useState({ title: '', location: '', date: '', tags: '', caption: '' });
  const fileInputRef = useRef(null);

  if (!configured) return <NotConfigured />;

  const currentChestUrl = patient?.family_photo_url || null;

  const pickFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!formData.title) return;
    setBusy(true);
    try {
      let imageUrl = null;
      if (pendingFile) imageUrl = await uploadFamilyPhoto(patientId, pendingFile);
      await memories.insert({
        title: formData.title,
        location: formData.location || 'Unknown',
        date: formData.date || new Date().toISOString().split('T')[0],
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        caption: formData.caption,
        image_url: imageUrl,
      });
      // First photo added also becomes the patient's Memory Chest photo.
      if (imageUrl && !currentChestUrl) {
        const updated = await updatePatient(patientId, { family_photo_url: imageUrl });
        setPatient(updated);
      }
      setFormData({ title: '', location: '', date: '', tags: '', caption: '' });
      setPendingFile(null);
      setShowForm(false);
      showToast('Memory card saved — synced to the patient app');
    } catch (e) {
      showToast(e.message || 'Upload failed', 'info');
    } finally {
      setBusy(false);
    }
  };

  const setAsChestPhoto = async (memory) => {
    if (!memory.image_url) return;
    const updated = await updatePatient(patientId, { family_photo_url: memory.image_url });
    setPatient(updated);
    showToast('Set as the Memory Chest photo the patient sees');
  };

  const handleDelete = async (memory) => {
    await memories.remove(memory.id);
    if (memory.image_url && memory.image_url === currentChestUrl) {
      const updated = await updatePatient(patientId, { family_photo_url: null });
      setPatient(updated);
    }
    showToast('Memory card removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Memory Vault</h1>
          <p className="text-sm" style={{ color: '#5F6F78' }}>Photos &amp; memories shown to the patient after their daily games</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: '#E88A2D' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Memory'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-xl space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all"
            style={{
              borderColor: dragActive ? '#C9C9C9' : '#E7E7E7',
              background: dragActive ? '#FAFAFA' : 'transparent',
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: '#F6F6F7' }}>
              {pendingFile ? <CheckCircle2 className="w-6 h-6" style={{ color: '#3E8E7E' }} /> : <Upload className="w-6 h-6" style={{ color: '#5F8FA3' }} />}
            </div>
            <p className="text-sm font-medium" style={{ color: '#26343B' }}>
              {pendingFile ? pendingFile.name : 'Drag & drop a photo, or click to browse'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#5F6F78' }}>Uploaded to secure storage · JPG / PNG</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} placeholder="e.g., Morning Tea Ritual" />
            <Field label="Location" value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} placeholder="e.g., Guwahati, Assam" />
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9]" style={inputStyle} />
            </div>
            <Field label="Relationship Tags" value={formData.tags} onChange={(v) => setFormData({ ...formData, tags: v })} placeholder="e.g., Family, Tea, Morning" />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Caption</label>
            <textarea value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} placeholder="Describe this memory..." rows="2" className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#C9C9C9] resize-none" style={inputStyle} />
          </div>
          <button onClick={handleSubmit} disabled={!formData.title || busy} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40" style={{ background: '#E88A2D' }}>
            {busy ? 'Saving…' : 'Save Memory Card'}
          </button>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#5F6F78' }}>Active Gallery · {memories.rows.length} cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.rows.map((memory) => {
            const isChest = memory.image_url && memory.image_url === currentChestUrl;
            return (
              <div key={memory.id} className="glass-card rounded-xl overflow-hidden group">
                <div className="aspect-[4/3] relative overflow-hidden" style={{ background: memory.image_url ? 'transparent' : 'linear-gradient(135deg, #F7F7F8, #FBFBFB)' }}>
                  {memory.image_url ? (
                    <img src={memory.image_url} alt={memory.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12" style={{ color: '#C9C9C9' }} />
                    </div>
                  )}
                  {isChest && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full text-white" style={{ background: '#3E8E7E' }}>
                      <Star className="w-3 h-3" /> Memory Chest
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    {memory.image_url && !isChest && (
                      <button onClick={() => setAsChestPhoto(memory)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110" style={{ background: '#DDF1EC', border: '1px solid rgba(62,142,126,0.3)' }} title="Show this in the patient's Memory Chest">
                        <Star className="w-4 h-4" style={{ color: '#3E8E7E' }} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(memory)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-110" style={{ background: '#FDE4E4', border: '1px solid rgba(231,76,76,0.3)' }}>
                      <Trash2 className="w-4 h-4" style={{ color: '#E74C4C' }} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: '#26343B' }}>{memory.title}</h3>
                  <div className="flex items-center gap-3 text-xs mb-2" style={{ color: '#5F6F78' }}>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{memory.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{memory.date}</span>
                  </div>
                  {memory.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {memory.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#DDF1EC', color: '#3E8E7E' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs" style={{ color: '#5F6F78' }}>{memory.caption}</p>
                </div>
              </div>
            );
          })}
        </div>
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
