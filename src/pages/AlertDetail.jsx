import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import api from '../utils/api';

const PIN = L.divIcon({
  html:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38"><path d="M14 1C7.37 1 2 6.37 2 13c0 9 12 25 12 25S26 22 26 13C26 6.37 20.63 1 14 1Z" fill="#0D3B4C" stroke="white" stroke-width="1.5"/><circle cx="14" cy="13" r="4.5" fill="white"/><circle cx="14" cy="13" r="2.5" fill="#E39A2D"/></svg>',
  className:'', iconSize:[28,38], iconAnchor:[14,38], popupAnchor:[0,-36]
});

export default function AlertDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [report, setReport] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sightingForm, setSightingForm] = useState({ description:'', locationName:'', sightingDate:'' });
  const [submitting, setSubmitting] = useState(false);
  const [sightingSuccess, setSightingSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/reports/' + id),
      api.get('/sightings/report/' + id)
    ]).then(([rRes, sRes]) => {
      if (rRes.data.success) setReport(rRes.data.report);
      if (sRes.data.success) setSightings(sRes.data.sightings);
    }).catch(() => navigate('/alerts'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitSighting = async e => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/sightings/report/' + id, { ...sightingForm, location:{ type:'Point', coordinates:[0,0] } });
      setSightingSuccess(true);
    } catch(err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ paddingTop:'var(--header-h)', display:'flex', justifyContent:'center', padding:'80px 20px' }}><div className="spin"/></div>;
  if (!report) return null;

  const mp = report.missingPerson || {};
  const coords = report.location?.coordinates;
  const pos = coords && coords[0] !== 0 ? [coords[1], coords[0]] : [17.386, 78.489];
  const caseNum = '#MPR-' + new Date(report.createdAt).getFullYear() + '-' + report._id.toString().slice(-4);
  const isResolved = report.status === 'resolved';
  const stacked = isMobile || isTablet;

  return (
    <div style={{ paddingTop:'var(--header-h)', minHeight:'100vh', background:'var(--bg-light)' }}>
      {/* Header */}
      <div style={{ background: isResolved ? '#16a34a' : 'var(--navy)', padding: isMobile ? '18px 0' : '24px 0' }}>
        <div className="page-wrap">
          <Link to="/alerts" style={{ color:'rgba(255,255,255,0.7)', fontSize:13, display:'inline-flex', alignItems:'center', gap:5, marginBottom:10 }}>
            ← Back to Alerts
          </Link>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
            <div>
              <h1 style={{ fontFamily:'Poppins', color:'white', fontSize: isMobile ? '1.5rem' : '2rem', marginBottom:4, fontWeight:800 }}>
                {isResolved ? '✅ ' : ''}{mp.name || 'Unknown'}
              </h1>
              <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13 }}>Case {caseNum}</p>
            </div>
            <span className={'badge badge-' + report.status} style={{ fontSize:12, padding:'5px 14px' }}>{report.status}</span>
          </div>
        </div>
      </div>

      <div className="page-wrap" style={{ padding: isMobile ? '16px 0' : '24px 0' }}>
        {isResolved && (
          <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'1.4rem' }}>✅</span>
            <div>
              <div style={{ fontWeight:700, color:'#16a34a', fontSize:14 }}>Case Resolved — Person Found</div>
              <div style={{ color:'#15803d', fontSize:13 }}>This case has been successfully closed. Thank you to all who helped.</div>
            </div>
          </div>
        )}

        {/* Main layout — stacks on mobile */}
        <div style={{ display:'grid', gridTemplateColumns: stacked ? '1fr' : 'minmax(0,1fr) 320px', gap:20, alignItems:'start' }}>
          {/* Left: details + sightings form */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Details card */}
            <div className="card" style={{ padding: isMobile ? '18px 16px' : '24px 28px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10, marginBottom:18 }}>
                {[
                  ['Age', mp.age],
                  ['Gender', mp.gender],
                  ['Height', mp.height],
                  ['Build', mp.build],
                  ['Hair', mp.hairColor],
                  ['Eyes', mp.eyeColor],
                  ['Last Seen', mp.lastSeenDate && new Date(mp.lastSeenDate).toLocaleDateString('en-IN')],
                  ['Location', report.locationName],
                ].filter(([,v]) => v).map(([k,v]) => (
                  <div key={k} style={{ background:'var(--bg)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{k}</div>
                    <div style={{ fontWeight:600, color:'var(--navy)', fontSize:13, textTransform:'capitalize' }}>{v}</div>
                  </div>
                ))}
              </div>
              {mp.description && <p style={{ color:'var(--text)', lineHeight:1.75, fontSize:14, marginBottom:12 }}>{mp.description}</p>}
              {mp.clothingDescription && (
                <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--text-muted)' }}>
                  👕 <b>Clothing:</b> {mp.clothingDescription}
                </div>
              )}
              {report.contactInfo && (
                <div style={{ marginTop:14, background:'#f8fafc', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--navy)', marginBottom:4 }}>📞 Contact</div>
                  <div style={{ color:'var(--text-muted)', fontSize:13 }}>
                    {report.contactInfo.name}{report.contactInfo.phone ? ' · ' + report.contactInfo.phone : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Sightings */}
            <div className="card" style={{ padding: isMobile ? '18px 16px' : '24px 28px' }}>
              <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.1rem', marginBottom:16 }}>
                👁️ Sightings ({sightings.length})
              </h2>
              {sightings.length === 0
                ? <p style={{ color:'var(--text-muted)', fontSize:14 }}>No verified sightings yet. Be the first to report one.</p>
                : sightings.map(s => (
                  <div key={s._id} style={{ borderBottom:'1px solid var(--border)', paddingBottom:14, marginBottom:14 }}>
                    <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
                      {new Date(s.sightingDate).toLocaleString('en-IN')}{s.locationName && ' at ' + s.locationName}
                    </p>
                    <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.65 }}>{s.description}</p>
                  </div>
                ))
              }

              {user && !isResolved && !sightingSuccess && (
                <div style={{ borderTop:'2px solid var(--border)', paddingTop:18, marginTop:18 }}>
                  <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1rem', marginBottom:14 }}>Submit a Sighting</h3>
                  <form onSubmit={submitSighting}>
                    <div className="form-group">
                      <label>What did you see? *</label>
                      <textarea rows={3} placeholder="Describe what you observed..." value={sightingForm.description}
                        onChange={e => setSightingForm({...sightingForm, description:e.target.value})} required style={{ resize:'vertical' }}/>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
                      <div className="form-group">
                        <label>Where?</label>
                        <input placeholder="Location/landmark" value={sightingForm.locationName}
                          onChange={e => setSightingForm({...sightingForm, locationName:e.target.value})}/>
                      </div>
                      <div className="form-group">
                        <label>When? *</label>
                        <input type="datetime-local" value={sightingForm.sightingDate}
                          onChange={e => setSightingForm({...sightingForm, sightingDate:e.target.value})} required/>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-amber btn-full" disabled={submitting} style={{ borderRadius:50 }}>
                      {submitting ? 'Submitting...' : 'Submit Sighting →'}
                    </button>
                  </form>
                </div>
              )}
              {sightingSuccess && (
                <div style={{ textAlign:'center', padding:'20px 0', color:'#16a34a', fontWeight:600 }}>
                  ✅ Sighting submitted for review!
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar: photo + map */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, position: stacked ? 'static' : 'sticky', top:'calc(var(--header-h) + 16px)' }}>
            {/* Photo */}
            <div className="card" style={{ overflow:'hidden' }}>
              {mp.photo ? (
                <img src={'http://localhost:5000' + mp.photo} alt={mp.name}
                  style={{ width:'100%', maxHeight: isMobile ? 220 : 280, objectFit:'cover', display:'block' }}/>
              ) : (
                <div style={{ height: isMobile ? 160 : 200, background:'linear-gradient(135deg,var(--navy),#1a3a5c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem' }}>
                  {mp.gender === 'female' ? '👩' : '👨'}
                </div>
              )}
              <div style={{ padding:'12px 16px' }}>
                <div style={{ fontWeight:700, color:'var(--navy)', fontSize:15 }}>{mp.name}</div>
                {mp.age && <div style={{ color:'var(--text-muted)', fontSize:13 }}>Age {mp.age} · {mp.gender || ''}</div>}
              </div>
            </div>

            {/* Map */}
            <div className="card" style={{ overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontFamily:'Poppins', fontWeight:600, color:'var(--navy)', fontSize:13.5 }}>
                📍 Last Known Location
              </div>
              <div style={{ height: isMobile ? 200 : 240 }}>
                <MapContainer center={pos} zoom={14} style={{ height:'100%', width:'100%' }} zoomControl={false} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"/>
                  <Marker position={pos} icon={PIN}/>
                </MapContainer>
              </div>
              {report.locationName && (
                <div style={{ padding:'8px 14px', fontSize:12.5, color:'var(--text-muted)' }}>{report.locationName}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
