import React from 'react';
import { Phone, LogOut } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, navItems, onSOS, onLogout, role = 'caregiver', patientName }) {
  return (
    <aside className="w-64 flex flex-col h-screen p-4" style={{ background: '#FFFFFF', borderRight: '1px solid #ECECEC' }}>
      <div className="flex items-center gap-3 mb-8 px-2">
        <img src="/logo.jpg" alt="Nirmaya" className="w-10 h-10 rounded-xl object-cover" />
        <div>
          <h1 className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Nirmaya</h1>
          <p className="text-[10px]" style={{ color: '#5F6F78' }}>
            {role === 'doctor' ? 'Doctor Portal · NER' : 'Caregiver Portal · NER'}
          </p>
        </div>
      </div>

      {patientName && (
        <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: '#F7F7F8', border: '1px solid #ECECEC' }}>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: '#5F6F78' }}>Connected patient</p>
          <p className="text-sm font-semibold" style={{ color: '#26343B' }}>{patientName}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              style={{
                background: isActive ? '#F2F2F3' : 'transparent',
                border: isActive ? '1px solid #E4E4E4' : '1px solid transparent',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? '#26343B' : '#5F6F78' }} />
              <span className="text-sm font-medium" style={{ color: isActive ? '#26343B' : '#5F6F78' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {role !== 'doctor' && (
        <button
          onClick={onSOS}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white mb-3 transition-all hover:scale-[1.02]"
          style={{ background: '#E74C4C', animation: 'sos-pulse 2s infinite' }}
        >
          <Phone className="w-4 h-4" />
          Trigger SOS Call
        </button>
      )}

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors"
        style={{ color: '#5F6F78' }}
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect Sync</span>
      </button>
    </aside>
  );
}

