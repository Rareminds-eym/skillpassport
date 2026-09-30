import { memo } from 'react';
import {
  Building2,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export interface OrganizationLearnerBenefitsCardProps {
  organizationName: string;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationType?: 'school' | 'college' | 'university';
  planName?: string;
  validUntil?: Date | string;
  adminEmail?: string;
  className?: string;
}

function OrganizationLearnerBenefitsCard({
  organizationName,
  organizationEmail,
  organizationPhone,
  organizationType,
  planName,
  validUntil,
  adminEmail,
  className = '',
}: OrganizationLearnerBenefitsCardProps) {
  const formattedDate = validUntil
    ? new Date(validUntil).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : null;

  const typeLabel = organizationType
    ? {
      school: 'School License',
      college: 'College License',
      university: 'University License',
    }[organizationType] || `${organizationType} License`
    : null;

  const displayEmail = organizationEmail || adminEmail;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
      {/* Institution Banner */}
      <div className="bg-slate-900 px-6 py-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Building2 className="w-6 h-6 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Provided by
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
              {organizationName && (
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {organizationName}
                </h2>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs text-slate-300">
                {displayEmail && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md text-slate-200">
                    <Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <a href={`mailto:${displayEmail}`} className="hover:underline hover:text-white transition-colors font-medium">
                      {displayEmail}
                    </a>
                  </div>
                )}
                {organizationPhone && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md text-slate-200">
                    <Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <a href={`tel:${organizationPhone.replace(/\s+/g, '')}`} className="hover:underline hover:text-white transition-colors font-medium">
                      {organizationPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {planName && (
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
              <p className="text-xs text-slate-400 font-medium">Plan Tier</p>
              <p className="text-sm font-semibold text-slate-100">{planName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Meta Bar */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        {formattedDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Valid Until: <strong className="text-slate-900 font-medium">{formattedDate}</strong></span>
          </div>
        )}
        {typeLabel && (
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Access Type: <strong className="text-slate-900 font-medium">{typeLabel}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(OrganizationLearnerBenefitsCard);
