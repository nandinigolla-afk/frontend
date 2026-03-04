import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { useResponsive } from '../hooks/useResponsive';
import { useSocket } from '../context/SocketContext';

const createAdminMarker = (color, size=20) => L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size*1.3}" viewBox="0 0 ${size} ${size*1.3}">
    <path d="M${size/2} 1 C${size*0.25} 1 ${size*0.08} ${size*0.28} ${size*0.08} ${size*0.42} C${size*0.08} ${size*0.7} ${size/2} ${size*1.25} ${size/2} ${size*1.25} S${size*0.92} ${size*0.7} ${size*0.92} ${size*0.42} C${size*0.92} ${size*0.28} ${size*0.75} 1 ${size/2} 1Z" fill="${color}"/>
    <circle cx="${size/2}" cy="${size*0.42}" r="${size*0.18}" fill="white"/>
    <circle cx="${size/2}" cy="${size*0.42}" r="${size*0.1}" fill="${color}"/>
  </svg>`,
  className: '', iconSize:[size,size*1.3], iconAnchor:[size/2,size*1.3]
});

const markers = {
  active: createAdminMarker('#1565c0'),
  critical: createAdminMarker('#c62828', 24),
  pending: createAdminMarker('#f57f17'),
  resolved: createAdminMarker('#2e7d32', 16),
};

function StatCard({ icon, value, label, color, bg, delta }) {
  return (
    <div className="card" style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:4, borderLeft:`3px solid ${color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontSize:'1.8rem', fontFamily:'Poppins', fontWeight:700, color }}>{value}</div>
        <div style={{ width:36, height:36, background:bg, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
      </div>
      <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
    </div>
  );
}

