import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token') || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      return setError('Reset token is missing. Please request a fresh recovery link.');
    }

    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="auth-page login-page">
        <div className="auth-visual">
          <Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link>
          <div className="auth-visual-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Access restored</div>
            <h1>Password updated <em>successfully.</em></h1>
            <p>Your password has been updated. You can now sign in with your new credentials.</p>
          </div>
          <div className="auth-caption">Security / 04</div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="mobile-brand"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link></div>
            <div className="auth-heading">
              <span className="form-kicker">Ready to sign in</span>
              <h2>Password updated successfully.</h2>
              <p>Use your new password to continue to your workspace.</p>
            </div>
            <button type="button" className="btn btn-ink btn-submit" onClick={() => navigate('/login')}>
              Back to Login <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page login-page">
      <div className="auth-visual">
        <Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link>
        <div className="auth-visual-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Secure access</div>
          <h1>Create a new <em>password</em></h1>
          <p>Choose a strong password to keep your account secure.</p>
        </div>
        <div className="auth-caption">Security / 04</div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-brand"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link></div>
          <div className="auth-heading">
            <span className="form-kicker">Reset password</span>
            <h2>Create a new password</h2>
            <p>Use a secure password with at least 8 characters.</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              New Password
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
              </div>
              <button type="button" className="inline-toggle" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle new password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>

            <label>
              Confirm New Password
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" required />
              </div>
              <button type="button" className="inline-toggle" onClick={() => setShowConfirmPassword((value) => !value)} aria-label="Toggle confirm password visibility">
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>

            <button type="submit" className="btn btn-ink btn-submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'} <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch"><Link to="/login">Back to Login</Link></p>
        </div>
      </div>
    </main>
  );
}
