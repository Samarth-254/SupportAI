import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import { api } from './api';

const ProtectedRoute = ({ children }) => {
  if (!api.auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const user = api.auth.getCurrentUser();

  if (!api.auth.isAuthenticated()) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const GuestOnlyRoute = ({ children, adminOnly = false }) => {
  if (!api.auth.isAuthenticated()) {
    return children;
  }

  const user = api.auth.getCurrentUser();

  if (adminOnly) {
    return user?.role === 'admin'
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/" replace />;
  }

  return user?.role === 'admin'
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chatbot />} />

        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <Login isAdminLogin={false} />
            </GuestOnlyRoute>
          }
        />

        <Route
          path="/admin-login"
          element={
            <GuestOnlyRoute adminOnly>
              <Login isAdminLogin={true} />
            </GuestOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics debug={process.env.NODE_ENV === 'development'} />
    </BrowserRouter>
  );
}

export default App;