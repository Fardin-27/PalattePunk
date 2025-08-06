import { jwtDecode } from 'jwt-decode';

// ✅ Save JWT token to localStorage
export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

// ✅ Decode the stored token and return user info
export const decodeToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    return jwtDecode(token); // returns { id, email, role, ... }
  } catch (err) {
    console.error('Token decoding failed:', err);
    return null;
  }
};

// ✅ Get just the token
export const getToken = () => {
  return localStorage.getItem('token');
};

// ✅ Remove token (logout)
export const logout = () => {
  localStorage.removeItem('token');
};
