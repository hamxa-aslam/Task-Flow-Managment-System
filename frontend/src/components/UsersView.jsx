import Icon from './Icons';
import PageHeader from './PageHeader';
import RoleBadge from './RoleBadge';
import RoleSelect from './RoleSelect';
import { ROLE_META } from '../roles';

const roleOptions = Object.entries(ROLE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
  description: meta.scope,
}));

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
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(value));
}

function UserSkeleton() {
  return Array.from({ length: 3 }).map((_, index) => (
    <tr className="border-b border-slate-100/80 last:border-0" key={index}>
      <td className="px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <div>
            <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200/80" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" /></td>
      <td className="px-4 py-4"><div className="h-8 w-32 animate-pulse rounded-lg bg-slate-100" /></td>
      <td className="px-4 py-4"><div className="h-4 w-12 animate-pulse rounded bg-slate-100" /></td>
      <td className="px-4 py-4"><div className="h-4 w-12 animate-pulse rounded bg-slate-100" /></td>
      <td className="px-5 py-4 sm:px-6"><div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-100" /></td>
    </tr>
  ));
}

export default function UsersView({
  users,
  loading,
  currentUserId,
  onAddUser,
  onDeleteUser,
  onRoleChange,
  updatingId,
}) {
  const counts = Object.keys(ROLE_META).reduce((totals, role) => {
    totals[role] = users.filter((user) => user.role === role).length;
    return totals;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm">
              <Icon name="users" className="h-3.5 w-3.5 text-slate-400" />
              {users.length} {users.length === 1 ? 'member' : 'members'}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95"
              onClick={onAddUser}
              type="button"
            >
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
              Add User
            </button>
          </div>
        }
        description="Review access levels and adjust roles across the ProjectFlow workspace."
        eyebrow="Administration"
        icon="users"
        title="User management"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(ROLE_META).map(([role, meta]) => (
          <div
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            key={role}
          >
            <div className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ring-inset ${meta.light}`}>
              <Icon name={meta.icon} className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-semibold leading-none tracking-tight text-slate-900">{counts[role]}</p>
                <p className="text-[11px] font-medium text-slate-500">{meta.label}s</p>
              </div>
              <p className="mt-1 truncate text-[10px] text-slate-400">
                {counts[role] === 0 ? 'No members in this role yet' : meta.scope}
              </p>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900">Team directory</h3>
            <p className="mt-1 text-[13px] text-slate-500">Role changes take effect the next time that user loads the dashboard.</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {users.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-6">Member</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Access</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Change role</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Assigned</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspaces</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-6">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <UserSkeleton />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200/80 bg-white text-slate-400 shadow-sm">
                        <Icon name="users" className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">No team members found</h3>
                      <p className="mt-1.5 text-[13px] text-slate-500">Add the first user to start building your team.</p>
                      <button
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95"
                        onClick={onAddUser}
                        type="button"
                      >
                        <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
                        Add User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((member) => {
                  const isSelf = member.id === currentUserId;
                  const isUpdating = updatingId === member.id;

                  return (
                    <tr
                      className="border-b border-slate-100/80 transition-colors duration-200 last:border-0 hover:bg-slate-50/70"
                      key={member.id}
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {initialsOf(member.name)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-semibold text-slate-900">{member.name}</p>
                              {isSelf && (
                                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <RoleSelect
                            ariaLabel={`Change role for ${member.name}`}
                            buttonClassName="h-8 min-w-[118px] rounded-lg border border-slate-200/80 bg-white px-2.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/40"
                            disabled={isSelf || isUpdating}
                            menuMinWidth={210}
                            onChange={(role) => onRoleChange(member, role)}
                            options={roleOptions}
                            title={
                              isSelf
                                ? 'You cannot change your own role'
                                : `Change ${member.name}'s role`
                            }
                            value={member.role}
                          />
                          {isUpdating && (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <Icon name="tasks" className="h-3.5 w-3.5 text-slate-400" />
                          {member.assigned_tasks_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <Icon name="layers" className="h-3.5 w-3.5 text-slate-400" />
                          {member.workspaces_count ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[11px] font-medium text-slate-500">
                            {formatJoined(member.created_at)}
                          </span>
                          {onDeleteUser && (
                            <button
                              aria-label={`Delete ${member.name}`}
                              className={`grid h-7 w-7 place-items-center rounded-md transition-all duration-200 active:scale-90 ${
                                isSelf
                                  ? 'cursor-not-allowed text-slate-300'
                                  : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                              }`}
                              disabled={isSelf || isUpdating}
                              onClick={() => onDeleteUser(member)}
                              title={isSelf ? 'You cannot delete your own account' : `Delete ${member.name}`}
                              type="button"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
