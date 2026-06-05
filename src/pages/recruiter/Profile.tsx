import {
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

import { useUser } from '@/shared/model/authStore';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('RecruiterProfile');

function formatDate(isoLike: string) {
  try {
    const d = new Date(isoLike);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoLike;
  }
}

const initials = (name: string) =>
  name
    ?.split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const RecruiterProfile: React.FC = () => {
  const user = useUser();
  const { orgContext, isLoading: orgLoading } = useOrgContext();
  const [copied, setCopied] = useState<{ field: "email" | "phone" | null }>({
    field: null,
  });

  // Log component mount and user data
  useEffect(() => {
    logger.info('[RecruiterProfile] Component mounted', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.name,
      userRoles: user?.roles,
      isEmailVerified: user?.isEmailVerified,
    });
  }, []);

  // Log user changes
  useEffect(() => {
    if (user) {
      logger.info('[RecruiterProfile] User data loaded', {
        userId: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
      });
    } else {
      logger.warn('[RecruiterProfile] No user data available');
    }
  }, [user]);

  // Log org context changes
  useEffect(() => {
    if (orgLoading) {
      logger.info('[RecruiterProfile] Loading organization context...');
    } else if (orgContext) {
      logger.info('[RecruiterProfile] Organization context loaded', {
        organizationId: orgContext.organizationId,
        organizationName: orgContext.organizationName,
        isAdmin: orgContext.isAdmin,
        ssoRoleName: orgContext.ssoRoleName,
      });
    } else {
      logger.warn('[RecruiterProfile] No organization context available');
    }
  }, [orgContext, orgLoading]);

  // Determine user role display
  const userDisplayRole = useMemo(() => {
    const userRoles = user?.roles || [];
    const isAdmin = userRoles.includes('owner') || userRoles.includes('company_admin');
    const role = isAdmin ? 'Admin' : 'Recruiter';

    logger.info('[RecruiterProfile] Computed user display role', {
      userRoles,
      isAdmin,
      displayRole: role,
    });

    return role;
  }, [user?.roles]);

  const handleCopy = async (value: string, field: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied({ field });
      setTimeout(() => setCopied({ field: null }), 1800);
      logger.info('[RecruiterProfile] Copied to clipboard', { field });
    } catch (error) {
      logger.error('[RecruiterProfile] Failed to copy to clipboard', {
        field,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Use data directly from auth user and org context
  const recruiter = useMemo(() => {
    const data = {
      id: user?.id || '',
      name: user?.name || `${user?.email?.split('@')[0]}`,
      email: user?.email || '',
      phone: user?.phone || null,
      organizationName: orgContext?.organizationName || 'Organization',
      organizationId: orgContext?.organizationId || '',
      role: userDisplayRole,
      state: null, // Can be added later if needed
      website: null,
      verificationstatus: user?.isEmailVerified ? 'approved' : 'pending',
      isactive: true,
      createdat: new Date().toISOString(), // Use current date as fallback
    };

    logger.info('[RecruiterProfile] Recruiter profile data constructed', {
      hasId: !!data.id,
      hasName: !!data.name,
      hasEmail: !!data.email,
      hasPhone: !!data.phone,
      organizationName: data.organizationName,
      role: data.role,
      verificationStatus: data.verificationstatus,
    });

    return data;
  }, [user, orgContext, userDisplayRole]);

  // Loading state
  if (!user) {
    logger.info('[RecruiterProfile] Showing loading state - no user data');
    return (
      <div className="p-10 text-center text-gray-500">Loading profile...</div>
    );
  }

  // Log final render
  logger.info('[RecruiterProfile] Rendering profile page', {
    recruiterId: recruiter.id,
    recruiterName: recruiter.name,
    recruiterRole: recruiter.role,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header / Hero */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="relative bg-white/90 border border-gray-100 rounded-3xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            {/* left: avatar card */}
            <div className="flex items-center gap-5 md:gap-8">
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-white bg-primary-600"

                aria-hidden
              >
                {recruiter.name ? initials(recruiter.name) : '??'}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {recruiter.name || 'Unknown User'}
                </h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{recruiter.email || 'No email available'}</span>
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* Role Badge */}
                  <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-xs text-blue-700">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{recruiter.role}</span>
                  </div>

                  {/* Organization Badge */}
                  {recruiter.organizationName && recruiter.organizationName !== 'Organization' && (
                    <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full text-xs text-purple-700">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{recruiter.organizationName}</span>
                    </div>
                  )}

                  {/* Verification Status Badge */}
                  <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">
                      {recruiter.verificationstatus === 'approved' ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  {/* Active Status Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${recruiter.isactive
                      ? "bg-white border border-slate-100 text-emerald-700"
                      : "bg-white border border-slate-100 text-rose-600"
                      }`}
                  >
                    {recruiter.isactive ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-medium">
                      {recruiter.isactive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Member Since Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-white border border-slate-100 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Member since {formatDate(recruiter.createdat)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {recruiter.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{recruiter.email}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">
                    {recruiter.verificationstatus || "Pending"}
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${recruiter.isactive
                    ? "bg-white border border-slate-100 text-emerald-700"
                    : "bg-white border border-slate-100 text-rose-600"
                    }`}
                >
                  {recruiter.isactive ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span className="font-medium">
                    {recruiter.isactive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-white border border-slate-100 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Member since {formatDate(recruiter.createdat)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* right: quick actions */}
          <div className="ml-auto flex gap-3">
            {recruiter.website && (
              <a
                href={recruiter.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600  text-white shadow-sm hover:scale-[1.01] transition"
              >
                <ExternalLink className="w-4 h-4" /> Visit Website
              </a>
            )}

            <button
              onClick={() => handleCopy(recruiter.email, "email")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-slate-700 hover:shadow-sm transition"
            >
              <Copy className="w-4 h-4" />
              {copied.field === "email" ? "Copied" : "Copy Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 bg-gradient-to-r from-[#f8fbff] to-[#eef6ff] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {recruiter.name}
                </div>
                <div className="text-sm text-slate-500">
                  {recruiter.state}
                </div>
              </div>
              <div className="text-right">
                {recruiter.website && (
                  <a
                    href={recruiter.website}
                    className="text-sm text-[#0a6aba] font-medium inline-flex items-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe className="w-4 h-4" /> Visit website
                  </a>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  ID: {recruiter.id.slice(0, 8)}…
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-slate-400">Email</div>
                <div className="mt-1 text-sm font-medium text-slate-800 flex items-center gap-3">
                  <span className="truncate">{recruiter.email}</span>
                  <button
                    onClick={() => handleCopy(recruiter.email, "email")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-slate-400">Phone</div>
                <div className="mt-1 text-sm font-medium text-slate-800 flex items-center gap-3">
                  <span>{recruiter.phone || "—"}</span>
                  {recruiter.phone && (
                    <button
                      onClick={() => handleCopy(recruiter.phone, "phone")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-slate-400">Location</div>
                <div className="mt-1 text-sm font-medium text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{recruiter.state || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Verification & Status
            </h4>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">
                  Verification
                </div>
                <div className="text-xs text-slate-500">
                  {recruiter.verificationstatus === "approved"
                    ? "Approved"
                    : recruiter.verificationstatus}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-shrink-0 p-3 rounded-lg bg-slate-50">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">
                  Account status
                </div>
                <div
                  className={`text-xs font-medium ${recruiter.isactive ? "text-emerald-600" : "text-rose-600"
                    }`}
                >
                  {recruiter.isactive ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Meta
            </h4>
            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Location
                </div>
                <div className="text-slate-800 font-medium">
                  {recruiter.state || "—"}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Created
                </div>
                <div className="text-slate-800 font-medium">
                  {formatDate(recruiter.createdat)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Contact
                </div>
                <div className="text-slate-800 font-medium">
                  {recruiter.email}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RecruiterProfile;
