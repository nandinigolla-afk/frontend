import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function requestPermissions() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      localStorage.setItem('mpas_lat', p.coords.latitude);
      localStorage.setItem('mpas_lng', p.coords.longitude);
    }, () => {});
  }
}

export default function Login() {
  const [tab, setTab]           = useState('user');
  const [form, setForm]         = useState({ email:'', password:'' });
  const [showPw, setShowPw]     = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      requestPermissions();
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch(err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleForgot = async e => {
    e.preventDefault(); setLoading(true);
    // Simulate — in production wire to POST /api/auth/forgot-password
    await new Promise(r => setTimeout(r, 1200));
    setForgotSent(true); setLoading(false);
  };

  const inputStyle = {
    width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
    fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit'
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

        {/* ── FORGOT PASSWORD MODE ── */}
        {forgotMode ? (
          <>
            <button onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); }}
              style={{ background:'none', border:'none', color:'var(--navy)', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:14, padding:0, display:'flex', alignItems:'center', gap:4 }}>
              ← Back to Login
            </button>
            <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.4rem', color:'var(--navy)', marginBottom:4, fontWeight:700 }}>Reset Password</h2>
            <p style={{ color:'#6b7280', fontSize:13.5, marginBottom:22 }}>Enter your email and we'll send a reset link.</p>

            {forgotSent ? (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:'20px', textAlign:'center' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:10 }}>📧</div>
                <h3 style={{ fontFamily:'Poppins', color:'#16a34a', marginBottom:6 }}>Check your email</h3>
                <p style={{ color:'#15803d', fontSize:13.5, lineHeight:1.6 }}>
                  If <strong>{forgotEmail}</strong> is registered, you'll receive a password reset link shortly.
                </p>
                <button onClick={() => { setForgotMode(false); setForgotSent(false); }}
                  style={{ marginTop:16, padding:'9px 24px', background:'var(--navy)', color:'white', border:'none', borderRadius:50, fontWeight:600, fontSize:13, cursor:'pointer' }}>
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Email address</label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="your@email.com" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor='var(--navy)'}
                    onBlur={e  => e.target.style.borderColor='#e5e7eb'} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'13px', background:'var(--navy)', color:'white', border:'none',
                    borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>
                  {loading ? '⏳ Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            {/* ── NORMAL LOGIN MODE ── */}
            <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'1.5rem', color:'var(--navy)', marginBottom:4, fontWeight:700 }}>Welcome Back</h2>
            <p style={{ color:'#6b7280', fontSize:13.5, marginBottom:18 }}>Sign in to your MPAS account</p>

            {/* Role tabs */}
            <div style={{ marginBottom:18 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.06em', marginBottom:7 }}>SIGN IN AS</p>
              <div style={{ display:'flex', gap:8 }}>
                {[['user','👤 Community'],['admin','🛡️ Admin']].map(([role, label]) => (
                  <button key={role} onClick={() => setTab(role)}
                    style={{ flex:1, padding:'9px 0', borderRadius:50, cursor:'pointer',
                      border: tab===role ? 'none' : '1.5px solid #e5e7eb',
                      background: tab===role ? 'var(--navy)' : 'white',
                      color: tab===role ? 'white' : '#6b7280',
                      fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px',
                color:'#dc2626', fontSize:13, marginBottom:14 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:5 }}>Email</label>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder={tab === 'admin' ? 'admin@mpas.com' : 'your@email.com'} required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='var(--navy)'}
                  onBlur={e  => e.target.style.borderColor='#e5e7eb'} />
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Password</label>
                  <button type="button" onClick={() => setForgotMode(true)}
                    style={{ background:'none', border:'none', color:'var(--amber)', fontSize:12.5, fontWeight:600, cursor:'pointer', padding:0 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder={tab === 'admin' ? 'admin123' : 'Your password'} required
                    style={{ ...inputStyle, paddingRight:44 }}
                    onFocus={e => e.target.style.borderColor='var(--navy)'}
                    onBlur={e  => e.target.style.borderColor='#e5e7eb'} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', fontSize:17, color:'#6b7280', lineHeight:1 }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'13px', marginTop:16, background: loading ? '#0d3b4c99' : 'var(--navy)',
                  color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:15,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'Poppins,sans-serif' }}>
                {loading ? '⏳ Signing in...' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign:'center', marginTop:18, fontSize:13.5, color:'#6b7280' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'var(--navy)', fontWeight:700, textDecoration:'none' }}>Register</Link>
            </p>

            {tab === 'admin' && (
              <div style={{ marginTop:12, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#92400e' }}>
                <b>Demo credentials:</b> admin@mpas.com / admin123
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
