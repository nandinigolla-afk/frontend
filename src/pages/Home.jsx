import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useResponsive } from '../hooks/useResponsive';
import api from '../utils/api';

// Inject bounce keyframe once
if (typeof document !== 'undefined' && !document.getElementById('mpas-bounce-style')) {
  const _s = document.createElement('style');
  _s.id = 'mpas-bounce-style';
  _s.textContent = `
    @keyframes mpas-bounce {
      0%,100% { transform:translateY(0);     animation-timing-function:cubic-bezier(.33,0,.66,0); }
      40%      { transform:translateY(-18px); animation-timing-function:cubic-bezier(.33,1,.68,1); }
      70%      { transform:translateY(-8px);  animation-timing-function:cubic-bezier(.33,0,.66,0); }
      85%      { transform:translateY(-3px);  animation-timing-function:cubic-bezier(.33,1,.68,1); }
    }
    @keyframes mpas-shadow {
      0%,100% { transform:scaleX(1);   opacity:.35; }
      40%      { transform:scaleX(.5); opacity:.12; }
      85%      { transform:scaleX(.8); opacity:.26; }
    }
    .mpas-bouncy-pin    { animation:mpas-bounce 1.9s ease-in-out infinite; transform-origin:bottom center; display:inline-block; }
    .mpas-bouncy-shadow { width:12px;height:4px;background:rgba(0,0,0,0.35);border-radius:50%;margin:-2px auto 0;filter:blur(1px);animation:mpas-shadow 1.9s ease-in-out infinite; }
  `;
  document.head.appendChild(_s);
}

function makePin(fill, size, pulse, bouncy) {
  const cx=size/2, cy=size*0.38;
  const uid = size+''+fill.replace('#','');
  const rings = pulse ? '<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="'+fill+'" opacity="0"><animate attributeName="r" values="5;'+size*0.85+';5" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0;0.55" dur="2.6s" repeatCount="indefinite"/></circle>' : '';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size*1.35+'" viewBox="0 0 '+size+' '+size*1.35+'"><defs><filter id="d'+uid+'"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/></filter></defs>'+rings+'<path d="M'+cx+' 1C'+size*0.22+' 1 '+size*0.06+' '+size*0.22+' '+size*0.06+' '+cy+'C'+size*0.06+' '+size*0.65+' '+cx+' '+size*1.3+' '+cx+' '+size*1.3+'S'+size*0.94+' '+size*0.65+' '+size*0.94+' '+cy+'C'+size*0.94+' '+size*0.22+' '+size*0.78+' 1 '+cx+' 1Z" fill="'+fill+'" stroke="white" stroke-width="2" filter="url(#d'+uid+')"/><circle cx="'+cx+'" cy="'+cy+'" r="'+size*0.18+'" fill="white"/><circle cx="'+cx+'" cy="'+cy+'" r="'+size*0.1+'" fill="'+fill+'"/></svg>';
  const html = bouncy
    ? '<div class="mpas-bouncy-pin">'+svg+'</div><div class="mpas-bouncy-shadow"></div>'
    : svg;
  const h = bouncy ? size*1.35+10 : size*1.35;
  return L.divIcon({ html, className:'', iconSize:[size,h], iconAnchor:[size/2,h], popupAnchor:[0,-size*1.1] });
}
const P_NAVY =makePin('#38bdf8',40,true,true);
const P_AMBER=makePin('#E39A2D',30,true,false);
const P_RED  =makePin('#f87171',34,true,false);
const P_TEAL =makePin('#4ade80',26,false,false);
const pinByStatus=s=>s==='critical'?P_RED:s==='resolved'?P_TEAL:s==='active'?P_AMBER:P_NAVY;

const DEMO=[{id:1,pos:[17.395,78.476],status:'active'},{id:2,pos:[17.386,78.489],status:'critical'},{id:3,pos:[17.374,78.502],status:'active'},{id:4,pos:[17.402,78.462],status:'active'},{id:5,pos:[17.368,78.514],status:'resolved'}];
const FEATURES=[{icon:'🔍',label:'Report',desc:'Submit missing person reports instantly'},{icon:'📡',label:'Alert',desc:'Real-time proximity notifications'},{icon:'👁',label:'Sightings',desc:'Community sighting submissions'},{icon:'🗺',label:'Track',desc:'Live map case tracking'},{icon:'✅',label:'Resolve',desc:'Coordinate and close cases'}];

