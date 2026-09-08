import { useState } from 'react';
import LoginScreen from './components/smritisetu/LoginScreen';
import AppShell from './components/smritisetu/AppShell';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return <AppShell onLogout={() => setIsLoggedIn(false)} />;
}
