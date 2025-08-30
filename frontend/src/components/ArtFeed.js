// src/components/ArtFeed.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './ArtFeed.css';

const toStr = (v) => (v ?? '').toString().toLowerCase();

const mockArtworks = [
  { _id: 'm1', title: 'Green City', description: 'Concept art city', image: 'https://source.unsplash.com/600x800/?city,art', author: { name: 'PalettePunk' } },
  { _id: 'm2', title: 'Mountain Dream', description: 'Landscape vibes', image: 'https://source.unsplash.com/600x800/?mountain,art', author: { name: 'PalettePunk' } },
  { _id: 'm3', title: 'Watercolor Fields', description: 'Watercolor landscape', image: 'https://source.unsplash.com/600x800/?watercolor,art', author: { name: 'PalettePunk' } },
];

export default function ArtFeed({ mode = 'simple', q = '', filters = {} }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const gridRef = useRef(null);
  const ROW = 8;
  const GAP = 16;

  const srcOf = (raw) =>
    typeof raw === 'string' && raw.startsWith('/uploads')
      ? `http://localhost:5000${raw}`
      : raw || '';

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        let res = await api.get('/artworks');
        let data = Array.isArray(res.data) ? res.data : [];
        if (!live) return;
        setItems(data);
      } catch (e) {
        if (!live) return;
        console.error('GET /artworks failed:', e);
        setErr('Could not load artworks. Showing sample feed.');
        setItems(mockArtworks);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const filtered = useMemo(() => {
    let out = items.slice();
    if (mode === 'simple' && q.trim()) {
      const qq = toStr(q);
      out = out.filter((it) =>
        toStr(it.title).includes(qq) ||
        toStr(it.description).includes(qq) ||
        toStr(it?.author?.name).includes(qq)
      );
    }
    if (mode === 'advanced' && filters) {
      const f = filters;
      if (f.title) out = out.filter((it) => toStr(it.title).includes(toStr(f.title)));
      if (f.description) out = out.filter((it) => toStr(it.description).includes(toStr(f.description)));
      if (f.artist) out = out.filter((it) => toStr(it?.author?.name).includes(toStr(f.artist)));
      if (Array.isArray(f.tags) && f.tags.length) {
        const want = f.tags.map(toStr);
        out = out.filter((it) => {
          const got = (it.tags || []).map(toStr);
          return want.some((t) => got.includes(t));
        });
      }
      if (typeof f.minPrice === 'number') out = out.filter((it) => typeof it.price === 'number' && it.price >= f.minPrice);
      if (typeof f.maxPrice === 'number') out = out.filter((it) => typeof it.price === 'number' && it.price <= f.maxPrice);
      if (f.sort === 'oldest') out.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      else out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return out;
  }, [items, mode, q, filters]);

  const measureAll = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('.pin');
    cards.forEach((card) => {
      const content = card.querySelector('.pin-inner');
      if (!content) return;
      const h = content.getBoundingClientRect().height;
      const span = Math.ceil((h + GAP) / (ROW + GAP));
      card.style.gridRowEnd = `span ${span}`;
    });
  }, []);

  useEffect(() => {
    measureAll();
    const onResize = () => measureAll();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [filtered, measureAll]);

  const onImgLoad = () => measureAll();
  const showEmpty = !loading && !err && filtered.length === 0;

  return (
    <div className="feed-wrapper">
      {loading && <p className="feed-note">Loading feed…</p>}
      {!loading && err && <p className="feed-error">{err}</p>}

      {showEmpty && (
        <div className="empty-state" style={{ padding: '16px 8px' }}>
          <h3>No artworks yet</h3>
          <p>Be the first to post your artwork!</p>
        </div>
      )}

      <div className="grid-masonry" ref={gridRef}>
        {filtered.map((art, i) => {
          const hasId = Boolean(art._id);
          const id = art._id || String(i);
          const img = srcOf(art.imageUrl || art.image);
          const title = art.title || 'Untitled';
          const author = art?.author?.name || 'Unknown';
          return (
            <article
              key={id}
              className="pin"
              onClick={() => hasId && nav(`/art/${id}`)}
              role="button"
              style={{ cursor: hasId ? 'pointer' : 'default' }}
            >
              <div className="pin-inner">
                {img ? (
                  <img src={img} alt={title} loading="lazy" onLoad={onImgLoad} />
                ) : (
                  <div className="img-placeholder">No image</div>
                )}
                <div className="pin-meta">
                  <div className="pin-title">{title}</div>
                  <div className="pin-sub">By {author}</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
