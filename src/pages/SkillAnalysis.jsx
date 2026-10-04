import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';

const SVGIcon = ({ path, color }) => (
  <svg className="icon" viewBox="0 0 24 24" style={{ stroke: color || 'currentColor', width: '24px', height: '24px', marginRight: '0.5rem' }}>
    <path d={path} />
  </svg>
);

export default function SkillAnalysis() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    fetchWithAuth(`http://localhost:5000/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setJob(data);
      });

    fetchWithAuth(`http://localhost:5000/api/match/${id}`)
      .then(res => res.json())
      .then(data => setMatchData(data));
  }, [id]);

  if (!job || !matchData) return <div className="text-center" style={{ padding: '5rem', color: 'var(--text-secondary)' }}>Loading analysis...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 'bold' }}>
        <SVGIcon path="M19 12H5 M12 19l-7-7 7-7" /> Back to Jobs
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Skill Gap Analysis</h1>
        <p className="page-subtitle" style={{ fontSize: '1.125rem' }}>
          Comparing your skills with <strong style={{ color: 'var(--primary-color)' }}>{job.title}</strong> at {job.company}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--card-border)" strokeWidth="12" />
              <circle 
                cx="80" cy="80" r="70" 
                fill="none" 
                stroke="var(--primary-color)" 
                strokeWidth="12" 
                strokeDasharray="440" 
                strokeDashoffset={440 - (440 * matchData.match_percentage) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', position: 'relative', zIndex: 10 }}>{matchData.match_percentage}%</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Match Score</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Based on required skills</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <SVGIcon path="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" color="var(--success)" /> 
              Matched Skills ({matchData.matched_skills.length})
            </h3>
            {matchData.matched_skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {matchData.matched_skills.map((skill, i) => (
                  <span key={i} className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No matched skills found.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <SVGIcon path="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M15 9l-6 6 M9 9l6 6" color="var(--danger)" /> 
              Missing Skills ({matchData.missing_skills.length})
            </h3>
            {matchData.missing_skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {matchData.missing_skills.map((skill, i) => (
                  <span key={i} className="badge badge-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>You have all the required skills!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
