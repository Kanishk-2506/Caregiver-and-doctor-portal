import { PatientProvider, usePatient } from './context/PatientProvider';
import LoginScreen from './components/niramaya/LoginScreen';
import AppShell from './components/niramaya/AppShell';

function Gate() {
  const { status, disconnect } = usePatient();

  if (status !== 'connected') {
    return <LoginScreen />;
  }
  return <AppShell onLogout={disconnect} />;
}

export default function App() {
  return (
    <PatientProvider>
      <Gate />
    </PatientProvider>
  );
}
