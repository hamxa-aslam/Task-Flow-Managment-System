import Icon from './Icons';

export default function PageHeader({ eyebrow, title, description, icon, badge, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white text-indigo-600 shadow-sm">
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </p>
            {badge}
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-[22px]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] font-normal leading-relaxed text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 sm:pb-0.5">{action}</div>}
    </div>
  );
}
