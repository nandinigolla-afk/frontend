import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    const h = e => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (user) api.get('/notifications').then(({data}) => setUnread(data.unreadCount || 0)).catch(() => {});
  }, [user, location.pathname]);

  const active = p => location.pathname === p;
  const NAV = [['/', 'Home'], ['/report', 'Report'], ['/alerts', 'Alerts'], ['/sightings', 'Sightings'], ['/about', 'About']];
  const mobile = isMobile || isTablet;

  return (
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:1000,height:'var(--header-h)',background:'white',boxShadow:'0 1px 0 var(--border)',display:'flex',alignItems:'center'}}>
        <div className="page-wrap" style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
          <Link to="/" style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <div style={{width:36,height:36,background:'var(--navy)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
                <circle cx="12" cy="9" r="2.5" fill="#E39A2D"/>
              </svg>
            </div>
            <span style={{fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:isMobile?'1rem':'1.2rem',color:'var(--navy)',letterSpacing:'-0.02em'}}>MPAS</span>
          </Link>

          {!mobile && (
            <div style={{display:'flex',alignItems:'center',gap:2}}>
              {NAV.map(([p,l]) => (
                <Link key={p} to={p} style={{padding:'7px 13px',borderRadius:8,fontFamily:'Poppins,sans-serif',fontWeight:500,fontSize:14,color:active(p)?'var(--amber)':'#1F2937',transition:'color 0.15s'}}
                onMouseEnter={e=>{if(!active(p))e.currentTarget.style.color='var(--navy)';}}
                onMouseLeave={e=>{if(!active(p))e.currentTarget.style.color='#1F2937';}}
                >{l}</Link>
              ))}
            </div>
          )}

          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            {!mobile && (user ? (
              <div ref={profileRef} style={{position:'relative'}}>
                <button onClick={()=>setProfileOpen(!profileOpen)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px 6px 7px',background:'var(--bg)',border:'1.5px solid var(--border)',borderRadius:50,cursor:'pointer'}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:12}}>{user.name?.charAt(0).toUpperCase()}</div>
                  <span style={{fontWeight:600,fontSize:13.5,color:'var(--navy)',fontFamily:'Poppins,sans-serif'}}>{user.name?.split(' ')[0]}</span>
                  {unread>0 && <span style={{background:'var(--red)',color:'white',borderRadius:'50%',width:17,height:17,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{unread>9?'9+':unread}</span>}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {profileOpen && (
                  <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'white',borderRadius:14,minWidth:210,boxShadow:'0 12px 40px rgba(13,59,76,0.18)',border:'1px solid var(--border)',overflow:'hidden',zIndex:9999}}>
                    <div style={{background:'var(--navy)',padding:'14px 16px'}}>
                      <div style={{fontFamily:'Poppins',fontWeight:700,color:'white',fontSize:14}}>{user.name}</div>
                      <div style={{color:'rgba(255,255,255,0.55)',fontSize:11,marginTop:2}}>{user.email}</div>
                      <span style={{display:'inline-block',marginTop:5,background:user.role==='admin'?'var(--amber)':'rgba(255,255,255,0.12)',color:user.role==='admin'?'#1a0e00':'white',padding:'2px 9px',borderRadius:50,fontSize:10,fontWeight:700}}>{user.role.toUpperCase()}</span>
                    </div>
                    <div style={{padding:'4px 0'}}>
                      {[{icon:'👤',label:'My Dashboard',path:'/dashboard'},...(isAdmin?[{icon:'⚙️',label:'Admin Panel',path:'/admin'}]:[])].map(item=>(
                        <Link key={item.label} to={item.path} onClick={()=>setProfileOpen(false)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',color:'var(--text)',fontSize:13.5,fontFamily:'Poppins,sans-serif',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f4f6f9'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                        ><span>{item.icon}</span>{item.label}</Link>
                      ))}
                      <div style={{height:1,background:'var(--border)',margin:'4px 10px'}}/>
                      <button onClick={()=>{setProfileOpen(false);logout();navigate('/');}} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',width:'100%',background:'none',border:'none',color:'var(--red)',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#fff5f5'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >🚪 Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{padding:'8px 22px',background:'var(--navy)',color:'white',borderRadius:50,fontWeight:700,fontSize:13.5,fontFamily:'Poppins,sans-serif'}}>Login</Link>
            ))}

            {mobile && (
              <button onClick={()=>setMenuOpen(v=>!v)} style={{width:38,height:38,borderRadius:9,border:'1.5px solid var(--border)',background:'white',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,cursor:'pointer',padding:0}}>
                <span style={{width:18,height:2,background:'var(--navy)',borderRadius:2,display:'block',transition:'all 0.2s',transform:menuOpen?'rotate(45deg) translate(0,7px)':'none'}}/>
                <span style={{width:18,height:2,background:'var(--navy)',borderRadius:2,display:'block',opacity:menuOpen?0:1,transition:'opacity 0.2s'}}/>
                <span style={{width:18,height:2,background:'var(--navy)',borderRadius:2,display:'block',transition:'all 0.2s',transform:menuOpen?'rotate(-45deg) translate(0,-7px)':'none'}}/>
              </button>
            )}
          </div>
        </div>
      </nav>

      {mobile && menuOpen && (
        <>
          <div onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,top:'var(--header-h)',zIndex:998,background:'rgba(13,59,76,0.45)',backdropFilter:'blur(2px)'}}/>
          <div style={{position:'fixed',top:'var(--header-h)',left:0,bottom:0,width:isMobile?'100%':300,background:'white',zIndex:999,overflowY:'auto',boxShadow:'4px 0 24px rgba(13,59,76,0.18)',display:'flex',flexDirection:'column'}}>
            {user && (
              <div style={{padding:'16px 20px',background:'var(--navy)',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:18}}>{user.name?.charAt(0).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:'white'}}>{user.name}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.6)'}}>{user.email}</div>
                </div>
                {unread>0 && <span style={{background:'var(--red)',color:'white',borderRadius:50,padding:'3px 9px',fontSize:12,fontWeight:700}}>{unread}</span>}
              </div>
            )}
            <div style={{padding:'8px 0',flex:1}}>
              {NAV.map(([p,l])=>(
                <Link key={p} to={p} style={{display:'flex',alignItems:'center',padding:'14px 20px',fontSize:15,fontFamily:'Poppins,sans-serif',fontWeight:active(p)?700:500,color:active(p)?'var(--amber)':'var(--text)',background:active(p)?'#fffbeb':'transparent',borderLeft:active(p)?'3px solid var(--amber)':'3px solid transparent'}}>{l}</Link>
              ))}
              <div style={{height:1,background:'var(--border)',margin:'8px 16px'}}/>
              {user ? (
                <>
                  <Link to="/dashboard" style={{display:'flex',alignItems:'center',gap:10,padding:'13px 20px',color:'var(--text)',fontSize:14.5,fontFamily:'Poppins,sans-serif'}}>👤 My Dashboard</Link>
                  {isAdmin && <Link to="/admin" style={{display:'flex',alignItems:'center',gap:10,padding:'13px 20px',color:'var(--text)',fontSize:14.5,fontFamily:'Poppins,sans-serif'}}>⚙️ Admin Panel</Link>}
                </>
              ) : (
                <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
                  <Link to="/login" style={{textAlign:'center',padding:'13px',background:'var(--navy)',color:'white',borderRadius:50,fontWeight:700,fontSize:15,fontFamily:'Poppins,sans-serif',display:'block'}}>Login</Link>
                  <Link to="/register" style={{textAlign:'center',padding:'13px',background:'var(--amber)',color:'#1a0e00',borderRadius:50,fontWeight:700,fontSize:15,fontFamily:'Poppins,sans-serif',display:'block'}}>Register</Link>
                </div>
              )}
            </div>
            {user && (
              <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)'}}>
                <button onClick={()=>{logout();navigate('/');setMenuOpen(false);}} style={{width:'100%',padding:'12px',background:'#fff5f5',color:'var(--red)',border:'1px solid #fca5a5',borderRadius:50,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
