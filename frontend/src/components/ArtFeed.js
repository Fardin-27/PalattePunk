// ✅ src/components/ArtFeed.js
import React from 'react';
import './ArtFeed.css';
import art1 from '../assets/art/art1.jpeg';
import art2 from '../assets/art/art2.jpeg';
import art3 from '../assets/art/art3.jpeg';

const artFeed = [art1, art2, art3];

const ArtFeed = () => {
  return (
    <div className="art-feed">
      {artFeed.map((image, index) => (
        <div className="art-card" key={index}>
          <img src={image} alt={`art-${index}`} />
        </div>
      ))}
    </div>
  );
};

export default ArtFeed;
