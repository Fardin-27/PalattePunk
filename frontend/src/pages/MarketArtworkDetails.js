// src/pages/MarketArtworkDetails.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import './ArtworkDetails.css'; // reuse the same CSS as ArtworkDetails

const imgSrc = (raw) =>
  typeof raw === 'string' && raw.startsWith('/uploads')
    ? `http://localhost:5000${raw}`
    : raw || '';

export default function MarketArtworkDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [buyBusy, setBuyBusy] = useState(false);
  const [buyMsg, setBuyMsg] = useState('');
  const [buyErr, setBuyErr] = useState('');

  // Load a single FOR-SALE artwork (buyer view)
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await api.get(`/market/${id}`);
        if (!live) return;
        setArt(res.data || null);
      } catch (e) {
        if (!live) return;
        setErr('Could not load artwork.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [id]);

  const priceText = useMemo(() => {
    if (!art || typeof art.price !== 'number') return '';
    return `$${art.price}`;
  }, [art]);

  const onBuy = async () => {
    if (!art) return;
    setBuyBusy(true);
    setBuyMsg('');
    setBuyErr('');
    try {
      await api.post(`/market/${art._id}/buy`);
      setBuyMsg('Purchase successful! Redirecting…');
      setTimeout(() => nav('/market'), 900);
    } catch (e) {
      setBuyErr(e?.response?.data?.message || 'Purchase failed.');
    } finally {
      setBuyBusy(false);
    }
  };

  if (loading) return <div className="ad-wrap"><p className="muted">Loading…</p></div>;
  if (err) return <div className="ad-wrap"><p className="error">{err}</p></div>;
  if (!art) return null;

  return (
    <div className="ad-wrap">
      {/* LEFT: plain image (same as ArtworkDetails) */}
      <section className="ad-left">
        {art.imageUrl ? (
          <img
            src={imgSrc(art.imageUrl)}
            alt={art.title || 'Artwork'}
            className="ad-image"
            loading="eager"
          />
        ) : (
          <div className="ad-image ad-image-ph">No image</div>
        )}
      </section>

      {/* RIGHT: details + Buy/Back (styled like ArtworkDetails cards) */}
      <aside className="ad-right">
        <div className="ad-card">
          <div className="ad-title">{art.title || 'Untitled'}</div>
          <div className="ad-sub">
            By <b>{art?.author?.name || 'Unknown'}</b>
            {priceText ? <> · <b>{priceText}</b></> : null}
          </div>

          {Array.isArray(art.tags) && art.tags.length > 0 && (
            <div className="ad-tags">
              {art.tags.map((t, i) => <span key={`${t}-${i}`}>#{t}</span>)}
            </div>
          )}

          {art.description ? (
            <p className="ad-desc">{art.description}</p>
          ) : (
            <p className="ad-desc muted">No description.</p>
          )}

          <div className="ad-actions" style={{ marginTop: 8, justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => nav(-1)}>← Back</button>
            <button className="btn primary" onClick={onBuy} disabled={buyBusy}>
              {buyBusy ? 'Processing…' : 'Buy'}
            </button>
          </div>

          {buyMsg && <p className="ok" style={{ marginTop: 8 }}>{buyMsg}</p>}
          {buyErr && <p className="error" style={{ marginTop: 8 }}>{buyErr}</p>}
        </div>
      </aside>
    </div>
  );
}
