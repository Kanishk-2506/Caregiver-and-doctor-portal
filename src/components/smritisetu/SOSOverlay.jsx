import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';

export default function SOSOverlay({ onCancel }) {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('dialing');

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    const statusTimer = setTimeout(() => setStatus('connecting'), 3000);
    return () => { clearInterval(timer); clearTimeout(statusTimer); };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(38,52,59,0.88)', backdropFilter: 'blur(12px)' }}>
      <div className="relative mb-8">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid rgba(231,76,76,0.4)',
              width: '96px',
              height: '96px',
              animation: 'sos-ring 2s ease-out infinite',
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        <div className="w-24 h-24 rounded-full flex items-center justify-center relative z-10" style={{ background: 'linear-gradient(135deg, #E74C4C, #c0392b)', boxShadow: '0 4px 20px rgba(231,76,76,0.3)' }}>
          <User className="w-12 h-12 text-white" />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#FFFFFF' }}>Dr. Sharma</h2>
      <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Emergency Care Specialist</p>
      <p className="text-lg font-mono mb-4" style={{ color: '#A8C7D8' }}>+91 98765 43210</p>

      <div className="flex items-center gap-2 mb-8">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: status === 'dialing' ? '#E74C4C' : '#3E8E7E' }} />
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {status === 'dialing' ? 'Dialing' : 'Connecting'}... {formatTime(seconds)}
        </span>
      </div>

      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-105"
        style={{ background: 'rgba(231,76,76,0.2)', border: '1px solid rgba(231,76,76,0.5)' }}
      >
        <X className="w-4 h-4" />
        Cancel Call
      </button>
    </div>
  );
}



