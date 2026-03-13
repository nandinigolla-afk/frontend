import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/api';

const SocketContext = createContext(null);

// ── Service Worker ────────────────────────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('SW register failed:', e.message);
    return null;
  }
}

// ── Show notification (when tab is open) ─────────────────────────────
async function showNotification(title, body, tag = 'mpas', url = '/') {
  // Tab blink — always works
  const orig = document.title;
  let blink = false;
  const iv = setInterval(() => { document.title = blink ? `🔔 ${title}` : orig; blink = !blink; }, 900);
  setTimeout(() => { clearInterval(iv); document.title = orig; }, 15000);

  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico', tag, requireInteraction: true, vibrate: [200, 100, 200], data: { url } });
  } catch (e) {
    try { new Notification(title, { body, icon: '/favicon.ico', tag }); } catch (_) {}
  }
}

// ── Web Push subscription ─────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}

async function subscribeToPush(userId) {
  try {
    // Get VAPID public key from backend
    const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
    if (!res.ok) return;
    const { publicKey } = await res.json();
    if (!publicKey) return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      // Already subscribed — just save to backend
      await saveSubscription(existing, userId);
      return;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly     : true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await saveSubscription(subscription, userId);
    console.log('🔔 Web Push subscription created');
  } catch (e) {
    console.warn('Push subscribe failed:', e.message);
  }
}

async function saveSubscription(subscription, userId) {
  const token = localStorage.getItem('mpas_token');
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/push/subscribe`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body   : JSON.stringify({ subscription }),
    });
  } catch (e) {
    console.warn('Save subscription failed:', e.message);
  }
}

// ── Permissions ───────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
}

export function requestGeolocation(socket, userId) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        localStorage.setItem('mpas_lat', lat);
        localStorage.setItem('mpas_lng', lng);
        if (socket?.connected && userId) socket.emit('update_location', { userId, lat, lng });
        resolve({ lat, lng });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

// ── SocketProvider ────────────────────────────────────────────────────
export const SocketProvider = ({ children }) => {
  const [socket,    setSocket]    = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Register SW once on mount
  useEffect(() => { registerSW(); }, []);

  // Connect socket
  useEffect(() => {
    const s = io(API_BASE, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
      timeout: 20000,
      withCredentials: true,
    });
    socketRef.current = s;

    s.on('connect',       () => { setConnected(true);  console.log('🔌 Socket connected'); });
    s.on('disconnect',    () => { setConnected(false); });
    s.on('connect_error', (e) => console.warn('🔌 Socket error:', e.message));

    s.on('new_alert', ({ title, message, report }) => {
      showNotification(title || '🚨 Missing Person Alert', message || 'Someone is missing near you.', 'mpas-alert-' + (report?._id || Date.now()), report?._id ? `/alerts/${report._id}` : '/');
    });
    s.on('case_resolved', ({ title, message, personName }) => {
      showNotification(title || `✅ ${personName} Found`, message || `${personName} has been safely found.`, 'mpas-resolved');
    });
    s.on('notification', ({ type, status, personName }) => {
      if (type === 'status_update') showNotification('📋 Report Update', `Your report for ${personName} is now: ${status}`, 'mpas-status');
    });
    s.on('sighting_verified', ({ personName, locationName }) => {
      showNotification(`📍 Sighting: ${personName}`, `A sighting near ${locationName} was confirmed.`, 'mpas-sighting');
    });

    setSocket(s);
    return () => { s.disconnect(); socketRef.current = null; };
  }, []);

  // Auth + location + push subscription when user logs in
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('authenticate', user._id);
    if (user.role === 'admin') socket.emit('join_admin');

    // Send stored location
    const lat = localStorage.getItem('mpas_lat');
    const lng = localStorage.getItem('mpas_lng');
    if (lat && lng && socket.connected) socket.emit('update_location', { userId: user._id, lat: parseFloat(lat), lng: parseFloat(lng) });

    // Subscribe to Web Push if notification permission already granted
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      subscribeToPush(user._id);
    }

    // Refresh location every 5 min
    const iv = setInterval(() => {
      const la = localStorage.getItem('mpas_lat');
      const ln = localStorage.getItem('mpas_lng');
      if (la && ln && socket.connected) socket.emit('update_location', { userId: user._id, lat: parseFloat(la), lng: parseFloat(ln) });
    }, 300_000);

    return () => clearInterval(iv);
  }, [socket, user, connected]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export { subscribeToPush };
export const useSocket = () => useContext(SocketContext);
