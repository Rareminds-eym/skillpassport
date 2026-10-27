import { Building2, Calendar, Check, Factory, Info, MapPin, X } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { opportunityText } from '@/features/opportunities/lib/presentation';
import './IndustrialVisitPreview.css';

function visitDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function IndustrialVisitRegistration({ visit, onRegister, isRegistered = false, isRegistering = false, error = '', onCompleteProfile }) {
  return <div className="industrial-visit-registration">
    <button type="button" onClick={() => onRegister?.(visit)} disabled={!visit || !onRegister || isRegistered || isRegistering}
      aria-busy={isRegistering} className={isRegistered ? 'visit-register-button is-registered' : 'visit-register-button'}>
      {isRegistered && <span className="visit-registration-check" aria-hidden="true"><Check size={15} /></span>}
      {isRegistered ? 'Registered' : isRegistering ? 'Registering…' : 'Register for Visit'}
    </button>
    {error ? <div role="alert" className="visit-registration-error"><p>{error}</p>{onCompleteProfile && <button type="button" onClick={onCompleteProfile} className="visit-profile-action">Complete your profile</button>}</div>
      : <p role={isRegistered ? 'status' : undefined} className="visit-registration-note">{isRegistered ? 'Your registration is recorded. The organizer will share further updates.' : 'The organizer will share confirmation and scheduling details.'}</p>}
  </div>;
}

const IndustrialVisitPreview = ({ visit, onClose, onRegister, isRegistered = false, isRegistering = false, inDialog = false, registrationError = '', onCompleteProfile }) => {
  const previewRef = useRef(null);
  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview || inDialog) return;
    const fit = () => {
      const available = window.innerHeight - Math.max(96, preview.getBoundingClientRect().top) - 16;
      const height = window.innerWidth >= 1024 && available >= 320 ? `${available}px` : 'none';
      if (preview.style.getPropertyValue('--visit-preview-height') !== height)
        preview.style.setProperty('--visit-preview-height', height);
    };
    fit();
    window.addEventListener('resize', fit);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(preview.closest('.opportunity-visits') || preview);
    return () => { window.removeEventListener('resize', fit); observer?.disconnect(); };
  }, [visit?.id, inDialog]);
  if (!visit) return <div className="industrial-visit-preview visit-preview-empty"><Factory size={32} aria-hidden="true" /><h2>Select a visit</h2><p>Choose a visit to review its details.</p></div>;
  const company = opportunityText(visit.company_name) || 'Industrial visit';
  const location = opportunityText(visit.location) || 'Location not specified';
  const sector = opportunityText(visit.sector) || 'Industry not specified';
  const posted = visitDate(visit.posted_date || visit.created_at);
  return <div ref={previewRef} className="industrial-visit-preview" data-dialog={inDialog ? 'true' : undefined}>
    {!inDialog && <header className="visit-preview-header">
      {onClose && <button type="button" onClick={onClose} aria-label="Close visit preview" className="visit-preview-close"><X size={18} aria-hidden="true" /></button>}
      <div className="visit-preview-heading"><span className="visit-preview-company-icon"><Factory size={24} aria-hidden="true" /></span><div className="min-w-0"><p className="visit-preview-kicker">Industrial visit</p><h2>{company}</h2></div></div>
      <div className="visit-preview-meta"><MapPin size={14} aria-hidden="true" /><span>{location}</span></div>
    </header>}
    <div className="visit-preview-body" role="region" aria-label="Visit information" tabIndex={inDialog ? undefined : 0}>
      <section aria-label="About this visit"><h3>About this visit</h3><p className="visit-description">{opportunityText(visit.description) || 'The organizer has not provided a description yet.'}</p></section>
      <dl className="visit-preview-facts">
        {[[Building2, 'Industry', sector], [MapPin, 'Location', location], [Calendar, 'Listing posted', posted || 'Posting date unavailable']].map(([Icon, label, value]) => <div key={label} className="visit-preview-fact"><dt><span className="visit-fact-icon" aria-hidden="true"><Icon size={18} /></span>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="visit-preview-info"><Info size={16} aria-hidden="true" /><div><p className="visit-preview-info-title">{isRegistered ? 'What happens next' : 'Before you register'}</p><p>{isRegistered ? 'Scheduling and joining details are provided by the organizer.' : 'Review the description and location. The organizer will confirm the schedule and arrangements.'}</p></div></div>
    </div>
    {!inDialog && <footer className="visit-preview-footer"><IndustrialVisitRegistration visit={visit} onRegister={onRegister} isRegistered={isRegistered} isRegistering={isRegistering} error={registrationError} onCompleteProfile={onCompleteProfile} /></footer>}
  </div>;
};
export default IndustrialVisitPreview;
