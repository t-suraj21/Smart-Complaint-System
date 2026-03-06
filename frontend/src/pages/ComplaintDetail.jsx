import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Tag, User, Brain, CheckCircle } from 'lucide-react';

const STATUSES = ['Pending', 'In Progress', 'Solved'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [teacherNote, setTeacherNote] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data.complaint);
        setNewStatus(res.data.complaint.status);
        setTeacherNote(res.data.complaint.teacherNote || '');
      } catch (err) {
        toast.error('Complaint not found');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const res = await api.put(`/complaints/${id}/status`, { status: newStatus, teacherNote });
      setComplaint(res.data.complaint);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!complaint) return null;

  const isTeacher = user.role === 'teacher' || user.role === 'admin';
  const date = new Date(complaint.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const sentimentColor = {
    Negative: 'text-red-600 bg-red-50',
    Neutral: 'text-gray-600 bg-gray-50',
    Positive: 'text-green-600 bg-green-50',
  }[complaint.sentiment] || 'text-gray-600 bg-gray-50';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900 flex-1">
            {complaint.isAnonymous ? '🔒 Anonymous Complaint' : complaint.title}
          </h1>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={complaint.priority} size="lg" />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mb-5">{complaint.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-t border-gray-100 pt-4">
          <InfoItem icon={Tag} label="Category" value={complaint.category} />
          <InfoItem icon={Calendar} label="Submitted" value={date} />
          {!complaint.isAnonymous && complaint.studentId && (
            <InfoItem icon={User} label="Student" value={`${complaint.studentId.name} · ${complaint.studentId.department}`} />
          )}
          <div className="flex items-start gap-2">
            <Brain size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Sentiment</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sentimentColor}`}>
                {complaint.sentiment}
              </span>
            </div>
          </div>
        </div>

        {complaint.teacherNote && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">Teacher Note</p>
            <p className="text-sm text-blue-800">{complaint.teacherNote}</p>
          </div>
        )}

        {complaint.resolvedAt && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} />
            Resolved on {new Date(complaint.resolvedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            {complaint.resolvedBy && ` by ${complaint.resolvedBy.name}`}
          </div>
        )}
      </div>

      {/* NLP details card */}
      {complaint.nlpRaw && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Brain size={18} className="text-purple-600" />
            NLP Analysis Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <InfoBox label="Category Confidence" value={`${Math.round((complaint.nlpRaw.category_confidence || 0) * 100)}%`} />
            <InfoBox label="Priority Confidence" value={`${Math.round((complaint.nlpRaw.priority_confidence || 0) * 100)}%`} />
            <InfoBox label="NLP Source" value={complaint.nlpRaw.source === 'ml_model' ? '🤖 ML Model' : '⚙️ Rule-based'} />
            {complaint.nlpRaw.cleaned_text && (
              <div className="col-span-full">
                <p className="text-xs text-gray-400 mb-1">Cleaned Text</p>
                <p className="font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg text-gray-600 break-all">
                  {complaint.nlpRaw.cleaned_text}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teacher actions */}
      {isTeacher && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Update Complaint Status</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                rows={3}
                className="input-field resize-none"
                placeholder="Add a note for the student..."
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
              />
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === complaint.status}
              className="btn-primary flex items-center gap-2"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const InfoBox = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2">
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value}</p>
  </div>
);
