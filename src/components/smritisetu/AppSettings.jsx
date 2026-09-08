import React, { useState } from 'react';
import { User, Database, Languages, Download, RefreshCw, Check, HardDrive } from 'lucide-react';
import { useToast } from './ToastProvider';

const languages = [
  { id: 'assamese', name: 'Assamese', size: '42 MB' },
  { id: 'manipuri', name: 'Manipuri', size: '38 MB' },
  { id: 'bodo', name: 'Bodo', size: '35 MB' },
  { id: 'bengali', name: 'Bengali', size: '45 MB' },
  { id: 'khasi', name: 'Khasi', size: '33 MB' },
];

const syncRates = [
  { id: 'realtime', label: 'Real-time', desc: 'Sync instantly on change' },
  { id: 'hourly', label: 'Hourly', desc: 'Sync every hour' },
  { id: '12hours', label: '12 Hours', desc: 'Sync twice daily' },
  { id: 'manual', label: 'Manual', desc: 'Sync only on demand' },
];

const inputStyle = { background: '#FFFFFF', borderColor: '#D6E0E5', color: '#26343B' };

export default function AppSettings() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    caregiverName: 'Priya Sharma',
    patientName: 'Gita Sharma',
    emergencyContact: '+91 98765 43210',
  });
  const [syncRate, setSyncRate] = useState('hourly');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [langProgress, setLangProgress] = useState({});
  const [downloadedLangs, setDownloadedLangs] = useState({ assamese: true });

  const handleSaveProfile = () => {
    showToast('Profile updated successfully');
  };

  const handleForceSync = () => {
    setSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncing(false);
          showToast('Force sync complete — all data up to date');
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleDownloadLang = (langId) => {
    setLangProgress(prev => ({ ...prev, [langId]: 0 }));
    const interval = setInterval(() => {
      setLangProgress(prev => {
        const current = prev[langId] ?? 0;
        if (current >= 100) {
          clearInterval(interval);
          setDownloadedLangs(d => ({ ...d, [langId]: true }));
          const newPrev = { ...prev };
          delete newPrev[langId];
          showToast(`${languages.find(l => l.id === langId).name} pack downloaded`);
          return newPrev;
        }
        return { ...prev, [langId]: current + 4 };
      });
    }, 80);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>App Settings</h1>
        <p className="text-sm" style={{ color: '#5F6F78' }}>Manage your portal preferences</p>
      </div>

      {/* Profile Management */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5" style={{ color: '#A8C7D8' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Profile Management</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Caregiver Name</label>
            <input value={profile.caregiverName} onChange={e => setProfile({ ...profile, caregiverName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Patient Name</label>
            <input value={profile.patientName} onChange={e => setProfile({ ...profile, patientName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: '#5F6F78' }}>Emergency Contact</label>
            <input value={profile.emergencyContact} onChange={e => setProfile({ ...profile, emergencyContact: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#A8C7D8] transition-colors" style={inputStyle} />
          </div>
          <button onClick={handleSaveProfile} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #E88A2D, #C96D16)' }}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5" style={{ color: '#A8C7D8' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Offline Sync Status</h2>
        </div>
        <div className="space-y-3 mb-4">
          {syncRates.map(rate => (
            <button
              key={rate.id}
              onClick={() => setSyncRate(rate.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-all"
              style={{
                background: syncRate === rate.id ? 'rgba(168,199,216,0.15)' : '#EAF3F7',
                border: syncRate === rate.id ? '1px solid #A8C7D8' : '1px solid #D6E0E5',
              }}
            >
              <div className="text-left">
                <div className="text-sm font-medium" style={{ color: '#26343B' }}>{rate.label}</div>
                <div className="text-xs" style={{ color: '#5F6F78' }}>{rate.desc}</div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: syncRate === rate.id ? '#3E8E7E' : '#D6E0E5' }}>
                {syncRate === rate.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3E8E7E' }} />}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={handleForceSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(168,199,216,0.15)', border: '1px solid #A8C7D8', color: '#26343B' }}
        >
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#3E8E7E' }} /> : <RefreshCw className="w-4 h-4" style={{ color: '#5F8FA3' }} />}
          {syncing ? 'Syncing...' : 'Force Sync Now'}
        </button>
        {syncing && (
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#D6E0E5' }}>
              <div className="h-full rounded-full" style={{ width: `${syncProgress}%`, background: '#3E8E7E', transition: 'width 0.1s linear' }} />
            </div>
            <div className="text-right text-xs mt-1" style={{ color: '#5F6F78' }}>{syncProgress}%</div>
          </div>
        )}
      </div>

      {/* Language Packs */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="w-5 h-5" style={{ color: '#A8C7D8' }} />
          <h2 className="text-base font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Regional Language Packs</h2>
        </div>
        <div className="space-y-3">
          {languages.map(lang => {
            const isDownloaded = downloadedLangs[lang.id];
            const isDownloading = langProgress[lang.id] !== undefined;
            return (
              <div key={lang.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#EAF3F7', border: '1px solid #D6E0E5' }}>
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4" style={{ color: '#5F6F78' }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#26343B' }}>{lang.name}</div>
                    <div className="text-xs" style={{ color: '#5F6F78' }}>{lang.size}</div>
                  </div>
                </div>
                {isDownloaded ? (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#3E8E7E' }}>
                    <Check className="w-4 h-4" />
                    <span>Downloaded</span>
                  </div>
                ) : isDownloading ? (
                  <div className="w-24">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#D6E0E5' }}>
                      <div className="h-full rounded-full" style={{ width: `${langProgress[lang.id]}%`, background: '#3E8E7E', transition: 'width 0.08s linear' }} />
                    </div>
                    <div className="text-right text-[10px] mt-0.5" style={{ color: '#5F6F78' }}>{langProgress[lang.id]}%</div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadLang(lang.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ background: 'rgba(168,199,216,0.15)', border: '1px solid #A8C7D8', color: '#26343B' }}
                  >
                    <Download className="w-3.5 h-3.5" style={{ color: '#5F8FA3' }} />
                    Download
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



