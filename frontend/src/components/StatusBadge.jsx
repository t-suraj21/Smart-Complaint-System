import React from 'react';

const config = {
  Pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700' },
  Solved: { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function StatusBadge({ status }) {
  const c = config[status] || config.Pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}
