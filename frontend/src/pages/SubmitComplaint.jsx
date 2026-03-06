import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Send, EyeOff } from 'lucide-react';

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', isAnonymous: false });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/complaints', form);
      const { complaint } = res.data;
      setResult(complaint);
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const priorityColors = { High: 'text-red-600', Medium: 'text-orange-500', Low: 'text-green-600' };
    const priorityBg = { High: 'bg-red-50 border-red-200', Medium: 'bg-orange-50 border-orange-200', Low: 'bg-green-50 border-green-200' };

    return (
      <div className="max-w-lg mx-auto">
        <div className={`card border-2 ${priorityBg[result.priority]}`}>
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-gray-900">Complaint Submitted!</h2>
            <p className="text-gray-500 text-sm mt-1">Our NLP system has analyzed your complaint</p>
          </div>

          <div className="bg-white rounded-lg divide-y divide-gray-100">
            <Row label="Title" value={result.title} />
            <Row label="Category" value={result.category} />
            <Row label="Priority" value={result.priority} className={`font-bold ${priorityColors[result.priority]}`} />
            <Row label="Sentiment" value={result.sentiment} />
            <Row label="Status" value={result.status} />
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => navigate('/student')} className="btn-primary flex-1">
              View Dashboard
            </button>
            <button onClick={() => { setResult(null); setForm({ title: '', description: '', isAnonymous: false }); }}
              className="btn-secondary flex-1">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Send className="text-blue-600" size={28} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Submit a Complaint</h1>
            <p className="text-gray-500 text-sm">Our NLP system will automatically categorize and prioritize it</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. WiFi not working in hostel"
              value={form.title}
              onChange={set('title')}
              minLength={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              className="input-field resize-none"
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={set('description')}
              minLength={10}
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <EyeOff size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-blue-600"
                  checked={form.isAnonymous}
                  onChange={set('isAnonymous')}
                />
                <span className="text-sm font-medium text-gray-700">Submit Anonymously</span>
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Your identity will be hidden from teachers/admin
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/student')} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Row = ({ label, value, className = '' }) => (
  <div className="flex justify-between items-center px-4 py-3">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium text-gray-900 ${className}`}>{value}</span>
  </div>
);
