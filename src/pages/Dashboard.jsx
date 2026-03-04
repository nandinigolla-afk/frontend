import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

const NOTIF_STYLES = {
  new_report:    { border:'#ef4444', bg:'#fff5f5', titleColor:'#dc2626' },
  case_resolved: { border:'#16a34a', bg:'#f0fdf4', titleColor:'#15803d' },
  new_sighting:  { border:'#E39A2D', bg:'#fffbeb', titleColor:'#92400e' },
  status_update: { border:'var(--navy)', bg:'#f5f8ff', titleColor:'var(--navy)' },
};

export default function Dashboard() {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [reports, setReports]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [platformStats, setPlatformStats] = useState({ total:0, active:0, critical:0, resolved:0, pending:0 });
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/reports/my'),
      api.get('/notifications'),
      api.get('/reports/stats'),
    ]).then(([r, n, s]) => {
      if (r.data.success) setReports(r.data.reports);
      if (n.data.success) setNotifications(n.data.notifications);
      if (s.data.success) setPlatformStats(s.data.stats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead:true })));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  // User's own stats
  const myTotal    = reports.length;
  const myActive   = reports.filter(r => r.status === 'active').length;
  const myResolved = reports.filter(r => r.status === 'resolved').length;
  const myPending  = reports.filter(r => r.status === 'pending').length;

  const TABS = [
    { id:'overview',       icon:'📊', label:'Overview' },
    { id:'reports',        icon:'📋', label:'My Reports',    count: myTotal },
    { id:'notifications',  icon:'🔔', label:'Notifications', count: unread  },
  ];

  return (
    <div style={{ paddingTop:'var(--header-h)', minHeight:'100vh', background:'var(--bg-light)' }}>

      {/* Header */}
      <div style={{ background:'var(--navy)', padding: isMobile ? '18px 0' : '28px 0' }}>
        <div className="page-wrap">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
            <div>
              <h1 style={{ fontFamily:'Poppins', color:'white', fontSize: isMobile ? '1.3rem' : '1.8rem', marginBottom:3, fontWeight:800 }}>
                My Dashboard
              </h1>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>Welcome back, {user?.name}</p>
            </div>
            <Link to="/report" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px',
              background:'var(--amber)', color:'#1a0e00', borderRadius:50, fontWeight:700, fontSize:13.5,
              textDecoration:'none', fontFamily:'Poppins,sans-serif', flexShrink:0 }}>
              + Report Missing Person
            </Link>
          </div>
        </div>
      </div>

      <div className="page-wrap" style={{ padding: isMobile ? '16px 0' : '24px 0' }}>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display:'flex', alignItems:'center', gap:6, padding: isMobile ? '8px 14px' : '9px 18px',
              borderRadius:50, border: activeTab===tab.id ? 'none' : '1.5px solid var(--border)',
              background: activeTab===tab.id ? 'var(--navy)' : 'white',
              color: activeTab===tab.id ? 'white' : 'var(--text-muted)',
              fontWeight:600, fontSize: isMobile ? 12.5 : 13.5, cursor:'pointer',
              fontFamily:'Poppins,sans-serif', whiteSpace:'nowrap', flexShrink:0
            }}>
              <span>{tab.icon}</span>{tab.label}
              {tab.count > 0 && (
                <span style={{ background: activeTab===tab.id ? 'rgba(255,255,255,0.25)' : '#f0f4f8',
                  borderRadius:50, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? <div className="spin" style={{ margin:'60px auto' }}/> : (
          <>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                {/* Platform-wide stats (same as admin) */}
                <div className="card" style={{ padding: isMobile ? '16px' : '24px' }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1rem', marginBottom:4, fontWeight:700 }}>
                    📡 Platform Statistics
                  </h2>
                  <p style={{ color:'var(--text-muted)', fontSize:12.5, marginBottom:16 }}>Live community-wide case data</p>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:10 }}>
                    {[
                      { n: platformStats.total,    l:'Total Cases',  c:'var(--navy)' },
                      { n: platformStats.active,   l:'Active',       c:'#2563eb' },
                      { n: platformStats.critical, l:'Critical',     c:'#ef4444' },
                      { n: platformStats.resolved, l:'Resolved',     c:'#16a34a' },
                      { n: platformStats.pending,  l:'Pending',      c:'#f59e0b' },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign:'center', padding:'14px 10px', background:'#f8fafc',
                        borderRadius:10, borderTop:`3px solid ${s.c}` }}>
                        <div style={{ fontFamily:'Poppins', fontWeight:800, fontSize: isMobile ? '1.4rem' : '1.7rem', color:s.c, lineHeight:1 }}>{s.n}</div>
                        <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:4 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User's own report stats */}
                <div className="card" style={{ padding: isMobile ? '16px' : '24px' }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1rem', marginBottom:16, fontWeight:700 }}>
                    📋 My Reports Summary
                  </h2>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10 }}>
                    {[
                      { n: myTotal,    l:'Submitted',  c:'var(--navy)' },
                      { n: myActive,   l:'Active',     c:'#2563eb' },
                      { n: myPending,  l:'Pending',    c:'#f59e0b' },
                      { n: myResolved, l:'Resolved',   c:'#16a34a' },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign:'center', padding:'14px 10px', background:'#f8fafc',
                        borderRadius:10, borderTop:`3px solid ${s.c}` }}>
                        <div style={{ fontFamily:'Poppins', fontWeight:800, fontSize:'1.5rem', color:s.c, lineHeight:1 }}>{s.n}</div>
                        <div style={{ color:'var(--text-muted)', fontSize:11, marginTop:4 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent reports */}
                {reports.length > 0 && (
                  <div className="card" style={{ padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                      <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1rem', fontWeight:700 }}>Recent Reports</h2>
                      <button onClick={() => setActiveTab('reports')}
                        style={{ background:'none', border:'none', color:'var(--navy)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        View all →
                      </button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {reports.slice(0, 4).map(r => (
                        <div key={r._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 14px', background:'#f8fafc', borderRadius:10, gap:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:'Poppins', fontWeight:600, color:'var(--navy)', fontSize:13.5,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {r.missingPerson?.name}
                            </div>
                            <div style={{ color:'var(--text-muted)', fontSize:11.5, marginTop:2 }}>
                              {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                            <span className={`badge badge-${r.status}`}>{r.status}</span>
                            {r.isPublic && (
                              <Link to={`/alerts/${r._id}`} style={{ padding:'4px 12px', background:'var(--navy)', color:'white',
                                borderRadius:50, fontSize:11.5, fontWeight:600, textDecoration:'none' }}>View</Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent notifications */}
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <div className="card" style={{ padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                      <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1rem', fontWeight:700 }}>
                        🔔 Unread Alerts ({unread})
                      </h2>
                      <button onClick={() => setActiveTab('notifications')}
                        style={{ background:'none', border:'none', color:'var(--navy)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        See all →
                      </button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {notifications.filter(n => !n.isRead).slice(0,3).map(n => {
                        const ns = NOTIF_STYLES[n.type] || NOTIF_STYLES.status_update;
                        return (
                          <div key={n._id} style={{ padding:'12px 14px', borderRadius:10, background:ns.bg,
                            borderLeft:`3px solid ${ns.border}`, border:`1px solid ${ns.border}33` }}>
                            <div style={{ fontFamily:'Poppins', fontWeight:600, color:ns.titleColor, fontSize:13, marginBottom:3 }}>{n.title}</div>
                            <p style={{ color:'var(--text-muted)', fontSize:12.5, lineHeight:1.55, margin:0 }}>{n.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {reports.length === 0 && (
                  <div className="card" style={{ padding:'48px 20px', textAlign:'center' }}>
                    <div style={{ fontSize:'3.5rem', marginBottom:14 }}>📋</div>
                    <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', marginBottom:8 }}>No reports yet</h3>
                    <p style={{ color:'var(--text-muted)', marginBottom:18, fontSize:14 }}>Submit your first missing person report to get started.</p>
                    <Link to="/report" className="btn btn-navy" style={{ borderRadius:50 }}>Submit a Report</Link>
                  </div>
                )}
              </div>
            )}

            {/* ── MY REPORTS TAB ── */}
            {activeTab === 'reports' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.1rem', fontWeight:700 }}>My Reports</h2>
                  <Link to="/report" className="btn btn-amber btn-sm" style={{ borderRadius:50 }}>+ New Report</Link>
                </div>

                {reports.length === 0 ? (
                  <div className="card" style={{ padding:'48px 20px', textAlign:'center', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:'3rem', marginBottom:12 }}>📋</div>
                    <p style={{ fontSize:15, marginBottom:16 }}>No reports submitted yet.</p>
                    <Link to="/report" className="btn btn-navy btn-sm">Submit First Report</Link>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {reports.map(r => (
                      <div key={r._id} className="card" style={{ padding: isMobile ? '14px 16px' : '18px 22px',
                        display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', marginBottom:3, fontSize:'0.95rem',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.missingPerson?.name}
                          </h3>
                          <p style={{ color:'var(--text-muted)', fontSize:12 }}>
                            Submitted {new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                          </p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                          <span className={`badge badge-${r.status}`}>{r.status}</span>
                          {r.isPublic && (
                            <Link to={`/alerts/${r._id}`} style={{ padding:'5px 14px', background:'var(--navy)', color:'white',
                              borderRadius:50, fontSize:12, fontWeight:600, textDecoration:'none' }}>View →</Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'1.1rem', fontWeight:700 }}>Notifications</h2>
                  {unread > 0 && (
                    <button onClick={markRead} style={{ padding:'6px 14px', background:'white', border:'1.5px solid var(--border)',
                      borderRadius:50, fontSize:12.5, fontWeight:600, cursor:'pointer', color:'var(--navy)' }}>
                      ✓ Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="card" style={{ padding:'48px 20px', textAlign:'center', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:'3rem', marginBottom:12 }}>🔔</div>
                    <p>No notifications yet. You'll receive alerts when cases are reported near you.</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {notifications.map(n => {
                      const ns = NOTIF_STYLES[n.type] || NOTIF_STYLES.status_update;
                      return (
                        <div key={n._id} style={{ padding: isMobile ? '14px' : '16px 20px', borderRadius:12,
                          borderLeft:`3px solid ${n.isRead ? 'var(--border)' : ns.border}`,
                          background: n.isRead ? 'white' : ns.bg, border:'1px solid var(--border)' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5, gap:8 }}>
                            <h4 style={{ fontFamily:'Poppins', fontWeight:600, color: n.isRead ? 'var(--text)' : ns.titleColor,
                              fontSize:'0.87rem', lineHeight:1.4, flex:1, margin:0 }}>{n.title}</h4>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                              {!n.isRead && <span style={{ width:7, height:7, background:ns.border, borderRadius:'50%', display:'inline-block' }}/>}
                              <span style={{ fontSize:10.5, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                                {new Date(n.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                              </span>
                            </div>
                          </div>
                          <p style={{ color:'var(--text-muted)', fontSize:12.5, lineHeight:1.6, margin:0 }}>{n.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
