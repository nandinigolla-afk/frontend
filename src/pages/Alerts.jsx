import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import api from '../utils/api';

const FILTERS = [
  {key:'all',label:'All'},
  {key:'active',label:'Active',dot:'#22c55e'},
  {key:'critical',label:'Critical',dot:'#ef4444'},
  {key:'pending',label:'Pending',dot:'#f59e0b'},
  {key:'resolved',label:'Resolved',dot:'#3b82f6'},
];

export default function Alerts() {
  const { isMobile, isTablet } = useResponsive();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/reports/public').then(({data})=>{if(data.success)setReports(data.reports);})
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = filter==='all' ? reports : reports.filter(r=>r.status===filter);
  const cols = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

  return (
    <div style={{paddingTop:'var(--header-h)',minHeight:'100vh',background:'var(--bg-light)'}}>
      <div style={{background:'white',borderBottom:'1px solid var(--border)',padding:isMobile?'16px 0':'24px 0'}}>
        <div className="page-wrap">
          <h1 style={{fontFamily:'Poppins',fontSize:isMobile?'1.5rem':'2rem',color:'var(--navy)',marginBottom:4}}>Active Alerts</h1>
          <p style={{color:'var(--text-muted)',fontSize:13.5}}>Live community alerts — tap any card for full details</p>
        </div>
      </div>
      <div className="page-wrap" style={{padding:isMobile?'16px 0':'24px 0'}}>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:isMobile?'7px 14px':'8px 18px',borderRadius:50,border:'1.5px solid',
              cursor:'pointer',fontWeight:600,fontSize:isMobile?12:13.5,transition:'all 0.15s',
              fontFamily:'Poppins,sans-serif',
              borderColor:filter===f.key?'var(--navy)':'var(--border)',
              background:filter===f.key?'var(--navy)':'white',
              color:filter===f.key?'white':'var(--text-muted)'
            }}>
              {f.dot && <span style={{width:7,height:7,borderRadius:'50%',background:filter===f.key?'rgba(255,255,255,0.7)':f.dot,flexShrink:0}}/>}
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <div className="spin"/> : (
          filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
              <div style={{fontSize:'3rem',marginBottom:12}}>🔍</div>
              <p style={{fontSize:16}}>No {filter!=='all'?filter:''} alerts found.</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:cols,gap:isMobile?12:16}}>
              {filtered.map(r => {
                const mp = r.missingPerson || {};
                const caseNum = '#MPR-'+new Date(r.createdAt).getFullYear()+'-'+r._id.toString().slice(-4);
                const isResolved = r.status === 'resolved';
                return (
                  <div key={r._id} className="card" style={{
                    padding:isMobile?'14px 16px':'18px 20px',
                    cursor:'pointer',transition:'all 0.2s',
                    opacity: isResolved ? 0.8 : 1,
                    borderTop: isResolved ? '3px solid #3b82f6' : r.status==='critical' ? '3px solid #ef4444' : '3px solid var(--navy)'
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(13,31,45,0.12)';e.currentTarget.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform='translateY(0)';}}
                  >
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:isMobile?'0.95rem':'1.05rem',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{mp.name||'Unknown'}</h3>
                        <p style={{color:'var(--text-muted)',fontSize:11}}>Case {caseNum}</p>
                      </div>
                      <span className={'badge badge-'+r.status} style={{marginLeft:8,flexShrink:0}}>{r.status}</span>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px 14px',margin:'10px 0',fontSize:12.5}}>
                      <div><span style={{color:'var(--text-muted)'}}>Age: </span><b>{mp.age||'—'}</b></div>
                      <div><span style={{color:'var(--text-muted)'}}>Gender: </span><b>{mp.gender?mp.gender.charAt(0).toUpperCase()+mp.gender.slice(1):'—'}</b></div>
                      <div style={{gridColumn:'span 2'}}><span style={{color:'var(--text-muted)'}}>Last Seen: </span><b style={{wordBreak:'break-word'}}>{r.locationName||mp.lastSeenLocation||'—'}</b></div>
                    </div>
                    {isResolved && (
                      <div style={{background:'#dbeafe',borderRadius:8,padding:'6px 10px',marginBottom:8,fontSize:12,color:'#1d4ed8',fontWeight:600}}>
                        ✅ Case Resolved — Person Found
                      </div>
                    )}
                    <div style={{display:'flex',justifyContent:'flex-end',marginTop:10,paddingTop:10,borderTop:'1px solid #f0f4f8'}}>
                      <Link to={'/alerts/'+r._id} style={{padding:'6px 16px',background:'var(--navy)',color:'white',borderRadius:50,fontSize:12.5,fontWeight:700,transition:'all 0.15s'}}>View Details →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
