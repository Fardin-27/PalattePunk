// src/pages/ManageArtworks.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './ManageArtworks.css';

const srcOf = (raw) =>
  typeof raw === 'string' && raw.startsWith('/uploads')
    ? `http://localhost:5000${raw}`
    : raw || '';

export default function ManageArtworks() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const fetchList = async () => {
    try {
      setLoading(true);
      setErr('');
      const qs = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
      const r = await api.get(`/admin/artworks${qs}`);
      setItems(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      console.error('GET /admin/artworks failed', e);
      setErr('Failed to load artworks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const toggleHide = async (id, currentStatus) => {
    const next = currentStatus === 'hidden' ? 'published' : 'hidden';
    await api.patch(`/admin/artworks/${id}/status`, { status: next });
    fetchList();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this artwork?')) return;
    await api.delete(`/admin/artworks/${id}`);
    fetchList();
  };

  return (
    <div className="adm-wrap">
      <header className="adm-head">
        <h2>Manage Artworks</h2>
        <div className="adm-controls">
          <label>
            Status:&nbsp;
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
              <option value="sold">Sold</option>
            </select>
          </label>
        </div>
      </header>

      {loading && <p className="note">Loading…</p>}
      {!loading && err && <p className="error">{err}</p>}

      <section className="grid-regular">
        {items.map((it) => {
          const id = it._id;
          const img = srcOf(it.imageUrl || it.image);
          const title = it.title || 'Untitled';
          const author = it?.author?.name || 'Unknown';
          const price =
            typeof it.price === 'number' && it.price > 0 ? `$${it.price}` : null;

          return (
            <article key={id} className="card">
              <div className="card-media" onClick={() => nav(`/admin/artworks/${id}`)}>
                {img ? (
                  <img src={img} alt={title} loading="lazy" />
                ) : (
                  <div className="img-placeholder">No image</div>
                )}
              </div>

              <div className="card-body" onClick={() => nav(`/admin/artworks/${id}`)}>
                <div className="card-title">{title}</div>
                <div className="card-sub">
                  By {author}
                  {price ? <strong> • {price}</strong> : null} • <em>{it.status}</em>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="btn small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHide(id, it.status);
                  }}
                  title={it.status === 'hidden' ? 'Publish' : 'Hide'}
                >
                  {it.status === 'hidden' ? 'Publish' : 'Hide'}
                </button>
                <button
                  className="btn danger small"
                  onClick={(e) => {
                    e.stopPropagation();
                    del(id);
                  }}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {!loading && !err && !items.length && (
        <p className="muted">No artworks to display.</p>
      )}
    </div>
  );
}
