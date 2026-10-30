import { useState } from 'react';
import Icon from './Icons';
import RoleBadge from './RoleBadge';

function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatJoined(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function ProfileView({
  user,
  role,
  roleInfo,
  stats,
  projectsCount,
  backLabel,
  onBack,
  onSave,
  onUpdateEmail,
  onChangePassword,
  onLogout,
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailErrors, setEmailErrors] = useState({});
  const [emailSaved, setEmailSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaved, setPwSaved] = useState(false);
  const isDirty = name.trim() !== (user?.name ?? '').trim();
  const emailDirty = email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase();

  const handleChange = (event) => {
    setName(event.target.value);
    setErrors({});
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const nextName = name.trim();

    if (!nextName) {
      setErrors({ name: 'Please enter your full name.' });
      return;
    }

    if (nextName.length > 255) {
      setErrors({ name: 'Your name must be 255 characters or fewer.' });
      return;
    }

    if (!isDirty) return;

    setSaving(true);
    setErrors({});

    const result = await onSave(nextName);

    if (result?.ok) {
      setName(result.user?.name ?? nextName);
      setSaved(true);
    } else {
      setErrors(result?.errors ?? { message: 'Could not update your profile. Please try again.' });
    }

    setSaving(false);
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();

    if (emailSaving) return;

    const nextEmail = email.trim().toLowerCase();

    if (!nextEmail) {
      setEmailErrors({ email: 'Please enter your email address.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    if (!emailDirty) return;

    setEmailSaving(true);
    setEmailErrors({});
    setEmailSaved(false);

    const result = await onUpdateEmail(nextEmail);

    if (result?.ok) {
      setEmail(result.user?.email ?? nextEmail);
      setEmailSaved(true);
    } else {
      setEmailErrors(result?.errors ?? { message: 'Could not update your email. Please try again.' });
    }

    setEmailSaving(false);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (pwSaving) return;

    if (!currentPassword) {
      setPwErrors({ current_password: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 8) {
      setPwErrors({ password: 'Your new password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwErrors({ password_confirmation: 'The password confirmation does not match.' });
      return;
    }

    setPwSaving(true);
    setPwErrors({});
    setPwSaved(false);

    const result = await onChangePassword({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });

    if (result?.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSaved(true);
    } else {
      setPwErrors(result?.errors ?? { message: 'Could not update your password. Please try again.' });
    }

    setPwSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="group inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md active:scale-95"
          onClick={onBack}
          type="button"
        >
          <Icon name="arrowLeft" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to {backLabel}
        </button>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span>Account</span>
          <Icon name="chevronRight" className="h-3 w-3" />
          <span className="font-semibold text-slate-600">Profile</span>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950 p-6 shadow-xl shadow-slate-900/10 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.035)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 text-2xl font-semibold text-white shadow-2xl shadow-violet-500/25 ring-4 ring-white/10">
            {initialsOf(user?.name) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">Member profile</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {user?.name || 'Your profile'}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-400">{user?.email || 'Account details'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoleBadge role={role} size="md" variant="dark" />
              <span className="text-xs text-slate-500">Member since {formatJoined(user?.created_at)}</span>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-2">
            {[
              { label: 'Open', value: stats.total - stats.completed, icon: 'clock' },
              { label: 'Completed', value: stats.completed, icon: 'checkCircle' },
              { label: 'Projects', value: projectsCount, icon: 'briefcase' },
            ].map((item) => (
              <div
                className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 backdrop-blur-sm sm:flex sm:min-w-36 sm:items-center sm:gap-2.5"
                key={item.label}
              >
                <Icon name={item.icon} className="hidden h-4 w-4 text-indigo-300 sm:block" />
                <div>
                  <p className="text-base font-semibold leading-none text-white">{item.value}</p>
                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
              <Icon name="user" className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Personal information</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Update the name shown across your workspace.</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {errors.message && (
              <div className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {errors.message}
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="profile-name">
                  Full name
                </label>
                <span className="text-[10px] font-medium tabular-nums text-slate-400">{name.length}/255</span>
              </div>
              <div className="relative">
                <Icon
                  name="user"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-4 ${
                    errors.name
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                      : 'border-slate-200/80 focus:border-indigo-300 focus:ring-indigo-500/10'
                  }`}
                  id="profile-name"
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  type="text"
                  value={name}
                />
              </div>
              {errors.name ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name}</p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">
                  This name is visible in the sidebar, header, and task activity.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <Icon name="mail" className="h-3 w-3" />
                  Email address
                </div>
                <p className="mt-1.5 truncate text-[13px] font-semibold text-slate-800">{user?.email || '—'}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Update it in account security below</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <Icon name={roleInfo.icon} className="h-3 w-3" />
                  Access level
                </div>
                <div className="mt-1.5">
                  <RoleBadge role={role} size="md" />
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">{roleInfo.scope}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                  disabled={!isDirty || saving}
                  type="submit"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.2} />
                      Save changes
                    </>
                  )}
                </button>
                <button
                  className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isDirty || saving}
                  onClick={() => {
                    setName(user?.name ?? '');
                    setErrors({});
                    setSaved(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Icon name="checkCircle" className="h-3.5 w-3.5" />
                  All changes saved
                </span>
              )}
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                <Icon name="mail" className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Update email</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">Change the address tied to your account.</p>
              </div>
            </div>

            <form className="mt-5 space-y-3.5" onSubmit={handleEmailSubmit}>
              {emailErrors.message && (
                <div className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  {emailErrors.message}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="profile-email">
                  Email address
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-4 ${
                      emailErrors.email
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                        : 'border-slate-200/80 focus:border-indigo-300 focus:ring-indigo-500/10'
                    }`}
                    id="profile-email"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailErrors({});
                      setEmailSaved(false);
                    }}
                    placeholder="you@company.com"
                    type="email"
                    value={email}
                  />
                </div>
                {emailErrors.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{emailErrors.email}</p>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                  disabled={!emailDirty || emailSaving}
                  type="submit"
                >
                  {emailSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.2} />
                      Update email
                    </>
                  )}
                </button>
                {emailSaved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <Icon name="checkCircle" className="h-3.5 w-3.5" />
                    Email updated
                  </span>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <Icon name="shield" className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Change password</h2>
                <p className="mt-0.5 text-[13px] text-slate-500">Verify your current password to set a new one.</p>
              </div>
            </div>

            <form className="mt-5 space-y-3.5" onSubmit={handlePasswordSubmit}>
              {pwErrors.message && (
                <div className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  {pwErrors.message}
                </div>
              )}
              {[
                {
                  id: 'profile-current-password',
                  label: 'Current password',
                  placeholder: 'Enter your current password',
                  value: currentPassword,
                  onChange: (event) => {
                    setCurrentPassword(event.target.value);
                    setPwErrors({});
                    setPwSaved(false);
                  },
                  error: pwErrors.current_password,
                },
                {
                  id: 'profile-new-password',
                  label: 'New password',
                  placeholder: 'At least 8 characters',
                  value: newPassword,
                  onChange: (event) => {
                    setNewPassword(event.target.value);
                    setPwErrors({});
                    setPwSaved(false);
                  },
                  error: pwErrors.password,
                },
                {
                  id: 'profile-confirm-password',
                  label: 'Confirm new password',
                  placeholder: 'Repeat your new password',
                  value: confirmPassword,
                  onChange: (event) => {
                    setConfirmPassword(event.target.value);
                    setPwErrors({});
                    setPwSaved(false);
                  },
                  error: pwErrors.password_confirmation,
                },
              ].map((field) => (
                <div key={field.id}>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor={field.id}>
                    {field.label}
                  </label>
                  <div className="relative">
                    <Icon
                      name="shield"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoComplete={field.id === 'profile-current-password' ? 'current-password' : 'new-password'}
                      className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-4 ${
                        field.error
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                          : 'border-slate-200/80 focus:border-indigo-300 focus:ring-indigo-500/10'
                      }`}
                      id={field.id}
                      onChange={field.onChange}
                      placeholder={field.placeholder}
                      type="password"
                      value={field.value}
                    />
                  </div>
                  {field.error && <p className="mt-1.5 text-xs font-medium text-rose-600">{field.error}</p>}
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                  disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
                  type="submit"
                >
                  {pwSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.2} />
                      Change password
                    </>
                  )}
                </button>
                {pwSaved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <Icon name="checkCircle" className="h-3.5 w-3.5" />
                    Password updated
                  </span>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                <Icon name={roleInfo.icon} className="h-[18px] w-[18px]" />
              </div>
              <RoleBadge role={role} />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">Role &amp; access</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{roleInfo.description}</p>
            <ul className="mt-4 space-y-2.5">
              {roleInfo.access.map((item) => (
                <li className="flex items-start gap-2 text-[11px] font-medium text-slate-600" key={item}>
                  <Icon name="checkCircle" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
              <Icon name="shield" className="h-[18px] w-[18px]" />
            </div>
            <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">Session security</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              You are signed in with a Sanctum bearer token stored securely on this device.
            </p>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600 transition-all duration-200 hover:border-rose-300 hover:bg-rose-100 active:scale-[0.99]"
              onClick={onLogout}
              type="button"
            >
              <Icon name="logout" className="h-4 w-4" />
              Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
