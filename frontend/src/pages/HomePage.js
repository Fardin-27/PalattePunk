// ✅ src/pages/HomePage.js (unchanged logic, just no container)
import React, { useState } from 'react';
import ArtFeed from '../components/ArtFeed';
import './HomePage.css';

export default function HomePage() {
  const [q, setQ] = useState('');

  return (
    <>
      <div className="top-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search artworks… (title or description)"
        />
        <button onClick={() => setQ((s) => s.trim())}>Search</button>
      </div>

      <ArtFeed mode="simple" q={q} />
    </>
  );
}
