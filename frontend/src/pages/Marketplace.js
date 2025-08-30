// src/pages/Marketplace.js
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const img = (u) =>
  typeof u === 'string' && u.startsWith('/uploads')
    ? `http://localhost:5000${u}`
    : u || '';

export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/market');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load marketplace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (id) => nav(`/market/art/${id}`);

  const buy = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post(`/market/${id}/buy`);
      setItems((old) => old.filter((x) => x._id !== id));
      alert('✅ Purchase successful!');
    } catch (e2) {
      alert(e2?.response?.data?.message || 'Purchase failed.');
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading marketplace…</p>;
  if (err) return <p style={{ padding: 16, color: '#b00020' }}>{err}</p>;
  if (!items.length) return <p style={{ padding: 16 }}>No items for sale right now.</p>;

  return (
    <div style={{ columnCount: 4, columnGap: 16, padding: 16 }}>
      {items.map((a) => (
        <article
          key={a._id}
          onClick={() => open(a._id)}
          style={{
            breakInside: 'avoid',
            marginBottom: 16,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(0,0,0,.08)',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <Link to={`/market/art/${a._id}`} className="card-link" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            {a.imageUrl ? (
              <img
                src={img(a.imageUrl)}
                alt={a.title || 'Artwork'}
                style={{ width: '100%', display: 'block' }}
                loading="lazy"
              />
            ) : (
              <div style={{
                width: '100%', height: 220, display: 'grid',
                placeItems: 'center', background: '#f2f2f2', color: '#666'
              }}>
                No image
              </div>
            )}

            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{a.title || 'Untitled'}</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                {a?.author?.name || 'Unknown'} · {typeof a.price === 'number' ? `$${a.price}` : '—'}
              </div>
            </div>
          </Link>

          <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8 }}>
            <button
              onClick={(e) => buy(e, a._id)}
              style={{
                border: 'none', background: '#2563eb', color: '#fff',
                padding: '8px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Buy
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); open(a._id); }}
              style={{
                border: '1px solid #ddd', background: '#fff', color: '#111',
                padding: '8px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
              }}
            >
              View
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
