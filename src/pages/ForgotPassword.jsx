import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return setError('Please enter a valid registered email address.');
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to process password reset request.');
      }

      setMessage(data.message || 'Recovery instructions have been prepared.');
      if (data.reset_token) {
        setResetUrl(`${window.location.origin}/reset-password?token=${encodeURIComponent(data.reset_token)}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <div className="auth-visual">
        <Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link>
        <div className="auth-visual-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Secure access</div>
          <h1>Forgot your <em>password?</em></h1>
          <p>Enter your registered email and we will help you reset your password.</p>
        </div>
        <div className="auth-caption">Security / 03</div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-brand"><Link to="/" className="brand-mark"><span className="brand-icon"><Sparkles size={16} /></span><span>Profile<span>Master</span></span></Link></div>
          <div className="auth-heading">
            <span className="form-kicker">Account recovery</span>
            <h2>Forgot your password?</h2>
            <p>Enter your registered email and we will help you reset your password.</p>
          </div>

          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}{resetUrl && <><br /><a href={resetUrl}>Open development reset link</a></>}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <div className="input-with-icon">
                <Mail size={17} />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
              </div>
            </label>

            <button type="submit" className="btn btn-ink btn-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-switch"><Link to="/login">Back to Login</Link></p>
        </div>
      </div>
    </main>
  );
}
