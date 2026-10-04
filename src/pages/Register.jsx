import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, FilePlus2, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '', experience: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword || !form.role || !form.experience) {
      return setError('Please complete all required fields.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return setError('Please enter a valid email address.');
    }

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          experience: form.experience,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <div className="auth-visual"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link><div className="auth-visual-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Make room for what is next</div><h1>Start building your <em>career profile.</em></h1><p>Create one focused place for your resume, skills, job applications and interview preparation.</p><div className="visual-stats"><strong>01</strong><span>Profile<br />foundation</span><strong>∞</strong><span>Room to<br />grow</span></div></div><div className="auth-caption">Foundation / 01</div></div>
      <div className="auth-panel"><div className="auth-panel-inner register-inner"><div className="mobile-brand"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link></div><div className="auth-heading"><span className="form-kicker"><FilePlus2 size={15} /> Create your account</span><h2>Your next move<br /><em>starts here.</em></h2><p>Set up your workspace in a couple of minutes.</p></div>{error && <div className="form-error">{error}</div>}<form onSubmit={handleSubmit} className="auth-form register-form"><div className="form-grid"><label>Full name<div className="input-with-icon"><UserRound size={17} /><input type="text" placeholder="Your full name" required value={form.name} onChange={update('name')} /></div></label><label>Email<div className="input-with-icon"><Mail size={17} /><input type="email" placeholder="you@example.com" required value={form.email} onChange={update('email')} /></div></label></div><label>Target role<div className="select-wrap"><select required value={form.role} onChange={update('role')}><option value="">Choose a direction</option><option>Frontend Developer</option><option>React Developer</option><option>Python Developer</option><option>Software Developer</option><option>UI Developer</option><option>Other</option></select><ChevronDown size={17} /></div></label><label>Experience level<div className="select-wrap"><select required value={form.experience} onChange={update('experience')}><option value="">Choose your level</option><option>Fresher</option><option>0–1 Year</option><option>1–3 Years</option><option>3+ Years</option></select><ChevronDown size={17} /></div></label><div className="form-grid"><label>Password<div className="input-with-icon"><LockKeyhole size={17} /><input type="password" placeholder="At least 6 characters" required value={form.password} onChange={update('password')} /></div></label><label>Confirm password<div className="input-with-icon"><LockKeyhole size={17} /><input type="password" placeholder="Repeat password" required value={form.confirmPassword} onChange={update('confirmPassword')} /></div></label></div><button type="submit" className="btn btn-ink btn-submit">Create Account <ArrowRight size={17} /></button></form><p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p><div className="secure-note"><Check size={14} /> Your information stays private and secure.</div></div></div>
    </main>
  );
}
