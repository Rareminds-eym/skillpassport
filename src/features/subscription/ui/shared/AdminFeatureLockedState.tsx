/**
 * AdminFeatureLockedState Component
 *
 * Professional, clean enterprise presentation state displayed when an institutional admin
 * accesses a module that is not included in their organization's current subscription.
 *
 * Formatted for standard enterprise B2B administrative portals:
 * - Sober, trustworthy layout (neutral tones, clean borders, no flashy gradients or glows)
 * - Clear entitlement status and module capabilities
 * - Streamlined access request dialog
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LockClosedIcon,
  CheckIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';

export interface AdminFeatureInfo {
  key: string;
  nav_label?: string;
  nav_path?: string;
  nav_group?: string | null;
}

interface AdminFeatureLockedStateProps {
  feature?: AdminFeatureInfo | null;
  role?: string | null;
  className?: string;
}

interface ModuleDetails {
  category: string;
  description: string;
  capabilities: string[];
}

const MODULE_CATALOG: Record<string, ModuleDetails> = {
  course_mapping: {
    category: 'Academic Operations',
    description: 'Matrix-based course-to-program mapping with faculty allocation, workload tracking, and elective management.',
    capabilities: [
      'Course-to-program allocation across semesters, branches, and degree tracks',
      'Dynamic faculty workload calculation and overload threshold alerts',
      'Core, departmental elective, and open elective capacity management',
      'Semester-level lock and approval controls for academic governance',
    ],
  },
  departments: {
    category: 'Institutional Structure',
    description: 'Departmental hierarchy management, HOD delegations, and resource oversight.',
    capabilities: [
      'Multi-tier academic structure and department configuration',
      'Head of Department (HOD) assignment and administrative delegation',
      'Departmental faculty quotas and resource distribution analytics',
      'Accreditation metrics and compliance record mapping',
    ],
  },
  faculty: {
    category: 'Faculty Governance',
    description: 'Faculty profile management, teaching assignments, and workload balancing.',
    capabilities: [
      'Verified faculty records with qualifications and designations',
      'Semester teaching credit allocation and workload utilization monitoring',
      'Course and section assignment coordination',
      'Cross-departmental teaching approvals and conflict prevention',
    ],
  },
  curriculum_builder: {
    category: 'Curriculum & OBE',
    description: 'Outcome-based education curriculum design with Bloom’s Taxonomy mapping.',
    capabilities: [
      'Structured syllabus and module authoring',
      'Bloom’s Taxonomy cognitive level tagging per unit',
      'Course Outcome (CO) to Program Outcome (PO) mapping matrices',
      'Version-controlled curriculum revision and approval boards',
    ],
  },
  lesson_plans: {
    category: 'Instructional Planning',
    description: 'Session-wise academic delivery planning, lesson tracking, and review workflows.',
    capabilities: [
      'Structured session objectives and pedagogical milestones',
      'Resource and reference material attachments',
      'Curriculum pace and syllabus completion tracking',
      'HOD review, feedback, and delivery verification',
    ],
  },
  programs: {
    category: 'Academic Programs',
    description: 'Degree specifications, academic tracks, and minimum credit requirements.',
    capabilities: [
      'Degree configurations with duration and graduation credit rules',
      'Specializations, minors, and honors pathways',
      'Academic year cohort onboarding and intake limits',
      'Inter-disciplinary program support',
    ],
  },
  program_sections: {
    category: 'Cohort Management',
    description: 'Student cohort division, lab batch allocation, and class advisor assignments.',
    capabilities: [
      'Automated and manual section allocation rules',
      'Laboratory batch splitting with capacity limits',
      'Class teacher and mentor assignments',
      'Timetable and attendance register integration',
    ],
  },
  admissions_data: {
    category: 'Learner Onboarding',
    description: 'Bulk student onboarding, roll number assignment, and admission verification.',
    capabilities: [
      'Bulk data import via validated Excel/CSV templates',
      'Automated roll number and institutional identifier generation',
      'Document prerequisite verification and eligibility tracking',
      'Pre-enrollment status and batch allocation readiness',
    ],
  },
  enrolled_learners: {
    category: 'Student Registry',
    description: 'Central student records, progression tracking, and academic status administration.',
    capabilities: [
      'Searchable student directory with multi-attribute filtering',
      'Complete academic transcripts and skill portfolios',
      'Enrollment status management (Active, On-Leave, Graduated)',
      'Institutional notification dispatch and advising records',
    ],
  },
  learner_attendance: {
    category: 'Attendance & Compliance',
    description: 'Institution-wide attendance tracking with policy enforcement and shortage alerts.',
    capabilities: [
      'Subject-wise and daily attendance logging with hardware sync',
      'Automated minimum attendance threshold rules',
      'Shortage notification dispatch to students and guardians',
      'Medical exemption and authorized absence approval workflows',
    ],
  },
  assessment_results: {
    category: 'Evaluations & Grading',
    description: 'Marks consolidation, GPA/CGPA computation, and grade analytics.',
    capabilities: [
      'Outcome-based marks entry and rubric evaluation',
      'Grade curve distribution and statistical moderation',
      'Automated SGPA/CGPA calculation per institution rules',
      'Digital grade sheet generation and student transcript export',
    ],
  },
  digital_portfolio: {
    category: 'Student Credentials',
    description: 'Institutionally verified student project portfolios and skill records.',
    capabilities: [
      'Verified project and credential records for each learner',
      'Industry-ready digital portfolio links',
      'Employer discovery pipeline integration',
      'Skill gap radar analytics per cohort',
    ],
  },
  learner_verifications: {
    category: 'Credential Verification',
    description: 'Employer background check and digital certificate verification portal.',
    capabilities: [
      'Direct employer verification portal',
      'Cryptographically verifiable credential checking',
      'Audit log of external verification requests',
      'Tamper-evident transcript validation',
    ],
  },
  learner_communication: {
    category: 'Campus Communication',
    description: 'Targeted broadcast announcements, department circulars, and messaging.',
    capabilities: [
      'Targeted circulars by department, program, or cohort',
      'In-app and email delivery with read receipts',
      'Mandatory acknowledgment logging for institutional orders',
      'Advising communication between mentors and students',
    ],
  },
  exam_management: {
    category: 'Examinations Office',
    description: 'Examination scheduling, hall ticket generation, and seating allocations.',
    capabilities: [
      'Conflict-free timetable generation',
      'Hall ticket generation with fee and attendance gates',
      'Room-capacity seating plan allocation',
      'Invigilator duty assignment and rotation',
    ],
  },
  placement_status: {
    category: 'Career & Placements',
    description: 'Campus recruitment drive management, candidate tracking, and offer records.',
    capabilities: [
      'Company registration and job opening criteria',
      'Multi-stage interview process tracking',
      'Offer letter tracking and package statistics',
      'Accreditation-compliant placement audit reports',
    ],
  },
  mentors: {
    category: 'Student Mentorship',
    description: 'Faculty mentor allocation, counseling notes, and intervention tracking.',
    capabilities: [
      'Mentor-to-mentee batch assignments',
      'Confidential counseling and academic action logs',
      'Early warning indicators for academic intervention',
      'Mentorship activity summaries for administration',
    ],
  },
  finance: {
    category: 'Institutional Finance',
    description: 'Fee structures, payment collection tracking, and outstanding balance reports.',
    capabilities: [
      'Custom fee heads and installment schedules',
      'Online payment gateway reconciliation',
      'Defaulter reporting and automated late fee rules',
      'Scholarship and fee concession tracking',
    ],
  },
  library: {
    category: 'Library Management',
    description: 'Cataloging, book circulation, and barcode inventory administration.',
    capabilities: [
      'Cataloging with standard ISBN and classification support',
      'Circulation desk (Issue, Return, Renewal, Reserve)',
      'Fine calculation and account balance logging',
      'Inventory auditing and collection usage statistics',
    ],
  },
  events: {
    category: 'Campus Events',
    description: 'Academic symposiums, workshops, and student event registration.',
    capabilities: [
      'Event scheduling with attendee capacity controls',
      'Attendance check-in validation',
      'Certificate generation for participants',
      'Resource and speaker management',
    ],
  },
  circulars: {
    category: 'Official Notices',
    description: 'Administrative orders, regulatory circulars, and institutional directives.',
    capabilities: [
      'Official memo publishing with authority signing',
      'Departmental and faculty distribution tracking',
      'Compliance acknowledgment logging',
      'Searchable circular repository',
    ],
  },
  user_management: {
    category: 'Administration & Security',
    description: 'Role-based access control, account provisioning, and security credentials.',
    capabilities: [
      'Role-based permissions with scoped administrative privileges',
      'User provisioning and single sign-on integration',
      'Account suspension and access revocation workflows',
      'Audit log of administrative actions',
    ],
  },
  reports_analytics: {
    category: 'Institutional Intelligence',
    description: 'Executive dashboards, accreditation data collation, and institutional KPIs.',
    capabilities: [
      'Accreditation reporting templates (NAAC, NIRF, NBA)',
      'Cohort progression and retention rate analysis',
      'Departmental performance and efficiency comparisons',
      'Data export for administrative review',
    ],
  },
  basic_analytics: {
    category: 'Course Performance',
    description: 'Course completion metrics, pass rates, and learner engagement analytics.',
    capabilities: [
      'Course completion and attendance correlation metrics',
      'Assessment difficulty curve analysis',
      'Section-wise academic performance comparisons',
      'Curriculum pacing analysis',
    ],
  },
};

export const AdminFeatureLockedState: React.FC<AdminFeatureLockedStateProps> = ({
  feature,
  role,
  className = '',
}) => {
  const navigate = useNavigate();
  const user = useUser();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urgency, setUrgency] = useState<'immediate' | 'next_term' | 'planning'>('immediate');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(
    () => (user as { phone?: string } | null)?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number || ''
  );
  const [hasRequested, setHasRequested] = useState(() => {
    if (!feature?.key) return false;
    return !!localStorage.getItem(`feature_request_${feature.key}`);
  });

  useEffect(() => {
    setShowModal(false);
    setNotes('');
    setUrgency('immediate');
    setPhone((user as { phone?: string } | null)?.phone || user?.user_metadata?.phone || user?.user_metadata?.phone_number || '');
    if (!feature?.key) {
      setHasRequested(false);
    } else {
      setHasRequested(!!localStorage.getItem(`feature_request_${feature.key}`));
    }
  }, [feature?.key, user?.id]);

  const featureKey = feature?.key || 'module';
  const featureLabel =
    feature?.nav_label ||
    featureKey
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  const featureGroup = feature?.nav_group || 'Academic Management';

  const details: ModuleDetails = MODULE_CATALOG[featureKey] || {
    category: featureGroup,
    description: `Enterprise academic management module for ${featureLabel}.`,
    capabilities: [
      `Standardized ${featureLabel} workflows and institutional administrative tools`,
      'Role-based access control with audited operational permissions',
      'Real-time metrics and compliance reporting exports',
      'Integration with your institution’s SkillPassport configuration',
    ],
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestPayload = {
        featureKey,
        featureLabel,
        urgency,
        notes,
        phone,
        userPhone: phone,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        orgId: user?.orgId,
        role: role || 'admin',
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(`feature_request_${featureKey}`, JSON.stringify(requestPayload));

      try {
        await apiPost('/admin/feature-request', requestPayload);
      } catch {
        // Fallback to direct fetch
        await fetch('/api/admin/feature-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        }).catch(() => {});
      }

      setHasRequested(true);
      setShowModal(false);
      toast.success(`Access request for ${featureLabel} has been submitted.`);
    } catch {
      toast.error('Unable to submit request. Please contact enterprise support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dashboardPath = role?.startsWith('school')
    ? '/school-admin/dashboard'
    : role?.startsWith('university')
    ? '/university-admin/dashboard'
    : '/college-admin/dashboard';

  return (
    <div className={`min-h-[calc(100vh-10rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="w-full max-w-2xl">
        {/* Main Clean Professional Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header: Icon, Title & Status */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                <LockClosedIcon className="h-6 w-6 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                    {featureLabel}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Not Included in Plan
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-normal">
                  {details.description}
                </p>
              </div>
            </div>

            {/* Plan Context Information */}
            <div className="my-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Subscription Status: </span>
                  Your organization is subscribed to a <span className="font-medium text-gray-800">Hybrid Plan</span>,
                  which provides customized modular access. The <span className="font-medium text-gray-800">{featureLabel}</span> module
                  is currently not licensed for your institution.
                </div>
              </div>
            </div>

            {/* Included Capabilities */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Module Capabilities
              </h2>
              <div className="space-y-2.5">
                {details.capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckIcon className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 text-gray-500" />
                Back to Dashboard
              </button>

              <div className="flex items-center gap-3">
                {hasRequested ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                    Request Submitted
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition-colors"
                  >
                    Request Module Access
                  </button>
                )}
              </div>
            </div>

            {/* Support Link */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Category: {details.category}</span>
              <a
                href={`mailto:support@rareminds.in?subject=Module%20Access%20Request%3A%20${encodeURIComponent(featureLabel)}`}
                className="text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
              >
                <EnvelopeIcon className="h-3.5 w-3.5" />
                Contact Enterprise Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Request Access Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Request Module Access</h3>
                <p className="text-xs text-gray-500">Submit an activation request for your institution</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Module
                </label>
                <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 border border-gray-200">
                  {featureLabel}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Requester
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || 'Administrator'}
                    className="w-full rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || 'admin@institution.edu'}
                    className="w-full rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deployment Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as 'immediate' | 'next_term' | 'planning')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="immediate">Immediate (Current academic session)</option>
                  <option value="next_term">Next Academic Term</option>
                  <option value="planning">Evaluating for future adoption</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Comments / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide any additional context or timeline requirements..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatureLockedState;
