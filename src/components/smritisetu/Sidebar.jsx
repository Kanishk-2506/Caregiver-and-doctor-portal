import React from 'react';
import { Flame, Phone, LogOut } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, navItems, onSOS, onLogout }) {
  return (
    <aside className="w-64 flex flex-col h-screen p-4" style={{ background: '#D8E8EF', borderRight: '1px solid #D6E0E5' }}>
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(168,199,216,0.4), rgba(168,199,216,0.2))',
          border: '1px solid #A8C7D8',
        }}>
          <Flame className="w-5 h-5" style={{ color: '#3E8E7E' }} />
        </div>
        <div>
          <h1 className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>SmritiSetu</h1>
          <p className="text-[10px]" style={{ color: '#5F6F78' }}>Caregiver Portal · NER</p>
        </div>
      </div>

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
                background: isActive ? 'rgba(168,199,216,0.35)' : 'transparent',
                border: isActive ? '1px solid #A8C7D8' : '1px solid transparent',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? '#26343B' : '#5F6F78' }} />
              <span className="text-sm font-medium" style={{ color: isActive ? '#26343B' : '#5F6F78' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onSOS}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white mb-3 transition-all hover:scale-[1.02]"
        style={{ background: '#E74C4C', animation: 'sos-pulse 2s infinite' }}
      >
        <Phone className="w-4 h-4" />
        Trigger SOS Call
      </button>

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

