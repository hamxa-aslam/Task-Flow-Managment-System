import { useState } from 'react';
import Icon from './Icons';

const statusStyles = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'In progress',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
    dot: 'bg-indigo-500',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    dot: 'bg-emerald-500',
  },
};

const viewOptions = [
  { id: 'table', label: 'Table', icon: 'tableView' },
  { id: 'kanban', label: 'Kanban', icon: 'board' },
];

const kanbanColumns = [
  {
    id: 'pending',
    label: 'To Do',
    accent: 'text-amber-600',
    ring: 'ring-amber-200/70',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    accent: 'text-indigo-600',
    ring: 'ring-indigo-200/70',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  },
  {
    id: 'completed',
    label: 'Done',
    accent: 'text-emerald-600',
    ring: 'ring-emerald-200/70',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  },
];

const priorityStyles = {
  high: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  normal: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  low: 'bg-slate-50 text-slate-600 ring-slate-200/80',
};

/**
 * Derives a client-side priority from the due date urgency.
 * (Tasks have no priority column; this keeps the badge informative without touching the backend.)
 */
function priorityOf(task) {
  if (task.status === 'completed' || !task.due_date) {
    return { key: 'low', label: 'Low' };
  }

  const due = new Date(`${task.due_date.slice(0, 10)}T23:59:59`);
  const days = Math.ceil((due - Date.now()) / 86_400_000);

  if (days < 1) return { key: 'high', label: 'High' };
  if (days <= 3) return { key: 'medium', label: 'Medium' };
  if (days <= 7) return { key: 'normal', label: 'Normal' };
  return { key: 'low', label: 'Low' };
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  );
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') return false;
  const due = new Date(`${task.due_date.slice(0, 10)}T23:59:59`);
  return due < new Date();
}

function StatusBadge({ status }) {
  const style = statusStyles[status] ?? statusStyles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr className="border-b border-slate-100/80 last:border-0" key={index}>
      <td className="px-5 py-4 sm:px-6">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200/80" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
      </td>
      <td className="px-4 py-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-4 py-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
        </div>
      </td>
      <td className="px-5 py-4 sm:px-6">
        <div className="ml-auto h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
      </td>
    </tr>
  ));
}

