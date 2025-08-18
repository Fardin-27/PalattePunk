// ✅ src/utils/auth.js
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';

// Save JWT token to localStorage
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Decode the stored token and return user info
export const decodeToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    return jwtDecode(token); // returns { id, email, role, ... }
  } catch (err) {
    console.error('Token decoding failed:', err);
    return null;
  }
};

// Get just the token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token (logout)
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
