import React from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

export default function About() {
  const { isMobile, isTablet } = useResponsive();
  const stacked = isMobile || isTablet;

  const STATS = [['10K+','Cases Handled','var(--navy)'],['2.5L+','Registered Users','#2563eb'],['78%','Resolution Rate','#16a34a'],['5km','Alert Radius','var(--amber)']];
  const STEPS = [
    {n:'01',icon:'📝',t:'Submit Report',d:'Register and file a missing person report with photo, physical description, and last known location.'},
    {n:'02',icon:'🔍',t:'Verification',d:'Trained administrators review every submission for accuracy before activating the alert network.'},
    {n:'03',icon:'📡',t:'Real-Time Alert',d:'Verified cases trigger instant notifications to all users within 5km via app and email.'},
    {n:'04',icon:'👁️',t:'Community Sightings',d:'Community members submit sightings. Each is reviewed before being published on the case page.'},
    {n:'05',icon:'✅',t:'Case Resolution',d:'When a person is found, case is marked resolved, all parties notified, and archived for records.'},
  ];
  const ROLES = [
    {t:'Community Members',icon:'👥',items:['Submit missing person reports','Report verified sightings','Receive location-based alerts','Track active cases on the map']},
    {t:'Administrators',icon:'⚙️',items:['Verify reports before publication','Review and approve sightings','Manage case status','Monitor live tracking dashboard']},
  ];

  return (
    <div style={{ paddingTop:'var(--header-h)', minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ background:'var(--navy)', padding: isMobile ? '24px 0' : '40px 0' }}>
        <div className="page-wrap">
          <h1 style={{ fontFamily:'Poppins', color:'white', fontSize: isMobile ? '1.6rem' : '2rem', marginBottom:8 }}>About MPAS</h1>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize: isMobile ? 13.5 : 14.5, maxWidth:560, lineHeight:1.7 }}>
            A community-powered platform connecting people to help find missing persons through real-time alerts and collaborative reporting.
          </p>
        </div>
      </div>

      <div className="page-wrap" style={{ padding: isMobile ? '20px 0' : '32px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns: stacked ? '1fr' : '200px 1fr', gap: stacked ? 20 : 28, alignItems:'start' }}>

          {/* Sidebar nav — hidden on mobile */}
          {!stacked && (
            <div style={{ position:'sticky', top:'calc(var(--header-h) + 20px)' }}>
              <div className="card" style={{ padding:16 }}>
                {['Mission','How It Works','Community Roles','Privacy & Safety','Contact'].map((s,i) => (
                  <a key={s} href={'#about-section'+i} style={{ display:'block', padding:'9px 12px', borderRadius:8, color:'var(--text-muted)', fontSize:13.5, fontWeight:500, transition:'all 0.15s', marginBottom:3 }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#f0f4f8'; e.currentTarget.style.color='var(--navy)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)';}}>{s}</a>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 16 : 24 }}>

            <div id="about-section0" className="card" style={{ padding: isMobile ? '18px 16px' : '28px 32px' }}>
              <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize: isMobile ? '1.2rem' : '1.4rem', marginBottom:12 }}>Our Mission</h2>
              <p style={{ color:'var(--text-muted)', lineHeight:1.8, fontSize:14, marginBottom:12 }}>
                Every year, thousands of individuals go missing. MPAS bridges the gap between families and communities by providing a centralized, real-time platform for reporting, tracking, and resolving missing person cases.
              </p>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10, marginTop:18 }}>
                {STATS.map(([n,l,c]) => (
                  <div key={l} style={{ textAlign:'center', padding:'14px 10px', background:'#f8fafc', borderRadius:10, borderTop:`3px solid ${c}` }}>
                    <div style={{ fontFamily:'Poppins', fontWeight:800, fontSize: isMobile ? '1.3rem' : '1.5rem', color:c }}>{n}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div id="about-section1" className="card" style={{ padding: isMobile ? '18px 16px' : '28px 32px' }}>
              <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize: isMobile ? '1.2rem' : '1.4rem', marginBottom:16 }}>How It Works</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {STEPS.map(s => (
                  <div key={s.n} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{ width:38, height:38, background:'var(--navy)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'Poppins', fontWeight:800, color:'white', fontSize:12 }}>{s.n}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                        <span>{s.icon}</span>
                        <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'0.95rem' }}>{s.t}</h3>
                      </div>
                      <p style={{ color:'var(--text-muted)', fontSize:13.5, lineHeight:1.65 }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="about-section2" className="card" style={{ padding: isMobile ? '18px 16px' : '28px 32px' }}>
              <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize: isMobile ? '1.2rem' : '1.4rem', marginBottom:16 }}>Community Roles</h2>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
                {ROLES.map(r => (
                  <div key={r.t} style={{ background:'#f8fafc', borderRadius:10, padding:18 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                      <span style={{ fontSize:'1.3rem' }}>{r.icon}</span>
                      <h3 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize:'0.95rem' }}>{r.t}</h3>
                    </div>
                    <ul style={{ paddingLeft:18, color:'var(--text-muted)', fontSize:13.5, lineHeight:1.9, margin:0 }}>
                      {r.items.map(i => <li key={i}>{i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div id="about-section3" className="card" style={{ padding: isMobile ? '18px 16px' : '28px 32px' }}>
              <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize: isMobile ? '1.2rem' : '1.4rem', marginBottom:12 }}>Privacy & Safety</h2>
              <p style={{ color:'var(--text-muted)', lineHeight:1.8, fontSize:14, marginBottom:12 }}>
                All data submitted is encrypted and stored securely. Your location data is only used to send relevant nearby alerts and is never shared with third parties.
              </p>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'12px 16px' }}>
                <p style={{ fontSize:13, color:'#92400e', lineHeight:1.7, margin:0 }}>
                  ⚠️ Misuse of this platform for false reporting may result in account suspension and legal action.
                </p>
              </div>
            </div>

            <div id="about-section4" className="card" style={{ padding: isMobile ? '18px 16px' : '28px 32px' }}>
              <h2 style={{ fontFamily:'Poppins', color:'var(--navy)', fontSize: isMobile ? '1.2rem' : '1.4rem', marginBottom:12 }}>Contact & Help</h2>
              <p style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.7, marginBottom:18 }}>
                For technical support or report-related queries, contact the admin team through your dashboard.
              </p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <Link to="/register" className="btn btn-navy" style={{ borderRadius:50 }}>Register Now</Link>
                <Link to="/alerts" className="btn btn-outline" style={{ borderRadius:50 }}>View Active Cases</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:'#0a1929', padding:'16px 0', marginTop:32 }}>
        <div className="page-wrap" style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'rgba(255,255,255,0.4)', flexWrap:'wrap', gap:6 }}>
          <span>© 2024 MPAS — Missing Person Alert System</span>
          <span>Emergency: 112 · Missing Child: 1098</span>
        </div>
      </div>
    </div>
  );
}
