import React from 'react';

export default function CalendarIcon({ size = 22, color = "#0e7490", ...props }) {
  return (
    <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="3" strokeWidth="2" />
      <path d="M16 2v4M8 2v4" strokeWidth="2" />
      <path d="M3 10h18" strokeWidth="2" />
    </svg>
  );
}