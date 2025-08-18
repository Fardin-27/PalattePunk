// src/components/Layout.js
import React from 'react';
import LeftRail from './LeftRail';
import './Layout.css';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <LeftRail />
      <main className="with-rail">
        {children}
      </main>
    </div>
  );
}
