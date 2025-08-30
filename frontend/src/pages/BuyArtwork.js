// src/pages/BuyArtwork.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const imgSrc = (raw) =>
  typeof raw === 'string' && raw.startsWith('/uploads')
    ? `http://localhost:5000${raw}`
    : raw || '';

export default function BuyArtwork() {
  const { id } = useParams();
  const nav = useNavigate();
  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/artworks/${id}`);
        if (!live) return;
        setArt(res.data);
      } catch (e) {
        if (!live) return;
        setErr('Artwork not found');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [id]);

  const onBuy = async () => {
    try {
      await api.post('/market/purchase', { artworkId: id });
      alert('✅ Purchase successful!');
      nav('/profile'); // Profile shows "My Purchases"
    } catch (e) {
      const msg = e?.response?.data?.message || 'Purchase failed';
      alert('❌ ' + msg);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (err) return <p className="error">{err}</p>;
  if (!art) return null;

  return (
    <div className="buy-page">
      {art.imageUrl ? <img src={imgSrc(art.imageUrl)} alt={art.title} /> : null}
      <h2>{art.title}</h2>
      <p>by {art?.author?.name || 'Unknown'}</p>
      <p>{art.description}</p>
      <p>{typeof art.price === 'number' ? `$${art.price}` : 'Free'}</p>
      <button className="btn primary" onClick={onBuy}>
        Buy
      </button>
      <button className="btn muted" onClick={() => nav(-1)}>
        Back
      </button>
    </div>
  );
}
