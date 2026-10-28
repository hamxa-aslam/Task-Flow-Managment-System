import { useState } from 'react';
import api from './api';
import Icon from './components/Icons';

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || '';
  });
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      // After registration (web auth), login via API to get token
      const response = await api.post('/login', { email, password });
      const token = response.data.token;
      localStorage.setItem('auth_token', token);
      if (onRegisterSuccess) onRegisterSuccess(token);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5">
          <div className="relative px-6 pb-8 pt-9 sm:px-10">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <Icon name="user-plus" className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Create your account</h1>
              <p className="mt-1.5 text-sm text-slate-500">Sign up to accept your project invitation</p>
            </div>
            <form className="mt-8 space-y-5" onSubmit={handleRegister}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="name">
                  Full name
                </label>
                <div className="relative">
                  <Icon name="user" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                  <input
                    id="name"
                    className="w-full rounded-lg border border-slate-200/80 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    type="text"
                    value={name}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Icon name="mail" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                  <input
                    id="email"
                    className="w-full rounded-lg border border-slate-200/80 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                  <input
                    id="password"
                    className="w-full rounded-lg border border-slate-200/80 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="password_confirmation">
                  Confirm password
                </label>
                <div className="relative">
                  <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                  <input
                    id="password_confirmation"
                    className="w-full rounded-lg border border-slate-200/80 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    type="password"
                    value={passwordConfirmation}
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-lg border border-rose-200/80 bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-600">
                  {error}
                </div>
              )}
              <button
                className="group relative inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100"
                disabled={loading}
                type="submit"
              >
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                Create account
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button
                className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500"
                onClick={onSwitchToLogin}
                type="button"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
