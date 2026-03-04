import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm]       = useState({ name:'', email:'', password:'', phone:'' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      // Pass individual args — NOT the whole object
      await register(form.name, form.email, form.password, form.phone);
      navigate('/dashboard');
    } catch(err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0d1f2d 0%,#1a3047 40%,#1e3d56 100%)', padding:'80px 16px 20px' }}>
      <div style={{ position:'relative', background:'white', borderRadius:20, width:'100%',
        maxWidth:420, padding:'32px 28px 28px', boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}>

        <button onClick={() => navigate('/')} style={{ position:'absolute', top:14, right:14,
          width:30, height:30, borderRadius:'50%', border:'1.5px solid #e5e7eb', background:'white',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:15, color:'#9ca3af' }}>✕</button>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
          <div style={{ width:36, height:36, background:'var(--navy)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
              <circle cx="12" cy="9" r="2.5" fill="#E39A2D"/>
            </svg>
          </div>
          <span style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.15rem', color:'var(--navy)' }}>MPAS</span>
        </div>

        <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.5rem', color:'var(--navy)', marginBottom:4, fontWeight:700 }}>Create Account</h2>
        <p style={{ color:'#6b7280', fontSize:13.5, marginBottom:22 }}>Join the community helping locate missing persons</p>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px',
            color:'#dc2626', fontSize:13, marginBottom:16, lineHeight:1.5 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Full Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="Your full name" required
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
                fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='var(--navy)'}
              onBlur={e  => e.target.style.borderColor='#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
                fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='var(--navy)'}
              onBlur={e  => e.target.style.borderColor='#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Password *</label>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="Min 6 characters" required minLength={6}
                style={{ width:'100%', padding:'11px 44px 11px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
                  fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                onFocus={e => e.target.style.borderColor='var(--navy)'}
                onBlur={e  => e.target.style.borderColor='#e5e7eb'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:17, color:'#6b7280', lineHeight:1 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            <p style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>Must be at least 6 characters</p>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Phone <span style={{ fontWeight:400, color:'#9ca3af' }}>(optional)</span></label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210"
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
                fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e => e.target.style.borderColor='var(--navy)'}
              onBlur={e  => e.target.style.borderColor='#e5e7eb'}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'13px', background: loading ? '#f59e0b99' : 'var(--amber)',
              color:'#1a0e00', border:'none', borderRadius:12, fontWeight:700, fontSize:15,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'Poppins,sans-serif', transition:'opacity 0.15s' }}>
            {loading ? '⏳ Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:13.5, color:'#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--navy)', fontWeight:700, textDecoration:'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
