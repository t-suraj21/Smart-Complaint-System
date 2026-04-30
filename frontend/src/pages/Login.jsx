import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'student' ? '/student' : '/teacher');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-layout grid lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-slate-950 text-slate-100 overflow-hidden">
          <div className="aurora-strip" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Smart Campus Care</p>
            <h1 className="text-4xl mt-3 leading-tight">Raise a voice. Track every action.</h1>
            <p className="text-slate-300 mt-4 leading-relaxed max-w-sm">
              AI-powered complaint analysis routes issues faster so students get transparent updates and safer campuses.
            </p>
          </div>
          <div className="relative z-10 space-y-2 text-sm text-slate-300">
            <p className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-4 py-3">
              "This portal made our hostel issue tracking clear and quick."
            </p>
            <p className="text-xs text-slate-400">Student Support Collective</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="card bg-white/90">
            <div className="text-center mb-6">
              <LogIn className="mx-auto text-blue-600 mb-2" size={34} />
              <h2 className="text-3xl text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to continue managing your complaints</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-700 hover:underline font-semibold">Register</Link>
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 space-y-1 border border-slate-200">
              <p className="font-semibold text-slate-700 mb-2">Demo Credentials</p>
              <p>Student: <span className="font-mono">student@demo.com</span> / <span className="font-mono">123456</span></p>
              <p>Teacher: <span className="font-mono">teacher@demo.com</span> / <span className="font-mono">123456</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
