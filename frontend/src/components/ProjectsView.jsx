import { useState } from 'react';
import { invitationsApi, projectsApi } from '../api';
import Icon from './Icons';
import PageHeader from './PageHeader';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
};

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
};

function ProjectSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-5 h-4 w-40 animate-pulse rounded bg-slate-200/80" />
      <div className="mt-2.5 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
      <div className="mt-6 h-1 animate-pulse rounded-full bg-slate-100" />
    </div>
  );
}

export default function ProjectsView({ projects, loading, role, onProjectCreated }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitingId, setInvitingId] = useState(null);
  const [inviteMsg, setInviteMsg] = useState({});

  const totalTasks = projects.reduce((total, project) => total + (project.tasks_count ?? 0), 0);
  const completedTasks = projects.reduce((total, project) => total + (project.completed_tasks_count ?? 0), 0);
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAdmin = role === 'admin';
  const canCreate = isAdmin || role === 'manager';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await projectsApi.create({ name: name.trim(), description: description.trim() || null });
      if (onProjectCreated) {
        onProjectCreated(res.data.data);
      }
      setName('');
      setDescription('');
      setShowCreate(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (projectId) => {
    if (!inviteEmail.trim()) return;
    setInvitingId(projectId);
    setInviteMsg((m) => ({ ...m, [projectId]: '' }));
    try {
      await invitationsApi.invite(projectId, inviteEmail.trim());
      setInviteMsg((m) => ({ ...m, [projectId]: 'Invitation sent successfully.' }));
      setInviteEmail('');
    } catch (err) {
      setInviteMsg((m) => ({ ...m, [projectId]: err.response?.data?.message || 'Could not send invitation.' }));
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm">
              <Icon name="briefcase" className="h-3.5 w-3.5 text-slate-400" />
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
            </div>
            {canCreate && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95"
                onClick={() => setShowCreate((v) => !v)}
                type="button"
              >
                <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
                Create Project
              </button>
            )}
          </div>
        }
        description={
          isAdmin
            ? 'Every project across the workspace, with ownership and delivery progress.'
            : 'The projects you manage and the work moving through them.'
        }
        eyebrow="Portfolio"
        icon="briefcase"
        title={isAdmin ? 'All projects' : 'Team projects'}
      />

      {canCreate && showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
              <Icon name="plus" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">New project</h3>
              <p className="text-[11px] text-slate-500">Create a project and invite team members to collaborate.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Project title</label>
              <input
                className="w-full rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
                required
                value={name}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea
                className="w-full rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a short description for this project"
                rows={3}
                value={description}
              />
            </div>
          </div>
          {createError && <p className="mt-3 text-xs font-medium text-rose-600">{createError}</p>}
          <div className="mt-4 flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
              disabled={creating}
              type="submit"
            >
              {creating ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.2} />}
              Create project
            </button>
            <button
              className="rounded-lg px-4 py-2.5 text-[11px] font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setShowCreate(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: isAdmin ? 'Projects in workspace' : 'Projects in scope',
            value: projects.length,
            icon: 'briefcase',
            iconClass: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
            helper: 'Active portfolio',
          },
          {
            label: 'Tasks in portfolio',
            value: totalTasks,
            icon: 'tasks',
            iconClass: 'bg-sky-50 text-sky-600 ring-sky-100',
            helper: `${completedTasks} delivered`,
          },
          {
            label: 'Delivery progress',
            value: `${completionRate}%`,
            icon: 'chart',
            iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
            helper: 'Across all projects',
          },
        ].map((item) => (
          <div
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            key={item.label}
          >
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${item.iconClass}`}>
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-none tracking-tight text-slate-900">{item.value}</p>
              <p className="mt-1 truncate text-[11px] font-medium text-slate-500">{item.label}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">{item.helper}</p>
            </div>
          </div>
        ))}
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ProjectSkeleton key={index} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-slate-200/80 bg-white text-slate-400 shadow-sm">
            <Icon name="briefcase" className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">No projects in scope</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
            Projects will appear here once they are connected to your workspace.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const taskCount = project.tasks_count ?? 0;
            const completedCount = project.completed_tasks_count ?? 0;
            const completion = taskCount ? Math.round((completedCount / taskCount) * 100) : 0;
            const status = statusLabels[project.status] ? project.status : 'pending';

            return (
              <article
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                key={project.id}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-60" />

                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition-transform duration-200 group-hover:scale-105">
                    <Icon name="briefcase" className="h-[18px] w-[18px]" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusStyles[status]}`}
                  >
                    {statusLabels[status]}
                  </span>
                </div>

                <h3 className="mt-5 truncate text-[15px] font-semibold tracking-tight text-slate-900">{project.name}</h3>
                <p className="mt-1.5 line-clamp-2 min-h-10 text-[13px] leading-relaxed text-slate-500">
                  {project.description || 'No project description yet.'}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-[11px]">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-500">
                    <Icon name="layers" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{project.workspace?.name || 'Workspace'}</span>
                  </span>
                  {isAdmin && (
                    <span className="truncate font-medium text-slate-500">{project.workspace?.user?.name || 'Unassigned lead'}</span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span>
                      {completedCount} of {taskCount} {taskCount === 1 ? 'task' : 'tasks'} complete
                    </span>
                    <span className="text-indigo-600">{completion}%</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                {(canCreate || isAdmin) && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Invite team member</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        className="w-full rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[12px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        type="email"
                        value={invitingId === project.id ? inviteEmail : inviteEmail}
                      />
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
                        disabled={invitingId === project.id}
                        onClick={() => handleInvite(project.id)}
                        type="button"
                      >
                        {invitingId === project.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Icon name="mail" className="h-3.5 w-3.5" />
                        )}
                        Send invite
                      </button>
                    </div>
                    {inviteMsg[project.id] && (
                      <p className={`mt-2 text-[11px] font-medium ${inviteMsg[project.id].includes('success') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {inviteMsg[project.id]}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
