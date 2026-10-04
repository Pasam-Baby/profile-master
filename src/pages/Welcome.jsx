import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FileText, GraduationCap, MessageCircleQuestion, Sparkles } from 'lucide-react';

const pathways = [
  { label: 'Build My Resume', icon: FileText, path: '/resume' },
  { label: 'Find My Next Job', icon: BriefcaseBusiness, path: '/jobs' },
  { label: 'Improve My Skills', icon: GraduationCap, path: '/roadmap' },
  { label: 'Prepare for Interviews', icon: MessageCircleQuestion, path: '/interview' },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="welcome-page">
      <div className="welcome-art" aria-hidden="true"><span /><span /><span /></div>
      <header className="public-nav">
        <Link to="/" className="brand-mark brand-mark-light">
          <span className="brand-icon"><Sparkles size={16} /></span>
          <span>Profile<span>Master</span></span>
        </Link>
        <Link to="/login" className="nav-login">Already have an account? <strong>Login</strong></Link>
      </header>
      <section className="welcome-content">
        <div className="eyebrow light"><span className="eyebrow-dot" /> Your next chapter starts here</div>
        <h1>Welcome to <em>ProfileMaster</em></h1>
        <p className="welcome-copy">Build your profile. Discover opportunities. Prepare for your next career move.</p>
        <div className="career-question">
          <p>Where do you want your career to go next?</p>
          <div className="pathway-grid">
            {pathways.map(({ label, icon: Icon, path }) => (
              <button type="button" className="pathway-option" key={label} onClick={() => navigate(path)}>
                <Icon size={18} /> <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <Link to="/register" className="btn btn-sun btn-lg welcome-cta">Get Started <ArrowRight size={18} /></Link>
      </section>
      <div className="welcome-footer"><span>PROFILEMASTER / 01</span><span>Build a career with intention.</span></div>
    </main>
  );
}
