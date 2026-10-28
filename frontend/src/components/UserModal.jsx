import { useEffect, useState } from 'react';
import { ROLE_META } from '../roles';
import Icon from './Icons';
import RoleSelect from './RoleSelect';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'team_member',
};

const roleOptions = Object.entries(ROLE_META).map(([value, meta]) => ({
  value,
  label: value === 'team_member' ? 'Member' : meta.label,
  description: meta.scope,
}));

const fieldClass =
  'w-full rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saving, onClose]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined, message: undefined }));
  };

  const updateRole = (role) => {
    setForm((current) => ({ ...current, role }));
    setErrors((current) => ({ ...current, role: undefined, message: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const nextErrors = {};
    const email = form.email.trim().toLowerCase();

    if (!form.name.trim()) nextErrors.name = 'A full name is required.';
    if (!email) {
      nextErrors.email = 'An email address is required.';
    } else if (!emailPattern.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      nextErrors.password = 'A password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }
    if (!form.role) nextErrors.role = 'Choose an access level.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const result = await onSave({
      name: form.name.trim(),
      email,
      password: form.password,
      role: form.role,
    });

    if (result && !result.ok) {
      setErrors(result.errors ?? { message: 'Something went wrong while creating the user.' });
    }
  };

  return (
    <div
      aria-labelledby="add-user-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-6 backdrop-blur-md animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      role="dialog"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20 animate-modal-in">
        <div className="relative border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
              <Icon name="users" className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-slate-900" id="add-user-title">
                Add a new user
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Create an account and set their workspace access.
              </p>
            </div>
            <button
              aria-label="Close dialog"
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-90"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
            {errors.message && (
              <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {errors.message}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="new-user-name">
                Full name
              </label>
              <input
                autoComplete="name"
                autoFocus
                className={`${fieldClass} ${errors.name ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                id="new-user-name"
                onChange={updateField('name')}
                placeholder="e.g. Ayesha Khan"
                type="text"
                value={form.name}
              />
              {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="new-user-email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={`${fieldClass} ${errors.email ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                id="new-user-email"
                inputMode="email"
                onChange={updateField('email')}
                placeholder="name@company.com"
                type="email"
                value={form.email}
              />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="new-user-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className={`${fieldClass} pr-11 ${errors.password ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                    id="new-user-password"
                    onChange={updateField('password')}
                    placeholder="At least 8 characters"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-white hover:text-slate-700"
                    onClick={() => setShowPassword((current) => !current)}
                    tabIndex={-1}
                    type="button"
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4 w-4" />
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password}</p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-400">Minimum 8 characters.</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="new-user-role">
                  Access level
                </label>
                <RoleSelect
                  ariaLabel="Access level"
                  buttonClassName={`${fieldClass} flex w-full items-center justify-between gap-2 pr-3 text-left ${
                    errors.role ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''
                  }`}
                  id="new-user-role"
                  menuMinWidth={220}
                  onChange={updateRole}
                  options={roleOptions}
                  value={form.role}
                />
                {errors.role ? (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.role}</p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-400">Roles can be changed later.</p>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3.5 py-3 text-[11px] leading-relaxed text-indigo-700">
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
              Admins have full workspace access. Managers run their team projects. Members see only the work assigned to them.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button
              className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors duration-200 hover:bg-white hover:text-slate-900"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating…
                </>
              ) : (
                <>
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
                  Create user
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
