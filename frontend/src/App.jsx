import { useState } from 'react';
import Dashboard from './Dashboard';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);

    if (window.location.pathname.endsWith('/register') || params.get('mode') === 'register') {
      return 'register';
    }

    return 'login';
  });

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setView('login');
  };

  if (!token) {
    if (view === 'register') {
      return <RegisterForm onRegisterSuccess={handleAuthSuccess} onSwitchToLogin={() => setView('login')} />;
    }
    return <LoginForm onLoginSuccess={handleAuthSuccess} onSwitchToRegister={() => setView('register')} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
