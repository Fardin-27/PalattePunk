// ✅ src/pages/ArtworkDetails.js
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getToken, decodeToken } from '../utils/auth';
import './ArtworkDetails.css';

export default function ArtworkDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [feedback, setFeedback] = useState('');
  const [all, setAll] = useState([]); // for related feed below

  const token = getToken();
  const me = decodeToken(); // {id, role, ...} or null

  const srcOf = (raw) =>
    typeof raw === 'string' && raw.startsWith('/uploads')
      ? `http://localhost:5000${raw}`
      : raw || '';

  const fetchOne = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get(`/artworks/${id}`);
      setArt(res.data);
    } catch (e) {
      console.error('GET /artworks/:id failed', e);
      setErr('Could not load artwork.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    try {
      const res = await api.get('/artworks');
      setAll(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('GET /artworks failed for related feed', e);
      setAll([]);
    }
  };

  useEffect(() => {
    fetchOne();
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    try {
      await api.post(
        `/artworks/${id}/feedback`,
        { text: feedback.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback('');
      fetchOne(); // refresh comments
    } catch (e) {
      console.error('POST feedback failed', e);
      alert(e?.response?.data?.message || 'Failed to add feedback');
    }
  };

  // Related: same artist first; exclude current; then fallback to others (limit ~12)
  const related = useMemo(() => {
    if (!art) return [];
    const meId = art._id?.toString?.();
    const authorName = (art?.author?.name || '').toLowerCase();
    const sameArtist = all.filter(
      (x) =>
        x._id !== meId &&
        (x?.author?.name || '').toLowerCase() === authorName
    );
    const others = all.filter(
      (x) =>
        x._id !== meId &&
        (x?.author?.name || '').toLowerCase() !== authorName
    );
    return [...sameArtist, ...others].slice(0, 12);
  }, [all, art]);

  if (loading) return <div className="art-details-wrap"><p>Loading…</p></div>;
  if (err) return <div className="art-details-wrap"><p className="error">{err}</p></div>;
  if (!art) return null;

  const img = srcOf(art.imageUrl || art.image);
  const authorName = art?.author?.name || 'Unknown artist';

  return (
    <div className="art-details-wrap">
      <div className="art-details-card">
        {/* Media (left) */}
        <div className="art-media">
          {img ? (
            <img src={img} alt={art.title} />
          ) : (
            <div className="img-placeholder">No image</div>
          )}
        </div>

        {/* Info (right) */}
        <div className="art-info">
          <div className="brand">PalettePunk</div>
          <h1 className="title">{art.title || 'Untitled'}</h1>

          <div className="byline">
            By <strong>{authorName}</strong>
          </div>

          {typeof art.price === 'number' && (
            <div className="price">Price: ${art.price}</div>
          )}

          {art.tags?.length ? (
            <div className="tags">
              {art.tags.map((t, i) => (
                <span className="tag" key={i}>#{t}</span>
              ))}
            </div>
          ) : null}

          <p className="desc">
            {art.description || 'No description provided.'}
          </p>

          <div className="divider" />

          {/* Feedback section */}
          <section className="feedback-sec">
            <h3>Feedback</h3>

            {/* Comment form first */}
            {me ? (
              <form className="feedback-form" onSubmit={submitFeedback}>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write your feedback…"
                />
                <button type="submit">Post Feedback</button>
              </form>
            ) : (
              <p className="muted">Log in to leave feedback.</p>
            )}

            {/* Then the comments list */}
            {art.comments?.length ? (
              <ul className="comments">
                {art.comments.map((c) => (
                  <li key={c._id}>
                    <div className="c-head">
                      <span className="c-author">{c?.user?.name || 'User'}</span>
                      <span className="c-time">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="c-body">{c.text}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No feedback yet.</p>
            )}
          </section>
        </div>
      </div>

      {/* Related feed BELOW the comment box */}
      <section className="related-sec">
        <h3>More like this</h3>
        <div className="related-grid">
          {related.map((r) => {
            const rid = r._id;
            const rimg = srcOf(r.imageUrl || r.image);
            const rtitle = r.title || 'Untitled';
            const rauthor = r?.author?.name || 'Unknown';

            return (
              <article
                key={rid}
                className="rel-card"
                onClick={() => nav(`/art/${rid}`)}
                role="button"
              >
                {rimg ? (
                  <img src={rimg} alt={rtitle} loading="lazy" />
                ) : (
                  <div className="img-placeholder">No image</div>
                )}
                <div className="rel-meta">
                  <div className="rel-title">{rtitle}</div>
                  <div className="rel-sub">By {rauthor}</div>
                </div>
              </article>
            );
          })}
          {!related.length && (
            <p className="muted">No related artworks yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
