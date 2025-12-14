import { PRIORITY_OPTIONS } from '../constants/index';

export function getPriorityColor(priority) {
  const found = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return found ? found.color : "bg-slate-100 text-slate-600 border border-slate-200";
}

export const getPriorityBorderColor = (priority) => {
  const p = priority ? priority.toLowerCase() : 'medium';
  if (p === 'high') return 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]';
  if (p === 'low') return 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.2)]';
  return 'border-yellow-400 shadow-[0_0_0_1px_rgba(250,204,21,0.2)]'; // Default Medium
};

export const getPriorityBorder = (priority) => {
  const p = (priority || 'Medium').toLowerCase().trim();
  if (p === 'high') return 'border-red-500 ring-1 ring-red-500/50';
  if (p === 'low') return 'border-green-500 ring-1 ring-green-500/50';
  return 'border-yellow-400 ring-1 ring-yellow-400/50'; // Default to Medium
};