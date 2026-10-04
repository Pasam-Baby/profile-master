import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CalendarDays, Check, CircleDollarSign, ExternalLink, MapPin, MessageSquare, Sparkles, UserRound } from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setJob(data);
      });

    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/match/${id}`)
      .then(res => res.json())
      .then(data => setMatchData(data));
  }, [id]);

  const handleApply = () => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: parseInt(id), status: 'Applied' })
    })
      .then(res => res.json())
        .then(() => { setApplied(true); setMessage('Application added to your tracker.'); });
  };

      const handleSave = () => fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/saved_jobs`, { method: 'POST', body: JSON.stringify({ job_id: parseInt(id) }) }).then(() => { setSaved(true); setMessage('Job saved to your opportunities.'); });
      const handleTrack = () => fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications`, { method: 'POST', body: JSON.stringify({ job_id: parseInt(id), status: 'Saved', source: job.source || 'ProfileMaster Jobs' }) }).then(() => setMessage('Job added to your application pipeline.'));

  if (!job) return <div className="text-center" style={{ padding: '5rem', color: 'var(--text-secondary)' }}>Loading job...</div>;

  const matchColor = matchData?.match_percentage >= 70 ? '#27664d' : matchData?.match_percentage >= 40 ? '#a87515' : '#c65e49';
  const skills = (job.required_skills || '').split(',').map(skill => skill.trim()).filter(Boolean);
  const preferredSkills = (job.preferred_skills || '').split(',').map(skill => skill.trim()).filter(Boolean);

  return (
    <div className="job-details-page"><Link to="/jobs" className="job-back-link"><ArrowLeft size={16} /> Back to jobs</Link><header className="job-details-hero"><div className="company-avatar large">{job.company?.slice(0, 1).toUpperCase()}</div><div><span className="section-kicker">{job.source || 'ProfileMaster Demo'} · {formatPostedDate(job.posted_date)}</span><h1>{job.title}</h1><h2>{job.company}</h2></div><div className="detail-match"><span>Your match</span><strong style={{ color: matchColor }}>{matchData?.match_percentage || 0}%</strong></div></header>{message && <div className="jobs-message"><Check size={15} />{message}</div>}<div className="job-details-layout"><main><div className="job-detail-facts"><span><MapPin size={16} />{job.location || 'Remote'}</span><span><UserRound size={16} />{job.experience || 'Flexible'}</span><span><CircleDollarSign size={16} />{job.salary || 'Salary not listed'}</span><span><BriefcaseBusiness size={16} />{job.work_mode || 'Remote'}</span><span><CalendarDays size={16} />Posted {formatPostedDate(job.posted_date)}</span></div><JobDetailBlock title="About the company" icon={<Building2 size={16} />} text={job.company_info || `${job.company} is hiring for a ${job.title} role. Review the responsibilities and connect your ProfileMaster strengths to the opportunity.`} /><JobDetailBlock title="Job description" text={job.description || 'Review the role requirements and prepare examples from your profile that show how you would contribute.'} /><JobDetailBlock title="Responsibilities" text={job.responsibilities || 'Collaborate with the team, build maintainable solutions, communicate progress and contribute to the delivery of quality work.'} /><SkillGroup title="Required skills" skills={skills} /><SkillGroup title="Preferred skills" skills={preferredSkills} /><JobDetailBlock title="Application information" text={job.application_info || 'Use Apply Now to add this role to your Applications tracker. You can then record interview dates, notes and follow-ups there.'} /></main><aside className="job-details-sidebar"><section className="match-explanation"><div className="panel-heading"><div><span className="section-kicker"><Sparkles size={13} /> Profile fit</span><h3>Why this job matches you</h3></div></div><div className="match-big"><strong style={{ color: matchColor }}>{matchData?.match_percentage || 0}%</strong><span>profile match</span></div><h4>Matched skills</h4><div className="match-list">{(matchData?.matched_skills || []).map(skill => <span className="matched" key={skill}><Check size={12} />{skill}</span>)}</div><h4>Missing skills</h4><div className="match-list">{(matchData?.missing_skills || []).map(skill => <span className="missing" key={skill}>• {skill}</span>)}</div></section><section className="prepare-card"><span className="section-kicker"><MessageSquare size={13} /> Before applying</span><h3>Prepare with your profile</h3><p>Revise the matched fundamentals, then practise explaining one project decision clearly.</p><Link to="/interview" className="text-button">Open interview preparation <ArrowRight size={14} /></Link></section><div className="job-action-stack"><button className="btn btn-sun" onClick={handleApply} disabled={applied}>{applied ? 'Application sent' : 'Apply now'} <ArrowRight size={15} /></button><button className="btn btn-light" onClick={handleSave}>{saved ? 'Saved' : 'Save job'} <BookmarkIcon saved={saved} /></button><button className="btn btn-light" onClick={handleTrack}>Track application <BriefcaseBusiness size={15} /></button>{job.job_link && <a className="job-external-link" href={job.job_link} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View source listing</a>}</div></aside></div></div>
  );
}

const formatPostedDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';
function BookmarkIcon({ saved }) { return <span aria-hidden="true">{saved ? '✓' : '☆'}</span>; }
function JobDetailBlock({ title, icon, text }) { return <section className="job-detail-block"><h3>{icon}{title}</h3><p>{text}</p></section>; }
function SkillGroup({ title, skills }) { return <section className="job-detail-block"><h3><Check size={16} />{title}</h3>{skills.length ? <div className="detail-skill-chips">{skills.map(skill => <span key={skill}>{skill}</span>)}</div> : <p>No additional skills listed.</p>}</section>; }