function ReportRow({ r, onAction, expanded, onToggle }) {
  const mp = r.missingPerson || {};
  return (
    <React.Fragment>
      <tr style={{ background: expanded ? '#f8faff' : 'white' }}>
        <td>
          <button onClick={onToggle} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:12, padding:'0 4px' }}>
            {expanded ? '▼' : '▶'}
          </button>
        </td>
        <td>
          <div style={{ fontWeight:600, fontSize:13 }}>{mp.name || '—'}</div>
          <div style={{ color:'var(--text-muted)', fontSize:11 }}>{mp.age} yrs • {mp.gender}</div>
        </td>
        <td><span className={'status-badge badge-' + r.status} style={{ textTransform:'capitalize' }}>{r.status}</span></td>
        <td style={{ color:'var(--text-muted)', fontSize:12 }}>
          {r.locationName || (r.location?.coordinates ? `${r.location.coordinates[1].toFixed(3)}, ${r.location.coordinates[0].toFixed(3)}` : '—')}
        </td>
        <td style={{ color:'var(--text-muted)', fontSize:12 }}>
          <div>{r.submittedBy?.name || '—'}</div>
          <div style={{ fontSize:11 }}>{new Date(r.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</div>
        </td>
        <td>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {r.status === 'pending' && <>
              <button onClick={() => onAction(r._id,'active')} className="btn btn-accent btn-sm">Approve</button>
              <button onClick={() => onAction(r._id,'critical')} className="btn btn-danger btn-sm">Critical</button>
              <button onClick={() => onAction(r._id,'rejected')} className="btn btn-sm" style={{background:'#546e7a',color:'white'}}>Reject</button>
            </>}
            {r.status === 'active' && <>
              <button onClick={() => onAction(r._id,'critical')} className="btn btn-danger btn-sm">Escalate</button>
              <button onClick={() => onAction(r._id,'resolved')} className="btn btn-sm" style={{background:'var(--resolved)',color:'white'}}>Resolve</button>
            </>}
            {r.status === 'critical' && (
              <button onClick={() => onAction(r._id,'resolved')} className="btn btn-sm" style={{background:'var(--resolved)',color:'white'}}>Resolve</button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background:'#f0f4f8' }}>
          <td colSpan={6} style={{ padding:'12px 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,180px),1fr))', gap:16, fontSize:12 }}>
              <div><b style={{color:'var(--navy)'}}>Description</b><p style={{color:'var(--text-muted)',marginTop:4,lineHeight:1.6}}>{mp.description || '—'}</p></div>
              <div><b style={{color:'var(--navy)'}}>Physical</b>
                <p style={{color:'var(--text-muted)',marginTop:4,lineHeight:1.8}}>
                  Height: {mp.height||'—'}<br/>Hair: {mp.hairColor||'—'}<br/>Eyes: {mp.eyeColor||'—'}
                </p>
              </div>
              <div><b style={{color:'var(--navy)'}}>Contact</b>
                <p style={{color:'var(--text-muted)',marginTop:4,lineHeight:1.8}}>
                  {r.contactInfo?.name}<br/>{r.contactInfo?.phone}<br/>{r.contactInfo?.email}
                </p>
              </div>
              <div><b style={{color:'var(--navy)'}}>Clothing</b><p style={{color:'var(--text-muted)',marginTop:4,lineHeight:1.6}}>{mp.clothingDescription||'—'}</p></div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

export default function Admin() {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isMobile, isTablet } = useResponsive();
  const [reports, setReports] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total:0, active:0, critical:0, resolved:0, pending:0, recent:[] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedRow, setExpandedRow] = useState(null);
  const [toast, setToast] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = useCallback(async () => {
    try {
      const [rRes, sRes, uRes, stRes] = await Promise.all([
        api.get('/reports/all?status=' + statusFilter),
        api.get('/sightings?status=pending'),
        api.get('/users'),
        api.get('/reports/stats'),
      ]);
      if (rRes.data.success) setReports(rRes.data.reports || []);
      if (sRes.data.success) setSightings(sRes.data.sightings || []);
      if (uRes.data.success) setUsers(uRes.data.users || []);
      if (stRes.data.success) setStats(stRes.data.stats || {});
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (socket) {
      socket.on('new_report', () => { loadAll(); showToast('New report submitted!', 'info'); });
      return () => socket.off('new_report');
    }
  }, [socket, loadAll]);

  const updateReportStatus = async (id, status) => {
    try {
      await api.put('/reports/' + id + '/status', { status });
      showToast('Report status updated to ' + status);
      loadAll();
    } catch(e) { showToast('Failed to update', 'error'); }
  };

  const updateSighting = async (id, status) => {
    try {
      await api.put('/sightings/' + id + '/status', { status });
      showToast('Sighting ' + status);
      loadAll();
    } catch(e) { showToast('Failed', 'error'); }
  };

  const updateUserRole = async (id, role) => {
    try {
      await api.put('/users/' + id + '/role', { role });
      showToast('User role updated');
      loadAll();
    } catch(e) { showToast('Failed', 'error'); }
  };

  const allReports = reports.filter(r => r.location?.coordinates);
  const filteredUsers = users.filter(u => !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()));

  const tabs = [
    { id:'dashboard', label:'Dashboard', icon:'🏠' },
    { id:'reports', label:'Reports', icon:'📋', badge: stats.pending },
    { id:'sightings', label:'Sightings', icon:'👁️', badge: sightings.length },
    { id:'users', label:'Users', icon:'👥' },
    { id:'map', label:'Live Map', icon:'🗺️' },
  ];

  return (
    <div style={{ paddingTop:'var(--header-height)', minHeight:'100vh', background:'var(--bg)' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:120, right:20, zIndex:9999, padding:'12px 20px',
          background: toast.type==='error' ? 'var(--critical)' : toast.type==='info' ? 'var(--accent)' : 'var(--resolved)',
          color:'white', borderRadius:4, boxShadow:'var(--shadow-lg)', fontSize:13, fontWeight:600,
          animation:'slideIn 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Admin Header */}
      <div style={{ background:'white', borderBottom:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
        <div className="page-container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:8, height:40, background:'var(--amber)', borderRadius:2 }} />
            <div>
              <h1 style={{ fontFamily:'Poppins', fontSize:'1.4rem', color:'var(--navy)', lineHeight:1 }}>Administration Console</h1>
              <p style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>MPAS — Missing Person Alert System Control Panel</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', gap:8 }}>
              {[{c:'var(--amber)',n:stats.pending,l:'Pending'},{c:'var(--accent)',n:stats.active,l:'Active'},{c:'var(--critical)',n:stats.critical,l:'Critical'}].map(s => (
                <div key={s.l} style={{ textAlign:'center', padding:'6px 14px', background:'var(--bg)', borderRadius:4, border:'1px solid var(--border)' }}>
                  <div style={{ fontFamily:'Poppins', fontWeight:700, fontSize:'1.2rem', color:s.c, lineHeight:1 }}>{s.n}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <button onClick={loadAll} className="btn btn-outline btn-sm" style={{ gap:5 }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ borderTop:'1px solid var(--border)' }}>
          <div className="page-container" style={{ display:'flex', padding:'0 24px' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding:'11px 18px', border:'none', cursor:'pointer', background:'transparent',
                color: activeTab===t.id ? 'var(--navy)' : 'var(--text-muted)',
                fontWeight: activeTab===t.id ? 700 : 500, fontSize:13,
                borderBottom: activeTab===t.id ? '2px solid var(--navy)' : '2px solid transparent',
                marginBottom:-1, display:'flex', alignItems:'center', gap:6, transition:'all 0.15s'
              }}>
                <span>{t.icon}</span> {t.label}
                {t.badge > 0 && <span style={{ background:'var(--critical)', color:'white', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding:'24px' }}>
        {loading ? <div className="loading-spinner"/> : (
          <>
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,180px),1fr))', gap:14, marginBottom:24 }}>
                  <StatCard icon="📋" value={stats.total} label="Total Cases" color="var(--navy)" bg="#e8eaf6"/>
                  <StatCard icon="⏳" value={stats.pending} label="Pending Review" color="#f57f17" bg="#fff8e1"/>
                  <StatCard icon="⚠️" value={stats.active} label="Active Cases" color="var(--accent)" bg="#e3f2fd"/>
                  <StatCard icon="🚨" value={stats.critical} label="Critical Cases" color="var(--critical)" bg="#ffebee"/>
                  <StatCard icon="✅" value={stats.resolved} label="Resolved" color="var(--resolved)" bg="#e8f5e9"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:(isMobile||isTablet)?'1fr':'2fr 1fr', gap:20 }}>
                  <div className="card" style={{ overflow:'hidden' }}>
                    <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.1rem' }}>Recent Submissions</h3>
                      <button onClick={() => setActiveTab('reports')} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:12, cursor:'pointer', fontWeight:600 }}>View All →</button>
                    </div>
                    <table>
                      <thead><tr>
                        <th>Name</th><th>Status</th><th>Location</th><th>Date</th>
                      </tr></thead>
                      <tbody>
                        {(stats.recent||[]).map(r => (
                          <tr key={r._id}>
                            <td><div style={{fontWeight:600}}>{r.missingPerson?.name||'—'}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{r.missingPerson?.age} yrs</div></td>
                            <td><span className={'status-badge badge-'+r.status} style={{textTransform:'capitalize'}}>{r.status}</span></td>
                            <td style={{fontSize:12,color:'var(--text-muted)'}}>{r.locationName||'—'}</td>
                            <td style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                        {(!stats.recent||stats.recent.length===0) && (
                          <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-muted)',padding:24}}>No recent submissions</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="card" style={{ padding:'20px' }}>
                    <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', marginBottom:16, fontSize:'1.1rem' }}>Quick Actions</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {[
                        { label:'Review Pending Reports', n: stats.pending, tab:'reports', filter:'pending', color:'var(--amber)' },
                        { label:'Active Case Monitor', n: stats.active, tab:'reports', filter:'active', color:'var(--accent)' },
                        { label:'Critical Alerts', n: stats.critical, tab:'reports', filter:'critical', color:'var(--critical)' },
                        { label:'Pending Sightings', n: sightings.length, tab:'sightings', filter:'', color:'var(--teal)' },
                        { label:'User Management', n: users.length, tab:'users', filter:'', color:'#7b1fa2' },
                      ].map(a => (
                        <button key={a.label} onClick={() => { setActiveTab(a.tab); if(a.filter) setStatusFilter(a.filter); }} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 14px', background:'var(--bg)', border:'1px solid var(--border)',
                          borderRadius:4, cursor:'pointer', fontSize:13, transition:'all 0.15s',
                          borderLeft:`3px solid ${a.color}`
                        }}
                        onMouseEnter={e => e.currentTarget.style.background='#e8f4ff'}
                        onMouseLeave={e => e.currentTarget.style.background='var(--bg)'}
                        >
                          <span style={{fontWeight:500}}>{a.label}</span>
                          <span style={{fontFamily:'Poppins',fontWeight:700,fontSize:'1rem',color:a.color}}>{a.n}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeTab === 'reports' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.3rem' }}>Reports Management</h2>
                  <div style={{ display:'flex', gap:6 }}>
                    {['pending','active','critical','resolved','rejected'].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)} style={{
                        padding:'5px 14px', borderRadius:3, border:'1px solid var(--border)', cursor:'pointer', fontSize:12, fontWeight:600,
                        background: statusFilter===s ? 'var(--navy)' : 'white',
                        color: statusFilter===s ? 'white' : 'var(--text-muted)',
                        textTransform:'capitalize', transition:'all 0.15s'
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ overflow:'hidden' }}>
                  {reports.length === 0 ? (
                    <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>
                      <div style={{ fontSize:'2.5rem', marginBottom:10 }}>📋</div>
                      <p>No {statusFilter} reports found.</p>
                    </div>
                  ) : (
                    <table>
                      <thead><tr>
                        <th style={{width:32}}/>
                        <th>Missing Person</th><th>Status</th><th>Location</th>
                        <th>Submitted By</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {reports.map(r => (
                          <ReportRow key={r._id} r={r} onAction={updateReportStatus}
                            expanded={expandedRow===r._id} onToggle={() => setExpandedRow(expandedRow===r._id ? null : r._id)}/>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* SIGHTINGS */}
            {activeTab === 'sightings' && (
              <div>
                <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', marginBottom:16, fontSize:'1.3rem' }}>
                  Pending Sightings <span style={{fontFamily:'Inter',fontSize:13,color:'var(--text-muted)',fontWeight:400}}>({sightings.length} awaiting review)</span>
                </h2>
                {sightings.length === 0 ? (
                  <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:10 }}>👁️</div>
                    <p>No pending sightings to review.</p>
                  </div>
                ) : (
                  <div className="card" style={{ overflow:'hidden' }}>
                    <table>
                      <thead><tr>
                        <th>Case</th><th>Submitted By</th><th>Sighting Date</th><th>Location</th><th>Description</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {sightings.map(s => (
                          <tr key={s._id}>
                            <td>
                              <div style={{fontWeight:600,fontSize:13}}>{s.report?.missingPerson?.name||'—'}</div>
                              <span className={'status-badge badge-'+(s.report?.status||'pending')} style={{textTransform:'capitalize',marginTop:3,display:'inline-flex'}}>{s.report?.status}</span>
                            </td>
                            <td style={{fontSize:12,color:'var(--text-muted)'}}>{s.submittedBy?.name}<br/>{s.submittedBy?.email}</td>
                            <td style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(s.sightingDate).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</td>
                            <td style={{fontSize:12,color:'var(--text-muted)'}}>{s.locationName||'—'}</td>
                            <td style={{fontSize:12,maxWidth:200}}>{s.description?.substring(0,100)}{s.description?.length>100&&'...'}</td>
                            <td>
                              <div style={{display:'flex',gap:6}}>
                                <button onClick={() => updateSighting(s._id,'verified')} className="btn btn-primary btn-sm">Verify</button>
                                <button onClick={() => updateSighting(s._id,'rejected')} className="btn btn-danger btn-sm">Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.3rem' }}>User Management ({users.length})</h2>
                  <input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{width:240, fontSize:12}} />
                </div>
                <div className="card" style={{ overflow:'hidden' }}>
                  <table>
                    <thead><tr>
                      <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                      {filteredUsers.map((u,i) => (
                        <tr key={u._id}>
                          <td style={{color:'var(--text-muted)',fontSize:11}}>{i+1}</td>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:28,height:28,borderRadius:'50%',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontFamily:'Poppins',fontWeight:700,fontSize:12}}>
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                              <span style={{fontWeight:500,fontSize:13}}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{fontSize:12,color:'var(--text-muted)'}}>{u.email}</td>
                          <td>
                            <span style={{
                              background: u.role==='admin' ? '#e3f2fd' : '#f5f5f5',
                              color: u.role==='admin' ? 'var(--accent)' : 'var(--text-muted)',
                              padding:'3px 10px', borderRadius:2, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em'
                            }}>{u.role}</span>
                          </td>
                          <td>
                            <span style={{width:7,height:7,borderRadius:'50%',display:'inline-block',background: u.isActive ? '#4caf50' : '#ef5350',marginRight:5}}/>
                            <span style={{fontSize:12,color:'var(--text-muted)'}}>{u.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                          <td style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            {u.role === 'user' ? (
                              <button onClick={() => updateUserRole(u._id,'admin')} className="btn btn-primary btn-sm">Make Admin</button>
                            ) : (
                              <button onClick={() => updateUserRole(u._id,'user')} className="btn btn-outline btn-sm">Remove Admin</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={7} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MAP */}
            {activeTab === 'map' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.3rem' }}>Live Cases Map</h2>
                  <div style={{ display:'flex', gap:12, alignItems:'center', fontSize:12 }}>
                    {[{c:'#1565c0',l:'Active'},{c:'#c62828',l:'Critical'},{c:'#f57f17',l:'Pending'},{c:'#2e7d32',l:'Resolved'}].map(leg => (
                      <span key={leg.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:leg.c, display:'inline-block' }} />
                        {leg.l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ overflow:'hidden' }}>
                  <div style={{ height:500 }}>
                    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height:'100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"/>
                      {allReports.map(r => (
                        <Marker key={r._id}
                          position={[r.location.coordinates[1], r.location.coordinates[0]]}
                          icon={markers[r.status] || markers.pending}>
                          <Popup>
                            <strong>{r.missingPerson?.name}</strong><br/>
                            Age: {r.missingPerson?.age}<br/>
                            <span className={'status-badge badge-'+r.status} style={{textTransform:'capitalize'}}>{r.status}</span><br/>
                            {r.locationName}
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes slideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>
    </div>
  );
}
