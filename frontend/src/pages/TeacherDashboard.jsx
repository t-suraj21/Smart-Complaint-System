import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import ComplaintCard from '../components/ComplaintCard';
import { Search, Filter, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Infrastructure', 'Faculty Issue', 'Hostel Problem', 'Ragging / Harassment', 'Library Issue', 'Exam Issue', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'In Progress', 'Solved'];

const StatCard = ({ label, value, colorClass, emoji }) => (
  <div className={`card text-center border-2 ${colorClass}`}>
    <div className="text-2xl font-bold">{emoji} {value}</div>
    <div className="text-sm text-gray-600 mt-0.5">{label}</div>
  </div>
);

export default function TeacherDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filters.category) params.append('category', filters.category);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/complaints?${params}`);
      setComplaints(res.data.complaints);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/analytics/summary');
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useEffect(() => { fetchSummary(); }, []);

  const setFilter = (k) => (e) => {
    setFilters({ ...filters, [k]: e.target.value });
    setPage(1);
  };

  const clearFilters = () => { setFilters({ category: '', priority: '', status: '', search: '' }); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <button onClick={fetchComplaints} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={summary.total} colorClass="border-gray-200" emoji="📋" />
          <StatCard label="High" value={summary.high} colorClass="border-red-200" emoji="🔴" />
          <StatCard label="Medium" value={summary.medium} colorClass="border-orange-200" emoji="🟠" />
          <StatCard label="Low" value={summary.low} colorClass="border-green-200" emoji="🟢" />
          <StatCard label="Pending" value={summary.pending} colorClass="border-yellow-200" emoji="⏳" />
          <StatCard label="Solved" value={summary.solved} colorClass="border-emerald-200" emoji="✅" />
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <h3 className="font-medium text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Search complaints..."
              value={filters.search}
              onChange={setFilter('search')}
            />
          </div>
          <select className="input-field" value={filters.category} onChange={setFilter('category')}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input-field" value={filters.priority} onChange={setFilter('priority')}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className="input-field" value={filters.status} onChange={setFilter('status')}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {(filters.category || filters.priority || filters.status || filters.search) && (
          <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:underline">
            Clear all filters
          </button>
        )}
      </div>

      {/* Complaint list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">
            Complaints{' '}
            <span className="text-gray-500 font-normal text-sm">({total} total, sorted by priority)</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>No complaints found</p>
          </div>
        ) : (
          <>
            {/* Priority groups */}
            {['High', 'Medium', 'Low'].map((priority) => {
              const group = complaints.filter((c) => c.priority === priority);
              if (group.length === 0) return null;
              const labels = {
                High: '🔴 High Priority',
                Medium: '🟠 Medium Priority',
                Low: '🟢 Low Priority',
              };
              return (
                <div key={priority} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-700">{labels[priority]}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{group.length}</span>
                  </div>
                  <div className="space-y-3">
                    {group.map((c) => <ComplaintCard key={c._id} complaint={c} showStudent />)}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm">‹ Prev</button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm">Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
