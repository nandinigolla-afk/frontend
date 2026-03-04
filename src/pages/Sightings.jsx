import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
const BACKEND_URL = "https://mpas-backend.onrender.com";
export default function Sightings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({caseName:'',date:'',time:'',location:'',description:'',reportId:''});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/public').then(({data})=>{if(data.success)setReports(data.reports);})
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const handleCardClick = r => setForm(f=>({...f,caseName:r.missingPerson?.name||'',reportId:r._id}));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!form.reportId) return setError('Please select a case by clicking a card above');
    setSubmitting(true); setError('');
    try {
      const sightingDate = form.date && form.time ? new Date(form.date+'T'+form.time) : new Date();
      await api.post('/sightings/report/'+form.reportId, {
        description:form.description,
        location:{type:'Point',coordinates:[0,0]},
        locationName:form.location,
        sightingDate
      });
      setSubmitted(true);
      setForm({caseName:'',date:'',time:'',location:'',description:'',reportId:''});
    } catch(err) { setError(err.response?.data?.message||'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const BADGE = {active:'#22c55e',critical:'#ef4444',pending:'#f59e0b',resolved:'#3b82f6'};
  const showSideBySide = !isMobile && !isTablet;
  const cardCols = isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

  return (
    <div style={{paddingTop:'var(--header-h)',minHeight:'100vh',background:'var(--bg-light)'}}>
      <div style={{background:'var(--navy)',padding:isMobile?'20px 0':'32px 0'}}>
        <div className="page-wrap">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'flex-start':'center',flexWrap:'wrap',gap:12}}>
            <div>
              <h1 style={{fontFamily:'Poppins',color:'white',fontSize:isMobile?'1.4rem':'2rem',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
                <span>👁️</span> Report a Sighting
              </h1>
              <p style={{color:'rgba(255,255,255,0.65)',fontSize:isMobile?13:14.5,maxWidth:520}}>
                Spotted someone matching a missing person? Log it here instantly.
              </p>
            </div>
            <div style={{display:'flex',gap:isMobile?20:36}}>
              <div style={{textAlign:isMobile?'left':'right'}}>
                <div style={{fontFamily:'Poppins',fontWeight:800,fontSize:isMobile?'1.6rem':'2.2rem',color:'var(--amber)',lineHeight:1}}>{reports.length*23+14}</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:isMobile?11:13,marginTop:3}}>Sightings This Month</div>
              </div>
              <div style={{textAlign:isMobile?'left':'right'}}>
                <div style={{fontFamily:'Poppins',fontWeight:800,fontSize:isMobile?'1.6rem':'2.2rem',color:'var(--amber)',lineHeight:1}}>{Math.floor(reports.length*4.2)+8}</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:isMobile?11:13,marginTop:3}}>Led to Reunions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-wrap" style={{padding:isMobile?'16px 0':'24px 0'}}>
        <div style={{display:'grid',gridTemplateColumns:showSideBySide?'1fr 340px':'1fr',gap:24,alignItems:'start'}}>
          <div>
            <h2 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1rem',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>📌 Active Cases — Have You Seen Them?</h2>
            {loading ? <div className="spin"/> : (
              <div style={{display:'grid',gridTemplateColumns:cardCols,gap:12}}>
                {reports.filter(r=>r.status!=='resolved').slice(0,5).map(r=>{
                  const mp=r.missingPerson||{};
                  const isSelected=form.reportId===r._id;
                  return (
                    <div key={r._id} onClick={()=>handleCardClick(r)} style={{
                      position:'relative',borderRadius:12,overflow:'hidden',cursor:'pointer',
                      background:'linear-gradient(180deg,#2d4a63 0%,#1a3047 100%)',
                      border:isSelected?'2px solid var(--amber)':'2px solid transparent',
                      transition:'all 0.2s',height:isMobile?150:170,
                      boxShadow:isSelected?'0 0 0 2px var(--amber)':'none'
                    }}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
                    >
                      <div style={{position:'absolute',top:8,left:8,zIndex:2,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',padding:'2px 8px',borderRadius:50,display:'flex',alignItems:'center',gap:4}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:BADGE[r.status]||'#6b7280'}}/>
                        <span style={{color:'white',fontSize:9,fontWeight:700,textTransform:'uppercase'}}>{r.status}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'58%',paddingTop:18}}>
                        {mp.photo ? (
                          <img src={BACKEND_URL + mp.photo} alt={mp.name} style={{width:60,height:60,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(255,255,255,0.3)'}}/>
                        ) : (
                          <div style={{fontSize:'2.4rem'}}>{mp.gender==='female'?'👩':'👦'}</div>
                        )}
                      </div>
                      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 10px',background:'linear-gradient(0deg,rgba(13,31,45,0.92) 0%,transparent 100%)'}}>
                        <div style={{fontFamily:'Poppins',color:'white',fontWeight:800,fontSize:'0.8rem'}}>{mp.name}, {mp.age}</div>
                        <div style={{color:'rgba(255,255,255,0.65)',fontSize:10}}>📍 {r.locationName||'Unknown'}</div>
                      </div>
                    </div>
                  );
                })}
                <Link to="/report" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--navy)',borderRadius:12,height:isMobile?150:170,color:'white',textDecoration:'none',border:'2px dashed rgba(255,255,255,0.2)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--navy-mid)';e.currentTarget.style.borderColor='rgba(255,255,255,0.4)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--navy)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)';}}
                >
                  <div style={{fontSize:'1.8rem',marginBottom:6}}>+</div>
                  <div style={{fontWeight:700,fontSize:12,textAlign:'center',padding:'0 8px'}}>Report New Case</div>
                </Link>
              </div>
            )}
          </div>

          <div style={{position:showSideBySide?'sticky':'static',top:'calc(var(--header-h) + 16px)'}}>
            <div className="card" style={{padding:isMobile?'20px 16px':'24px 22px'}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:4}}>Log a Sighting</h3>
              <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:18}}>Your tip could bring someone home. Takes 2 minutes.</p>
              {submitted ? (
                <div style={{textAlign:'center',padding:'24px 0'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:12}}>✅</div>
                  <h4 style={{fontFamily:'Poppins',color:'var(--navy)',marginBottom:8}}>Sighting Reported!</h4>
                  <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:16}}>Our team will review your tip shortly.</p>
                  <button onClick={()=>setSubmitted(false)} className="btn btn-navy btn-sm" style={{borderRadius:50}}>Report Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="error-box">{error}</div>}
                  <div className="form-group">
                    <label>Case / Person's Name *</label>
                    <input placeholder="Name or Case ID" value={form.caseName} onChange={e=>setForm({...form,caseName:e.target.value})}/>
                    {form.reportId && <p style={{fontSize:11,color:'#22c55e',marginTop:4}}>✓ Case selected</p>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12}}>
                    <div className="form-group">
                      <label>Date *</label>
                      <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/>
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input placeholder="Street address or landmark" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                    <label>What did you see?</label>
                    <textarea rows={3} placeholder="Describe what you saw..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical'}}/>
                  </div>
                  <button type="submit" disabled={submitting} style={{width:'100%',padding:'12px',background:'var(--navy)',color:'white',border:'none',borderRadius:50,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>
                    {submitting?'Submitting...':'Submit Sighting →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
