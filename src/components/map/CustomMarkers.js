import L from 'leaflet';

const createSVGIcon = (color, size, animate = false) => {
  const pulse = animate ? `
    <circle cx="14" cy="10" r="6" fill="${color}" opacity="0.15">
      <animate attributeName="r" values="6;18;6" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.15;0;0.15" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="14" cy="10" r="4" fill="${color}" opacity="0.2">
      <animate attributeName="r" values="4;12;4" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
    </circle>
  ` : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="${size}" height="${size * 1.28}">
      ${pulse}
      <filter id="shadow-${color.replace('#','')}">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
      </filter>
      <path d="M14 1C8.48 1 4 5.48 4 11c0 8 10 24 10 24s10-16 10-24c0-5.52-4.48-10-10-10z"
        fill="${color}" filter="url(#shadow-${color.replace('#','')})"/>
      <circle cx="14" cy="11" r="5" fill="white"/>
      <circle cx="14" cy="11" r="3" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size * 1.28],
    iconAnchor: [size / 2, size * 1.28],
    popupAnchor: [0, -size * 1.28]
  });
};

export const primaryMarker = createSVGIcon('#0d2b45', 28, true);
export const amberMarker = createSVGIcon('#e8960c', 20);
export const criticalMarker = createSVGIcon('#c0392b', 22);
export const resolvedMarker = createSVGIcon('#1a6b8a', 18);

export const getMarkerByStatus = (status) => {
  switch(status) {
    case 'critical': return criticalMarker;
    case 'resolved': return resolvedMarker;
    case 'active': return amberMarker;
    default: return primaryMarker;
  }
};
