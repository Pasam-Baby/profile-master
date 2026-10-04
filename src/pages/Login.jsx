import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      return setError('Please enter both email and password.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return setError('Please enter a valid email address.');
    }

    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <div className="auth-visual"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link><div className="auth-visual-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Your career, in motion</div><h1>Welcome back to <em>ProfileMaster.</em></h1><p>Ready to take your next career step? Continue your journey from where you left off.</p><div className="visual-checks"><span><Check size={14} /> One clear career workspace</span><span><Check size={14} /> Progress that keeps moving</span></div></div><div className="auth-caption">Workspace / 02</div></div>
      <div className="auth-panel"><div className="auth-panel-inner"><div className="mobile-brand"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link></div><div className="auth-heading"><span className="form-kicker"><BriefcaseBusiness size={15} /> Sign in</span><h2>Pick up where<br /><em>you left off.</em></h2><p>Access your profile, applications and next best moves.</p></div>{error && <div className="form-error">{error}</div>}<form onSubmit={handleSubmit} className="auth-form"><label>Email address<div className="input-with-icon"><Mail size={17} /><input type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div></label><label>Password<div className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} /></div><button type="button" className="inline-toggle" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">{showPassword ? 'Hide' : 'Show'}</button></label><div className="form-meta"><span><Check size={14} /> Secure sign in</span><Link to="/forgot-password" className="text-link">Forgot Password?</Link></div><button type="submit" className="btn btn-ink btn-submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'} <ArrowRight size={17} /></button></form><p className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></p></div></div>
    </main>
  );
}
