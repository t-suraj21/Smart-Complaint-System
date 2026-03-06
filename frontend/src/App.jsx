import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import Analytics from './pages/Analytics';
import ComplaintDetail from './pages/ComplaintDetail';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'student' ? '/student' : '/teacher'} replace />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Navbar />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/submit" element={<PrivateRoute roles={['student']}><SubmitComplaint /></PrivateRoute>} />
        <Route path="/teacher" element={<PrivateRoute roles={['teacher', 'admin']}><TeacherDashboard /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute roles={['teacher', 'admin']}><Analytics /></PrivateRoute>} />
        <Route path="/complaint/:id" element={<PrivateRoute><ComplaintDetail /></PrivateRoute>} />
        <Route path="*" element={<div className="text-center py-20 text-gray-500"><h2 className="text-2xl font-bold">404 – Page not found</h2></div>} />
      </Routes>
    </main>
    <Toaster position="top-right" />
  </BrowserRouter>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
