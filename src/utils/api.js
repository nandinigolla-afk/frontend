import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────
// MOBILE / NETWORK ACCESS
// If you want to use MPAS from your phone or other devices on the same
// Wi-Fi, change the IP below to your computer's LAN IP address.
//
// Find your LAN IP:
//   Windows : ipconfig           (look for IPv4 Address)
//   Mac/Linux: ifconfig / ip a   (look for inet 192.168.x.x)
//
// Then set it in  frontend/.env :
//   REACT_APP_API_URL=http://192.168.1.42:5000
//
// The server also prints its LAN IP when it starts:
//   Network: http://192.168.1.42:5000  ← use this
// ─────────────────────────────────────────────────────────────────────

export const API_BASE = process.env.REACT_APP_API_URL || 'https://mpas-backend.onrender.com';

const api = axios.create({
  baseURL : `${API_BASE}/api`,
  headers : { 'Content-Type': 'application/json' },
  timeout : 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mpas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mpas_token');
      localStorage.removeItem('mpas_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
