import { PatientProvider, usePatient } from './context/PatientProvider';
import LoginScreen from './components/smritisetu/LoginScreen';
import AppShell from './components/smritisetu/AppShell';

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
