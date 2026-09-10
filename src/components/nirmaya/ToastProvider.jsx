import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3 rounded-xl pointer-events-auto" style={{
            background: '#FFFFFF',
            border: `1px solid ${t.type === 'success' ? '#DDF1EC' : '#FDE4E4'}`,
            boxShadow: '0 4px 12px rgba(38,52,59,0.1)',
            animation: 'toast-in 0.3s ease-out',
          }}>
            {t.type === 'success'
              ? <CheckCircle2 className="w-5 h-5" style={{ color: '#3E8E7E' }} />
              : <Info className="w-5 h-5" style={{ color: '#E74C4C' }} />}
            <span className="text-sm font-medium" style={{ color: '#26343B' }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


