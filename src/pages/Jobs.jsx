import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Bookmark, BriefcaseBusiness, Building2, CalendarDays, Check, CircleDollarSign, ExternalLink, Filter, MapPin, Search, UserRound } from 'lucide-react';

const formatPosted = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently posted';

const JobCard = ({ job, saved, onSave, onApply, onTrack }) => {
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/match/${job.id}`)
      .then(res => res.json())
      .then(data => setMatchData(data))
      .catch(err => console.error(err));
  }, [job.id]);

  const matchColor = matchData?.match_percentage >= 70 ? '#27664d' : matchData?.match_percentage >= 40 ? '#a87515' : '#c65e49';

  return (
    <article className="job-card">
      <div className="job-card-top"><div className="company-avatar">{job.company?.slice(0, 1).toUpperCase()}</div><div className="job-source">{job.source || 'ProfileMaster Demo'} <span>· {formatPosted(job.posted_date)}</span></div><button className={`job-save ${saved ? 'saved' : ''}`} onClick={() => onSave(job.id)} aria-label={saved ? 'Remove saved job' : 'Save job'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>
      <div className="job-card-title"><div><h3>{job.title}</h3><p>{job.company}</p></div>{matchData && <div className="job-match"><strong style={{ color: matchColor }}>{matchData.match_percentage}%</strong><span>match</span></div>}</div>
      <div className="job-meta-grid"><span><MapPin size={14} />{job.location || 'Remote'}</span><span><UserRound size={14} />{job.experience || 'Flexible'}</span><span><CircleDollarSign size={14} />{job.salary || 'Salary not listed'}</span><span><BriefcaseBusiness size={14} />{job.work_mode || 'Remote'}</span></div>
      <div className="job-skill-list">{(job.required_skills || '').split(',').slice(0, 4).map(skill => <span key={skill}>{skill.trim()}</span>)}{(job.required_skills || '').split(',').length > 4 && <span>+ more</span>}</div>
      <div className="job-card-actions"><Link to={`/job/${job.id}`} className="btn btn-ink">View details</Link><button className="btn btn-light" onClick={() => onApply(job.id)}>Apply</button><button className="job-track-button" onClick={() => onTrack(job.id)}>Track</button></div>
    </article>
  );
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ location: '', experience: '', work_mode: '', salary: '', skills: '', posted: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/saved_jobs').then(res => res.json()).then(data => setSavedIds(Array.isArray(data) ? data.map(job => job.id) : [])).catch(() => setSavedIds([]));
  }, []);

  const fetchJobs = (query = search, nextFilters = filters) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    Object.entries(nextFilters).forEach(([key, value]) => value && params.set(key, value));
    fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs${params.toString() ? `?${params.toString()}` : ''}`)
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error(err));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const changeFilter = (key, value) => { const next = { ...filters, [key]: value }; setFilters(next); fetchJobs(search, next); };
  const toggleSave = id => {
    const saved = savedIds.includes(id);
    fetchWithAuth(saved ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/saved_jobs/${id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/saved_jobs', { method: saved ? 'DELETE' : 'POST', body: saved ? undefined : JSON.stringify({ job_id: id }) }).then(() => setSavedIds(ids => saved ? ids.filter(savedId => savedId !== id) : [...ids, id]));
  };
  const apply = id => fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications', { method: 'POST', body: JSON.stringify({ job_id: id, status: 'Applied', source: 'ProfileMaster Jobs' }) }).then(() => setMessage('Application added to your tracker.'));
  const track = id => fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications', { method: 'POST', body: JSON.stringify({ job_id: id, status: 'Saved', source: 'ProfileMaster Jobs' }) }).then(() => setMessage('Job added to your application pipeline.'));

  return (
    <div className="jobs-page"><header className="jobs-header"><div><span className="section-kicker"><BriefcaseBusiness size={14} /> Opportunity board</span><h1>Find Your <em>Next Opportunity</em></h1><p>Discover jobs that match your skills, goals and profile.</p></div><div className="jobs-header-mark"><Building2 size={24} /></div></header>
      <form className="jobs-search-panel" onSubmit={handleSearch}><div className="jobs-search-field"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Job title, skill or company" /></div><div className="jobs-search-field location"><MapPin size={17} /><input value={filters.location} onChange={event => setFilters({ ...filters, location: event.target.value })} placeholder="Location" /></div><button className="btn btn-ink" type="submit"><Search size={16} /> Search jobs</button></form>
      <div className="jobs-toolbar"><span>{jobs.length} opportunities found</span><button className={`jobs-filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} type="button"><Filter size={15} /> Filters</button></div>
      {showFilters && <div className="jobs-filters"><label>Job role<select value={search} onChange={event => { setSearch(event.target.value); fetchJobs(event.target.value); }}><option value="">All roles</option>{[...new Set(jobs.map(job => job.title))].map(title => <option key={title}>{title}</option>)}</select></label><label>Experience<select value={filters.experience} onChange={event => changeFilter('experience', event.target.value)}><option value="">Any experience</option><option>0-1 years</option><option>1-3 years</option><option>3-5 years</option><option>Experienced</option></select></label><label>Work mode<select value={filters.work_mode} onChange={event => changeFilter('work_mode', event.target.value)}><option value="">Any work mode</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label>Posted<select value={filters.posted} onChange={event => changeFilter('posted', event.target.value)}><option value="">Any time</option><option>today</option><option>last 3 days</option><option>last 7 days</option></select></label><label>Salary range<input value={filters.salary} onChange={event => setFilters({ ...filters, salary: event.target.value })} onBlur={() => fetchJobs()} placeholder="$70,000" /></label><label>Skills<input value={filters.skills} onChange={event => setFilters({ ...filters, skills: event.target.value })} onBlur={() => fetchJobs()} placeholder="React, SQL" /></label></div>}
      {message && <div className="jobs-message"><Check size={15} />{message}<button onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}
      <div className="jobs-grid">{jobs.map(job => <JobCard key={job.id} job={job} saved={savedIds.includes(job.id)} onSave={toggleSave} onApply={apply} onTrack={track} />)}</div>{jobs.length === 0 && <div className="jobs-empty"><BriefcaseBusiness size={28} /><h3>No jobs found</h3><p>Try a broader search or clear one of the filters.</p></div>}
    </div>
  );
}
