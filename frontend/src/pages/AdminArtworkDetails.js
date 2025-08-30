// src/pages/AdminArtworkDetails.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import './AdminArtworkDetails.css';

const srcOf = (raw) =>
  typeof raw === 'string' && raw.startsWith('/uploads')
    ? `http://localhost:5000${raw}`
    : raw || '';

export default function AdminArtworkDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const fetchOne = async () => {
    try {
      setLoading(true);
      setErr('');
      const r = await api.get(`/admin/artworks/${id}`);
      setArt(r.data);
    } catch (e) {
      console.error('GET /admin/artworks/:id failed', e);
      setErr('Could not load artwork.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const publishOrHide = async () => {
    if (!art) return;
    const next = art.status === 'hidden' ? 'published' : 'hidden';
    try {
      await api.patch(`/admin/artworks/${art._id}/status`, { status: next });
      await fetchOne();
    } catch (e) {
      console.error('PATCH status failed', e);
      alert('Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!art) return;
    if (!window.confirm('Delete this artwork?')) return;
    try {
      await api.delete(`/admin/artworks/${art._id}`);
      nav('/admin/artworks', { replace: true });
    } catch (e) {
      console.error('DELETE failed', e);
      alert('Failed to delete.');
    }
  };

  const img = useMemo(() => srcOf(art?.imageUrl || art?.image), [art]);

  return (
    <div className="adm-art-page">
      <div className="adm-art-actions-top">
        <button className="btn" onClick={() => nav(-1)}>← Back</button>
        <div className="btn-row">
          <button className="btn" onClick={publishOrHide}>
            {art?.status === 'hidden' ? 'Publish' : 'Hide'}
          </button>
          <button className="btn danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {loading && <p className="note">Loading…</p>}
      {!loading && err && <p className="error">{err}</p>}

      {art && (
        <div className="adm-art-grid">
          {/* LEFT: image (no border, left-aligned) */}
          <div className="adm-media">
            {img ? (
              <img src={img} alt={art.title || 'Artwork'} />
            ) : (
              <div className="img-ph">No image</div>
            )}
          </div>

          {/* RIGHT: details */}
          <aside className="adm-details">
            <h2 className="adm-title">{art.title || 'Untitled'}</h2>
            <div className="adm-meta">
              <div>
                <strong>By:</strong> {art?.author?.name || 'Unknown'}
              </div>
              <div>
                <strong>Status:</strong> {art.status}
              </div>
              {typeof art.price === 'number' && art.price > 0 && (
                <div>
                  <strong>Price:</strong> ${art.price}
                </div>
              )}
              {Array.isArray(art.tags) && art.tags.length ? (
                <div className="tags">
                  {art.tags.map((t, i) => (
                    <span key={i} className="tag">#{t}</span>
                  ))}
                </div>
              ) : null}
            </div>

            {art.description ? (
              <p className="adm-desc">{art.description}</p>
            ) : (
              <p className="adm-desc muted">No description.</p>
            )}

            <div className="adm-art-actions-bottom">
              <button className="btn" onClick={publishOrHide}>
                {art.status === 'hidden' ? 'Publish' : 'Hide'}
              </button>
              <button className="btn danger" onClick={handleDelete}>Delete</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
