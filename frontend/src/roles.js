export const ROLE_META = {
  admin: {
    label: 'Admin',
    scope: 'Full workspace access',
    description: 'Manage every project, task, and team member.',
    access: ['Full project visibility', 'Create and edit every task', 'Manage user roles and access'],
    icon: 'shield',
    light: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    dark: 'bg-violet-500/15 text-violet-200 ring-violet-400/25',
  },
  manager: {
    label: 'Manager',
    scope: 'Team workspace access',
    description: 'Manage your team projects and the work inside them.',
    access: ['Team project visibility', 'Create and assign team tasks', 'Update team task status'],
    icon: 'users',
    light: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    dark: 'bg-sky-500/15 text-sky-200 ring-sky-400/25',
  },
  team_member: {
    label: 'Team Member',
    scope: 'Assigned work only',
    description: 'Focus on the tasks assigned directly to you.',
    access: ['Assigned tasks only', 'Complete or reopen your work', 'No project administration'],
    icon: 'checkCircle',
    light: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dark: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/25',
  },
};

export function getRoleMeta(role) {
  return ROLE_META[role] ?? ROLE_META.team_member;
}
