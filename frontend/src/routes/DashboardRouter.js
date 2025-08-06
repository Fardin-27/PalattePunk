// ✅ src/routes/DashboardRouter.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { decodeToken } from '../utils/auth';

import HomePage from '../pages/HomePage';
import AdminDashboard from '../pages/AdminDashboard';

const DashboardRouter = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = decodeToken(token);
  const role = user?.role;

  if (role === 'Admin') {
    return <AdminDashboard />;
  }

  if (role === 'Buyer' || role === 'Artist') {
    return <HomePage />;
  }

  return <Navigate to="/login" replace />;
};

export default DashboardRouter;
