// ✅ src/pages/ExplorePage.js
import React, { useState } from 'react';
import ArtFeed from '../components/ArtFeed';
import './ExplorePage.css';

export default function ExplorePage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    artist: '',
    tags: '',
    minPrice: '',
    maxPrice: '',
    sort: 'recent',
  });

  // Keep a stable filters object so ArtFeed doesn’t refetch infinitely
  const [filters, setFilters] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tagList = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setFilters({
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      artist: form.artist.trim() || undefined,
      tags: tagList.length ? tagList : undefined,   // OR-matching handled in ArtFeed
      minPrice: form.minPrice !== '' ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice !== '' ? Number(form.maxPrice) : undefined,
      sort: form.sort,
    });
  };

  const handleClear = () => {
    setForm({
      title: '',
      description: '',
      artist: '',
      tags: '',
      minPrice: '',
      maxPrice: '',
      sort: 'recent',
    });
    setFilters({});
  };

  return (
    <>
      <h2 className="explore-title">Explore Artworks</h2>

      <form className="explore-advanced" onSubmit={handleSubmit}>
        <div className="row two">
          <div className="field">
            <label htmlFor="title">Title contains</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. sunset" />
          </div>
          <div className="field">
            <label htmlFor="artist">Artist name contains</label>
            <input id="artist" name="artist" value={form.artist} onChange={handleChange} placeholder="e.g. fardin" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description contains</label>
          <textarea id="description" name="description" rows={2} value={form.description} onChange={handleChange} placeholder="e.g. watercolor, abstract" />
        </div>

        <div className="field">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. watercolor, abstract, portrait" />
        </div>

        <div className="row three">
          <div className="field">
            <label htmlFor="minPrice">Min price</label>
            <input id="minPrice" name="minPrice" type="number" min="0" value={form.minPrice} onChange={handleChange} placeholder="e.g. 10" />
          </div>
          <div className="field">
            <label htmlFor="maxPrice">Max price</label>
            <input id="maxPrice" name="maxPrice" type="number" min="0" value={form.maxPrice} onChange={handleChange} placeholder="e.g. 500" />
          </div>
          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" value={form.sort} onChange={handleChange}>
              <option value="recent">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="actions">
          <button type="submit">Apply Filters</button>
          <button type="button" onClick={handleClear}>Clear</button>
        </div>
      </form>

      {/* Full-width feed below the card */}
      <ArtFeed mode="advanced" filters={filters} />
    </>
  );
}
