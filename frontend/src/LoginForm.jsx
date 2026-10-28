import { useState } from 'react';
import api from './api';
import Icon from './components/Icons';

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      const token = response.data.token;
      localStorage.setItem('auth_token', token);

      if (onLoginSuccess) onLoginSuccess(token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-slate-950 p-10 lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-indigo-400/25 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.04)_100%)]" />

          <div className="relative flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">
              <Icon name="layers" className="h-5 w-5 text-white" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[16px] font-semibold tracking-tight text-white">ProjectFlow</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-500">Project OS</p>
            </div>
          </div>

          <div className="relative mt-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
              <Icon name="sparkles" className="h-3.5 w-3.5 text-indigo-300" />
              Workspace clarity, built in
            </span>
            <h1 className="mt-5 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white">
              Project work, in focus.
            </h1>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-slate-400">
              Plan projects, assign the next step, and keep every teammate moving with a calm, clear workspace.
            </p>

            <div className="mt-8 space-y-2.5">
              {[
                'A single view of every active task',
                'Status updates your whole team can trust',
                'Access that matches each person’s role',
              ].map((item) => (
                <div className="flex items-center gap-2.5 text-[12px] font-medium text-slate-300" key={item}>
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.035] p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
                    <Icon name="tasks" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-white">Website redesign</p>
                    <p className="text-[10px] text-slate-500">Product · Due today</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/20">
                  In progress
                </span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex items-center gap-2 text-[10px] font-medium text-slate-600">
            <Icon name="shield" className="h-3.5 w-3.5" />
            Private workspace · Protected access
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/25">
                <Icon name="layers" className="h-[18px] w-[18px] text-white" strokeWidth={1.9} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-900">ProjectFlow</p>
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400">Project OS</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
                Welcome back
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Sign in to your workspace
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Enter your credentials to continue where your team left off.
              </p>
            </div>

            {error && (
              <div className="mt-5 flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="login-email">
                  Email address
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-200/80 bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                    id="login-email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <Icon
                    name="shield"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-200/80 bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                    id="login-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md hover:shadow-indigo-500/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <Icon name="arrowLeft" className="h-4 w-4 rotate-180" strokeWidth={2} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-[10px] font-medium text-slate-500">
              <Icon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              Secure workspace access · Your session stays on this device
            </div>

            <p className="mt-4 text-center text-[12px] text-slate-500">
              New here?{' '}
              <button
                className="font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-500"
                onClick={() => onSwitchToRegister?.()}
                type="button"
              >
                Create an account
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
