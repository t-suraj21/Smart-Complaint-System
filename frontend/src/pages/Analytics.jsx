import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart2, PieChart as PieIcon, Activity } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#06b6d4'];
const STATUS_COLORS = { Solved: '#22c55e', Pending: '#f59e0b', 'In Progress': '#3b82f6' };

export default function Analytics() {
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [monthlyRes, catRes, statusRes, sumRes] = await Promise.all([
          api.get(`/analytics/monthly?year=${year}`),
          api.get('/analytics/categories'),
          api.get('/analytics/status'),
          api.get('/analytics/summary'),
        ]);
        setMonthly(monthlyRes.data.monthly);
        setCategories(catRes.data.categories);
        setStatuses(statusRes.data.statuses);
        setSummary(sumRes.data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const totalComplaints = summary?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <select
          className="input-field w-32"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: summary.total, cls: 'bg-blue-500' },
            { label: '🔴 High', value: summary.high, cls: 'bg-red-500' },
            { label: '🟠 Medium', value: summary.medium, cls: 'bg-orange-500' },
            { label: '🟢 Low', value: summary.low, cls: 'bg-green-500' },
            { label: 'Pending', value: summary.pending, cls: 'bg-yellow-500' },
            { label: 'Solved', value: summary.solved, cls: 'bg-emerald-500' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`${cls} text-white rounded-xl p-4 text-center shadow-sm`}>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-sm opacity-90 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly bar chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-blue-600" />
          Monthly Complaints — {year}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v) => [v, 'Complaints']}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category pie chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <PieIcon size={18} className="text-purple-600" />
            Category Distribution
          </h2>
          {categories.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ percentage }) => `${percentage}%`}
                    labelLine={false}
                  >
                    {categories.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {categories.map((cat, idx) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      {cat.category}
                    </span>
                    <span className="font-medium text-gray-700">{cat.count} ({cat.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Activity size={18} className="text-green-600" />
            Solved vs Pending
          </h2>
          {statuses.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ percentage }) => `${percentage}%`}
                    labelLine={false}
                  >
                    {statuses.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statuses.map((s) => (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full"
                        style={{ width: `${s.percentage}%`, background: STATUS_COLORS[s.status] || '#94a3b8' }}
                      />
                    </div>
                    <span className="text-sm font-medium w-28 text-right text-gray-700">
                      {s.status}: {s.count} ({s.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
