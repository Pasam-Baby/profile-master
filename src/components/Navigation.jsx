import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Briefcase, CheckSquare, Map, MessageSquare, LogOut, Moon, Sun, User, Settings, Lock, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resume Builder', path: '/resume', icon: FileText },
  { label: 'Jobs', path: '/jobs', icon: Briefcase },
  { label: 'Applications', path: '/applications', icon: CheckSquare },
  { label: 'Roadmap', path: '/roadmap', icon: Map },
  { label: 'Interview Prep', path: '/interview', icon: MessageSquare },
];

export default function Navigation() {
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: 'Saving...', type: 'info' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.id || localStorage.getItem('user_id')
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      login(data);
      setMsg({ text: 'Profile updated!', type: 'success' });
      setTimeout(() => { setActiveModal(null); setMsg({ text: '', type: '' }); }, 1500);
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return setMsg({ text: 'New passwords do not match', type: 'error' });
    }
    setMsg({ text: 'Updating...', type: 'info' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.id || localStorage.getItem('user_id')
        },
        body: JSON.stringify({ current_password: passwordForm.current_password, new_password: passwordForm.new_password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setMsg({ text: 'Password updated!', type: 'success' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => { setActiveModal(null); setMsg({ text: '', type: '' }); }, 1500);
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  return (
    <>
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon"><Briefcase size={16} /></span>
        <span>Profile<span>Master</span></span>
      </div>
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-account" style={{ cursor: 'pointer', position: 'relative' }}>
        <div onClick={() => setShowMenu(!showMenu)}>
          <div className="account-row" style={{ marginBottom: showMenu ? '16px' : '0' }}>
            <div className="account-avatar"><User size={17} /></div>
            <div>
              <div className="account-name">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
              <div className="account-status"><span /> Logged In</div>
            </div>
          </div>
        </div>
        
        {showMenu && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className="logout-button" onClick={() => { setActiveModal('profile'); setShowMenu(false); }}><Settings size={15} /> Edit Profile</button>
            <button className="logout-button" onClick={() => { setActiveModal('password'); setShowMenu(false); }}><Lock size={15} /> Change Password</button>
            <button className="logout-button" onClick={logout}><LogOut size={15} /> Logout</button>
          </div>
        )}
      </div>
    </aside>

    {activeModal && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
        <div style={{ background: 'var(--paper)', padding: '30px', borderRadius: '6px', width: '90%', maxWidth: '400px', position: 'relative', border: '1px solid var(--line)', color: 'var(--ink)' }}>
          <button onClick={() => { setActiveModal(null); setMsg({ text: '', type: '' }); }} style={{ position: 'absolute', right: '15px', top: '15px', background: 'transparent', border: 0, cursor: 'pointer' }}><X size={20} color="var(--muted)" /></button>
          
          {activeModal === 'profile' ? (
            <form className="auth-form" onSubmit={handleProfileSubmit}>
              <div className="auth-heading" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', margin: 0, fontFamily: 'Manrope', color: 'var(--ink)' }}>Edit Profile</h2>
              </div>
              {msg.text && <div className={msg.type === 'error' ? 'form-error' : 'form-success'}>{msg.text}</div>}
              <label style={{ color: 'var(--ink)' }}>
                Name
                <div className="input-with-icon"><input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required style={{ color: 'var(--ink)' }} /></div>
              </label>
              <label style={{ color: 'var(--ink)' }}>
                Email
                <div className="input-with-icon"><input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} required style={{ color: 'var(--ink)' }} /></div>
              </label>
              <button type="submit" className="btn btn-sun btn-submit">Save Changes</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handlePasswordSubmit}>
              <div className="auth-heading" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', margin: 0, fontFamily: 'Manrope', color: 'var(--ink)' }}>Change Password</h2>
              </div>
              {msg.text && <div className={msg.type === 'error' ? 'form-error' : 'form-success'}>{msg.text}</div>}
              <label style={{ color: 'var(--ink)' }}>
                Current Password
                <div className="input-with-icon"><input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} required style={{ color: 'var(--ink)' }} /></div>
              </label>
              <label style={{ color: 'var(--ink)' }}>
                New Password
                <div className="input-with-icon"><input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} minLength="8" required style={{ color: 'var(--ink)' }} /></div>
              </label>
              <label style={{ color: 'var(--ink)' }}>
                Confirm Password
                <div className="input-with-icon"><input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} minLength="8" required style={{ color: 'var(--ink)' }} /></div>
              </label>
              <button type="submit" className="btn btn-sun btn-submit">Update Password</button>
            </form>
          )}
        </div>
      </div>
    )}
    </>
  );
}
