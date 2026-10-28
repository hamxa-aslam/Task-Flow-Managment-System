import { useEffect, useRef, useState } from 'react';
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

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDue(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  );
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') return false;
  return new Date(`${task.due_date.slice(0, 10)}T23:59:59`) < new Date();
}

export default function Header({
  user,
  pendingTasks = [],
  onMenuClick,
  onProfileClick,
  onLogout,
  onViewTasks,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const menusRef = useRef(null);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const alertCount = pendingTasks.length;
  const recentAlerts = pendingTasks.slice(0, 4);
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menusRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md active:scale-95 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Icon name="menu" className="h-[18px] w-[18px]" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1 w-1 rounded-full bg-indigo-500" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {today}
            </p>
          </div>
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-slate-900 sm:mt-0.5 sm:text-lg">
            {greeting()}, {firstName}
          </h1>
        </div>

        <div className="relative flex shrink-0 items-center gap-2 sm:gap-3" ref={menusRef}>
          <button
            aria-controls="notification-menu"
            aria-expanded={openMenu === 'notifications'}
            aria-haspopup="true"
            aria-label={`${alertCount} open ${alertCount === 1 ? 'task' : 'tasks'}`}
            className={`relative grid h-9 w-9 place-items-center rounded-lg border transition-all duration-200 sm:h-10 sm:w-10 ${
              openMenu === 'notifications'
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm'
                : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-900 hover:shadow-md'
            } active:scale-95`}
            onClick={() => toggleMenu('notifications')}
            type="button"
          >
            <Icon name="bell" className="h-[18px] w-[18px]" />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {openMenu === 'notifications' && (
            <div
              className="animate-menu-in absolute right-0 top-full z-50 mt-3 w-[21rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/10"
              id="notification-menu"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold tracking-tight text-slate-900">Notifications</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {alertCount > 0
                      ? `${alertCount} open ${alertCount === 1 ? 'task needs' : 'tasks need'} your attention`
                      : 'Nothing needs your attention'}
                  </p>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/15">
                  {alertCount}
                </span>
              </div>

              {recentAlerts.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-9 text-center">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200/80 bg-white text-emerald-600 shadow-sm">
                    <Icon name="checkCircle" className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    No open tasks need attention right now.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto py-1">
                  {recentAlerts.map((task) => {
                    const overdue = isOverdue(task);

                    return (
                      <div
                        className="flex gap-3 px-4 py-3 transition-colors duration-200 hover:bg-slate-50"
                        key={task.id}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4 ${
                            overdue
                              ? 'bg-rose-500 ring-rose-100'
                              : 'bg-amber-500 ring-amber-100'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{task.title}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="truncate">{task.project?.name || 'General'}</span>
                            <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                            <span className={overdue ? 'font-semibold text-rose-600' : ''}>
                              {overdue ? 'Overdue' : `Due ${formatDue(task.due_date)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="flex w-full items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  setOpenMenu(null);
                  onViewTasks();
                }}
                type="button"
              >
                Open task workspace
                <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="hidden h-7 w-px bg-slate-200/80 sm:block" />

          <button
            aria-controls="profile-menu"
            aria-expanded={openMenu === 'profile'}
            aria-haspopup="menu"
            className={`group flex items-center gap-2 rounded-lg border p-1 text-left transition-all duration-200 sm:gap-2.5 sm:pr-2 ${
              openMenu === 'profile'
                ? 'border-slate-200 bg-slate-50 shadow-sm'
                : 'border-transparent hover:border-slate-200/80 hover:bg-slate-50'
            }`}
            onClick={() => toggleMenu('profile')}
            type="button"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white sm:h-9 sm:w-9 sm:text-xs">
              {initialsOf(user?.name) || 'U'}
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2">
                <p className="max-w-[130px] truncate text-[13px] font-semibold text-slate-900">
                  {user?.name || 'Loading…'}
                </p>
                <RoleBadge className="shrink-0" role={user?.role} />
              </div>
              <p className="max-w-[170px] truncate text-[11px] text-slate-500">
                {user?.email || 'Fetching account'}
              </p>
            </div>
            <Icon
              name="chevronDown"
              className={`hidden h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 sm:block ${
                openMenu === 'profile' ? 'rotate-180 text-slate-600' : 'group-hover:translate-y-0.5'
              }`}
            />
          </button>

          {openMenu === 'profile' && (
            <div
              className="animate-menu-in absolute right-0 top-full z-50 mt-3 w-52 origin-top-right overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-2xl shadow-slate-950/10"
              id="profile-menu"
              role="menu"
              aria-label="Account menu"
            >
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  setOpenMenu(null);
                  onProfileClick();
                }}
                role="menuitem"
                type="button"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="user" className="h-4 w-4" />
                </span>
                Profile
              </button>
              <div className="mx-2 my-1 h-px bg-slate-100" />
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-rose-600 transition-colors duration-200 hover:bg-rose-50"
                onClick={() => {
                  setOpenMenu(null);
                  onLogout();
                }}
                role="menuitem"
                type="button"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500">
                  <Icon name="logout" className="h-4 w-4" />
                </span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
