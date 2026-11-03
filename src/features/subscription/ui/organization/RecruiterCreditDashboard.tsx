import React from 'react';
import { useEntitlementManifest } from '@/features/subscription/model/useEntitlementManifest';
import { AlertTriangle, Users, Mail, Phone, Briefcase, Zap, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreditCardProps {
  title: string;
  icon: React.ReactNode;
  consumed: number;
  allocated: number;
  remaining: number;
  unit: string;
  lowThreshold?: number;
}

function MetricProgressBar({ value, max, colorClass = 'bg-indigo-600' }: { value: number; max: number; colorClass?: string }) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function RecruiterCreditDashboard() {
  const { manifest, loading, error, refetch } = useEntitlementManifest({ family: 'recruiter' });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return null;
  }

  const features = manifest.features || {};

  // Extract metrics from manifest
  const contactUnlocks = features['contact_unlocks'] || { allocated: 0, consumed: 0, remaining: 0 };
  const candidateInvites = features['candidate_invites'] || { allocated: 0, consumed: 0, remaining: 0 };
  const jobPosts = features['active_job_posts'] || { limit: 1, current_usage: 0 };
  const seats = features['recruiter_seats'] || { limit: 1, current_usage: 1 };

  // Calculate low credit state (< 20% remaining)
  const isLowContactCredits = (contactUnlocks.allocated ?? 0) > 0 && 
    ((contactUnlocks.remaining ?? 0) / (contactUnlocks.allocated ?? 1)) < 0.2;

  const isLowInviteCredits = (candidateInvites.allocated ?? 0) > 0 && 
    ((candidateInvites.remaining ?? 0) / (candidateInvites.allocated ?? 1)) < 0.2;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {manifest.plan_name || 'Active Plan'}
            </span>
            <span className="text-xs text-slate-400">
              Synced {new Date(manifest.synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Sourcing Credits & Capacity</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            title="Refresh Balances"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to="/subscription/plans?type=recruiter"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-slate-900 to-black text-white text-sm font-semibold rounded-xl hover:from-black hover:to-slate-800 transition-all shadow-sm"
          >
            Upgrade Plan
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Low Balance Warning Banner */}
      {(isLowContactCredits || isLowInviteCredits) && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <span>
              Your credit balance is running low (below 20%). Upgrade your plan or add credits to ensure uninterrupted outreach.
            </span>
          </div>
          <Link
            to="/subscription/plans?type=recruiter"
            className="font-semibold text-amber-900 underline hover:text-amber-700 whitespace-nowrap"
          >
            View Options
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Contact Unlocks */}
        <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Contact Unlocks</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-slate-900">{contactUnlocks.remaining ?? 0}</span>
            <span className="text-xs text-slate-400">/ {contactUnlocks.allocated ?? 0} remaining</span>
          </div>
          <MetricProgressBar
            value={contactUnlocks.consumed ?? 0}
            max={contactUnlocks.allocated ?? 1}
            colorClass={isLowContactCredits ? 'bg-amber-500' : 'bg-indigo-600'}
          />
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Consumed: {contactUnlocks.consumed ?? 0}</span>
            <span>Allocated: {contactUnlocks.allocated ?? 0}</span>
          </div>
        </div>

        {/* Candidate Invites */}
        <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Candidate Invites</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-slate-900">{candidateInvites.remaining ?? 0}</span>
            <span className="text-xs text-slate-400">/ {candidateInvites.allocated ?? 0} remaining</span>
          </div>
          <MetricProgressBar
            value={candidateInvites.consumed ?? 0}
            max={candidateInvites.allocated ?? 1}
            colorClass={isLowInviteCredits ? 'bg-amber-500' : 'bg-purple-600'}
          />
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Consumed: {candidateInvites.consumed ?? 0}</span>
            <span>Allocated: {candidateInvites.allocated ?? 0}</span>
          </div>
        </div>

        {/* Active Job Posts */}
        <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-slate-900">{jobPosts.current_usage ?? 0}</span>
            <span className="text-xs text-slate-400">/ {jobPosts.limit ?? 'Custom'} active</span>
          </div>
          <MetricProgressBar
            value={jobPosts.current_usage ?? 0}
            max={typeof jobPosts.limit === 'number' ? jobPosts.limit : 100}
            colorClass="bg-emerald-600"
          />
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>Active: {jobPosts.current_usage ?? 0}</span>
            <span>Limit: {jobPosts.limit ?? 'Custom'}</span>
          </div>
        </div>

        {/* Recruiter Seats */}
        <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Team Seats</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold text-slate-900">{seats.current_usage ?? 1}</span>
            <span className="text-xs text-slate-400">/ {seats.limit ?? 'Custom'} seats</span>
          </div>
          <MetricProgressBar
            value={seats.current_usage ?? 1}
            max={typeof seats.limit === 'number' ? seats.limit : 10}
            colorClass="bg-blue-600"
          />
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>In Use: {seats.current_usage ?? 1}</span>
            <span>Capacity: {seats.limit ?? 'Custom'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterCreditDashboard;