export default function Home() {
  const { isMobile, isTablet } = useResponsive();
  const [stats, setStats] = useState({active:0,resolved:0,total:0,critical:0});
  const [pins, setPins] = useState(DEMO);
  useEffect(()=>{
    api.get('/reports/stats').then(({data})=>{if(data.success)setStats(data.stats);}).catch(()=>{});
    api.get('/reports/public').then(({data})=>{
      if(data.success&&data.reports.length>0){
        const live=data.reports.slice(0,8).map((r,i)=>({id:r._id,pos:r.location?.coordinates?[r.location.coordinates[1],r.location.coordinates[0]]:DEMO[i%DEMO.length].pos,status:r.status,name:r.missingPerson?.name}));
        if(live.length) setPins(live);
      }
    }).catch(()=>{});
  },[]);

  const heroH=isMobile?300:isTablet?400:500;
  const cols=isMobile?'repeat(2,1fr)':isTablet?'repeat(3,1fr)':'repeat(5,1fr)';

  return (
    <div style={{paddingTop:'var(--header-h)'}}>
      <div style={{position:'relative',height:heroH,overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,zIndex:0,background:'#0D3B4C'}}/>
        <MapContainer center={[17.386,78.489]} zoom={isMobile?12:14} style={{height:'100%',width:'100%',position:'relative',zIndex:1,opacity:0.85}} zoomControl={false} scrollWheelZoom={false} dragging={false} doubleClickZoom={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"/>
          {pins.map(p=><Marker key={p.id} position={p.pos} icon={pinByStatus(p.status)}><Popup>{p.name||'Case'}</Popup></Marker>)}
          <Polyline positions={pins.slice(0,5).map(p=>p.pos)} pathOptions={{color:'#E39A2D',weight:1.5,dashArray:'8,12',opacity:0.55}}/>
        </MapContainer>
        <div style={{position:'absolute',inset:0,zIndex:2,pointerEvents:'none',background:isMobile?'rgba(13,59,76,0.78)':'linear-gradient(90deg,rgba(13,59,76,0.93) 0%,rgba(13,59,76,0.82) 30%,rgba(13,59,76,0.2) 52%,transparent 68%)'}}/>
        <div style={{position:'absolute',inset:0,zIndex:3,display:'flex',alignItems:'center',justifyContent:isMobile?'center':'flex-start'}}>
          <div className="page-wrap" style={{width:'100%'}}>
            <div style={{maxWidth:isMobile?'100%':520,textAlign:isMobile?'center':'left'}}>
              <h1 style={{fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:isMobile?'1.8rem':isTablet?'2.6rem':'3.4rem',color:'white',lineHeight:1.1,marginBottom:12,letterSpacing:'-0.03em'}}>
                Missing Person<br/>Alert System
              </h1>
              <p style={{color:'rgba(255,255,255,0.78)',marginBottom:24,fontSize:isMobile?13.5:16,lineHeight:1.65,fontFamily:'Poppins,sans-serif'}}>Community-Powered Search Network</p>
              <Link to="/report" style={{display:'inline-flex',alignItems:'center',gap:8,padding:isMobile?'11px 24px':'13px 32px',background:'#E39A2D',color:'#1a0e00',borderRadius:50,fontWeight:600,fontSize:isMobile?14:15,boxShadow:'0 4px 18px rgba(227,154,45,0.45)',fontFamily:'Poppins,sans-serif'}}>Report Missing Person</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{background:'white',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',overflowX:'auto'}}>
        <div className="page-wrap">
          <div style={{display:'flex',justifyContent:'center',minWidth:280}}>
            {[{n:stats.total,l:'Total',c:'var(--navy)'},{n:stats.active,l:'Active',c:'#2563eb'},{n:stats.critical,l:'Critical',c:'#ef4444'},{n:stats.resolved,l:'Resolved',c:'#16a34a'}].map((s,i)=>(
              <div key={i} style={{textAlign:'center',padding:isMobile?'14px 16px':'22px 36px',borderRight:i<3?'1px solid var(--border)':'none',flex:1}}>
                <div style={{fontFamily:'Poppins',fontSize:isMobile?'1.3rem':'1.9rem',fontWeight:800,color:s.c,lineHeight:1}}>{s.n||0}</div>
                <div style={{color:'var(--text-muted)',fontSize:isMobile?10:12.5,marginTop:3}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-wrap" style={{padding:isMobile?'28px 0':'52px 0'}}>
        <div style={{display:'grid',gridTemplateColumns:cols,gap:isMobile?10:16}}>
          {FEATURES.map(f=>(
            <div key={f.label} className="card" style={{padding:isMobile?'16px 12px':'28px 18px',textAlign:'center',transition:'transform 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
            >
              <div style={{width:44,height:44,background:'var(--bg)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontSize:'1.4rem',border:'1.5px solid var(--border)'}}>{f.icon}</div>
              <div style={{fontFamily:'Poppins',fontWeight:800,color:'var(--navy)',fontSize:isMobile?'0.83rem':'1rem',marginBottom:4}}>{f.label}</div>
              <div style={{color:'var(--text-muted)',fontSize:isMobile?11:13,lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:'var(--navy)',padding:isMobile?'32px 0':'52px 0'}}>
        <div className="page-wrap" style={{textAlign:'center'}}>
          <h2 style={{fontFamily:'Poppins',fontSize:isMobile?'1.3rem':'2rem',color:'white',marginBottom:10}}>Every second matters</h2>
          <p style={{color:'rgba(255,255,255,0.6)',marginBottom:22,fontSize:isMobile?13.5:15}}>Join the community helping locate missing persons.</p>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/register" className="btn btn-amber" style={{borderRadius:50}}>Join the Network</Link>
            <Link to="/alerts" style={{padding:'10px 24px',border:'1.5px solid rgba(255,255,255,0.3)',color:'rgba(255,255,255,0.85)',borderRadius:50,fontWeight:600,fontSize:14,fontFamily:'Poppins,sans-serif'}}>View Active Cases</Link>
          </div>
        </div>
      </div>
      <div style={{background:'#0a1929',padding:'12px 0'}}>
        <div className="page-wrap" style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.35)',flexWrap:'wrap',gap:6}}>
          <span>© 2024 MPAS</span><span>Emergency: 112 · Missing Child: 1098</span>
        </div>
      </div>
    </div>
  );
}