export default function TaskTable({
  tasks,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  onAddTask,
  onEdit,
  onDelete,
  onToggleComplete,
  onChangeStatus,
  taskView = 'table',
  onViewChange,
  updatingId,
  canCreateTasks,
}) {
  const hasFilters = search.trim() !== '' || statusFilter !== 'all';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <Icon name="tasks" className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Tasks</h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {loading ? '—' : tasks.length}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Track progress and keep your work moving forward.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-9 w-full rounded-lg border border-slate-200/80 bg-white pl-9 pr-3 text-[13px] text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 sm:w-60"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search tasks…"
              type="search"
              value={search}
            />
          </div>

          {onViewChange && (
            <div
              aria-label="Task view"
              className="flex h-9 items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-50 p-0.5 shadow-sm"
              role="group"
            >
              {viewOptions.map((option) => {
                const isActive = taskView === option.id;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    key={option.id}
                    onClick={() => onViewChange(option.id)}
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" name={option.icon} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {canCreateTasks && (
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md hover:shadow-indigo-500/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-95"
              onClick={onAddTask}
              type="button"
            >
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
              Add Task
            </button>
          )}
        </div>
      </div>

      {taskView !== 'kanban' && (
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 py-2.5 sm:px-6">
        {filters.map((filter) => {
          const isActive = statusFilter === filter.id;

          return (
            <button
              aria-pressed={isActive}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/60'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              key={filter.id}
              onClick={() => onStatusFilterChange(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          );
        })}
        {hasFilters && (
          <button
            className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClearFilters}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>
      )}

      {taskView === 'kanban' ? (
        <KanbanBoard
          canCreateTasks={canCreateTasks}
          hasFilters={hasFilters}
          loading={loading}
          onAddTask={onAddTask}
          onClearFilters={onClearFilters}
          onChangeStatus={onChangeStatus}
          onDelete={onDelete}
          onEdit={onEdit}
          statusFilter={statusFilter}
          tasks={tasks}
          updatingId={updatingId}
        />
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-6">
                Task
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Project
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Due date
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Assignee
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200/80 bg-white text-slate-400 shadow-sm">
                      <Icon name="inbox" className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">
                      {hasFilters
                        ? 'No matching tasks'
                        : canCreateTasks
                          ? 'Your task board is clear'
                          : 'No tasks assigned yet'}
                    </h3>
                    <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
                      {hasFilters
                        ? 'Try adjusting your search or filters to find what you are looking for.'
                        : canCreateTasks
                          ? 'Create your first task and start turning plans into progress.'
                          : 'When a manager assigns work to you, it will appear here.'}
                    </p>
                    {(hasFilters || canCreateTasks) && (
                      <button
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:scale-95"
                        onClick={hasFilters ? onClearFilters : onAddTask}
                        type="button"
                      >
                        <Icon name={hasFilters ? 'close' : 'plus'} className="h-4 w-4" />
                        {hasFilters ? 'Clear filters' : 'Add your first task'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const overdue = isOverdue(task);
                const isCompleted = task.status === 'completed';
                const isUpdating = updatingId === task.id;

                return (
                  <tr
                    className="group border-b border-slate-100/80 transition-colors duration-200 last:border-0 hover:bg-slate-50/70"
                    key={task.id}
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        {task.can_update_status && (
                          <button
                            aria-label={isCompleted ? `Reopen ${task.title}` : `Complete ${task.title}`}
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all duration-200 active:scale-90 ${
                              isCompleted
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                            } ${isUpdating ? 'cursor-wait opacity-60' : ''}`}
                            disabled={isUpdating}
                            onClick={() => onToggleComplete(task)}
                            type="button"
                          >
                            {isUpdating ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />
                            )}
                          </button>
                        )}
                        <div className="min-w-0">
                          <p
                            className={`truncate text-[13px] font-semibold transition-colors duration-200 ${
                              isCompleted
                                ? 'text-slate-500 line-through decoration-slate-300'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-0.5 max-w-[280px] truncate text-[11px] text-slate-400">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/80">
                        <Icon name="briefcase" className="h-3 w-3 text-slate-400" />
                        <span className="max-w-[130px] truncate">{task.project?.name || 'General'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          overdue ? 'text-rose-600' : 'text-slate-500'
                        }`}
                        title={overdue ? 'Overdue' : undefined}
                      >
                        <Icon name="calendar" className="h-3.5 w-3.5" />
                        {formatDate(task.due_date)}
                        {overdue && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/15">
                            Overdue
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[9px] font-bold text-white ring-2 ring-white">
                            {initialsOf(task.assignee.name)}
                          </span>
                          <span className="max-w-[110px] truncate text-[11px] font-medium text-slate-600">
                            {task.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center justify-end gap-0.5">
                        {task.can_update_status && (
                          <button
                            aria-label={isCompleted ? 'Reopen task' : 'Mark task complete'}
                            className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-90"
                            disabled={isUpdating}
                            onClick={() => onToggleComplete(task)}
                            title={isCompleted ? 'Reopen task' : 'Mark complete'}
                            type="button"
                          >
                            <Icon name={isCompleted ? 'reopen' : 'checkCircle'} className="h-4 w-4" />
                          </button>
                        )}
                        {task.can_manage && (
                          <>
                            <button
                              aria-label="Edit task"
                              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90"
                              onClick={() => onEdit(task)}
                              title="Edit task"
                              type="button"
                            >
                              <Icon name="pencil" className="h-4 w-4" />
                            </button>
                            <button
                              aria-label="Delete task"
                              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                              onClick={() => onDelete(task)}
                              title="Delete task"
                              type="button"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {!task.can_update_status && !task.can_manage && (
                          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            View only
                          </span>
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
      )}
    </section>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
      {kanbanColumns.map((column) => (
        <div className="rounded-2xl bg-slate-50/80 ring-1 ring-inset ring-slate-100" key={column.id}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200/80" />
            <div className="h-5 w-8 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="space-y-3 p-3">
            <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanEmpty({ hasFilters, canCreateTasks, onClearFilters, onAddTask }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200/80 bg-white text-slate-400 shadow-sm">
        <Icon name="inbox" className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-slate-900">
        {hasFilters ? 'No matching tasks' : canCreateTasks ? 'Your board is clear' : 'No tasks assigned yet'}
      </h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
        {hasFilters
          ? 'Try adjusting your search or filters to find what you are looking for.'
          : canCreateTasks
            ? 'Create your first task and it will appear on the board.'
            : 'When a manager assigns work to you, it will appear here.'}
      </p>
      {(hasFilters || canCreateTasks) && (
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:scale-95"
          onClick={hasFilters ? onClearFilters : onAddTask}
          type="button"
        >
          <Icon name={hasFilters ? 'close' : 'plus'} className="h-4 w-4" />
          {hasFilters ? 'Clear filters' : 'Add your first task'}
        </button>
      )}
    </div>
  );
}

function KanbanCard({
  task,
  onChangeStatus,
  onEdit,
  onDelete,
  updatingId,
  onDragStart,
  isDragging,
}) {
  const overdue = isOverdue(task);
  const isCompleted = task.status === 'completed';
  const isUpdating = updatingId === task.id;
  const priority = priorityOf(task);
  const canMove = task.can_update_status && onChangeStatus;
  const canManage = task.can_manage && (onEdit || onDelete);

  return (
    <article
      className={`group rounded-xl border bg-white p-3.5 shadow-sm ring-1 ring-inset transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md ${
        isDragging
          ? 'cursor-grabbing border-indigo-300 opacity-40 ring-indigo-200/60'
          : 'border-slate-200/80 ring-transparent hover:ring-slate-200/60'
      } ${isUpdating ? 'cursor-wait opacity-70' : ''}`}
      draggable={canMove && !isUpdating}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', String(task.id));
        event.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(task.id);
      }}
      onDragEnd={(event) => {
        event.dataTransfer.clearData();
        if (onDragStart) onDragStart(null);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[13px] font-semibold leading-snug text-slate-900">
          <span className={`line-clamp-2 ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : ''}`}>
            {task.title}
          </span>
        </h4>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${priorityStyles[priority.key]}`}
        >
          {priority.label}
        </span>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{task.description}</p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/80">
          <Icon name="briefcase" className="h-3 w-3 text-slate-400" />
          <span className="max-w-[110px] truncate">{task.project?.name || 'General'}</span>
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium ${overdue ? 'text-rose-600' : 'text-slate-500'}`}
        >
          <Icon name="calendar" className="h-3.5 w-3.5" />
          {formatDate(task.due_date)}
          {overdue && (
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/15">
              Overdue
            </span>
          )}
        </span>

        {task.assignee ? (
          <span
            className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[9px] font-bold text-white ring-2 ring-white"
            title={task.assignee.name}
          >
            {initialsOf(task.assignee.name)}
          </span>
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-slate-300 text-slate-300" title="Unassigned">
            <Icon name="user" className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {(canMove || canManage || task.can_update_status) && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
          {(task.can_update_status || canManage) && (
            <select
              aria-label={`Change status for ${task.title}`}
              className="min-w-0 flex-1 cursor-pointer appearance-none rounded-md bg-transparent py-1 pr-5 text-[11px] font-semibold text-slate-600 outline-none transition-colors duration-200 hover:text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
              disabled={isUpdating}
              onChange={(event) => onChangeStatus?.(task, event.target.value)}
              value={task.status}
            >
              {kanbanColumns.map((statusColumn) => (
                <option key={statusColumn.id} value={statusColumn.id}>
                  {statusColumn.label}
                </option>
              ))}
            </select>
          )}
          {canManage && (
            <div className="flex shrink-0 items-center gap-0.5">
              {onEdit && (
                <button
                  aria-label="Edit task"
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90"
                  onClick={() => onEdit(task)}
                  title="Edit task"
                  type="button"
                >
                  <Icon name="pencil" className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  aria-label="Delete task"
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-90"
                  onClick={() => onDelete(task)}
                  title="Delete task"
                  type="button"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function KanbanBoard({
  tasks,
  loading,
  hasFilters,
  statusFilter,
  onChangeStatus,
  onClearFilters,
  onAddTask,
  onEdit,
  onDelete,
  canCreateTasks,
  updatingId,
}) {
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  if (loading) {
    return <KanbanSkeleton />;
  }

  if (tasks.length === 0) {
    return (
      <KanbanEmpty
        canCreateTasks={canCreateTasks}
        hasFilters={hasFilters}
        onAddTask={onAddTask}
        onClearFilters={onClearFilters}
      />
    );
  }

  const handleDrop = (status) => (event) => {
    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData('text/plain'));
    setDragOverColumn(null);
    setDraggedTaskId(null);

    const task = tasks.find((item) => item.id === taskId);
    if (task && task.status !== status) onChangeStatus?.(task, status);
  };

  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
      {kanbanColumns.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.id && (statusFilter === 'all' || statusFilter === column.id),
        );
        const isDropTarget = dragOverColumn === column.id;

        return (
          <div
            className={`flex flex-col rounded-2xl ring-1 ring-inset transition-colors duration-300 ease-in-out ${
              isDropTarget
                ? 'bg-indigo-50/70 ring-indigo-200'
                : 'bg-slate-50/80 ring-slate-100'
            }`}
            key={column.id}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              setDragOverColumn((current) => (current === column.id ? null : current));
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragOverColumn(column.id);
            }}
            onDrop={handleDrop(column.id)}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                <h3 className={`text-[13px] font-semibold tracking-tight ${column.accent}`}>{column.label}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${column.badge}`}
                >
                  {columnTasks.length}
                </span>
              </div>
              <Icon name="board" className="h-3.5 w-3.5 text-slate-300" />
            </div>
            <div className="flex min-h-[160px] flex-col gap-3 p-3">
              {columnTasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-[11px] text-slate-400">
                  {isDropTarget ? 'Drop here to move' : 'Nothing here'}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <KanbanCard
                    isDragging={draggedTaskId === task.id}
                    key={task.id}
                    onChangeStatus={onChangeStatus}
                    onDelete={onDelete}
                    onDragStart={setDraggedTaskId}
                    onEdit={onEdit}
                    task={task}
                    updatingId={updatingId}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
