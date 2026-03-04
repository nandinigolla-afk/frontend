import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

function showBrowserNotification(title, body, tag) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico', tag, requireInteraction: true });
    } catch (e) {}
  }
  // Blink the tab title
  const orig = document.title;
  let blink = false;
  const iv = setInterval(() => {
    document.title = blink ? `🔔 ${title}` : orig;
    blink = !blink;
  }, 900);
  setTimeout(() => { clearInterval(iv); document.title = orig; }, 14000);
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const s = io(URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 5 });
    setSocket(s);

    // New missing person alert (when admin approves a report)
    s.on('new_alert', ({ title, message, report }) => {
      showBrowserNotification(
        title || '🚨 Missing Person Alert',
        message || `${report?.missingPerson?.name || 'Someone'} is missing near ${report?.locationName || 'your area'}. Please help if you have information.`,
        'mpas-alert-' + report?._id
      );
    });

    // Case resolved — person safely found
    s.on('case_resolved', ({ title, message, personName }) => {
      showBrowserNotification(
        title || `✅ ${personName} Has Been Found`,
        message || `Update: ${personName} has been safely found. Thank you for your support.`,
        'mpas-resolved-' + Date.now()
      );
    });

    // Sighting verified — "person spotted" notification
    s.on('sighting_alert', ({ title, message, personName, locationName }) => {
      showBrowserNotification(
        title || `👁️ Sighting: ${personName}`,
        message || `${personName} was spotted near ${locationName}`,
        'mpas-sighting-' + Date.now()
      );
    });

    // Submitter-specific: their report status changed
    s.on('notification', ({ type, status, personName }) => {
      if (type === 'status_update') {
        showBrowserNotification('📋 Report Update', `Your report status changed to: ${status}`, 'mpas-status');
      }
      if (type === 'sighting_rejected') {
        showBrowserNotification('ℹ️ Sighting Update', `Your sighting of ${personName} was reviewed.`, 'mpas-rejected');
      }
    });

    // Submitter: their case got a verified sighting
    s.on('sighting_verified', ({ personName, locationName }) => {
      showBrowserNotification(
        `📍 ${personName} May Have Been Spotted`,
        `A verified sighting near ${locationName} was reported. Check the case page for details.`,
        'mpas-sighting-verified'
      );
    });

    return () => s.close();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('authenticate', user._id);
    if (user.role === 'admin') socket.emit('join_admin');

    // Send geolocation to backend so proximity alerts work
    const sendLoc = () => {
      const lat = localStorage.getItem('mpas_lat');
      const lng = localStorage.getItem('mpas_lng');
      if (lat && lng) {
        socket.emit('update_location', {
          userId: user._id,
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        });
      }
    };
    sendLoc();
    const iv = setInterval(sendLoc, 300000);
    return () => clearInterval(iv);
  }, [socket, user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
