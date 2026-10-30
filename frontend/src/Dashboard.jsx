import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { invitationsApi, projectsApi, usersApi } from './api';
import Header from './components/Header';
import Icon from './components/Icons';
import PageHeader from './components/PageHeader';
import ProfileView from './components/ProfileView';
import ProjectsView from './components/ProjectsView';
import ReportsView from './components/ReportsView';
import Sidebar from './components/Sidebar';
import TaskModal, { ConfirmDialog } from './components/TaskModal';
import TaskTable from './components/TaskTable';
import UserModal from './components/UserModal';
import UsersView from './components/UsersView';
import RoleBadge from './components/RoleBadge';
import { getRoleMeta } from './roles';

function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') return false;
  return new Date(`${task.due_date.slice(0, 10)}T23:59:59`) < new Date();
}

const VIEW_LABELS = {
  dashboard: 'dashboard',
  tasks: 'tasks',
  projects: 'projects',
  users: 'users',
  settings: 'settings',
};

async function fetchDashboardData() {
  const userResponse = await api.get('/user');
  const user = userResponse.data;
  const canAssign = user.role === 'admin' || user.role === 'manager';
  const isAdmin = user.role === 'admin';
  const emptyResponse = { data: { data: [] } };

  const [tasksResponse, projectsResponse, assigneesResponse, usersResponse] = await Promise.all([
    api.get('/tasks'),
    api.get('/projects'),
    canAssign ? api.get('/assignees') : Promise.resolve(emptyResponse),
    isAdmin ? api.get('/users') : Promise.resolve(emptyResponse),
  ]);

  return {
    user,
    tasks: tasksResponse.data.data ?? [],
    projects: projectsResponse.data.data ?? [],
    assignees: assigneesResponse.data.data ?? [],
    users: usersResponse.data.data ?? [],
  };
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-5 h-8 w-16 animate-pulse rounded bg-slate-200/80" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-5 h-1 animate-pulse rounded-full bg-slate-100" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  iconClass,
  trend,
  trendClass,
  trendIcon = 'trend',
  percent,
  empty = false,
  emptyLabel = 'Nothing here yet',
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-70`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105 ${iconClass}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </div>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${trendClass}`}>
          <Icon name={trendIcon} className="h-3 w-3" strokeWidth={2.2} />
          {trend}
        </span>
      </div>
      <p className="mt-4 text-[28px] font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-[13px] font-medium text-slate-500">{label}</p>
      {empty ? (
        <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-100">
          <Icon name="inbox" className="h-3.5 w-3.5 text-slate-400" />
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${accent}`}
            style={{ width: `${Math.max(percent, percent > 0 ? 3 : 0)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [returnView, setReturnView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskView, setTaskView] = useState('table');
  const [toast, setToast] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationActionId, setInvitationActionId] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message, id: Date.now() });
  }, []);

  const forceLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    onLogout();
  }, [onLogout]);

  const handleApiError = useCallback(
    (err, fallback) => {
      if (err.response?.status === 401) {
        forceLogout();
        return;
      }

      showToast('error', err.response?.data?.message || fallback);
    },
    [forceLogout, showToast],
  );

  useEffect(() => {
    let active = true;

    fetchDashboardData()
      .then((data) => {
        if (!active) return;

        setUser(data.user);
        setTasks(data.tasks);
        setProjects(data.projects);
        setAssignees(data.assignees);
        setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;

        if (err.response?.status === 401) {
          forceLogout();
          return;
        }

        setError(err.response?.data?.message || 'We could not load your workspace. Please try again.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [forceLogout]);

  const handleRetry = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchDashboardData();
      setUser(data.user);
      setTasks(data.tasks);
      setProjects(data.projects);
      setAssignees(data.assignees);
      setUsers(data.users);
    } catch (err) {
      if (err.response?.status === 401) {
        forceLogout();
        return;
      }

      setError(err.response?.data?.message || 'We could not load your workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchPendingInvitations = useCallback(async () => {
    try {
      const response = await invitationsApi.pending();
      setPendingInvitations(response.data.data ?? []);
    } catch (err) {
      if (err.response?.status !== 401) {
        // Ignore non-auth errors silently for this non-blocking feature
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      fetchPendingInvitations();
    }
  }, [loading, user, fetchPendingInvitations]);

  const handleAcceptInvitation = async (invitation) => {
    setInvitationActionId(invitation.id);
    try {
      await invitationsApi.accept(invitation.id);
      setPendingInvitations((current) => current.filter((item) => item.id !== invitation.id));
      showToast('success', `You joined ${invitation.project?.name || 'the project'}.`);
      // Reload dashboard data to reflect membership
      const data = await fetchDashboardData();
      setTasks(data.tasks);
      setProjects(data.projects);
      setAssignees(data.assignees);
      setUsers(data.users);
    } catch (err) {
      handleApiError(err, 'Could not accept the invitation.');
    } finally {
      setInvitationActionId(null);
    }
  };

  const handleRejectInvitation = async (invitation) => {
    setInvitationActionId(invitation.id);
    try {
      await invitationsApi.reject(invitation.id);
      setPendingInvitations((current) => current.filter((item) => item.id !== invitation.id));
      showToast('success', 'Invitation rejected.');
    } catch (err) {
      handleApiError(err, 'Could not reject the invitation.');
    } finally {
      setInvitationActionId(null);
    }
  };

  const role = user?.role ?? 'team_member';
  const roleInfo = getRoleMeta(role);
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const canCreateTasks = isAdmin || isManager;
  const taskScopeLabel = isAdmin ? 'Total tasks' : isManager ? 'Team tasks' : 'Assigned tasks';

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
    const pending = tasks.filter((task) => task.status === 'pending').length;
    const overdue = tasks.filter(isOverdue).length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const createdThisWeek = tasks.filter((task) => new Date(task.created_at) >= weekAgo).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, overdue, createdThisWeek, completionRate };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description ?? '').toLowerCase().includes(query) ||
        (task.project?.name ?? '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const statCards = [
    {
      label: taskScopeLabel,
      value: stats.total.toLocaleString(),
      icon: 'layers',
      accent: 'from-indigo-500 to-violet-600',
      iconClass: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
      trend: stats.createdThisWeek > 0 ? `+${stats.createdThisWeek} this week` : 'All time',
      trendClass: 'bg-indigo-50 text-indigo-600',
      percent: stats.total ? 100 : 0,
      empty: stats.total === 0,
      emptyLabel: 'No tasks have been created yet',
    },
    {
      label: 'In progress',
      value: stats.inProgress.toLocaleString(),
      icon: 'clock',
      accent: 'from-sky-500 to-blue-600',
      iconClass: 'bg-sky-50 text-sky-600 ring-sky-100',
      trend: stats.total ? `${Math.round((stats.inProgress / stats.total) * 100)}% of workload` : '0% of workload',
      trendClass: 'bg-sky-50 text-sky-600',
      percent: stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0,
      empty: stats.inProgress === 0,
      emptyLabel: 'Nothing is in progress right now',
    },
    {
      label: 'Completed',
      value: stats.completed.toLocaleString(),
      icon: 'checkCircle',
      accent: 'from-emerald-500 to-teal-500',
      iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      trend: `${stats.completionRate}% completion`,
      trendClass: 'bg-emerald-50 text-emerald-600',
      percent: stats.completionRate,
      empty: stats.completed === 0,
      emptyLabel: 'No tasks completed yet',
    },
    {
      label: 'Pending',
      value: stats.pending.toLocaleString(),
      icon: 'alert',
      accent: 'from-amber-400 to-orange-500',
      iconClass: 'bg-amber-50 text-amber-600 ring-amber-100',
      trend: stats.overdue > 0 ? `${stats.overdue} overdue` : 'On schedule',
      trendClass: stats.overdue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
      trendIcon: stats.overdue > 0 ? 'alert' : 'check',
      percent: stats.total ? Math.round((stats.pending / stats.total) * 100) : 0,
      empty: stats.pending === 0,
      emptyLabel: 'Nothing pending — you are clear',
    },
  ];

  const openCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
    setEditingTask(null);
  }, [saving]);

  const handleSaveTask = async (payload) => {
    setSaving(true);

    try {
      if (editingTask) {
        const response = await api.put(`/tasks/${editingTask.id}`, payload);
        const updated = response.data.data;
        setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
        showToast('success', 'Task updated successfully.');
      } else {
        const response = await api.post('/tasks', payload);
        const created = response.data.data;
        setTasks((current) => [created, ...current]);
        showToast('success', 'Task created successfully.');
      }

      setModalOpen(false);
      setEditingTask(null);
      return { ok: true };
    } catch (err) {
      if (err.response?.status === 401) {
        forceLogout();
        return { ok: false };
      }

      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        return {
          ok: false,
          errors: Object.fromEntries(
            Object.entries(validationErrors).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages[0] : messages,
            ]),
          ),
        };
      }

      return {
        ok: false,
        errors: { message: err.response?.data?.message || 'Something went wrong while saving the task.' },
      };
    } finally {
      setSaving(false);
    }
  };

  const handleSetTaskStatus = async (task, nextStatus) => {
    if (task.status === nextStatus) return;
    setUpdatingId(task.id);

    try {
      const response = await api.patch(`/tasks/${task.id}/status`, { status: nextStatus });
      const updated = response.data.data;
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        'success',
        nextStatus === 'completed' ? 'Task marked as completed.' : nextStatus === 'in_progress' ? 'Task moved to in progress.' : 'Task moved back to pending.',
      );
    } catch (err) {
      handleApiError(err, 'Could not update the task status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleComplete = (task) => {
    handleSetTaskStatus(task, task.status === 'completed' ? 'pending' : 'completed');
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setDeleting(true);

    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      setTasks((current) => current.filter((task) => task.id !== taskToDelete.id));
      setTaskToDelete(null);
      showToast('success', 'Task deleted successfully.');
    } catch (err) {
      handleApiError(err, 'Could not delete the task.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (member, nextRole) => {
    if (!isAdmin || member.id === user?.id || member.role === nextRole) return;

    setUpdatingUserId(member.id);

    try {
      const response = await api.patch(`/users/${member.id}/role`, { role: nextRole });
      const updated = response.data.data;

      setUsers((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setAssignees((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, role: updated.role } : item)),
      );
      showToast('success', `${updated.name}'s role was updated to ${getRoleMeta(updated.role).label}.`);
    } catch (err) {
      handleApiError(err, 'Could not update the user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (member) => {
    if (!isAdmin || member.id === user?.id) return;
    if (!window.confirm(`Delete ${member.name}? Their workspaces and memberships will be removed.`)) return;

    setUpdatingUserId(member.id);

    try {
      await usersApi.remove(member.id);
      setUsers((current) => current.filter((item) => item.id !== member.id));
      setAssignees((current) => current.filter((item) => item.id !== member.id));
      showToast('success', `${member.name} was deleted.`);
    } catch (err) {
      handleApiError(err, 'Could not delete the user.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteProject = async (project) => {
    if (!isAdmin && !isManager) return;
    if (!window.confirm(`Delete "${project.name}"? Its tasks and invitations will be removed.`)) return;

    setDeletingProjectId(project.id);

    try {
      await projectsApi.remove(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setTasks((current) => current.filter((task) => task.project_id !== project.id));
      showToast('success', `${project.name} was deleted.`);
    } catch (err) {
      handleApiError(err, 'Could not delete the project.');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleCreateUser = async (payload) => {
    setSavingUser(true);

    try {
      const response = await api.post('/users', payload);
      const created = response.data.data;

      setUsers((current) => {
        if (current.some((member) => member.id === created.id)) return current;
        return [...current, created];
      });
      setAssignees((current) => {
        if (current.some((member) => member.id === created.id)) return current;

        return [
          ...current,
          { id: created.id, name: created.name, email: created.email, role: created.role },
        ].sort((a, b) => a.name.localeCompare(b.name));
      });

      setUserModalOpen(false);
      showToast('success', `${created.name} was added to the workspace.`);

      return { ok: true, user: created };
    } catch (err) {
      if (err.response?.status === 401) {
        forceLogout();
        return { ok: false };
      }

      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        return {
          ok: false,
          errors: Object.fromEntries(
            Object.entries(validationErrors).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages[0] : messages,
            ]),
          ),
        };
      }

      return {
        ok: false,
        errors: { message: err.response?.data?.message || 'Could not create the user. Please try again.' },
      };
    } finally {
      setSavingUser(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // The local session is cleared below even if the revocation request fails.
    } finally {
      forceLogout();
    }
  };

  const handleNavigate = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  const openProfileView = () => {
    if (activeView !== 'profile') {
      setReturnView(activeView in VIEW_LABELS ? activeView : 'dashboard');
    }

    setActiveView('profile');
    setSidebarOpen(false);
  };

  const closeProfileView = () => {
    setActiveView(returnView || 'dashboard');
  };

  const syncUserAcrossState = (updatedUser) => {
    setUser((current) => ({ ...current, ...updatedUser }));
    setUsers((current) =>
      current.map((member) => (member.id === updatedUser.id ? { ...member, ...updatedUser } : member)),
    );
    setAssignees((current) =>
      current.map((member) => (member.id === updatedUser.id ? { ...member, ...updatedUser } : member)),
    );
    setProjects((current) =>
      current.map((project) =>
        project.workspace?.user?.id === updatedUser.id
          ? {
              ...project,
              workspace: {
                ...project.workspace,
                user: { ...project.workspace.user, name: updatedUser.name },
              },
            }
          : project,
      ),
    );
    setTasks((current) =>
      current.map((task) =>
        task.assignee?.id === updatedUser.id
          ? { ...task, assignee: { ...task.assignee, name: updatedUser.name } }
          : task,
      ),
    );
  };

  const handleSaveProfile = async (name) => {
    try {
      const response = await api.patch('/profile', { name });
      const updatedUser = response.data.data;

      syncUserAcrossState(updatedUser);
      showToast('success', 'Profile updated successfully.');

      return { ok: true, user: updatedUser };
    } catch (err) {
      if (err.response?.status === 401) {
        forceLogout();
        return { ok: false };
      }

      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        return {
          ok: false,
          errors: Object.fromEntries(
            Object.entries(validationErrors).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages[0] : messages,
            ]),
          ),
        };
      }

      return {
        ok: false,
        errors: { message: err.response?.data?.message || 'Could not update your profile. Please try again.' },
      };
    }
  };

  const handleUpdateEmail = async (email) => {
    try {
      const response = await api.patch('/profile', { name: user?.name ?? '', email });
      const updatedUser = response.data.data;

      syncUserAcrossState(updatedUser);
      showToast('success', 'Email address updated successfully.');

      return { ok: true, user: updatedUser };
    } catch (err) {
      if (err.response?.status === 401) {
        forceLogout();
        return { ok: false };
      }

      const validationErrors = err.response?.data?.errors;

      return {
        ok: false,
        errors: validationErrors
          ? Object.fromEntries(
              Object.entries(validationErrors).map(([field, messages]) => [
                field,
                Array.isArray(messages) ? messages[0] : messages,
              ]),
            )
          : { message: err.response?.data?.message || 'Could not update your email. Please try again.' },
      };
    }
  };

  const handleChangePassword = async ({ current_password, password, password_confirmation }) => {
    try {
      await api.patch('/profile/password', { current_password, password, password_confirmation });
      showToast('success', 'Password updated successfully.');

      return { ok: true };
    } catch (err) {
      if (err.response?.status === 401) {
        forceLogout();
        return { ok: false };
      }

      const validationErrors = err.response?.data?.errors;

      return {
        ok: false,
        errors: validationErrors
          ? Object.fromEntries(
              Object.entries(validationErrors).map(([field, messages]) => [
                field,
                Array.isArray(messages) ? messages[0] : messages,
              ]),
            )
          : { message: err.response?.data?.message || 'Could not update your password. Please try again.' },
      };
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed').sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date) : new Date('2100-01-01');
      const bDue = b.due_date ? new Date(b.due_date) : new Date('2100-01-01');

      if (aDue.getTime() !== bDue.getTime()) return aDue.getTime() - bDue.getTime();
      return a.title.localeCompare(b.title);
    }),
    [tasks],
  );

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.055),transparent_60%)]">
      <Sidebar
        activeView={activeView}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onProfile={openProfileView}
        open={sidebarOpen}
        taskCount={stats.total}
        user={user}
      />

      <div className="lg:pl-72">
        <Header
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={openProfileView}
          onViewTasks={() => handleNavigate('tasks')}
          pendingTasks={pendingTasks}
          user={user}
        />

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-2.5">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-[13px] font-medium text-rose-700">{error}</p>
              </div>
              <button
                className="shrink-0 rounded-lg bg-white px-3.5 py-2 text-[11px] font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 transition-colors duration-200 hover:bg-rose-100"
                onClick={handleRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <PageHeader
                action={
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm">
                    <Icon name="briefcase" className="h-3.5 w-3.5 text-slate-400" />
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    {stats.total} {stats.total === 1 ? 'task' : 'tasks'}
                  </div>
                }
                badge={<RoleBadge role={role} />}
                description={roleInfo.description}
                eyebrow="Overview"
                icon="dashboard"
                title={isAdmin ? 'Workspace pulse' : isManager ? 'Team pulse' : 'My pulse'}
              />

              {pendingInvitations.length > 0 && (
                <section className="rounded-2xl border border-indigo-200/80 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-indigo-100/80 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                        <Icon name="mail" className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-slate-900">Pending Invitations</h3>
                        <p className="text-[11px] text-slate-500">You have {pendingInvitations.length} project invitation{pendingInvitations.length === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                      {pendingInvitations.length}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingInvitations.map((invitation) => {
                      const isActing = invitationActionId === invitation.id;
                      return (
                        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={invitation.id}>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900">
                              {invitation.project?.name || 'Project'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Invited by {invitation.inviter?.name || 'a team member'} • {invitation.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
                              disabled={isActing}
                              onClick={() => handleAcceptInvitation(invitation)}
                              type="button"
                            >
                              {isActing ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              ) : (
                                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.2} />
                              )}
                              Accept
                            </button>
                            <button
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isActing}
                              onClick={() => handleRejectInvitation(invitation)}
                              type="button"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {loading ? statCards.map((card) => <StatSkeleton key={card.label} />) : statCards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </section>

              <TaskTable
                loading={loading}
                onAddTask={openCreateModal}
                onChangeStatus={handleSetTaskStatus}
                onClearFilters={clearFilters}
                onDelete={setTaskToDelete}
                onEdit={openEditModal}
                onSearchChange={setSearch}
                onStatusFilterChange={setStatusFilter}
                onToggleComplete={handleToggleComplete}
                onViewChange={setTaskView}
                search={search}
                statusFilter={statusFilter}
                taskView={taskView}
                tasks={filteredTasks}
                updatingId={updatingId}
                canCreateTasks={canCreateTasks}
              />
            </div>
          )}

          {activeView === 'tasks' && (            <div className="space-y-6">
              <PageHeader
                action={
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm">
                    <span className="grid h-5 min-w-5 place-items-center rounded-md bg-indigo-50 px-1 text-[10px] font-semibold text-indigo-600">
                      {filteredTasks.length}
                    </span>
                    {filteredTasks.length === 1 ? 'task' : 'tasks'} in view
                  </div>
                }
                badge={<RoleBadge role={role} />}
                description={
                  isAdmin
                    ? 'Every task across the workspace, ready to review and prioritize.'
                    : isManager
                      ? 'Track your team projects and the tasks assigned across them.'
                      : 'Everything assigned to you, with the status controls you need.'
                }
                eyebrow="Task workspace"
                icon="tasks"
                title={isAdmin ? 'All workspace tasks' : isManager ? 'Team task board' : 'My assigned work'}
              />

              <TaskTable
                loading={loading}
                onAddTask={openCreateModal}
                onChangeStatus={handleSetTaskStatus}
                onClearFilters={clearFilters}
                onDelete={setTaskToDelete}
                onEdit={openEditModal}
                onSearchChange={setSearch}
                onStatusFilterChange={setStatusFilter}
                onToggleComplete={handleToggleComplete}
                onViewChange={setTaskView}
                search={search}
                statusFilter={statusFilter}
                taskView={taskView}
                tasks={filteredTasks}
                updatingId={updatingId}
                canCreateTasks={canCreateTasks}
              />
            </div>
          )}

          {activeView === 'reports' && (
            <ReportsView loading={loading} tasks={tasks} />
          )}

          {activeView === 'projects' && (isAdmin || isManager) && (
            <ProjectsView
              deletingProjectId={deletingProjectId}
              loading={loading}
              onDeleteProject={handleDeleteProject}
              onProjectCreated={(project) => {
                setProjects((current) => [project, ...current]);
              }}
              projects={projects}
              role={role}
            />
          )}

          {activeView === 'users' && isAdmin && (
            <UsersView
              currentUserId={user?.id}
              loading={loading}
              onAddUser={() => setUserModalOpen(true)}
              onDeleteUser={handleDeleteUser}
              onRoleChange={handleRoleChange}
              updatingId={updatingUserId}
              users={users}
            />
          )}

          {activeView === 'profile' && (
            <ProfileView
              backLabel={VIEW_LABELS[returnView] ?? 'dashboard'}
              key={user?.id ?? 'profile-loading'}
              onChangePassword={handleChangePassword}
              onBack={closeProfileView}
              onLogout={handleLogout}
              onSave={handleSaveProfile}
              onUpdateEmail={handleUpdateEmail}
              projectsCount={projects.length}
              role={role}
              roleInfo={roleInfo}
              stats={stats}
              user={user}
            />
          )}

          {activeView === 'settings' && (
            <div className="space-y-6">
              <PageHeader
                action={
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md active:scale-95"
                    onClick={openProfileView}
                    type="button"
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                    Edit profile
                  </button>
                }
                description="Manage your account identity, workspace access, and active session."
                eyebrow="Account"
                icon="settings"
                title="Settings & security"
              />

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="relative h-20 bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_75%_20%,rgba(129,140,248,0.35),transparent_45%)]" />
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                    <div className="px-6 pb-6">
                      <div className="-mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-xl font-semibold text-white shadow-lg shadow-violet-500/20 ring-4 ring-white">
                          {initialsOf(user?.name) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                              {user?.name || 'Loading profile…'}
                            </h3>
                            <RoleBadge role={role} size="md" />
                          </div>
                          <p className="mt-0.5 truncate text-[13px] text-slate-500">{user?.email || 'Fetching account details'}</p>
                        </div>
                        <button
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:scale-95"
                          onClick={openProfileView}
                          type="button"
                        >
                          <Icon name="pencil" className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {[
                          { label: 'Full name', value: user?.name || '—', icon: 'user' },
                          { label: 'Email address', value: user?.email || '—', icon: 'mail' },
                          { label: 'Access level', value: roleInfo.label, icon: roleInfo.icon },
                          {
                            label: 'Member since',
                            value: user?.created_at
                              ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.created_at))
                              : '—',
                            icon: 'calendar',
                          },
                        ].map((item) => (
                          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5" key={item.label}>
                            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              <Icon name={item.icon} className="h-3 w-3" />
                              {item.label}
                            </div>
                            <p className="mt-1.5 truncate text-[13px] font-semibold text-slate-800">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-800">
                          <Icon name={roleInfo.icon} className="h-[18px] w-[18px]" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-slate-900">Role &amp; access</h3>
                          <p className="mt-0.5 max-w-md text-[13px] leading-relaxed text-slate-500">
                            Your current role is {roleInfo.label} with {roleInfo.scope.toLowerCase()}.
                          </p>
                        </div>
                      </div>
                      <RoleBadge role={role} />
                    </div>
                    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {roleInfo.access.map((item) => (
                        <li
                          className="flex items-start gap-2 rounded-lg bg-slate-50/70 px-3 py-2.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-100"
                          key={item}
                        >
                          <Icon name="checkCircle" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                      <Icon name="shield" className="h-[18px] w-[18px]" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">Session security</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                      You are signed in with a Sanctum bearer token stored securely on this device.
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Current session is active
                    </div>
                    <button
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600 transition-all duration-200 hover:border-rose-300 hover:bg-rose-100 active:scale-[0.99]"
                      onClick={handleLogout}
                      type="button"
                    >
                      <Icon name="logout" className="h-4 w-4" />
                      Sign out
                    </button>
                  </section>

                  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
                        <Icon name="chart" className="h-[18px] w-[18px]" />
                      </div>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live</span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">Workspace snapshot</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: 'Projects', value: projects.length, tone: 'text-slate-900' },
                        { label: 'Total tasks', value: stats.total, tone: 'text-slate-900' },
                        { label: 'Completed', value: stats.completed, tone: 'text-emerald-600' },
                        { label: 'Completion', value: `${stats.completionRate}%`, tone: 'text-indigo-600' },
                      ].map((item) => (
                        <div className="rounded-lg bg-slate-50/70 p-3 ring-1 ring-inset ring-slate-100" key={item.label}>
                          <p className={`text-lg font-semibold tracking-tight ${item.tone}`}>{item.value}</p>
                          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    {stats.total === 0 && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-[11px] font-medium text-slate-500">
                        <Icon name="inbox" className="h-3.5 w-3.5 text-slate-400" />
                        No task activity in this workspace yet.
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-[11px]">
                        <span className="font-medium text-indigo-700">Team members</span>
                        <span className="font-semibold text-indigo-800">{users.length}</span>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <TaskModal
          assignees={assignees}
          currentUser={user}
          onClose={closeModal}
          onSave={handleSaveTask}
          projects={projects}
          saving={saving}
          task={editingTask}
        />
      )}

      {userModalOpen && (
        <UserModal
          onClose={() => {
            if (!savingUser) setUserModalOpen(false);
          }}
          onSave={handleCreateUser}
          saving={savingUser}
        />
      )}

      <ConfirmDialog
        deleting={deleting}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        task={taskToDelete}
      />

      {toast && (
        <div aria-live="polite" className="fixed bottom-5 right-4 z-[80] sm:right-6" role="status">
          <div
            className={`flex items-start gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-2xl shadow-slate-950/10 animate-toast-in ${
              toast.type === 'error' ? 'border-rose-200' : 'border-emerald-200'
            }`}
          >
            <div
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                toast.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Icon name={toast.type === 'error' ? 'alert' : 'checkCircle'} className="h-4 w-4" />
            </div>
            <p className="max-w-[260px] pt-1 text-[13px] font-semibold text-slate-800">{toast.message}</p>
            <button
              aria-label="Dismiss notification"
              className="ml-2 rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-90"
              onClick={() => setToast(null)}
              type="button"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
