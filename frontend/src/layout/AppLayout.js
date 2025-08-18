// ✅ src/layout/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftRail from '../components/LeftRail';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <LeftRail />
      {/* Main content always sits to the right of the rail */}
      <main className="app-content with-rail">
        <Outlet />
      </main>
    </div>
  );
}
