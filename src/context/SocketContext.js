import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/api';

const SocketContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────
// Service Worker registration (required for mobile push notifications)
// ─────────────────────────────────────────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker registered');
    return reg;
  } catch (e) {
    console.warn('SW register failed:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// showNotification — works on desktop + Android Chrome + iOS Safari 16.4+
// MUST be called from a user gesture for the first-time permission prompt.
// After permission granted, can be called freely.
// ─────────────────────────────────────────────────────────────────────
async function showNotification(title, body, tag = 'mpas', url = '/') {
  // Tab blink — works in all browsers including when notifications blocked
  const orig = document.title;
  let blink = false;
  const iv = setInterval(() => { document.title = blink ? `🔔 ${title}` : orig; blink = !blink; }, 900);
  setTimeout(() => { clearInterval(iv); document.title = orig; }, 15000);

  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // ServiceWorker showNotification — required on mobile, works on desktop too
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url },
      });
      return;
    } catch (e) { /* fall through */ }
  }

  // Fallback: basic Notification API
  try {
    const n = new Notification(title, { body, icon: '/favicon.ico', tag });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────
// requestNotificationPermission
// Returns 'granted' | 'denied' | 'unsupported'
// Must be called from a user click — browsers block silent requests.
// ─────────────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    return 'denied';
  }
}

// ─────────────────────────────────────────────────────────────────────
// requestGeolocation
// Saves lat/lng to localStorage and emits to socket.
// ─────────────────────────────────────────────────────────────────────
export function requestGeolocation(socket, userId) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        localStorage.setItem('mpas_lat', lat);
        localStorage.setItem('mpas_lng', lng);
        if (socket?.connected && userId) {
          socket.emit('update_location', { userId, lat, lng });
        }
        resolve({ lat, lng });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// SocketProvider
// ─────────────────────────────────────────────────────────────────────
export const SocketProvider = ({ children }) => {
  const [socket, setSocket]     = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Register SW once on mount
  useEffect(() => { registerSW(); }, []);

  // Create socket connection
  useEffect(() => {
    const s = io(API_BASE, {
      // polling first — always works even if WebSocket is blocked
      // (Render free tier drops idle WS; polling is reliable)
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
      timeout: 20000,
      withCredentials: true,
      forceNew: true,
    });

    socketRef.current = s;

    s.on('connect',       () => { console.log('🔌 Socket connected'); setConnected(true); });
    s.on('disconnect',    (r) => { console.log('🔌 Socket disconnected:', r); setConnected(false); });
    s.on('connect_error', (e) => { console.warn('🔌 Socket error:', e.message); });

    // ── New missing-person alert ──────────────────────────────────────
    s.on('new_alert', ({ title, message, report }) => {
      showNotification(
        title || '🚨 Missing Person Alert',
        message || `${report?.missingPerson?.name || 'Someone'} reported missing.`,
        'mpas-alert-' + (report?._id || Date.now()),
        report?._id ? `/alerts/${report._id}` : '/'
      );
    });

    // ── Case resolved ─────────────────────────────────────────────────
    s.on('case_resolved', ({ title, message, personName }) => {
      showNotification(
        title || `✅ ${personName} Has Been Found`,
        message || `Update: ${personName} has been safely found.Thank you for your attention`,
        'mpas-resolved-' + Date.now()
      );
    });

    // ── Status change for report submitter ───────────────────────────
    s.on('notification', ({ type, status, personName }) => {
      if (type === 'status_update') {
        showNotification('📋 Report Update', `Your report for ${personName} is now: ${status}`, 'mpas-status');
      }
    });

    // ── Verified sighting ─────────────────────────────────────────────
    s.on('sighting_verified', ({ personName, locationName }) => {
      showNotification(`📍 Sighting: ${personName}`, `A sighting near ${locationName} was confirmed.`, 'mpas-sighting');
    });

    setSocket(s);
    return () => { s.disconnect(); socketRef.current = null; };
  }, []);

  // Authenticate + sync location when user logs in
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('authenticate', user._id);
    if (user.role === 'admin') socket.emit('join_admin');

    // Send stored location immediately (if already granted before)
    const lat = localStorage.getItem('mpas_lat');
    const lng = localStorage.getItem('mpas_lng');
    if (lat && lng && socket.connected) {
      socket.emit('update_location', { userId: user._id, lat: parseFloat(lat), lng: parseFloat(lng) });
    }

    // Re-fetch fresh location silently in background (if permission already granted)
    if (navigator.geolocation && Notification.permission !== 'default') {
      requestGeolocation(socket, user._id).catch(() => {});
    }

    // Refresh location every 5 min
    const iv = setInterval(() => {
      const la = localStorage.getItem('mpas_lat');
      const ln = localStorage.getItem('mpas_lng');
      if (la && ln && socket.connected) {
        socket.emit('update_location', { userId: user._id, lat: parseFloat(la), lng: parseFloat(ln) });
      }
    }, 300_000);

    return () => clearInterval(iv);
  }, [socket, user, connected]); // re-run on reconnect too

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
