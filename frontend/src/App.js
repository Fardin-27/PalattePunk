// ✅ src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layout (adds LeftRail to all nested routes)
import AppLayout from './layout/AppLayout';

// Protected pages (render inside AppLayout)
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PostArtwork from './pages/PostArtwork';
import CreateAdminPage from './pages/CreateAdminPage';
import AdminDashboard from './pages/AdminDashboard'; // keep only if used
import ManageUsers from './pages/ManageUsers';
import ArtworkDetails from './pages/ArtworkDetails';
import Marketplace from './pages/Marketplace';
import MarketArtworkDetails from './pages/MarketArtworkDetails';
import BuyArtwork from './pages/BuyArtwork';
import ManageArtworks from './pages/ManageArtworks';
import Profile from './pages/Profile';
import AdminArtworkDetails from './pages/AdminArtworkDetails';

// Optional utility stubs/pages
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      {/* Default → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes with shared LeftRail layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/post" element={<PostArtwork />} />

        {/* Admin tools */}
        <Route path="/admin/create" element={<CreateAdminPage />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/artworks" element={<ManageArtworks />} />
        {/* Keep admin dashboard only if you really use it */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/artworks/:id" element={<AdminArtworkDetails />} />

        {/* Marketplace + details */}
        <Route path="/market" element={<Marketplace />} />
        <Route path="/market/art/:id" element={<MarketArtworkDetails />} />
        <Route path="/buy/:id" element={<BuyArtwork />} />
        <Route path="/art/:id" element={<ArtworkDetails />} />

        {/* Account */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>} />
      </Route>

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
