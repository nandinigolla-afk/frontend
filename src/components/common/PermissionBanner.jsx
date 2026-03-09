import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket, requestNotificationPermission, requestGeolocation } from '../../context/SocketContext';

// ─────────────────────────────────────────────────────────────────────
// PermissionBanner
// Shows a bottom banner asking users to allow notifications + location.
// Must trigger from a button click — browsers block silent permission requests.
// Appears once per session if either permission is missing.
// ─────────────────────────────────────────────────────────────────────
export default function PermissionBanner() {
  const { user } = useAuth();
  const socket   = useSocket();

  const [show,       setShow]       = useState(false);
  const [notifState, setNotifState] = useState('');  // '', 'granted', 'denied', 'requesting'
  const [geoState,   setGeoState]   = useState('');  // '', 'granted', 'denied', 'requesting'
  const [dismissed,  setDismissed]  = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;

    const notifGranted = 'Notification' in window && Notification.permission === 'granted';
    const geoGranted   = !!(localStorage.getItem('mpas_lat'));

    // Don't show if both already granted
    if (notifGranted && geoGranted) return;

    // Small delay so it doesn't flash immediately on page load
    const t = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(t);
  }, [user, dismissed]);

  if (!user || !show || dismissed) return null;

  const notifGranted = 'Notification' in window && Notification.permission === 'granted';
  const geoGranted   = !!(localStorage.getItem('mpas_lat'));
  if (notifGranted && geoGranted) return null;

  const handleEnable = async () => {
    // ── Notifications ──────────────────────────────────────────────
    if (!notifGranted) {
      if ('Notification' in window && Notification.permission === 'denied') {
        setNotifState('denied');
      } else {
        setNotifState('requesting');
        const result = await requestNotificationPermission();
        setNotifState(result === 'granted' ? 'granted' : 'denied');
      }
    } else {
      setNotifState('granted');
    }

    // ── Geolocation ────────────────────────────────────────────────
    if (!geoGranted) {
      setGeoState('requesting');
      try {
        await requestGeolocation(socket, user._id);
        setGeoState('granted');
      } catch (err) {
        setGeoState(err.code === 1 ? 'denied' : 'error');
      }
    } else {
      setGeoState('granted');
    }

    // Auto-dismiss after 2s if both granted
    setTimeout(() => {
      const ng = 'Notification' in window && Notification.permission === 'granted';
      const gg = !!(localStorage.getItem('mpas_lat'));
      if (ng && gg) setDismissed(true);
    }, 2000);
  };

  const statusIcon = (s) =>
    s === 'granted' ? '✅' :
    s === 'denied'  ? '❌' :
    s === 'requesting' ? '⏳' : '';

  const missingNotif = !notifGranted && Notification.permission !== 'denied';
  const blockedNotif = Notification.permission === 'denied';
  const missingGeo   = !geoGranted;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0D3B4C 0%, #1a3d5c 100%)',
      color: '#fff', padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
      fontFamily: 'inherit',
      borderTop: '3px solid #E39A2D',
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, letterSpacing: '0.01em' }}>
          🔔 Enable alerts to protect your community
        </p>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.82, lineHeight: 1.5 }}>
          {blockedNotif
            ? '⚠️ Notifications are blocked. Go to browser Settings → Site Settings → Notifications → Allow.'
            : missingNotif && missingGeo
            ? 'Allow notifications and location to receive missing person alerts near you.'
            : missingNotif
            ? 'Allow notifications to receive missing person alerts.'
            : 'Share your location to receive nearby alerts.'}
        </p>

        {/* Status feedback */}
        {(notifState || geoState) && (
          <p style={{ margin: '5px 0 0', fontSize: 12, opacity: 0.9 }}>
            {notifState && <span style={{ marginRight: 14 }}>Notifications: {statusIcon(notifState)} {notifState === 'denied' ? 'Blocked — allow in browser settings' : notifState}</span>}
            {geoState   && <span>Location: {statusIcon(geoState)} {geoState === 'denied' ? 'Blocked — allow in browser settings' : geoState === 'error' ? 'Unavailable' : geoState}</span>}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        {!blockedNotif && (
          <button onClick={handleEnable}
            style={{
              padding: '9px 20px', background: '#E39A2D', color: '#1a0e00',
              border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(227,154,45,0.4)',
            }}>
            ⚡ Enable Now
          </button>
        )}
        <button onClick={() => setDismissed(true)}
          style={{
            padding: '9px 14px', background: 'rgba(255,255,255,0.12)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 50,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
          Later
        </button>
      </div>
    </div>
  );
}
