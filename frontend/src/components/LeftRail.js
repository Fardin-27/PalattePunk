// ✅ src/components/LeftRail.js
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { decodeToken } from '../utils/auth';
import './LeftRail.css';

const Item = ({ icon, label, onClick, active }) => (
  <button
    className={`lr-item ${active ? 'active' : ''}`}
    onClick={onClick}
    aria-label={label}
    title={label}
    aria-current={active ? 'page' : undefined}
  >
    <span className="lr-ico">{icon}</span>
  </button>
);

export default function LeftRail() {
  const nav = useNavigate();
  const loc = useLocation();

  // Read role from token (if any)
  const token = localStorage.getItem('token');
  const role = token ? decodeToken(token)?.role : '';

  // Ensure a consistent rail width is available to CSS
  useEffect(() => {
    // Match the width you use in LeftRail.css (e.g., 72px or 88px)
    document.documentElement.style.setProperty('--rail-width', '88px');
    return () => {
      // optional clean-up
      document.documentElement.style.removeProperty('--rail-width');
    };
  }, []);

  const go = (to) => () => nav(to);
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login?logout=1');
  };

  // Common items
  const itemsCommon = [
    { icon: '🏠', label: 'Home', to: '/home' },
    { icon: '🔍', label: 'Explore', to: '/explore' },
    { icon: '🔔', label: 'Notifications', to: '/notifications' },
    { icon: '💬', label: 'Messages', to: '/messages' },
    { icon: '⚙️', label: 'Settings', to: '/settings' },
  ];

  // Role-specific
  const itemsArtist = [{ icon: '➕', label: 'Post', to: '/post' }];
  const itemsAdmin = [
    { icon: '➕', label: 'Create Admin', to: '/admin/create' },
    { icon: '👥', label: 'Manage Users', to: '/admin/users' },
  ];

  const items =
    role === 'Admin'
      ? [...itemsCommon.slice(0, 2), ...itemsAdmin, ...itemsCommon.slice(2)]
      : role === 'Artist'
      ? [...itemsCommon.slice(0, 2), ...itemsArtist, ...itemsCommon.slice(2)]
      : itemsCommon;

  // Helper: active if current path starts with target (so /admin/users/123 is active too)
  const isActive = (to) =>
    loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));

  return (
    <aside className="left-rail">
      <div className="lr-top">
        {/* App badge (acts like logo button to home) */}
        <button
          className="lr-logo"
          onClick={go('/home')}
          aria-label="PalettePunk"
          title="PalettePunk"
        >
          🖌️
        </button>

        {items.map((it) => (
          <Item
            key={it.label}
            icon={it.icon}
            label={it.label}
            active={isActive(it.to)}
            onClick={go(it.to)}
          />
        ))}
      </div>

      <div className="lr-bottom">
        <Item icon="🚪" label="Logout" onClick={logout} active={false} />
      </div>
    </aside>
  );
}
