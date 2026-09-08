import React, { useState, useRef } from 'react';
import { Flame, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    const newDigits = Array(8).fill('');
    pasted.split('').forEach((d, i) => { newDigits[i] = d; });
    setDigits(newDigits);
    if (pasted.length < 8) inputRefs.current[pasted.length]?.focus();
  };

  const handleSubmit = () => {
    const code = digits.join('');
    if (code.length !== 8) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => onLogin(), 1200);
    }, 2000);
  };

  const isComplete = digits.every(d => d !== '');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#EAF3F7' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,199,216,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(62,142,126,0.08) 0%, transparent 70%)' }} />
      </div>

      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl" style={{
          background: '#FFFFFF',
          border: '1px solid #DDF1EC',
          boxShadow: '0 4px 12px rgba(62,142,126,0.12)',
          animation: 'toast-in 0.3s ease-out',
        }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: '#3E8E7E' }} />
          <span className="text-sm font-medium" style={{ color: '#3E8E7E' }}>Sync complete — Connected to SmritiSetu</span>
        </div>
      )}

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
              background: 'linear-gradient(135deg, rgba(168,199,216,0.3), rgba(168,199,216,0.15))',
              border: '1px solid #A8C7D8',
            }}>
              <Flame className="w-8 h-8" style={{ color: '#3E8E7E' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>SmritiSetu</h1>
            <p className="text-xs mt-1" style={{ color: '#5F6F78' }}>Caregiver Portal · NER</p>
          </div>

          <div className="mb-6">
            <label className="text-xs mb-3 block" style={{ color: '#5F6F78' }}>Enter 8-Digit Sharing Code</label>
            <div className="flex gap-1.5 justify-center" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-9 h-12 text-center text-lg font-bold rounded-lg border focus:outline-none focus:border-[#A8C7D8] transition-all"
                  style={{
                    background: '#FFFFFF',
                    borderColor: digit ? '#A8C7D8' : '#D6E0E5',
                    color: '#26343B',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isComplete && !loading ? 'linear-gradient(135deg, #E88A2D, #C96D16)' : '#EAF3F7',
              color: isComplete && !loading ? '#FFFFFF' : '#5F6F78',
              border: '1px solid #D6E0E5',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <span>Connect to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs mt-4" style={{ color: '#5F6F78' }}>
            Enter any 8-digit code to access the prototype
          </p>
        </div>
      </div>
    </div>
  );
}


