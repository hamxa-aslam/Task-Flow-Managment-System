import Icon from './Icons';
import { getRoleMeta } from '../roles';

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-[11px]',
};

export default function RoleBadge({ role, variant = 'light', size = 'sm', className = '' }) {
  const meta = getRoleMeta(role);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset ${
        sizes[size] ?? sizes.sm
      } ${variant === 'dark' ? meta.dark : meta.light} ${className}`}
      title={meta.scope}
    >
      <Icon name={meta.icon} className="h-3 w-3" strokeWidth={2.1} />
      {meta.label}
    </span>
  );
}
