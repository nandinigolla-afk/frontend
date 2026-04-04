import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import api from '../utils/api';

// Inject bounce animation
if (typeof document !== 'undefined' && !document.getElementById('land-bounce')) {
  const s = document.createElement('style');
  s.id = 'land-bounce';
  s.textContent = `
    @keyframes land-bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-14px)} 70%{transform:translateY(-6px)} }
    @keyframes land-shadow { 0%,100%{transform:scaleX(1);opacity:.3} 40%{transform:scaleX(.5);opacity:.1} }
    .land-pin { animation:land-bounce 2s ease-in-out infinite; display:inline-block; transform-origin:bottom center; }
    .land-shadow { width:10px;height:3px;background:rgba(0,0,0,.3);border-radius:50%;margin:-2px auto 0;filter:blur(1px);animation:land-shadow 2s ease-in-out infinite; }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    .fade-in-1 { animation:fadeInUp 0.6s ease forwards; }
    .fade-in-2 { animation:fadeInUp 0.6s 0.15s ease forwards; opacity:0; }
    .fade-in-3 { animation:fadeInUp 0.6s 0.3s ease forwards; opacity:0; }
    .fade-in-4 { animation:fadeInUp 0.6s 0.45s ease forwards; opacity:0; }
  `;
  document.head.appendChild(s);
}

