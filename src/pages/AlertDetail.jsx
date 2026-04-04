import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import api from '../utils/api';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://mpas-backend.onrender.com';

function InfoBox({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ background:'#f1f5f9', borderRadius:10, padding:'10px 14px' }}>
      <div style={{ fontSize:11, color:'#94a3b8', marginBottom:3, fontWeight:500 }}>{label}</div>
      <div style={{ fontWeight:700, color:'#0D3B4C', fontSize:14, textTransform:'capitalize' }}>{value}</div>
    </div>
  );
}

export default function AlertDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [report, setReport]   = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sightingForm, setSightingForm] = useState({ description:'', locationName:'', sightingDate:'' });
  const [submitting, setSubmitting] = useState(false);
  const [sightingSuccess, setSightingSuccess] = useState(false);
  const [showSightingForm, setShowSightingForm] = useState(false);

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
      await api.post('/sightings/report/' + id, {
        ...sightingForm,
        location: { type:'Point', coordinates:[0,0] }
      });
      setSightingSuccess(true);
      setShowSightingForm(false);
    } catch(err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const shareAlert = () => {
    if (navigator.share) {
      navigator.share({ title:`MPAS Alert: ${report?.missingPerson?.name}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <div className="spin"/>
    </div>
  );
  if (!report) return null;

  const mp = report.missingPerson || {};
  const caseNum = '#MPR-' + new Date(report.createdAt).getFullYear() + '-' + report._id.toString().slice(-4);
  const isResolved = report.status === 'resolved';
  const lastSeenFmt = mp.lastSeenDate
    ? new Date(mp.lastSeenDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
      + ' at ' + new Date(mp.lastSeenDate).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
    : null;

  return (
    <div style={{ paddingTop:'var(--header-h)', minHeight:'100vh', background:'#e8edf2' }}>
      {/* Back button */}
      <div style={{ padding:'12px 20px', background:'white', borderBottom:'1px solid #e2e8f0' }}>
        <Link to="/alerts" style={{ color:'#0D3B4C', fontSize:13.5, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none' }}>
          ← Back to Alerts
        </Link>
      </div>

      <div style={{ maxWidth:680, margin:'0 auto', padding: isMobile?'16px 12px':'24px 16px' }}>

        {/* ── Modal-style card ── */}
        <div style={{ background:'white', borderRadius:20, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.12)' }}>

          {/* Header */}
          <div style={{ padding:'24px 24px 20px', borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              {/* Avatar */}
              <div style={{ width:70, height:70, borderRadius:16, overflow:'hidden', flexShrink:0,
                background:'linear-gradient(135deg,#e2e8f0,#cbd5e1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem' }}>
                {mp.photo
                  ? <img src={BACKEND_URL + mp.photo} alt={mp.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : (mp.gender === 'female' ? '👩' : '👨')
                }
              </div>

              {/* Name + status */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                  <h1 style={{ fontFamily:'Poppins', fontWeight:800, color:'#0D3B4C', fontSize: isMobile?'1.3rem':'1.6rem', margin:0 }}>
                    {isResolved ? '✅ ' : ''}{mp.name || 'Unknown'}
                  </h1>
                  <span style={{
                    padding:'3px 12px', borderRadius:50, fontSize:11.5, fontWeight:700, textTransform:'uppercase',
                    background: isResolved?'#dcfce7': report.status==='critical'?'#fef2f2':'#fef3c7',
                    color: isResolved?'#16a34a': report.status==='critical'?'#ef4444':'#d97706',
                    border: `1px solid ${isResolved?'#86efac': report.status==='critical'?'#fecaca':'#fde68a'}`
                  }}>{report.status}</span>
                </div>
                <div style={{ color:'#94a3b8', fontSize:12.5, marginBottom:4 }}>Case {caseNum}</div>
                {lastSeenFmt && (
                  <div style={{ color:'#0D3B4C', fontSize:13, fontWeight:600 }}>
                    Last seen: {lastSeenFmt}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resolved banner */}
          {isResolved && (
            <div style={{ background:'#dcfce7', padding:'12px 24px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'1.2rem' }}>✅</span>
              <div>
                <div style={{ fontWeight:700, color:'#16a34a', fontSize:13.5 }}>Case Resolved — Person Found</div>
                <div style={{ color:'#15803d', fontSize:12.5 }}>This case has been successfully closed. Thank you to all who helped.</div>
              </div>
            </div>
          )}

          {/* Body */}
          <div style={{ padding:'20px 24px' }}>

            {/* Last Known Location */}
            {report.locationName && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                  Last Known Location
                </div>
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:'1.1rem' }}>📍</span>
                  <span style={{ color:'#0D3B4C', fontWeight:600, fontSize:14 }}>{report.locationName}</span>
                </div>
              </div>
            )}

            {/* Physical Description */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                Physical Description
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <InfoBox label="Age" value={mp.age ? `${mp.age} years` : null}/>
                <InfoBox label="Gender" value={mp.gender}/>
                <InfoBox label="Height" value={mp.height}/>
                <InfoBox label="Weight" value={mp.weight ? `${mp.weight} lbs` : null}/>
                <InfoBox label="Hair" value={mp.hairColor}/>
                <InfoBox label="Eyes" value={mp.eyeColor}/>
              </div>
              {mp.clothingDescription && (
                <div style={{ marginTop:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 16px' }}>
                  <span style={{ fontWeight:700, color:'#0D3B4C', fontSize:13.5 }}>Clothing: </span>
                  <span style={{ color:'#475569', fontSize:13.5 }}>{mp.clothingDescription}</span>
                </div>
              )}
            </div>

            {/* Circumstances / Description */}
            {mp.description && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                  Circumstances
                </div>
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px',
                  color:'#475569', fontSize:14, lineHeight:1.7 }}>
                  {mp.description}
                </div>
              </div>
            )}

            {/* Contact Reporter */}
            {report.contactInfo && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                  Contact Reporter
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <InfoBox label="Name" value={report.contactInfo.name}/>
                  <InfoBox label="Phone" value={report.contactInfo.phone}/>
                </div>
              </div>
            )}

            {/* Sightings */}
            {sightings.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                  Verified Sightings ({sightings.length})
                </div>
                {sightings.map(s => (
                  <div key={s._id} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', marginBottom:8, border:'1px solid #e2e8f0' }}>
                    <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>
                      {new Date(s.sightingDate).toLocaleString('en-IN')}{s.locationName && ` · ${s.locationName}`}
                    </div>
                    <div style={{ fontSize:13.5, color:'#475569', lineHeight:1.6 }}>{s.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Sighting success */}
            {sightingSuccess && (
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:10, padding:'12px 16px', marginBottom:16, textAlign:'center', color:'#16a34a', fontWeight:600 }}>
                ✅ Sighting submitted successfully! Thank you for helping.
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
              {user && !isResolved && !sightingSuccess && (
                <button onClick={() => setShowSightingForm(!showSightingForm)}
                  style={{ padding:'13px', background:'#E39A2D', color:'#1a0e00', border:'none',
                    borderRadius:12, fontWeight:700, fontSize:14.5, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  Report a Sighting
                </button>
              )}
              {!user && !isResolved && (
                <Link to="/login" style={{ padding:'13px', background:'#E39A2D', color:'#1a0e00',
                  borderRadius:12, fontWeight:700, fontSize:14.5, textDecoration:'none', textAlign:'center', fontFamily:'Poppins,sans-serif' }}>
                  Report a Sighting
                </Link>
              )}
              <button onClick={shareAlert}
                style={{ padding:'13px', background:'#0D3B4C', color:'white', border:'none',
                  borderRadius:12, fontWeight:700, fontSize:14.5, cursor:'pointer', fontFamily:'Poppins,sans-serif',
                  gridColumn: (isResolved || (!user && isResolved)) ? 'span 2' : 'auto' }}>
                Share Alert
              </button>
            </div>

            {/* Sighting form */}
            {showSightingForm && user && !isResolved && (
              <div style={{ marginTop:20, paddingTop:20, borderTop:'2px solid #f1f5f9' }}>
                <h3 style={{ fontFamily:'Poppins', color:'#0D3B4C', fontSize:'1rem', marginBottom:14 }}>Submit a Sighting</h3>
                <form onSubmit={submitSighting}>
                  <div className="form-group">
                    <label>What did you see? *</label>
                    <textarea rows={3} placeholder="Describe what you observed..."
                      value={sightingForm.description}
                      onChange={e => setSightingForm({...sightingForm, description:e.target.value})}
                      required style={{ resize:'vertical' }}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
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
                  <div style={{ display:'flex', gap:10 }}>
                    <button type="button" onClick={() => setShowSightingForm(false)}
                      style={{ flex:1, padding:'11px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      style={{ flex:2, padding:'11px', background:'#0D3B4C', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                      {submitting ? 'Submitting...' : 'Submit Sighting →'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
