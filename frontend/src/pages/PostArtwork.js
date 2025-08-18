// src/pages/PostArtwork.js
import React, { useState } from 'react';
import axios from 'axios';

export default function PostArtwork() {
  const [form, setForm] = useState({ title: '', description: '', tags: '', category: '', price: '' });
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleImage = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      await axios.post('http://localhost:5000/api/artworks', fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setMsg('Artwork posted!');
      setForm({ title: '', description: '', tags: '', category: '', price: '' });
      setImage(null);

      // notify feed to refresh
      window.dispatchEvent(new Event('artwork:posted'));
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to post');
    }
  };

  return (
    <>
      <h2 style={{ marginBottom: 12 }}>Post Artwork</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title *" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} />
        <input name="tags" value={form.tags} onChange={handleChange} placeholder="Tags (comma separated)" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price (optional)" />
        <input type="file" accept="image/*" onChange={handleImage} required />
        <button type="submit">Post</button>
      </form>
      {msg && <p style={{ color: 'green', marginTop: 8 }}>{msg}</p>}
      {err && <p style={{ color: '#b71c1c', marginTop: 8 }}>{err}</p>}
    </>
  );
}
