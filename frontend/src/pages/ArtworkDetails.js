// src/pages/ArtworkDetails.js
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import './ArtworkDetails.css';

const imgSrc = (raw) =>
  typeof raw === 'string' && raw.startsWith('/uploads')
    ? `http://localhost:5000${raw}`
    : raw || '';

export default function ArtworkDetails() {
  const { id } = useParams();

  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [fbText, setFbText] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbErr, setFbErr] = useState('');

  // load artwork
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await api.get(`/artworks/${id}`);
        if (!live) return;
        setArt(res.data);
      } catch (e) {
        if (!live) return;
        setErr('Could not load artwork.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [id]);

  const onSendFeedback = async (e) => {
    e.preventDefault();
    if (!fbText.trim()) return;
    setFbLoading(true);
    setFbErr('');
    try {
      const res = await api.post(`/artworks/${id}/feedback`, { text: fbText.trim() });
      const newFb = res.data?.feedback;
      // append the new feedback so it shows immediately
      if (newFb) {
        setArt(prev => {
          const prevList =
            (Array.isArray(prev?.feedbacks) && prev.feedbacks) ||
            (Array.isArray(prev?.comments) && prev.comments) ||
            [];
          const updated = [newFb, ...prevList];
          // keep both keys in sync for compatibility with other code paths
          return { ...prev, feedbacks: updated, comments: updated };
        });
      }
      setFbText('');
    } catch (e) {
      setFbErr(e?.response?.data?.message || 'Failed to post feedback.');
    } finally {
      setFbLoading(false);
    }
  };

  // normalize comments from either "feedbacks" (current API) or legacy "comments"
  const comments = useMemo(() => {
    const raw =
      (Array.isArray(art?.feedbacks) && art.feedbacks) ||
      (Array.isArray(art?.comments) && art.comments) ||
      [];
    return raw.map((f) => ({
      _id: f._id,
      // API populates 'author' — fall back to legacy 'user'
      name: (f.author && f.author.name) || (f.user && f.user.name) || 'User',
      text: f.text || f.content || '',
      createdAt: f.createdAt,
    }));
  }, [art]);

  if (loading) return <div className="ad-wrap"><p className="muted">Loading…</p></div>;
  if (err) return <div className="ad-wrap"><p className="error">{err}</p></div>;
  if (!art) return null;

  const price =
    typeof art.price === 'number' && art.price > 0 ? `$${art.price}` : null;

  return (
    <div className="ad-wrap">
      {/* LEFT: plain image */}
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

      {/* RIGHT: details + feedback */}
      <aside className="ad-right">
        <div className="ad-card">
          <div className="ad-title">{art.title || 'Untitled'}</div>
          <div className="ad-sub">
            By <b>{art?.author?.name || 'Unknown'}</b>
            {price ? <> · <b>{price}</b></> : null}
          </div>

          {art.tags?.length ? (
            <div className="ad-tags">
              {art.tags.map((t, i) => <span key={`${t}-${i}`}>#{t}</span>)}
            </div>
          ) : null}

          {art.description ? (
            <p className="ad-desc">{art.description}</p>
          ) : (
            <p className="ad-desc muted">No description.</p>
          )}
        </div>

        <div className="ad-card">
          <h3 className="ad-h3">Leave a feedback</h3>
          <form onSubmit={onSendFeedback} className="ad-fb-form">
            <textarea
              rows={3}
              placeholder="Say something nice or helpful…"
              value={fbText}
              onChange={(e) => setFbText(e.target.value)}
            />
            <div className="ad-actions">
              <button className="btn primary" disabled={fbLoading || !fbText.trim()}>
                {fbLoading ? 'Posting…' : 'Post'}
              </button>
              {fbErr && <span className="error" style={{ marginLeft: 8 }}>{fbErr}</span>}
            </div>
          </form>
        </div>

        <div className="ad-card">
          <h3 className="ad-h3">Feedback</h3>
          {!comments.length ? (
            <p className="muted">No feedback yet.</p>
          ) : (
            <ul className="ad-fb-list">
              {comments.map((c, i) => (
                <li key={c._id || i} className="ad-fb-item">
                  <div className="ad-fb-head">
                    <b>{c.name}</b>
                    <span className="ad-time">
                      {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="ad-fb-text">{c?.text}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
