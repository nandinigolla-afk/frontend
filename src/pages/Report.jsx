import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useResponsive } from '../hooks/useResponsive';

const PIN = L.divIcon({
  html:`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
    <path d="M15 1C8.37 1 3 6.37 3 13c0 9 12 26 12 26s12-17 12-26C27 6.37 21.63 1 15 1z" fill="#0d1f2d"/>
    <circle cx="15" cy="13" r="5" fill="white"/><circle cx="15" cy="13" r="3" fill="#0d1f2d"/>
  </svg>`,
  className:'', iconSize:[30,40], iconAnchor:[15,40], popupAnchor:[0,-38]
});

function LocPicker({onPick}) {
  useMapEvents({click(e){onPick([e.latlng.lat, e.latlng.lng]);}});
  return null;
}

const STEPS = [
  {n:1, label:'Personal Details',     sub:'Name, age, gender'},
  {n:2, label:'Last Known Location',  sub:'Date, time, address'},
  {n:3, label:'Physical Description', sub:'Height, hair, clothing'},
  {n:4, label:'Reporter Contact',     sub:'Your info, police report'},
  {n:5, label:'Photo Upload',         sub:'Recent clear photo'},
  {n:6, label:'Submit',               sub:'Review and send'},
];

export default function Report() {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pos, setPos] = useState([17.385,78.487]);
  const [photo, setPhoto] = useState(null);

  const [form, setForm] = useState({
    firstName:'', lastName:'', dob:'', age:'', gender:'', nationality:'',
    lastSeenDate:'', lastSeenTime:'', locationName:'', address:'',
    height:'', hairColor:'', eyeColor:'', build:'', clothingDescription:'',
    contactName: '', contactPhone:'', contactEmail:'',
    description:''
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p=>setPos([p.coords.latitude,p.coords.longitude]),()=>{});
    if(user) setForm(f=>({...f, contactName:user.name||'', contactEmail:user.email||''}));
  }, [user]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const progress = Math.round(((step-1)/5)*100);

  const next = () => { setError(''); setStep(s=>Math.min(s+1,6)); };
  const back = () => { setError(''); setStep(s=>Math.max(s-1,1)); };

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('missingPerson', JSON.stringify({
        name:`${form.firstName} ${form.lastName}`.trim(),
        age:parseInt(form.age), gender:form.gender, nationality:form.nationality,
        description:form.description, lastSeenDate: form.lastSeenDate||new Date().toISOString(),
        height:form.height, hairColor:form.hairColor, eyeColor:form.eyeColor,
        build:form.build, clothingDescription:form.clothingDescription
      }));
      fd.append('location', JSON.stringify({type:'Point',coordinates:[pos[1],pos[0]]}));
      fd.append('locationName', form.locationName||form.address);
      fd.append('contactInfo', JSON.stringify({name:form.contactName,phone:form.contactPhone,email:form.contactEmail}));
      if(photo) fd.append('photo', photo);
      await api.post('/reports', fd, {headers:{'Content-Type':'multipart/form-data'}});
      setSuccess(true);
    } catch(err) { setError(err.response?.data?.message||'Submission failed'); setStep(6); }
    finally { setLoading(false); }
  };

  if (!user) return (
    <div style={{paddingTop:'var(--header-h)',minHeight:'100vh',background:'var(--bg-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card" style={{padding:40,textAlign:'center',maxWidth:380}}>
        <div style={{fontSize:'3rem',marginBottom:16}}>🔒</div>
        <h2 style={{fontFamily:'Poppins',color:'var(--navy)',marginBottom:12}}>Login Required</h2>
        <p style={{color:'var(--text-muted)',marginBottom:20}}>Please login to submit a missing person report.</p>
        <Link to="/login" className="btn btn-navy">Login to Continue</Link>
      </div>
    </div>
  );

  if (success) return (
    <div style={{paddingTop:'var(--header-h)',minHeight:'100vh',background:'var(--bg-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card" style={{padding:'48px 40px',textAlign:'center',maxWidth:440}}>
        <div style={{width:72,height:72,background:'#dcfce7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',margin:'0 auto 20px'}}>✅</div>
        <h2 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.7rem',marginBottom:12}}>Report Submitted!</h2>
        <p style={{color:'var(--text-muted)',lineHeight:1.7,marginBottom:24}}>Your report is under review. You'll be notified once verified.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <Link to="/dashboard" className="btn btn-navy" style={{borderRadius:50}}>My Reports</Link>
          <button onClick={()=>{setSuccess(false);setStep(1);}} className="btn btn-outline" style={{borderRadius:50}}>Submit Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <style>{`
        .report-wrap{display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - var(--header-h))}
        @media(max-width:900px){.report-wrap{grid-template-columns:1fr}}
        .report-sidebar{height:auto;position:relative;top:0}
        @media(min-width:900px){.report-sidebar{position:sticky;top:var(--header-h);height:calc(100vh - var(--header-h));overflow-y:auto}}
      `}</style>
      <div style={{paddingTop:'var(--header-h)',minHeight:'100vh',background:'var(--bg-light)'}}>
      <div className='report-wrap'>

      {/* ── DARK NAVY SIDEBAR — exact from screenshot 3 ── */}
      <div style={{
        background:'var(--navy)',color:'white',padding:'24px 20px',display:'flex',flexDirection:'column'
      }}>
        <h2 style={{fontFamily:'Poppins',fontSize:'1.2rem',marginBottom:4}}>File a Report</h2>
        <p style={{color:'rgba(255,255,255,0.55)',fontSize:12.5,marginBottom:28,lineHeight:1.6}}>
          Reports reviewed within 2 hours and shared with authorities.
        </p>

        {/* Steps */}
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
          {STEPS.map(s=>(
            <div key={s.n} onClick={()=>s.n < step && setStep(s.n)} style={{
              display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:10,
              cursor: s.n < step ? 'pointer' : 'default',
              background: step===s.n ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition:'background 0.15s'
            }}>
              {/* Step number circle */}
              <div style={{
                width:30,height:30,borderRadius:'50%',flexShrink:0,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontWeight:800,fontSize:13,transition:'all 0.25s',
                background: step>s.n ? 'var(--amber)' : step===s.n ? 'white' : 'rgba(255,255,255,0.12)',
                color: step>s.n ? 'white' : step===s.n ? 'var(--navy)' : 'rgba(255,255,255,0.5)'
              }}>
                {step > s.n ? '✓' : s.n}
              </div>
              <div>
                <div style={{fontSize:13.5,fontWeight: step===s.n?700:500, color: step===s.n?'white':'rgba(255,255,255,0.7)'}}>{s.label}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{marginTop:28}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12,color:'rgba(255,255,255,0.55)'}}>
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div style={{background:'rgba(255,255,255,0.12)',borderRadius:50,height:6}}>
            <div style={{background:'var(--amber)',height:6,borderRadius:50,width:`${progress}%`,transition:'width 0.4s ease'}}/>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{padding:'28px 36px',overflowY:'auto',background:'var(--bg-light)'}}>
        <Link to="/" style={{color:'var(--text-muted)',fontSize:13,display:'inline-flex',alignItems:'center',gap:6,marginBottom:20}}>
          ← Back to Home
        </Link>

        <h1 style={{fontFamily:'Poppins',fontSize:'1.8rem',color:'var(--navy)',marginBottom:6}}>Report a Missing Person</h1>
        <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:28}}>Please provide as much detail as possible. Your report will be reviewed immediately.</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit}>
          {/* STEP 1 — Personal Details */}
          {step===1 && (
            <div className="card" style={{padding:28}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>👤</span> Personal Details
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,240px),1fr))',gap:14}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>First Name *</label>
                  <input placeholder="First name" value={form.firstName} onChange={e=>set('firstName',e.target.value)} required/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Last Name *</label>
                  <input placeholder="Last name" value={form.lastName} onChange={e=>set('lastName',e.target.value)} required/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e=>set('dob',e.target.value)}/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Age *</label>
                  <input type="number" placeholder="Age" value={form.age} onChange={e=>set('age',e.target.value)} required min="0" max="120"/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Gender</label>
                  <select value={form.gender} onChange={e=>set('gender',e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Nationality</label>
                  <input placeholder="Nationality" value={form.nationality} onChange={e=>set('nationality',e.target.value)}/>
                </div>
              </div>
              <button type="button" onClick={()=>{if(!form.firstName||!form.age)return setError('First name and age are required');next();}}
                className="btn btn-navy" style={{marginTop:24,borderRadius:50}}>Continue →</button>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step===2 && (
            <div className="card" style={{padding:28}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>📍</span> Last Known Location
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,240px),1fr))',gap:14,marginBottom:18}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Last Seen Date</label>
                  <input type="date" value={form.lastSeenDate} onChange={e=>set('lastSeenDate',e.target.value)}/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Last Seen Time</label>
                  <input type="time" value={form.lastSeenTime} onChange={e=>set('lastSeenTime',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'span 2',marginBottom:0}}>
                  <label>Address / Landmark</label>
                  <input placeholder="Street address or landmark" value={form.locationName} onChange={e=>set('locationName',e.target.value)}/>
                </div>
              </div>
              <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:8}}>Click map to pin exact location:</p>
              <div style={{height:300,borderRadius:12,overflow:'hidden',border:'2px solid var(--border)',marginBottom:20}}>
                <MapContainer center={pos} zoom={14} style={{height:'100%'}}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"/>
                  <LocPicker onPick={setPos}/>
                  <Marker position={pos} icon={PIN}/>
                </MapContainer>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button type="button" onClick={back} className="btn btn-outline" style={{borderRadius:50}}>← Back</button>
                <button type="button" onClick={next} className="btn btn-navy" style={{borderRadius:50}}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Physical Description */}
          {step===3 && (
            <div className="card" style={{padding:28}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>📏</span> Physical Description
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,240px),1fr))',gap:14}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Height</label>
                  <input placeholder="e.g. 5ft 8in" value={form.height} onChange={e=>set('height',e.target.value)}/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Build</label>
                  <select value={form.build} onChange={e=>set('build',e.target.value)}>
                    <option value="">Select</option>
                    <option value="slim">Slim</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Hair Color</label>
                  <input placeholder="e.g. Black" value={form.hairColor} onChange={e=>set('hairColor',e.target.value)}/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Eye Color</label>
                  <input placeholder="e.g. Brown" value={form.eyeColor} onChange={e=>set('eyeColor',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'span 2',marginBottom:0}}>
                  <label>Clothing When Last Seen</label>
                  <input placeholder="Describe clothing..." value={form.clothingDescription} onChange={e=>set('clothingDescription',e.target.value)}/>
                </div>
                <div className="form-group" style={{gridColumn:'span 2',marginBottom:0}}>
                  <label>Additional Description</label>
                  <textarea rows={3} placeholder="Any other identifying features..." value={form.description} onChange={e=>set('description',e.target.value)} style={{resize:'vertical'}}/>
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button type="button" onClick={back} className="btn btn-outline" style={{borderRadius:50}}>← Back</button>
                <button type="button" onClick={next} className="btn btn-navy" style={{borderRadius:50}}>Continue →</button>
              </div>
              <p style={{fontSize:12,color:'var(--text-muted)',marginTop:12,textAlign:'center'}}>
                💡 All fields in this step are optional
              </p>
            </div>
          )}

          {/* STEP 4 — Reporter Contact */}
          {step===4 && (
            <div className="card" style={{padding:28}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>📞</span> Reporter Contact
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,240px),1fr))',gap:14}}>
                <div className="form-group" style={{gridColumn:'span 2',marginBottom:0}}>
                  <label>Your Full Name *</label>
                  <input placeholder="Your name" value={form.contactName} onChange={e=>set('contactName',e.target.value)} required/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Phone Number *</label>
                  <input placeholder="+91 98765 43210" value={form.contactPhone} onChange={e=>set('contactPhone',e.target.value)} required/>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label>Email</label>
                  <input type="email" placeholder="you@email.com" value={form.contactEmail} onChange={e=>set('contactEmail',e.target.value)}/>
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button type="button" onClick={back} className="btn btn-outline" style={{borderRadius:50}}>← Back</button>
                <button type="button" onClick={()=>{if(!form.contactName||!form.contactPhone)return setError('Name and phone are required');next();}}
                  className="btn btn-navy" style={{borderRadius:50}}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 5 — Photo */}
          {step===5 && (
            <div className="card" style={{padding:28}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>📸</span> Photo Upload <span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)',marginLeft:6}}>(Optional)</span>
              </h3>
              <div style={{border:'2px dashed var(--border)',borderRadius:12,padding:'40px 20px',textAlign:'center',marginBottom:20,background:'#f8fafc'}}>
                {photo ? (
                  <div>
                    <img src={URL.createObjectURL(photo)} alt="preview" style={{width:120,height:120,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--navy)',marginBottom:12}}/>
                    <p style={{fontSize:13,color:'var(--text-muted)'}}>{photo.name}</p>
                  </div>
                ) : (
                  <>
                    <div style={{fontSize:'2.5rem',marginBottom:10}}>📷</div>
                    <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:12}}>Upload a recent, clear photo</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])}
                  style={{display:'block',margin:'0 auto',fontSize:13,padding:'8px'}}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button type="button" onClick={back} className="btn btn-outline" style={{borderRadius:50}}>← Back</button>
                <button type="button" onClick={next} className="btn btn-navy" style={{borderRadius:50}}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 6 — Submit */}
          {step===6 && (
            <div className="card" style={{padding:28}}>
              <h3 style={{fontFamily:'Poppins',color:'var(--navy)',fontSize:'1.1rem',marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>✅</span> Review & Submit
              </h3>
              <div style={{background:'#f8fafc',borderRadius:12,padding:20,marginBottom:20}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'8px 16px',fontSize:14}}>
                  {[['Name',`${form.firstName} ${form.lastName}`],['Age',form.age],['Gender',form.gender],['Location',form.locationName||'Not set'],['Contact',form.contactName],['Phone',form.contactPhone]].map(([l,v])=>(
                    <div key={l} style={{borderBottom:'1px solid var(--border)',paddingBottom:6}}>
                      <span style={{color:'var(--text-muted)',fontSize:12}}>{l}: </span>
                      <b>{v||'—'}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#92400e'}}>
                ⚠️ By submitting this report, you confirm that all information is accurate to the best of your knowledge.
              </div>
              <div style={{display:'flex',gap:10}}>
                <button type="button" onClick={back} className="btn btn-outline" style={{borderRadius:50}}>← Back</button>
                <button type="submit" disabled={loading} style={{
                  flex:1,padding:'12px',background:'var(--amber)',color:'white',
                  border:'none',borderRadius:50,fontWeight:700,fontSize:15,cursor:'pointer',
                  transition:'all 0.18s',fontFamily:'Poppins,sans-serif'
                }}>
                  {loading ? '⏳ Submitting...' : '🚨 Submit Report'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      </div>
    </div>
    </>
  );
}