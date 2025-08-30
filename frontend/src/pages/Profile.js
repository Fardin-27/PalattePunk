// src/pages/Profile.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Profile.css';

const imgSrc = (raw) =>
  typeof raw === 'string' && raw.startsWith('/uploads')
    ? `http://localhost:5000${raw}`
    : raw || '';

export default function Profile() {
  // header/user
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState('');
  const [meLoading, setMeLoading] = useState(true);

  // my artworks
  const [mine, setMine] = useState([]);
  const [mineErr, setMineErr] = useState('');
  const [mineLoading, setMineLoading] = useState(true);

  // purchases
  const [purch, setPurch] = useState([]);
  const [purchErr, setPurchErr] = useState('');
  const [purchLoading, setPurchLoading] = useState(true);

  // role request
  const [reason, setReason] = useState('');
  const [targetRole, setTargetRole] = useState('Artist');
  const [rrOk, setRrOk] = useState('');
  const [rrErr, setRrErr] = useState('');
  const [rrBusy, setRrBusy] = useState(false);

  // about edit
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  // avatar upload (left as-is; UI button removed)
  const [avBusy, setAvBusy] = useState(false);
  const [avErr, setAvErr] = useState('');
  const fileRef = useRef(null);

  // load profile header + sections
  useEffect(() => {
    let live = true;

    (async () => {
      try {
        setMeLoading(true);
        const r = await api.get('/profile/me');
        if (!live) return;
        setMe(r.data);
        setName(r.data?.name || '');
        setBio(r.data?.bio || '');
        setMeErr('');
      } catch (e) {
        if (!live) return;
        setMeErr('Failed to load profile.');
      } finally {
        if (live) setMeLoading(false);
      }
    })();

    (async () => {
      try {
        setMineLoading(true);
        const r = await api.get('/profile/my-artworks');
        if (!live) return;
        setMine(Array.isArray(r.data) ? r.data : []);
        setMineErr('');
      } catch (e) {
        if (!live) return;
        setMineErr('Could not load your artworks.');
      } finally {
        if (live) setMineLoading(false);
      }
    })();

    (async () => {
      try {
        setPurchLoading(true);
        const r = await api.get('/profile/purchases');
        if (!live) return;
        setPurch(Array.isArray(r.data) ? r.data : []);
        setPurchErr('');
      } catch (e) {
        if (!live) return;
        setPurchErr('Could not load your purchases yet.');
      } finally {
        if (live) setPurchLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  const myName = me?.name || 'User';
  const myRole = me?.role || '';
  const myEmail = me?.email || '';

  const smallCards = useMemo(
    () => ({ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }),
    []
  );

  const onSaveAbout = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setSaveMsg('');
    setSaveErr('');
    try {
      const r = await api.patch('/profile/me', { bio, name });
      setSaveMsg('Saved!');
      setMe((m) => (m ? { ...m, bio, name } : m));
    } catch (e) {
      setSaveErr(e?.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 1200);
    }
  };

  const onRequestRole = async (e) => {
    e?.preventDefault?.();
    if (!reason.trim()) return;
    setRrBusy(true);
    setRrOk('');
    setRrErr('');
    try {
      await api.post('/roles/request', {
        requestedRole: targetRole,
        reason: reason.trim(),
      });
      setRrOk('Request sent to admin.');
      setReason('');
    } catch (e) {
      setRrErr(e?.response?.data?.message || 'Failed to send request.');
    } finally {
      setRrBusy(false);
    }
  };

  // kept (no UI triggers now)
  const onPickAvatar = () => fileRef.current?.click();

  const onUploadAvatar = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setAvBusy(true);
    setAvErr('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const r = await api.post('/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = r?.data?.avatarUrl;
      if (!newUrl) throw new Error('No avatar URL returned.');
      setMe((m) => (m ? { ...m, avatarUrl: newUrl } : m));
    } catch (err) {
      setAvErr(
        err?.response?.data?.message ||
          'Failed to upload avatar. (Ensure backend route exists.)'
      );
    } finally {
      setAvBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="profile-page">
      {/* header */}
      <div className="profile-header">
        <div className="avatar-wrap">
          {me?.avatarUrl ? (
            <img src={imgSrc(me.avatarUrl)} alt={myName} />
          ) : (
            <div className="avatar-ph">👤</div>
          )}
          {/* Removed Change Avatar button & file input */}
          <span className="muted">{myRole}</span>
        </div>

        <div>
          <h2 style={{ margin: 0 }}>
            {meLoading ? <span className="loader-inline">Loading…</span> : myName}
          </h2>
          <div className="meta-line">
            {meLoading ? <span className="loader-inline">Loading…</span> : myEmail}
          </div>
          {meErr && <div className="error" style={{ marginTop: 6 }}>{meErr}</div>}
        </div>
      </div>

      {/* About (name + bio) */}
      <div className="card">
        <form className="form-grid" onSubmit={onSaveAbout}>
          <label>
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
            />
          </label>

          <label className="full">
            <span>Bio</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about you…"
            />
          </label>
          <div className="actions">
            <button className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saveMsg && <span className="ok" style={{ marginLeft: 8 }}>{saveMsg}</span>}
            {saveErr && <span className="error" style={{ marginLeft: 8 }}>{saveErr}</span>}
          </div>
        </form>
      </div>

      {/* Role change request */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Request a role change</h3>
        <form className="form-grid" onSubmit={onRequestRole}>
          <label>
            <span>Target role</span>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="Artist">Artist</option>
              <option value="Buyer">Buyer</option>
            </select>
          </label>

          <label className="full">
            <span>Reason</span>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want this role?"
            />
          </label>

          <div className="actions">
            <button className="btn primary" disabled={rrBusy || !reason.trim()}>
              {rrBusy ? 'Sending…' : 'Send request'}
            </button>
            {rrOk && <span className="ok" style={{ marginLeft: 8 }}>{rrOk}</span>}
            {rrErr && <span className="error" style={{ marginLeft: 8 }}>{rrErr}</span>}
          </div>
        </form>
      </div>

      {/* My Artworks */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>My artworks</h3>
        {mineErr && <p className="error">{mineErr}</p>}
        {mineLoading && <p className="muted">Loading…</p>}
        {!mineErr && !mineLoading && (
          <div className="grid-mine" style={smallCards}>
            {mine.map((a) => (
              <Link key={a._id} to={`/art/${a._id}`} className="mini-card link-card">
                <img src={imgSrc(a.imageUrl)} alt={a.title || 'Artwork'} />
                <div className="mini-meta">
                  <div className="mini-title">{a.title || 'Untitled'}</div>
                </div>
              </Link>
            ))}
            {!mine.length && <p className="muted">You haven’t posted any artworks yet.</p>}
          </div>
        )}
      </div>

      {/* My Purchases */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>My purchases</h3>
        {purchErr && <p className="error">{purchErr}</p>}
        {purchLoading && <p className="muted">Loading…</p>}
        {!purchErr && !purchLoading && (
          <div className="grid-mine" style={smallCards}>
            {purch.map((a) => (
              <Link key={a._id} to={`/art/${a._id}`} className="mini-card link-card">
                <img src={imgSrc(a.imageUrl)} alt={a.title || 'Artwork'} />
                <div className="mini-meta">
                  <div className="mini-title">{a.title || 'Untitled'}</div>
                  {typeof a.price === 'number' ? (
                    <div className="mini-price">${a.price}</div>
                  ) : null}
                </div>
              </Link>
            ))}
            {!purch.length && <p className="muted">No purchases yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
