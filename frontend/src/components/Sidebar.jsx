import { useEffect } from 'react';
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

export default function Sidebar({
  activeView,
  onNavigate,
  open,
  onClose,
  onLogout,
  onProfile,
  user,
  taskCount,
}) {
  const role = user?.role ?? 'team_member';
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      id: 'tasks',
      label: role === 'admin' ? 'All tasks' : role === 'manager' ? 'Team tasks' : 'My tasks',
      icon: 'tasks',
    },
    ...(role === 'admin' || role === 'manager'
      ? [{ id: 'projects', label: 'Projects', icon: 'briefcase' }]
      : []),
    ...(role === 'admin' ? [{ id: 'users', label: 'Users', icon: 'users' }] : []),
    { id: 'reports', label: 'Reports', icon: 'chart' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-72 max-w-[86vw] flex-col overflow-hidden border-r border-white/[0.06] bg-[#09090b] bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.13),transparent_45%)] shadow-2xl shadow-slate-950/40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-indigo-400/25 to-transparent" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-5 py-[18px]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">
            <Icon name="layers" className="h-5 w-5 text-white" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold tracking-tight text-white">ProjectFlow</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-500">Project OS</p>
          </div>
          <button
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-white active:scale-95 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <nav
            aria-label="Main navigation"
            className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-5"
          >
            <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Workspace
            </p>

            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeView === item.id;

                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ease-in-out active:scale-[0.99] ${
                      isActive
                        ? 'bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/[0.08]'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    type="button"
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_10px_rgba(129,140,248,0.7)]" />
                    )}
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : 'bg-transparent text-slate-500 group-hover:text-slate-300'
                      }`}
                    >
                      <Icon name={item.icon} className="h-[17px] w-[17px]" />
                    </span>
                    <span>{item.label}</span>
                    {item.id === 'tasks' && taskCount > 0 && (
                      <span
                        className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-200 ${
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-200'
                            : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {taskCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Icon
                  name={role === 'admin' ? 'shield' : role === 'manager' ? 'users' : 'checkCircle'}
                  className="h-3.5 w-3.5 text-indigo-400"
                />
                {role === 'admin' ? 'Administrator' : role === 'manager' ? 'Manager access' : 'Member access'}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                {role === 'admin'
                  ? 'Full workspace visibility and control.'
                  : role === 'manager'
                    ? 'Your team projects and assignments.'
                    : 'Your assigned work, kept in focus.'}
              </p>
            </div>
          </nav>

          <div className="relative shrink-0 border-t border-white/[0.06] p-3.5">
            <button
              aria-label="Open your profile"
              className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-2.5 text-left transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] active:scale-[0.99]"
              onClick={onProfile}
              type="button"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 text-xs font-bold text-white shadow-lg shadow-violet-500/20 ring-2 ring-white/10">
                {initialsOf(user?.name) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">{user?.name || 'Loading…'}</p>
                <p className="truncate text-[11px] text-slate-500">{user?.email || 'Fetching account'}</p>
              </div>
              <Icon
                name="chevronRight"
                className="h-4 w-4 shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-slate-300"
              />
            </button>

            <div className="mt-3 flex items-center justify-between gap-2 px-1">
              <RoleBadge role={role} variant="dark" />
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Online
              </span>
            </div>

            <button
              className="group mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-transparent px-4 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300 active:scale-[0.99]"
              onClick={onLogout}
              type="button"
            >
              <Icon name="logout" className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
