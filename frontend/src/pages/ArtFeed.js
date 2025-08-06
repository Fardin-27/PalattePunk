import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import './ArtFeed.css';

const mockArtworks = [
  {
    id: 1,
    title: 'Sunset Overdrive',
    artist: 'Fardin',
    price: '$50',
    image: 'https://source.unsplash.com/400x500/?art,sunset',
  },
  {
    id: 2,
    title: 'Urban Jungle',
    artist: 'Mahadi',
    price: '$80',
    image: 'https://source.unsplash.com/400x500/?painting,city',
  },
  {
    id: 3,
    title: 'Abstract Beauty',
    artist: 'Nishat',
    price: '$65',
    image: 'https://source.unsplash.com/400x500/?abstract,art',
  },
  {
    id: 4,
    title: 'Mountain Dream',
    artist: 'Rafi',
    price: '$45',
    image: 'https://source.unsplash.com/400x500/?mountain,art',
  },
];

const ArtFeed = () => {
  return (
    <DashboardLayout>
      <h2>🎨 Art Feed</h2>
      <div className="art-grid">
        {mockArtworks.map((art) => (
          <div key={art.id} className="art-card">
            <img src={art.image} alt={art.title} />
            <h3>{art.title}</h3>
            <p>By {art.artist}</p>
            <p className="price">{art.price}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default ArtFeed;
