import Icon from './Icons';
import PageHeader from './PageHeader';

const statusMeta = [
  { key: 'pending', label: 'To Do', hex: '#f59e0b', row: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  { key: 'in_progress', label: 'In Progress', hex: '#6366f1', row: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15' },
  { key: 'completed', label: 'Completed', hex: '#10b981', row: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
];

const priorityMeta = [
  { key: 'high', label: 'High', hex: '#f43f5e' },
  { key: 'medium', label: 'Medium', hex: '#f59e0b' },
  { key: 'normal', label: 'Normal', hex: '#6366f1' },
  { key: 'low', label: 'Low', hex: '#94a3b8' },
];

function daysUntilDue(task) {
  if (!task.due_date || task.status === 'completed') return Number.POSITIVE_INFINITY;
  const due = new Date(`${task.due_date.slice(0, 10)}T23:59:59`);
  return Math.ceil((due - Date.now()) / 86_400_000);
}

function priorityKeyOf(task) {
  const days = daysUntilDue(task);
  if (days < 1) return 'high';
  if (days <= 3) return 'medium';
  if (days <= 7) return 'normal';
  return 'low';
}

function isOverdue(task) {
  return task.status !== 'completed' && task.due_date && daysUntilDue(task) < 1;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function DonutChart({ segments, total }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r={radius} stroke="#f1f5f9" strokeWidth="10" />
          {total > 0 &&
            segments.map((segment) => {
              const fraction = segment.value / total;
              const dash = fraction * circumference;

              if (fraction <= 0) return null;

              const circle = (
                <circle
                  cx="50"
                  cy="50"
                  fill="none"
                  r={radius}
                  stroke={segment.hex}
                  strokeDasharray={`${Math.max(dash - 1.5, 0.5)} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  strokeWidth="10"
                />
              );

              offset += dash;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">{total}</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Tasks</p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((segment) => (
          <li className="flex items-center gap-2.5 text-[12px]" key={segment.key}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.hex }} />
            <span className="min-w-0 flex-1 truncate font-medium text-slate-600">{segment.label}</span>
            <span className="font-semibold text-slate-900">{segment.value}</span>
            <span className="w-10 text-right text-[11px] font-semibold text-slate-400">
              {total > 0 ? formatPercent((segment.value / total) * 100) : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${tone}`}>
          <Icon className="h-4 w-4" name={icon} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
      <p className="mt-3 text-[13px] font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

export default function ReportsView({ tasks, loading }) {
  const total = tasks.length;
  const counts = {
    pending: tasks.filter((task) => task.status === 'pending').length,
    in_progress: tasks.filter((task) => task.status === 'in_progress').length,
    completed: tasks.filter((task) => task.status === 'completed').length,
  };
  const overdue = tasks.filter(isOverdue).length;
  const completionRate = total ? (counts.completed / total) * 100 : 0;

  const byProject = Object.entries(
    tasks.reduce((acc, task) => {
      const name = task.project?.name || 'General';
      (acc[name] ??= { total: 0, completed: 0 });
      acc[name].total += 1;
      if (task.status === 'completed') acc[name].completed += 1;
      return acc;
    }, {}),
  )
    .map(([name, stats]) => ({ name, ...stats, rate: stats.total ? (stats.completed / stats.total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const priorityCounts = priorityMeta.reduce(
    (acc, meta) => ({ ...acc, [meta.key]: tasks.filter((task) => priorityKeyOf(task) === meta.key).length }),
    {},
  );
  const maxPriority = Math.max(...priorityMeta.map((meta) => priorityCounts[meta.key]), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" key={index} />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Live analytics pulled straight from the task workspace — status mix, urgency, and delivery pace."
        eyebrow="Analytics"
        icon="chart"
        title="Reports"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon="tasks"
          label="Total tasks"
          sub="Everything in your view"
          tone="bg-slate-50 text-slate-600 ring-slate-200/80"
          value={total}
        />
        <MetricCard
          icon="checkCircle"
          label="Completed"
          sub={`${counts.completed} of ${total} tasks closed`}
          tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
          value={counts.completed}
        />
        <MetricCard
          icon="trend"
          label="Completion rate"
          sub={completionRate >= 70 ? 'Strong delivery pace' : 'Room to accelerate'}
          tone="bg-indigo-50 text-indigo-600 ring-indigo-100"
          value={formatPercent(completionRate)}
        />
        <MetricCard
          icon="alert"
          label="Overdue"
          sub={overdue > 0 ? 'Needs attention soon' : 'Nothing past deadline'}
          tone={overdue > 0 ? 'bg-rose-50 text-rose-600 ring-rose-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'}
          value={overdue}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">Status distribution</h3>
              <p className="mt-0.5 text-[12px] text-slate-500">Where every task sits right now</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Live</span>
          </div>
          <div className="mt-6">
            <DonutChart
              segments={statusMeta.map((meta) => ({ key: meta.key, label: meta.label, hex: meta.hex, value: counts[meta.key] }))}
              total={total}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">Priority breakdown</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">Urgency based on upcoming deadlines</p>
          <ul className="mt-6 space-y-4">
            {priorityMeta.map((meta) => {
              const count = priorityCounts[meta.key];
              const width = total > 0 ? (count / total) * 100 : 0;

              return (
                <li key={meta.key}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-slate-700">{meta.label}</span>
                    <span className="font-semibold text-slate-500">
                      {count} · {total > 0 ? formatPercent((count / total) * 100) : '0%'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ backgroundColor: meta.hex, width: `${(width / maxPriority) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">Project progress</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">Completion by project</p>
          </div>
          <Icon name="briefcase" className="h-4 w-4 text-slate-300" />
        </div>

        {byProject.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200/80 bg-white text-slate-400 shadow-sm">
              <Icon name="inbox" className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[13px] font-semibold text-slate-900">No project activity yet</p>
            <p className="mt-1 max-w-sm text-[12px] text-slate-500">
              Reports will build automatically as tasks are created and moved.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {byProject.map((project) => (
              <li key={project.name}>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="min-w-0 truncate font-semibold text-slate-700">
                    {project.name}
                    <span className="ml-2 font-medium text-slate-400">
                      {project.completed}/{project.total}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                      project.rate >= 70
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
                        : project.rate >= 30
                          ? statusMeta[1].row
                          : statusMeta[0].row
                    }`}
                  >
                    {formatPercent(project.rate)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                    style={{ width: `${project.rate}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
