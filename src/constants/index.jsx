import React from 'react';

export const API_URL = 'https://my-to-do-listtt.onrender.com/api/todos';
export const API_PROFILE_URL = 'https://my-to-do-listtt.onrender.com/api/user/profile';
export const API_ME_URL = 'https://my-to-do-listtt.onrender.com/api/user/me';

export const SIDEBAR_NAV = [
  { key: 'INBOX', label: 'Inbox', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="#06b6d4" strokeWidth="2"/></svg> },
  { key: 'TODAY', label: 'Today', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><rect x="3.5" y="4.5" width="13" height="12" rx="2.5" stroke="#3b82f6" strokeWidth="2"/><rect x="6" y="1.5" width="2" height="5" rx="1" fill="#3b82f6"/><rect x="12" y="1.5" width="2" height="5" rx="1" fill="#3b82f6"/></svg> },
  { key: 'UPCOMING', label: 'Upcoming', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><path d="M10 3l7 7-7 7M3 10h14" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'IMPORTANT', label: 'Important', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><path d="M10 2l2.09 6.26L18 9.27l-5 4.73L14.18 18 10 15.27 5.82 18 7 14l-5-4.73 5.91-.91L10 2z" fill="#ef4444"/></svg> },
  { key: 'OVERDUE', label: 'Overdue', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="2"/><path d="M10 6v4M10 13h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg> }
];

export const PRIORITY_OPTIONS = [
  { label: "High", value: "High", color: "bg-red-100 text-red-700 border border-red-200" },
  { label: "Medium", value: "Medium", color: "bg-amber-100 text-amber-700 border border-amber-200" },
  { label: "Low", value: "Low", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
];