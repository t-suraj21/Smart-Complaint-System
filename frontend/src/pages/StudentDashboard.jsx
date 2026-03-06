import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import { PlusCircle, FileText, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.department} · {user.rollNumber}</p>
        </div>
        <Link to="/student/submit" className="btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          <span className="hidden sm:block">New Complaint</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={FileText} color="bg-blue-500" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-500" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="bg-orange-500" />
        <StatCard label="Solved" value={stats.solved} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* Complaint list */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-lg text-gray-800">My Complaints</h2>
          <div className="flex gap-2 flex-wrap">
            {['all', 'Pending', 'In Progress', 'Solved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No complaints found</p>
            <p className="text-sm mt-1">
              <Link to="/student/submit" className="text-blue-600 hover:underline">Submit your first complaint</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => <ComplaintCard key={c._id} complaint={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
