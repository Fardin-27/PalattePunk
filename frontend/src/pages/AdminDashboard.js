import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <h2 className="logo">PalettePunk Admin</h2>
        <ul>
          <li onClick={() => navigate('/admin/create')}>Create Admin</li>
          <li onClick={() => navigate('/admin/users')}>Manage Users</li>
          <li onClick={() => navigate('/admin/content')}>Manage Contents</li>
          <li onClick={() => navigate('/admin/market')}>Manage Marketplace</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>
      <main className="admin-main">
        <h1>Welcome, Admin 👑</h1>
        <p>Select an option from the sidebar.</p>
      </main>
    </div>
  );
};

export default AdminDashboard;
