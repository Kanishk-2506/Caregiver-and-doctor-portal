import React, { useState } from 'react';
import { Flame, LayoutDashboard, Images, Bell, Settings, Phone, Users, Activity, Brain } from 'lucide-react';
import Sidebar from './Sidebar';
import SOSOverlay from './SOSOverlay';
import DashboardView from './DashboardView';
import MemoryVault from './MemoryVault';
import ReminderVault from './ReminderVault';
import AppSettings from './AppSettings';
import Community from './Community';
import DoctorView from './DoctorView';
import CognitiveReport from './CognitiveReport';
import { ToastProvider } from './ToastProvider';
import { usePatient } from '../../context/PatientProvider';

const CAREGIVER_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'memory', label: 'Memory Vault', icon: Images },
  { id: 'reminders', label: 'Reminder Vault', icon: Bell },
  { id: 'report', label: 'Cognitive Report', icon: Brain },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'settings', label: 'App Settings', icon: Settings },
];

// Doctor portal is analysis-only (spec §25) — no community.
const DOCTOR_NAV = [
  { id: 'doctor', label: 'Patient Analysis', icon: Activity },
  { id: 'report', label: 'Cognitive Report', icon: Brain },
];

export default function AppShell({ onLogout }) {
  const { role, patient } = usePatient();
  const navItems = role === 'doctor' ? DOCTOR_NAV : CAREGIVER_NAV;
  const [activeView, setActiveView] = useState(navItems[0].id);
  const [sosActive, setSosActive] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'memory': return <MemoryVault />;
      case 'reminders': return <ReminderVault />;
      case 'community': return <Community />;
      case 'settings': return <AppSettings />;
      case 'doctor': return <DoctorView />;
      case 'report': return <CognitiveReport />;
      default: return role === 'doctor' ? <DoctorView /> : <DashboardView />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex" style={{ background: '#FFFFFF', color: '#26343B' }}>
        <div className="hidden lg:flex sticky top-0 h-screen self-start flex-shrink-0">
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            navItems={navItems}
            onSOS={() => setSosActive(true)}
            onLogout={onLogout}
            role={role}
            patientName={patient?.name}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: '#FFFFFF', borderBottom: '1px solid #E7E7E7' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F1F1F2', border: '1px solid #C9C9C9' }}>
                <Flame className="w-4 h-4" style={{ color: '#3E8E7E' }} />
              </div>
              <span className="font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#26343B' }}>Niramaya</span>
            </div>
            <button onClick={() => setSosActive(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#E74C4C', animation: 'sos-pulse 2s infinite' }}>
              <Phone className="w-3.5 h-3.5" />
              SOS
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
            {renderView()}
          </main>

          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2" style={{ background: '#FFFFFF', borderTop: '1px solid #E7E7E7' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button key={item.id} onClick={() => setActiveView(item.id)} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all" style={{ color: isActive ? '#3E8E7E' : '#5F6F78' }}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {sosActive && <SOSOverlay onCancel={() => setSosActive(false)} />}
      </div>
    </ToastProvider>
  );
}
