import { useEffect, useState } from 'react';
import Icon from './Icons';

const emptyForm = {
  title: '',
  description: '',
  project_id: '',
  status: 'pending',
  due_date: '',
  assigned_to: '',
};

const fieldClass =
  'w-full rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10';

function buildForm(task, projects, currentUser) {
  const defaultAssignee = currentUser?.id ? String(currentUser.id) : '';

  if (task) {
    return {
      title: task.title ?? '',
      description: task.description ?? '',
      project_id: String(task.project_id ?? ''),
      status: task.status ?? 'pending',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      assigned_to: String(task.assigned_to ?? defaultAssignee),
    };
  }

  return {
    ...emptyForm,
    project_id: projects[0] ? String(projects[0].id) : '',
    assigned_to: defaultAssignee,
  };
}

export default function TaskModal({
  task,
  projects,
  assignees = [],
  currentUser,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(() => buildForm(task, projects, currentUser));
  const [errors, setErrors] = useState({});

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
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'A task title is required.';
    if (!form.project_id) nextErrors.project_id = 'Select a project for this task.';
    if (!form.due_date) nextErrors.due_date = 'Choose a due date.';
    if (!form.assigned_to) nextErrors.assigned_to = 'Select who will own this task.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const result = await onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim() || null,
      project_id: Number(form.project_id),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    });

    if (result && !result.ok) {
      setErrors(result.errors ?? { message: 'Something went wrong while saving the task.' });
    }
  };

  const hasProjects = projects.length > 0;
  const assigneeOptions = assignees.length > 0 ? assignees : currentUser ? [currentUser] : [];

  return (
    <div
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
              <Icon name={task ? 'pencil' : 'plus'} className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                {task ? 'Edit task' : 'Create a new task'}
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {task ? 'Update the details and keep everyone aligned.' : 'Add a clear next step to your project.'}
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

        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
            {!hasProjects && (
              <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-medium text-amber-800">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                No projects are available yet. A project is required before a task can be created.
              </div>
            )}

            {errors.message && (
              <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {errors.message}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="task-title">
                Task title
              </label>
              <input
                autoFocus
                className={`${fieldClass} ${errors.title ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                id="task-title"
                onChange={updateField('title')}
                placeholder="e.g. Finalize dashboard design"
                type="text"
                value={form.title}
              />
              {errors.title && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="task-description">
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className={`${fieldClass} min-h-[88px] resize-none`}
                id="task-description"
                onChange={updateField('description')}
                placeholder="Add context, links, or acceptance criteria…"
                value={form.description}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="task-project">
                  Project
                </label>
                <div className="relative">
                  <select
                    className={`${fieldClass} appearance-none pr-9 ${errors.project_id ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                    disabled={!hasProjects}
                    id="task-project"
                    onChange={updateField('project_id')}
                    value={form.project_id}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevronDown"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                </div>
                {errors.project_id && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.project_id}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="task-status">
                  Status
                </label>
                <div className="relative">
                  <select
                    className={`${fieldClass} appearance-none pr-9`}
                    id="task-status"
                    onChange={updateField('status')}
                    value={form.status}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Icon
                    name="chevronDown"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="task-due-date">
                  Due date
                </label>
                <div className="relative">
                  <input
                    className={`${fieldClass} pr-10 ${errors.due_date ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                    id="task-due-date"
                    onChange={updateField('due_date')}
                    type="date"
                    value={form.due_date}
                  />
                  <Icon
                    name="calendar"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                </div>
                {errors.due_date && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.due_date}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="task-assignee">
                  Assignee
                </label>
                <div className="relative">
                  <select
                    className={`${fieldClass} appearance-none pr-9 ${errors.assigned_to ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10' : ''}`}
                    id="task-assignee"
                    onChange={updateField('assigned_to')}
                    value={form.assigned_to}
                  >
                    <option value="">Select a teammate</option>
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name}
                        {assignee.id === currentUser?.id ? ' (you)' : ''}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevronDown"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                </div>
                {errors.assigned_to && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.assigned_to}</p>
                )}
              </div>
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
              className="inline-flex min-w-[128px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
              disabled={saving || !hasProjects}
              type="submit"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                <>
                  <Icon name={task ? 'check' : 'plus'} className="h-4 w-4" strokeWidth={2.2} />
                  {task ? 'Save changes' : 'Create task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmDialog({ task, onClose, onConfirm, deleting }) {
  useEffect(() => {
    if (!task) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !deleting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, deleting, onClose]);

  if (!task) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-md animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
      role="alertdialog"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-2xl shadow-slate-950/20 animate-modal-in">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-100">
          <Icon name="trash" className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">Delete this task?</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">“{task.title}”</span> will be permanently removed. This action
          cannot be undone.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            className="flex-1 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900"
            disabled={deleting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-rose-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-500 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100"
            disabled={deleting}
            onClick={onConfirm}
            type="button"
          >
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Deleting…
              </>
            ) : (
              <>
                <Icon name="trash" className="h-4 w-4" />
                Delete task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
