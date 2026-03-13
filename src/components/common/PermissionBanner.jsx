import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket, requestNotificationPermission, requestGeolocation, subscribeToPush } from '../../context/SocketContext';

export default function PermissionBanner() {
  const { user }  = useAuth();
  const socket    = useSocket();
  const [show,      setShow]      = useState(false);
  const [notifState, setNotifState] = useState('');
  const [geoState,   setGeoState]   = useState('');
  const [dismissed,  setDismissed]  = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;
    const notifGranted = 'Notification' in window && Notification.permission === 'granted';
    const geoGranted   = !!(localStorage.getItem('mpas_lat'));
    if (notifGranted && geoGranted) return;
    const t = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(t);
  }, [user, dismissed]);

  if (!user || !show || dismissed) return null;

  const notifGranted = 'Notification' in window && Notification.permission === 'granted';
  const geoGranted   = !!(localStorage.getItem('mpas_lat'));
  const blockedNotif = 'Notification' in window && Notification.permission === 'denied';
  if (notifGranted && geoGranted) return null;

  const handleEnable = async () => {
    // Notifications + Web Push
    if (!notifGranted) {
      if (blockedNotif) { setNotifState('denied'); }
      else {
        setNotifState('requesting');
        const result = await requestNotificationPermission();
        setNotifState(result);
        // Subscribe to Web Push immediately after permission granted
        if (result === 'granted' && 'serviceWorker' in navigator) {
          await subscribeToPush(user._id);
        }
      }
    } else {
      setNotifState('granted');
      // Make sure push subscription is saved even if permission was already granted
      if ('serviceWorker' in navigator) await subscribeToPush(user._id);
    }

    // Geolocation
    if (!geoGranted) {
      setGeoState('requesting');
      try {
        await requestGeolocation(socket, user._id);
        setGeoState('granted');
      } catch (err) {
        setGeoState(err.code === 1 ? 'denied' : 'error');
      }
    } else { setGeoState('granted'); }

    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('mpas_lat')) setDismissed(true);
    }, 2000);
  };

  const icon = s => s === 'granted' ? '✅' : s === 'denied' ? '❌' : s === 'requesting' ? '⏳' : '';

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0D3B4C, #1a3d5c)',
      color: '#fff', padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
      boxShadow: '0 -4px 24px rgba(0,0,0,.35)',
      borderTop: '3px solid #E39A2D', fontFamily: 'inherit',
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14 }}>
          🔔 Enable alerts to protect your community
        </p>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.82, lineHeight: 1.5 }}>
          {blockedNotif
            ? '⚠️ Notifications blocked. Go to browser Settings → Site Settings → Notifications → Allow.'
            : !notifGranted && !geoGranted
            ? 'Allow notifications and location to receive missing person alerts — even when the app is closed.'
            : !notifGranted
            ? 'Allow notifications to receive missing person alerts even when the app is closed.'
            : 'Share your location to receive nearby alerts.'}
        </p>
        {(notifState || geoState) && (
          <p style={{ margin: '5px 0 0', fontSize: 12 }}>
            {notifState && <span style={{ marginRight: 14 }}>Notifications: {icon(notifState)} {notifState === 'denied' ? 'Blocked — allow in browser settings' : notifState === 'granted' ? 'Enabled + background push active' : notifState}</span>}
            {geoState   && <span>Location: {icon(geoState)} {geoState === 'denied' ? 'Blocked' : geoState === 'error' ? 'Unavailable' : geoState}</span>}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {!blockedNotif && (
          <button onClick={handleEnable} style={{
            padding: '9px 20px', background: '#E39A2D', color: '#1a0e00',
            border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>⚡ Enable Now</button>
        )}
        <button onClick={() => setDismissed(true)} style={{
          padding: '9px 14px', background: 'rgba(255,255,255,.12)', color: '#fff',
          border: '1px solid rgba(255,255,255,.25)', borderRadius: 50, fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>Later</button>
      </div>
    </div>
  );
}
