import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import { PlusCircle, FileText, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
    <div className={`p-3 rounded-2xl ${color} shadow-lg`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/my');
        setComplaints(res.data.complaints);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    solved: complaints.filter((c) => c.status === 'Solved').length,
  };

  const filtered =
    filter === 'all' ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden">
        <div className="aurora-strip" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-blue-800">Student Panel</p>
            <h1 className="text-3xl text-slate-900 mt-1">Welcome, {user.name}</h1>
            <p className="text-slate-600 text-sm mt-1">
              {user.department}{user.rollNumber ? ` · ${user.rollNumber}` : ''}
            </p>
          </div>
          <Link to="/student/submit" className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <PlusCircle size={18} />
            New Complaint
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={FileText} color="bg-blue-600" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="bg-orange-500" />
        <StatCard label="Solved" value={stats.solved} icon={CheckCircle} color="bg-emerald-500" />
      </div>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl text-slate-900">My Complaints</h2>
          <div className="flex gap-2 flex-wrap">
            {['all', 'Pending', 'In Progress', 'Solved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  filter === f ? 'bg-blue-700 text-white' : 'bg-blue-50 text-slate-600 hover:bg-blue-100'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No complaints found</p>
            <p className="text-sm mt-1">
              <Link to="/student/submit" className="text-blue-700 hover:underline">Submit your first complaint</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => <ComplaintCard key={c._id} complaint={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
