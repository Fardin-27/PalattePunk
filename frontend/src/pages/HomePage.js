// ✅ src/pages/HomePage.js
import React, { useState } from 'react';
import './HomePage.css';
import ArtFeed from '../components/ArtFeed';

const HomePage = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Portrait', 'Digital', 'Watercolor', 'Nature', 'Tattoo', 'Fantasy', 'Anime', 'Concept Art'];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="home-page-wrapper">
      <aside className="sidebar">
        <h2 className="logo">PalettePunk</h2>
        <nav>
          <ul>
            <li>🏠</li>
            <li>🔍</li>
            <li>🛒</li>
            <li>🔔</li>
            <li>💬</li>
            <li>⚙️</li>
            <li onClick={handleLogout} style={{ cursor: 'pointer' }}>🚪</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <input type="text" placeholder="Search artworks..." className="search-bar" />
          <button className="profile-button">T</button>
        </header>

        <div className="filter-bar">
          {filters.map((filter, index) => (
            <button
              key={index}
              className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <ArtFeed />
      </main>
    </div>
  );
};

export default HomePage;
