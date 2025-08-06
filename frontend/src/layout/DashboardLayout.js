import React from 'react';
import { decodeToken, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = decodeToken();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">🎨 PalettePunk</h2>
        <button onClick={() => navigate('/home')}>🏠 Home</button>

        {/* Show role-based buttons */}
        {user?.role === 'Artist' && (
          <>
            <button onClick={() => navigate('/explore')}>🔍 Explore</button>
            <button onClick={() => navigate('/market')}>🛒 Market</button>
            <button onClick={() => navigate('/post')}>➕ Post</button>
          </>
        )}

        {user?.role === 'Buyer' && (
          <>
            <button onClick={() => navigate('/explore')}>🔍 Explore</button>
            <button onClick={() => navigate('/market')}>🛒 Market</button>
          </>
        )}

        {user?.role === 'Admin' && (
          <>
            <button onClick={() => navigate('/create-admin')}>➕ Create Admin</button>
            <button onClick={() => navigate('/manage-users')}>👥 Manage Users</button>
            <button onClick={() => navigate('/manage-contents')}>🖼 Manage Contents</button>
            <button onClick={() => navigate('/manage-marketplace')}>🛒 Manage Marketplace</button>
          </>
        )}

        <button onClick={() => navigate('/notifications')}>🔔 Notifications</button>
        <button onClick={() => navigate('/messages')}>💬 Messages</button>
        <button onClick={() => navigate('/settings')}>⚙️ Settings</button>
        <button onClick={handleLogout}>🚪 Logout</button>
      </aside>


      {/* Main content... */}


      {/* Main Content */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <input type="text" placeholder="Search artwork..." />
          <button className="profile-btn">👤</button>
        </header>

        {/* Page Content */}
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