function makePin(color, size=32, bounce=false) {
  const cx=size/2, cy=size*0.38;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size*1.35}" viewBox="0 0 ${size} ${size*1.35}">
    <path d="M${cx} 1C${size*.22} 1 ${size*.06} ${size*.22} ${size*.06} ${cy}C${size*.06} ${size*.65} ${cx} ${size*1.3} ${cx} ${size*1.3}S${size*.94} ${size*.65} ${size*.94} ${cy}C${size*.94} ${size*.22} ${size*.78} 1 ${cx} 1Z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${size*.18}" fill="white"/>
    <circle cx="${cx}" cy="${cy}" r="${size*.1}" fill="${color}"/>
  </svg>`;
  const html = bounce ? `<div class="land-pin">${svg}</div><div class="land-shadow"></div>` : svg;
  const h = bounce ? size*1.35+8 : size*1.35;
  return L.divIcon({ html, className:'', iconSize:[size,h], iconAnchor:[cx,h] });
}

const PINS = {
  active:   makePin('#E39A2D', 30, true),
  critical: makePin('#ef4444', 34, true),
  resolved: makePin('#4ade80', 24, false),
  pending:  makePin('#94a3b8', 26, false),
};

const STEPS = [
  { icon:'📝', title:'Submit Report', desc:'Fill in missing person details with photo and last known location' },
  { icon:'🔔', title:'Instant Alerts', desc:'Nearby community members get notified immediately via push & email' },
  { icon:'👁️', title:'Report Sightings', desc:'Anyone who spots them can submit a sighting with location' },
  { icon:'✅', title:'Case Resolved', desc:'Admin verifies and closes the case, community gets notified' },
];

const STATS_DEFAULT = { total:0, active:0, critical:0, resolved:0 };

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [stats, setStats]   = useState(STATS_DEFAULT);
  const [alerts, setAlerts] = useState([]);
  const [mapCenter] = useState([17.386, 78.489]);

 useEffect(() => {
  api.get('/reports/stats')
    .then(r => {
      if (r.data.success) setStats(r.data.stats);
    })
    .catch(() => {});

  api.get('/reports/public')
    .then(r => {
      if (r.data.success) setAlerts(r.data.reports.slice(0, 8));
    })
    .catch(() => {});
}, []);

  const isSm = isMobile || isTablet;

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Poppins,sans-serif' }}>

      {/* ── HERO ── */}
      <div style={{ position:'relative', height: isMobile?'100vh':isTablet?'90vh':'100vh', overflow:'hidden', background:'#0D3B4C' }}>
        {/* Map background */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <MapContainer center={mapCenter} zoom={isMobile?12:13} style={{ height:'100%', width:'100%' }}
            zoomControl={false} scrollWheelZoom={false} dragging={!isMobile} doubleClickZoom={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"/>
            {alerts.map((r,i) => {
              const c = r.location?.coordinates;
              if (!c || c[0]===0) return null;
              return <Marker key={r._id||i} position={[c[1],c[0]]} icon={PINS[r.status]||PINS.active}>
                <Popup><b>{r.missingPerson?.name}</b><br/>{r.locationName}</Popup>
              </Marker>;
            })}
          </MapContainer>
        </div>

        {/* Gradient overlay */}
        <div style={{ position:'absolute', inset:0, zIndex:1,
          background: isMobile
            ? 'rgba(13,59,76,0.85)'
            : 'linear-gradient(90deg,rgba(13,59,76,0.97) 0%,rgba(13,59,76,0.88) 35%,rgba(13,59,76,0.3) 60%,transparent 75%)'
        }}/>

        {/* Content */}
        <div style={{ position:'absolute', inset:0, zIndex:2, display:'flex', alignItems:'center' }}>
          <div style={{ padding: isMobile?'0 20px':isTablet?'0 40px':'0 6vw', maxWidth: isMobile?'100%':580, width:'100%' }}>

            {/* Badge */}
            <div className="fade-in-1" style={{ display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(227,154,45,0.18)', border:'1px solid rgba(227,154,45,0.4)',
              borderRadius:50, padding:'6px 16px', marginBottom:20 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#E39A2D', animation:'pulse 2s infinite' }}/>
              <span style={{ color:'#E39A2D', fontSize:12.5, fontWeight:600 }}>Live Community Alert Network</span>
            </div>

            <h1 className="fade-in-2" style={{ fontSize: isMobile?'2.2rem':isTablet?'2.8rem':'3.6rem',
              fontWeight:900, color:'white', lineHeight:1.08, marginBottom:16, letterSpacing:'-0.03em' }}>
              Missing Person<br/>
              <span style={{ color:'#E39A2D' }}>Alert System</span>
            </h1>

            <p className="fade-in-3" style={{ color:'rgba(255,255,255,0.75)', fontSize: isMobile?14:16,
              lineHeight:1.7, marginBottom:30, maxWidth:440 }}>
              A community-powered platform to report missing persons, alert nearby residents, and coordinate search efforts in real time.
            </p>

            {/* CTA buttons */}
            <div
  className="fade-in-4"
  style={{
    display: 'flex',
    gap: 14,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    alignItems: 'center'
  }}
>
           
              <Link to="/report" style={{
            padding: isMobile ? '11px 22px' : '12px 26px',
fontSize: isMobile ? 13 : 14,
whiteSpace: 'nowrap',
minWidth: isMobile ? '100%' : '220px',
justifyContent: 'center',
                background:'#E39A2D', color:'#1a0e00',
                borderRadius:50, fontWeight:700, fontSize: isMobile?13:14,
                boxShadow:'0 6px 24px rgba(227,154,45,0.45)',
                textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8
              }}>
                🚨 Report Missing Person
              </Link>
              <Link
  to="/alerts"
  style={{
    
    padding: isMobile ? '10px 18px' : '11px 22px',
fontSize: isMobile ? 13 : 14,
    background: 'rgba(255,255,255,0.18)',
    color: '#ffffff',
    border: '1.5px solid rgba(255,255,255,0.45)',
    borderRadius: 50,
    fontWeight: 700,
    fontSize: isMobile ? 14 : 15,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: isMobile ? '100%' : '220px',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap'
  }}
>
                👁️ View Active Cases
              </Link>
            </div>

            {/* Login link */}
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:20 }}>
              Have an account?{' '}
              <Link to="/login" style={{ color:'rgba(255,255,255,0.75)', fontWeight:600, textDecoration:'underline' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, zIndex:2,
          background:'rgba(10,25,41,0.9)', backdropFilter:'blur(12px)',
          borderTop:'1px solid rgba(255,255,255,0.08)',
          display:'flex', justifyContent:'center'
        }}>
          {[
            { n:stats.total,    l:'Total Cases',     c:'#94a3b8' },
            { n:stats.active,   l:'Active',          c:'#E39A2D' },
            { n:stats.critical, l:'Critical',        c:'#ef4444' },
            { n:stats.resolved, l:'Resolved',        c:'#4ade80' },
          ].map((s,i) => (
            <div key={i} style={{
              flex:1, textAlign:'center', padding: isMobile?'14px 8px':'20px 24px',
              borderRight: i<3 ? '1px solid rgba(255,255,255,0.07)' : 'none'
            }}>
              <div style={{ fontSize: isMobile?'1.4rem':'2rem', fontWeight:800, color:s.c, lineHeight:1 }}>{s.n||0}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize: isMobile?10:12, marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding: isSm?'40px 20px':'64px 6vw', background:'white' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom: isSm?28:44 }}>
            <h2 style={{ fontSize: isSm?'1.5rem':'2.2rem', fontWeight:800, color:'#0D3B4C', marginBottom:8 }}>How MPAS Works</h2>
            <p style={{ color:'#64748b', fontSize: isSm?13:15 }}>Four simple steps to find missing persons faster</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':isTablet?'repeat(2,1fr)':'repeat(4,1fr)', gap: isSm?16:24 }}>
            {STEPS.map((s,i) => (
              <div key={i} style={{ background:'#f8fafc', borderRadius:16, padding: isSm?'20px 16px':'28px 20px',
                textAlign:'center', border:'1px solid #e2e8f0', position:'relative' }}>
                <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)',
                  width:28, height:28, background:'#0D3B4C', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:800, fontSize:13 }}>{i+1}</div>
                <div style={{ fontSize:'2.2rem', marginBottom:12, marginTop:8 }}>{s.icon}</div>
                <div style={{ fontWeight:700, color:'#0D3B4C', fontSize: isSm?'0.95rem':'1.05rem', marginBottom:8 }}>{s.title}</div>
                <div style={{ color:'#64748b', fontSize: isSm?12:13.5, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTIVE ALERTS PREVIEW ── */}
      {alerts.filter(r=>r.status==='active'||r.status==='critical').length > 0 && (
        <div style={{ padding: isSm?'40px 20px':'64px 6vw', background:'#f8fafc' }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:10 }}>
              <div>
                <h2 style={{ fontSize: isSm?'1.3rem':'1.8rem', fontWeight:800, color:'#0D3B4C', marginBottom:4 }}>Recent Active Cases</h2>
                <p style={{ color:'#64748b', fontSize:13 }}>Help locate these missing individuals</p>
              </div>
              <Link to="/alerts" style={{ padding:'9px 22px', background:'#0D3B4C', color:'white', borderRadius:50, fontWeight:600, fontSize:13.5, textDecoration:'none' }}>
                View All →
              </Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':isTablet?'repeat(2,1fr)':'repeat(3,1fr)', gap:16 }}>
              {alerts.filter(r=>r.status==='active'||r.status==='critical').slice(0,3).map(r => {
                const mp = r.missingPerson||{};
                return (
                  <div key={r._id} style={{ background:'white', borderRadius:14, padding:'18px 20px',
                    border:'1px solid #e2e8f0', borderTop:`3px solid ${r.status==='critical'?'#ef4444':'#E39A2D'}`,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, color:'#0D3B4C', fontSize:15 }}>{mp.name||'Unknown'}</div>
                        <div style={{ color:'#94a3b8', fontSize:12 }}>Age {mp.age} · {mp.gender}</div>
                      </div>
                      <span style={{ padding:'3px 10px', borderRadius:50, fontSize:11, fontWeight:700,
                        background: r.status==='critical'?'#fef2f2':'#fff7ed',
                        color: r.status==='critical'?'#ef4444':'#E39A2D',
                        border: `1px solid ${r.status==='critical'?'#fecaca':'#fed7aa'}` }}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize:12.5, color:'#64748b', marginBottom:12 }}>
                      📍 {r.locationName||'Location not specified'}
                    </div>
                    <Link to={`/alerts/${r._id}`} style={{ display:'block', textAlign:'center', padding:'8px',
                      background:'#0D3B4C', color:'white', borderRadius:8, fontWeight:600, fontSize:13, textDecoration:'none' }}>
                      View Details →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div style={{ background:'#0D3B4C', padding: isSm?'40px 20px':'64px 6vw', textAlign:'center' }}>
        <h2 style={{ fontSize: isSm?'1.4rem':'2rem', fontWeight:800, color:'white', marginBottom:10 }}>
          Every second matters
        </h2>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize: isSm?13.5:15, marginBottom:28, maxWidth:480, margin:'0 auto 28px' }}>
          Join thousands of community members helping to locate missing persons across the country.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/register" style={{ padding:'13px 32px', background:'#E39A2D', color:'#1a0e00',
            borderRadius:50, fontWeight:700, fontSize:15, textDecoration:'none' }}>
            Join the Network
          </Link>
          <Link to="/alerts" style={{ padding:'13px 32px', background:'rgba(255,255,255,0.1)',
            color:'rgba(255,255,255,0.85)', border:'1.5px solid rgba(255,255,255,0.25)',
            borderRadius:50, fontWeight:600, fontSize:15, textDecoration:'none' }}>
            View Active Cases
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:'#0a1929', padding:'14px 20px', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:0 }}>
          © 2026 MPAS — Emergency: 112 · Missing Child Helpline: 1098
        </p>
      </div>
    </div>
  );
}
