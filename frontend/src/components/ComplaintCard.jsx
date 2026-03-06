import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, User } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

export default function ComplaintCard({ complaint, showStudent = false }) {
  const date = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const borderColor = {
    High: 'border-l-red-500',
    Medium: 'border-l-orange-400',
    Low: 'border-l-green-500',
  }[complaint.priority] || 'border-l-gray-300';

  return (
    <Link
      to={`/complaint/${complaint._id}`}
      className={`block bg-white rounded-xl border border-gray-100 border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow p-5`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">
          {complaint.isAnonymous ? '🔒 Anonymous Complaint' : complaint.title}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{complaint.description}</p>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Tag size={12} />
          {complaint.category}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {date}
        </span>
        {showStudent && complaint.studentId && !complaint.isAnonymous && (
          <span className="flex items-center gap-1">
            <User size={12} />
            {complaint.studentId.name}
          </span>
        )}
      </div>
    </Link>
  );
}
