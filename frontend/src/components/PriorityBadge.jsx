import React from 'react';

const config = {
  High: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: '🔴 High' },
  Medium: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: '🟠 Medium' },
  Low: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: '🟢 Low' },
};

export default function PriorityBadge({ priority, size = 'sm' }) {
  const c = config[priority] || config.Low;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${size === 'lg' ? 'text-sm' : 'text-xs'} ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
