/**
 * Event Sales - Multi-Step Form with Progress Indicator
 * Role-specific detail forms for different user types
 */

import { useState, useMemo, memo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  ChevronRight,
  Shield,
  Zap,
  Award,
  Users,
  GraduationCap,
  Briefcase,
  Globe,
  Hash,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getEntityContent } from '../../utils/getEntityContent';
import { isTestPricing } from '../../config/payment';
import Header from '../../layouts/Header';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';
import StudentPlanCard from './components/StudentPlanCard';
import paymentsApiService from '../../services/paymentsApiService';
import userApiService from '../../services/userApiService';

// Role types that use institution pricing tiers (not individual plans)
const ADMIN_ROLES = ['school-admin', 'college-admin', 'university-admin', 'educator', 'recruiter'];

// Student roles that use individual pricing tiers from institution_pricing_tiers
const STUDENT_ROLES = ['school-student', 'college-student', 'university-student'];

// Roles
const ROLES = [
  { id: 'school-student', label: 'School Student', desc: 'Class 8-12', type: 'student', icon: '🎒' },
  { id: 'college-student', label: 'College Student', desc: 'Undergraduate', type: 'college-student', icon: '🎓' },
  { id: 'university-student', label: 'University Student', desc: 'Postgraduate', type: 'university-student', icon: '📚' },
  { id: 'educator', label: 'Educator', desc: 'Teacher / Professor', type: 'college-educator', icon: '👨‍🏫' },
  { id: 'school-admin', label: 'School Admin', desc: 'School Management', type: 'school-admin', icon: '🏫' },
  { id: 'college-admin', label: 'College Admin', desc: 'College Management', type: 'college-admin', icon: '🎓' },
  { id: 'university-admin', label: 'University Admin', desc: 'University Management', type: 'university-admin', icon: '🏛️' },
  { id: 'recruiter', label: 'Recruiter', desc: 'Hiring Professional', type: 'recruitment-recruiter', icon: '💼' },
];

// States
const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

// School Types
const SCHOOL_TYPES = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Cambridge', 'Other'];

// College Types
const COLLEGE_TYPES = ['Engineering', 'Arts & Science', 'Medical', 'Law', 'Commerce', 'Polytechnic', 'Other'];

// University Types
const UNIVERSITY_TYPES = ['Central University', 'State University', 'Private University', 'Deemed University', 'Other'];

// Industry Types
const INDUSTRY_TYPES = ['IT/Software', 'Manufacturing', 'Healthcare', 'Finance/Banking', 'Education', 'Retail', 'Consulting', 'Other'];

// Load Razorpay - improved for mobile compatibility
const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.async = true;
  s.onload = () => {
    console.log('✅ Razorpay script loaded successfully');
    resolve(true);
  };
  s.onerror = () => {
    console.error('❌ Failed to load Razorpay script');
    reject(new Error('Failed to load payment gateway'));
  };
  document.body.appendChild(s);
});

// Detect mobile device
const isMobileDevice = () => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

// Step Progress Component
const StepProgress = memo(({ currentStep, steps }) => (
  <div className="w-full py-6 px-4">
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        <div className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
        {steps.map((step, idx) => {
          const isCompleted = currentStep > idx + 1;
          const isCurrent = currentStep === idx + 1;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-blue-600 text-white' : ''} ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''} ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-400' : ''}`}>
                {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`mt-2 text-xs font-medium transition-colors ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
));

// Role Card
const RoleCard = memo(({ role, isSelected, onSelect }) => (
  <button onClick={() => onSelect(role)} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}`}>
    <div className="flex items-center gap-4">
      <div className="text-3xl">{role.icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{role.label}</div>
        <div className="text-sm text-gray-500">{role.desc}</div>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
        {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </div>
    </div>
  </button>
));

// Selected Role Badge - Shows the selected role with option to change
const SelectedRoleBadge = memo(({ role, onChangeRole }) => (
  <div className="flex justify-center mb-4">
    <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full shadow-sm max-w-full">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="text-lg sm:text-xl flex-shrink-0">{role.icon}</span>
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{role.label}</span>
          <span className="text-gray-400 hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline truncate">{role.desc}</span>
        </div>
      </div>
      <button
        onClick={onChangeRole}
        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex-shrink-0"
      >
        Change
      </button>
    </div>
  </div>
));

// Student/Capacity Tier Card
const StudentTierCard = memo(({ tier, isSelected, onSelect, capacityLabel = 'Students' }) => (
  <button onClick={() => onSelect(tier)} className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 relative ${isSelected ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl shadow-blue-500/10' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
    {tier.is_recommended && <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full">Recommended</div>}
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-bold text-gray-900">{tier.max_students === 99999 ? `${tier.min_students}+` : `${tier.min_students} - ${tier.max_students}`} {capacityLabel}</span>
        </div>
        <div className="font-semibold text-blue-600 mb-3">{tier.tier_name} Plan</div>
        <ul className="space-y-1.5">
          {(tier.features || []).slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <div className="text-2xl font-bold text-gray-900">₹{tier.price?.toLocaleString()}</div>
        <div className="text-sm text-gray-500">per {tier.duration}</div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-3 ml-auto ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
          {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
      </div>
    </div>
  </button>
));

// Plan Card
const PlanCard = memo(({ plan, isSelected, onSelect }) => (
  <button onClick={() => onSelect(plan)} className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 relative ${isSelected ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl shadow-blue-500/10' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
    {plan.recommended && <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full">Recommended</div>}
    <div className="flex justify-between items-start">
      <div>
        <div className="text-2xl font-bold text-gray-900">₹{plan.price}</div>
        <div className="text-sm text-gray-500 mb-2">per {plan.duration}</div>
        <div className="font-semibold text-blue-600 mb-3">{plan.name}</div>
        <ul className="space-y-1.5">
          {plan.features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
        {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </div>
    </div>
  </button>
));

// Input Field
const InputField = memo(({ label, icon: Icon, error, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon className="w-5 h-5" /></div>}
      <input {...props} className={`w-full h-12 ${Icon ? 'pl-11' : 'pl-4'} pr-4 rounded-xl border-2 bg-white outline-none transition-all text-gray-900 placeholder:text-gray-400 ${error ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`} />
    </div>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
));

// Select Field
const SelectField = memo(({ label, icon: Icon, options, error, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Icon className="w-5 h-5" /></div>}
      <select {...props} className={`w-full h-12 ${Icon ? 'pl-11' : 'pl-4'} pr-4 rounded-xl border-2 bg-white outline-none transition-all appearance-none cursor-pointer ${!props.value ? 'text-gray-400' : 'text-gray-900'} ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}`}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
));


// Get role-specific UX content for steps
const getStepContent = (roleId) => {
  switch (roleId) {
    case 'school-student':
      return {
        step2: {
          heading: 'Start Your Journey',
          subtitle: 'Build skills early and discover your career path'
        },
        step3: {
          heading: 'Student Information',
          subtitle: 'Tell us about yourself'
        }
      };
    case 'college-student':
      return {
        step2: {
          heading: 'Boost Your Career',
          subtitle: 'Stand out to recruiters with verified skills'
        },
        step3: {
          heading: 'Student Information',
          subtitle: 'Help us personalize your experience'
        }
      };
    case 'university-student':
      return {
        step2: {
          heading: 'Advance Your Career',
          subtitle: 'Access premium opportunities and industry connections'
        },
        step3: {
          heading: 'Student Information',
          subtitle: 'Complete your professional profile'
        }
      };
    default:
      return {
        step2: {
          heading: 'Choose Your Plan',
          subtitle: 'Select the plan that fits your needs'
        },
        step3: {
          heading: 'Your Details',
          subtitle: 'Enter your information'
        }
      };
  }
};

// Get initial form state based on role
const getInitialFormState = (roleId) => {
  const common = { email: '', phone: '', address: '', city: '', state: '', pincode: '' };

  switch (roleId) {
    case 'school-admin':
      return { ...common, school_name: '', school_type: '', principal_name: '', registration_number: '', website: '' };
    case 'college-admin':
      return { ...common, college_name: '', college_type: '', university_affiliation: '', dean_name: '', aicte_code: '', website: '' };
    case 'university-admin':
      return { ...common, university_name: '', university_type: '', vc_name: '', ugc_number: '', website: '' };
    case 'school-student':
      return { ...common, full_name: '', school_name: '', class_grade: '', roll_number: '' };
    case 'college-student':
    case 'university-student':
      return { ...common, full_name: '', institution_name: '', course: '', year: '', roll_number: '' };
    case 'educator':
      return { ...common, full_name: '', institution_name: '', department: '', designation: '', employee_id: '' };
    case 'recruiter':
      return { ...common, full_name: '', company_name: '', designation: '', industry: '', company_website: '' };
    default:
      return { ...common, full_name: '' };
  }
};

// Main Component
function EventSales() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventName = searchParams.get('event') || 'Event Registration';

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [plan, setPlan] = useState(null);
  const [studentTier, setStudentTier] = useState(null);
  const [studentTiers, setStudentTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [selectedTierGroupIndex, setSelectedTierGroupIndex] = useState(0);
  const [studentCount, setStudentCount] = useState(''); // Manual student count input
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [promoEvent, setPromoEvent] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Preload Razorpay script on component mount (critical for mobile)
  useEffect(() => {
    loadRazorpay()
      .then(() => setRazorpayReady(true))
      .catch((err) => {
        console.error('Razorpay preload failed:', err);
        setPaymentError('Payment gateway failed to load. Please refresh the page.');
      });
  }, []);

  // Fetch active promotional event
  useEffect(() => {
    const fetchPromoEvent = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('promotional_events')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now)
          .single();

        if (!error && data) {
          setPromoEvent(data);
        }
      } catch (err) {
        console.error('Error fetching promo event:', err);
      }
    };
    fetchPromoEvent();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!promoEvent?.end_date) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(promoEvent.end_date).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setPromoEvent(null); // Promotion ended
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [promoEvent?.end_date]);

  const isPromoActive = !!promoEvent;

  const isAdminRole = role && ADMIN_ROLES.includes(role.id);
  const isStudentRole = role && STUDENT_ROLES.includes(role.id);

  // Dynamic steps
  const steps = useMemo(() => {
    if (isAdminRole) {
      // Use "Capacity" for recruiter, "Students" for others
      const tierLabel = role?.id === 'recruiter' ? 'Capacity' : 'Students';
      return [
        { id: 1, title: 'Role', icon: User },
        { id: 2, title: tierLabel, icon: Users },
        { id: 3, title: 'Details', icon: Building },
        { id: 4, title: 'Payment', icon: Shield },
      ];
    }
    return [
      { id: 1, title: 'Role', icon: User },
      { id: 2, title: 'Plan', icon: CreditCard },
      { id: 3, title: 'Details', icon: Mail },
      { id: 4, title: 'Payment', icon: Shield },
    ];
  }, [isAdminRole, role?.id]);

  const { plans } = useMemo(() => role && !isAdminRole ? getEntityContent(role.type) : { plans: [] }, [role, isAdminRole]);

  // Group tiers by student count range for better display
  const groupedTiers = useMemo(() => {
    if (!studentTiers.length) return [];

    const groups = {};
    studentTiers.forEach(tier => {
      const key = `${tier.min_students}-${tier.max_students}`;
      if (!groups[key]) {
        groups[key] = {
          min: tier.min_students,
          max: tier.max_students,
          tiers: []
        };
      }
      groups[key].tiers.push(tier);
    });

    // Sort groups by min_students and sort tiers within each group by plan type
    const planOrder = { 'Basic-Cost': 1, 'Professional': 2, 'Entreprise': 3 };
    return Object.values(groups)
      .sort((a, b) => a.min - b.min)
      .map(group => ({
        ...group,
        tiers: group.tiers.sort((a, b) => (planOrder[a.tier_name] || 99) - (planOrder[b.tier_name] || 99))
      }));
  }, [studentTiers]);

  // Fetch pricing tiers for admin and student roles
  useEffect(() => {
    const fetchTiers = async () => {
      if (!role || (!isAdminRole && !isStudentRole)) return;
      setTiersLoading(true);
      try {
        const { data, error } = await supabase
          .from('institution_pricing_tiers')
          .select('*')
          .eq('role_type', role.id)
          .eq('is_active', true)
          .order('min_students', { ascending: true });
        if (error) throw error;
        setStudentTiers(data || []);
        const recommended = data?.find(t => t.is_recommended);
        if (recommended && !studentTier) setStudentTier(recommended);
      } catch (err) {
        console.error('Error fetching tiers:', err);
      } finally {
        setTiersLoading(false);
      }
    };
    fetchTiers();
  }, [role, isAdminRole, isStudentRole]);

  // Auto-select plan for non-admin roles
  useEffect(() => {
    if (step === 2 && !isAdminRole && plans.length && !plan) {
      setPlan(plans.find(p => p.recommended) || plans[0]);
    }
  }, [step, plans, plan, isAdminRole]);

  // Reset form when role changes
  useEffect(() => {
    if (role) {
      setForm(getInitialFormState(role.id));
      setPlan(null);
      setStudentTier(null);
      setSelectedTierGroupIndex(0);
      setStudentCount('');
    }
  }, [role?.id]);

  const updateForm = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  // Validate form based on role
  // Only email, name, and phone are mandatory - all other fields are optional
  const validateForm = () => {
    const e = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^\d{10}$/;

    // Mandatory fields: email, phone, and name
    if (!form.email?.trim() || !emailRegex.test(form.email)) e.email = 'Valid email required';
    if (!form.phone?.trim() || !phoneRegex.test(form.phone.replace(/\D/g, ''))) e.phone = 'Valid 10-digit phone required';

    // Name validation based on role
    switch (role?.id) {
      case 'school-admin':
        if (!form.principal_name?.trim()) e.principal_name = 'Name required';
        break;
      case 'college-admin':
        if (!form.dean_name?.trim()) e.dean_name = 'Name required';
        break;
      case 'university-admin':
        if (!form.vc_name?.trim()) e.vc_name = 'Name required';
        break;
      default:
        // For students, educators, recruiters - use full_name
        if (!form.full_name?.trim()) e.full_name = 'Name required';
        break;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canProceed = () => {
    if (step === 1) return !!role;
    if (step === 2) {
      // Step 2: Just select a plan/tier
      if (isAdminRole) return !!studentTier;
      if (isStudentRole) return !!studentTier; // Students also use studentTier from DB
      return !!plan;
    }
    if (step === 3) {
      // Step 3: Only email, name, and phone are mandatory
      const emailRegex = /\S+@\S+\.\S+/;
      const phoneRegex = /^\d{10}$/;

      // Check mandatory fields: email and phone
      const emailValid = form.email?.trim() && emailRegex.test(form.email);
      const phoneValid = form.phone?.trim() && phoneRegex.test(form.phone.replace(/\D/g, ''));

      if (!emailValid || !phoneValid) return false;

      // Check name field based on role
      let nameValid = false;
      switch (role?.id) {
        case 'school-admin':
          nameValid = !!form.principal_name?.trim();
          break;
        case 'college-admin':
          nameValid = !!form.dean_name?.trim();
          break;
        case 'university-admin':
          nameValid = !!form.vc_name?.trim();
          break;
        default:
          nameValid = !!form.full_name?.trim();
      }

      if (!nameValid) return false;

      // Check student count for admin roles
      if (isAdminRole && studentTier) {
        const count = parseInt(studentCount, 10) || 0;
        const minStudents = parseInt(studentTier.min_students, 10) || 0;
        const maxStudents = parseInt(studentTier.max_students, 10) || 0;
        const isUnlimited = maxStudents >= 99999;
        return count >= minStudents && (isUnlimited || count <= maxStudents);
      }

      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 3 && !validateForm()) return;
    if (step < 4) setStep(s => s + 1);
  };

  // Get display name for order summary
  const getDisplayName = () => {
    if (role?.id === 'school-admin') return form.principal_name;
    if (role?.id === 'college-admin') return form.dean_name;
    if (role?.id === 'university-admin') return form.vc_name;
    return form.full_name;
  };

  // Get institution name for order summary
  const getInstitutionName = () => {
    if (role?.id === 'school-admin') return form.school_name;
    if (role?.id === 'college-admin') return form.college_name;
    if (role?.id === 'university-admin') return form.university_name;
    if (role?.id === 'recruiter') return form.company_name;
    return form.institution_name || form.school_name;
  };

  const currentPricing = useMemo(() => {
    // Admin role pricing (with student count multiplier)
    if (isAdminRole && studentTier) {
      const capacityLabel = role?.id === 'recruiter' ? 'candidates' : 'students';
      const count = parseInt(studentCount) || 0;

      // Regular price per student
      const regularPricePerStudent = parseFloat(studentTier.price) || 0;

      // Check if ESFE pricing is active
      const hasEsfePrice = isPromoActive && studentTier.esfe_active && studentTier.esfe_price;

      // ESFE price per student (use esfe_price column directly)
      const esfePricePerStudent = hasEsfePrice ? parseFloat(studentTier.esfe_price) || 0 : regularPricePerStudent;

      // Calculate totals
      const originalTotal = Math.round(regularPricePerStudent * count);
      const displayTotal = Math.round(esfePricePerStudent * count);

      return {
        name: `${studentTier.tier_name} Plan`,
        price: displayTotal,
        originalPrice: hasEsfePrice ? originalTotal : null,
        isEsfe: hasEsfePrice,
        discountPercent: hasEsfePrice ? studentTier.esfe_discount_percent : 0,
        pricePerStudent: hasEsfePrice ? esfePricePerStudent : regularPricePerStudent,
        originalPricePerStudent: regularPricePerStudent,
        studentCount: count,
        capacityLabel
      };
    }

    // Student role pricing (individual, no multiplier)
    if (isStudentRole && studentTier) {
      const hasEsfePrice = isPromoActive && studentTier.esfe_active && studentTier.esfe_price;
      const displayPrice = hasEsfePrice ? parseFloat(studentTier.esfe_price) : parseFloat(studentTier.price);
      const originalPrice = parseFloat(studentTier.price);

      return {
        name: `${studentTier.tier_name} Plan`,
        price: displayPrice,
        originalPrice: hasEsfePrice ? originalPrice : null,
        isEsfe: hasEsfePrice,
        discountPercent: hasEsfePrice ? studentTier.esfe_discount_percent : 0,
        duration: studentTier.duration || 'year'
      };
    }

    if (plan) return { name: plan.name, price: parseInt(plan.price), duration: plan.duration };
    return null;
  }, [isAdminRole, isStudentRole, studentTier, plan, role?.id, isPromoActive, studentCount]);

  const handlePayment = async () => {
    if (loading || !currentPricing) return;

    // Clear any previous errors
    setPaymentError(null);

    // Check if Razorpay is ready (preloaded)
    if (!razorpayReady || !window.Razorpay) {
      setPaymentError('Payment gateway is loading. Please wait a moment and try again.');
      // Try to load again
      try {
        await loadRazorpay();
        setRazorpayReady(true);
      } catch (e) {
        setPaymentError('Payment gateway failed to load. Please refresh the page and try again.');
        return;
      }
    }

    setLoading(true);

    // Detect mobile for logging
    const isMobile = isMobileDevice();
    console.log(`💳 Payment initiated on ${isMobile ? 'MOBILE' : 'DESKTOP'} device`);

    try {
      // Prepare role_details JSON
      const roleDetails = { ...form };
      delete roleDetails.email;
      delete roleDetails.phone;
      delete roleDetails.address;
      delete roleDetails.city;
      delete roleDetails.state;
      delete roleDetails.pincode;

      const registrationData = {
        full_name: getDisplayName(),
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        institution_name: getInstitutionName(),
        plan_type: currentPricing.name,
        plan_amount: currentPricing.price,
        payment_status: 'pending',
        event_name: eventName,
        role_type: role.id,
        role_details: roleDetails,
      };

      if (isAdminRole && studentTier) {
        registrationData.student_tier_id = studentTier.id;
        registrationData.student_count_min = studentTier.min_students;
        registrationData.student_count_max = studentTier.max_students;
        registrationData.student_count = parseInt(studentCount) || 0;
        registrationData.price_per_student = parseFloat(studentTier.price) || 0;
      }

      const { data: reg, error: err } = await supabase.from('event_registrations').insert(registrationData).select().single();
      if (err) throw err;

      // Create order via Cloudflare Worker (uses server-side Razorpay credentials)
      const orderData = await paymentsApiService.createEventOrder({
        amount: currentPricing.price * 100, // Amount in paise
        currency: 'INR',
        registrationId: reg.id,
        planName: currentPricing.name,
        userEmail: form.email,
        userName: getDisplayName(),
        origin: window.location.origin, // Send origin for dev/prod detection
      });

      console.log('💳 Razorpay: Order created via Cloudflare Worker', orderData.id);

      // Store registration data for use in callbacks
      const regId = reg.id;
      const pricingName = currentPricing.name;
      const userEmail = form.email;
      const userPhone = form.phone;
      const displayName = getDisplayName();
      const institutionName = getInstitutionName();
      const userRole = role.id;
      const savedRoleDetails = { ...roleDetails };

      // Create Razorpay options - IMPORTANT: Open immediately after creation for mobile
      const razorpayOptions = {
        key: orderData.key,
        order_id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Skill Passport',
        description: pricingName,
        prefill: {
          name: displayName,
          email: userEmail,
          contact: userPhone
        },
        theme: { color: '#3B82F6' },
        // Mobile-specific: Use redirect mode for better compatibility
        // Note: handler is still used but redirect provides fallback
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300, // 5 minutes timeout
        handler: async (res) => {
          console.log('✅ Payment successful:', res.razorpay_payment_id);

          // Update payment status using stored regId
          await supabase.from('event_registrations').update({
            razorpay_payment_id: res.razorpay_payment_id,
            payment_status: 'completed'
          }).eq('id', regId);

          // Create user account after successful payment
          try {
            const nameParts = displayName?.split(' ') || ['User'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            const userResponse = await userApiService.createEventUser({
              email: userEmail,
              firstName,
              lastName,
              role: userRole,
              phone: userPhone,
              registrationId: regId,
              metadata: {
                institution: institutionName,
                plan: pricingName,
                eventName,
                ...savedRoleDetails
              }
            });

            if (userResponse.error) {
              console.error('User creation error:', userResponse.error);
            }

            // Navigate with temp password if available
            const tempPassword = userResponse.data?.temporaryPassword;
            navigate(`/register/plans/success?id=${regId}&plan=${encodeURIComponent(pricingName)}${tempPassword ? `&tp=${encodeURIComponent(tempPassword)}` : ''}`);
          } catch (userErr) {
            console.error('User creation failed:', userErr);
            // Still navigate to success even if user creation fails
            navigate(`/register/plans/success?id=${regId}&plan=${encodeURIComponent(pricingName)}`);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment modal dismissed');
            setLoading(false);
            setPaymentError(null);
            // Update registration status to cancelled using stored regId
            supabase.from('event_registrations').update({
              payment_status: 'cancelled'
            }).eq('id', regId);
            navigate(`/register/plans/failure?error=cancelled&plan=${encodeURIComponent(pricingName)}`);
          },
          // Mobile-specific: Handle escape key and back button
          escape: true,
          backdropclose: false,
          confirm_close: true,
        },
      };

      // Create and open Razorpay checkout immediately
      // CRITICAL: This must happen synchronously after options creation for mobile
      const rzp = new window.Razorpay(razorpayOptions);

      // Add error handler for payment failures
      rzp.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        setLoading(false);
        setPaymentError(`Payment failed: ${response.error.description || 'Unknown error'}`);
        // Update registration status
        supabase.from('event_registrations').update({
          payment_status: 'failed',
          payment_error: response.error.description || 'Payment failed'
        }).eq('id', regId);
      });

      // Open the checkout - this should happen as quickly as possible after user click
      rzp.open();

    } catch (e) {
      console.error('Payment error:', e);
      setLoading(false);
      setPaymentError(e.message || 'Payment initialization failed. Please try again.');
      // Don't navigate away on error, show error message instead
    }
  };

  // Render role-specific form fields
  const renderFormFields = () => {
    switch (role?.id) {
      case 'school-admin':
        return (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">School Information</h3>
              <p className="text-sm text-blue-700">Enter your school details</p>
            </div>
            <InputField label="Principal Name" icon={User} placeholder="Dr. John Smith" value={form.principal_name} onChange={e => updateForm('principal_name', e.target.value)} error={errors.principal_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="principal@school.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="School Name" icon={Building} placeholder="ABC Public School (Optional)" value={form.school_name} onChange={e => updateForm('school_name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="School Board/Type" icon={BookOpen} options={SCHOOL_TYPES} value={form.school_type} onChange={e => updateForm('school_type', e.target.value)} />
              <InputField label="Registration Number" icon={Hash} placeholder="Optional" value={form.registration_number} onChange={e => updateForm('registration_number', e.target.value)} />
            </div>
            <InputField label="School Address" icon={MapPin} placeholder="123 Education Street (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Mumbai (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="400001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
            <InputField label="Website" icon={Globe} placeholder="https://school.edu (Optional)" value={form.website} onChange={e => updateForm('website', e.target.value)} />
          </>
        );

      case 'college-admin':
        return (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">College Information</h3>
              <p className="text-sm text-blue-700">Enter your college details</p>
            </div>
            <InputField label="Dean/Principal Name" icon={User} placeholder="Dr. Jane Doe" value={form.dean_name} onChange={e => updateForm('dean_name', e.target.value)} error={errors.dean_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="admin@college.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="College Name" icon={Building} placeholder="ABC College of Engineering (Optional)" value={form.college_name} onChange={e => updateForm('college_name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="College Type" icon={GraduationCap} options={COLLEGE_TYPES} value={form.college_type} onChange={e => updateForm('college_type', e.target.value)} />
              <InputField label="University Affiliation" placeholder="XYZ University (Optional)" value={form.university_affiliation} onChange={e => updateForm('university_affiliation', e.target.value)} />
            </div>
            <InputField label="AICTE/UGC Code" icon={Hash} placeholder="Optional" value={form.aicte_code} onChange={e => updateForm('aicte_code', e.target.value)} />
            <InputField label="College Address" icon={MapPin} placeholder="123 College Road (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Bangalore (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="560001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
            <InputField label="Website" icon={Globe} placeholder="https://college.edu (Optional)" value={form.website} onChange={e => updateForm('website', e.target.value)} />
          </>
        );

      case 'university-admin':
        return (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-1">University Information</h3>
              <p className="text-sm text-blue-700">Enter your university details</p>
            </div>
            <InputField label="Vice Chancellor / Registrar Name" icon={User} placeholder="Prof. John Smith" value={form.vc_name} onChange={e => updateForm('vc_name', e.target.value)} error={errors.vc_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="registrar@university.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="University Name" icon={Building} placeholder="XYZ University (Optional)" value={form.university_name} onChange={e => updateForm('university_name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="University Type" icon={GraduationCap} options={UNIVERSITY_TYPES} value={form.university_type} onChange={e => updateForm('university_type', e.target.value)} />
              <InputField label="UGC Recognition No." icon={Hash} placeholder="Optional" value={form.ugc_number} onChange={e => updateForm('ugc_number', e.target.value)} />
            </div>
            <InputField label="University Address" icon={MapPin} placeholder="University Campus (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Delhi (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="110001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
            <InputField label="Website" icon={Globe} placeholder="https://university.edu (Optional)" value={form.website} onChange={e => updateForm('website', e.target.value)} />
          </>
        );

      case 'school-student':
        return (
          <>
            <InputField label="Full Name" icon={User} placeholder="John Doe" value={form.full_name} onChange={e => updateForm('full_name', e.target.value)} error={errors.full_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="john@email.com" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="School Name" icon={Building} placeholder="ABC Public School (Optional)" value={form.school_name} onChange={e => updateForm('school_name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Class/Grade" icon={BookOpen} placeholder="Class 10 (Optional)" value={form.class_grade} onChange={e => updateForm('class_grade', e.target.value)} />
              <InputField label="Roll Number" placeholder="Optional" value={form.roll_number} onChange={e => updateForm('roll_number', e.target.value)} />
            </div>
            <InputField label="Address" icon={MapPin} placeholder="123 Main Street (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Mumbai (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="400001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
          </>
        );

      case 'college-student':
      case 'university-student':
        return (
          <>
            <InputField label="Full Name" icon={User} placeholder="John Doe" value={form.full_name} onChange={e => updateForm('full_name', e.target.value)} error={errors.full_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="john@email.com" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="Institution Name" icon={Building} placeholder="ABC College/University (Optional)" value={form.institution_name} onChange={e => updateForm('institution_name', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <InputField label="Course" icon={BookOpen} placeholder="B.Tech CSE (Optional)" value={form.course} onChange={e => updateForm('course', e.target.value)} />
              <InputField label="Year" placeholder="3rd Year (Optional)" value={form.year} onChange={e => updateForm('year', e.target.value)} />
              <InputField label="Roll Number" placeholder="Optional" value={form.roll_number} onChange={e => updateForm('roll_number', e.target.value)} />
            </div>
            <InputField label="Address" icon={MapPin} placeholder="123 Main Street (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Bangalore (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="560001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
          </>
        );

      case 'educator':
        return (
          <>
            <InputField label="Full Name" icon={User} placeholder="Dr. Jane Smith" value={form.full_name} onChange={e => updateForm('full_name', e.target.value)} error={errors.full_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="jane@school.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="Institution Name" icon={Building} placeholder="ABC School/College (Optional)" value={form.institution_name} onChange={e => updateForm('institution_name', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <InputField label="Department" icon={BookOpen} placeholder="Mathematics (Optional)" value={form.department} onChange={e => updateForm('department', e.target.value)} />
              <InputField label="Designation" placeholder="Senior Teacher (Optional)" value={form.designation} onChange={e => updateForm('designation', e.target.value)} />
              <InputField label="Employee ID" placeholder="Optional" value={form.employee_id} onChange={e => updateForm('employee_id', e.target.value)} />
            </div>
            <InputField label="Address" icon={MapPin} placeholder="123 Main Street (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Chennai (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="600001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
          </>
        );

      case 'recruiter':
        return (
          <>
            <InputField label="Full Name" icon={User} placeholder="John Smith" value={form.full_name} onChange={e => updateForm('full_name', e.target.value)} error={errors.full_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="john@company.com" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="Company Name" icon={Briefcase} placeholder="ABC Technologies (Optional)" value={form.company_name} onChange={e => updateForm('company_name', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Designation" placeholder="HR Manager (Optional)" value={form.designation} onChange={e => updateForm('designation', e.target.value)} />
              <SelectField label="Industry" icon={Building} options={INDUSTRY_TYPES} value={form.industry} onChange={e => updateForm('industry', e.target.value)} />
            </div>
            <InputField label="Company Address" icon={MapPin} placeholder="123 Business Park (Optional)" value={form.address} onChange={e => updateForm('address', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} />
              <InputField label="City" icon={Building} placeholder="Hyderabad (Optional)" value={form.city} onChange={e => updateForm('city', e.target.value)} />
              <InputField label="Pincode" placeholder="500001 (Optional)" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} />
            </div>
            <InputField label="Company Website" icon={Globe} placeholder="https://company.com (Optional)" value={form.company_website} onChange={e => updateForm('company_website', e.target.value)} />
          </>
        );

      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StepProgress currentStep={step} steps={steps} />

      {isTestPricing() && (
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center text-amber-700 text-sm">🧪 Test Mode</div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pb-32">
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Select Your Role</h2>
              <p className="text-gray-500 mt-1">Choose the option that best describes you</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {ROLES.map(r => <RoleCard key={r.id} role={r} isSelected={role?.id === r.id} onSelect={setRole} />)}
            </div>
          </div>
        )}

        {/* Step 2: Plan/Student Count Selection */}
        {step === 2 && (
          <div>
            {role && <SelectedRoleBadge role={role} onChangeRole={() => setStep(1)} />}
            {isAdminRole ? (
              <>
                {/* ESFE Event Banner - Mobile Responsive with Flip Clock */}
                {isPromoActive && promoEvent?.end_date && (
                  <div className="mb-6 relative overflow-hidden rounded-2xl shadow-lg">
                    {/* Custom responsive styles for flip clock */}
                    <style>{`
                      .flip-clock-container {
                        transform: scale(0.75);
                        transform-origin: center;
                      }
                      @media (min-width: 640px) {
                        .flip-clock-container {
                          transform: scale(1);
                        }
                      }
                      .flip-clock-container .flip-clock__piece {
                        margin: 0 1px;
                      }
                      @media (min-width: 640px) {
                        .flip-clock-container .flip-clock__piece {
                          margin: 0 3px;
                        }
                      }
                      .flip-clock-container .flip-clock__slot {
                        font-size: 9px;
                        font-weight: 600;
                        letter-spacing: 0.05em;
                        color: rgba(255,255,255,0.7);
                        margin-top: 4px;
                      }
                      @media (min-width: 640px) {
                        .flip-clock-container .flip-clock__slot {
                          font-size: 11px;
                          margin-top: 6px;
                        }
                      }
                    `}</style>

                    {/* Base Gradient - Consistent Blue */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgb(30, 78, 216) 0%, rgb(59, 130, 246) 100%)' }} />

                    {/* Subtle Geometric Shapes */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <linearGradient id="shape1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                        </linearGradient>
                      </defs>
                      <ellipse cx="700" cy="30" rx="150" ry="100" fill="url(#shape1)" />
                      <ellipse cx="50" cy="180" rx="120" ry="80" fill="url(#shape1)" />
                    </svg>

                    {/* Content */}
                    <div className="relative z-10 px-3 sm:px-6 py-4 sm:py-5 text-white text-center">
                      {/* Badge + Heading - Stack on mobile, row on desktop */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-emerald-500 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
                          Limited Time
                        </span>
                        <h2 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                          {promoEvent?.banner_text || 'ESFE Event Special Pricing!'}
                        </h2>
                      </div>

                      {/* Flip Clock Countdown */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest font-medium mb-2 sm:mb-3">
                          Offer Ends In
                        </span>
                        <div className="flip-clock-container">
                          <FlipClockCountdown
                            to={new Date(promoEvent.end_date)}
                            labels={['DAYS', 'HOURS', 'MIN', 'SEC']}
                            labelStyle={{
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              color: 'rgba(255,255,255,0.7)',
                              letterSpacing: '0.03em'
                            }}
                            digitBlockStyle={{
                              width: 32,
                              height: 44,
                              fontSize: 22,
                              fontWeight: 700,
                              backgroundColor: '#1e293b',
                              color: '#fff',
                              borderRadius: 5
                            }}
                            dividerStyle={{ color: '#334155', height: 1 }}
                            separatorStyle={{ color: 'rgba(255,255,255,0.5)', size: '4px' }}
                            duration={0.5}
                            onComplete={() => setPromoEvent(null)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {role?.id === 'recruiter' ? 'Select Candidate Capacity' : 'Select Student Count'}
                  </h2>
                  <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                    {role?.id === 'recruiter'
                      ? 'Choose based on your hiring volume'
                      : 'Choose based on your institution size'}
                  </p>
                </div>
                {tiersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8">
                    {/* Tier Group Tabs - Scrollable on mobile */}
                    <div className="flex justify-center overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                      <div className="inline-flex bg-gray-100 rounded-full p-1 sm:p-1.5 gap-0.5 sm:gap-1 shadow-inner min-w-max">
                        {groupedTiers.map((group, index) => {
                          const label = group.max === 99999
                            ? `${group.min}+`
                            : `${group.min}-${group.max}`;
                          const isActive = selectedTierGroupIndex === index;
                          return (
                            <button
                              key={`${group.min}-${group.max}`}
                              onClick={() => setSelectedTierGroupIndex(index)}
                              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                  ? 'bg-white text-blue-600 shadow-md'
                                  : 'text-gray-600 hover:text-gray-900'
                                }`}
                              style={isActive ? { color: 'rgb(30, 78, 216)' } : {}}
                            >
                              <span className="flex items-center gap-1 sm:gap-2">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                {label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Plan Cards for Selected Tier Group - Stack on mobile */}
                    {groupedTiers[selectedTierGroupIndex] && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        {groupedTiers[selectedTierGroupIndex].tiers.map(tier => {
                          const isRecommended = tier.tier_name === 'Professional';
                          const isSelected = studentTier?.id === tier.id;
                          // Only show ESFE pricing if promotion is active
                          const hasEsfePrice = isPromoActive && tier.esfe_active && tier.esfe_price;
                          const displayPrice = hasEsfePrice ? tier.esfe_price : tier.price;

                          // Get tier-specific features
                          const tierFeatures = tier.features || (
                            tier.tier_name === 'Basic-Cost'
                              ? [`${groupedTiers[selectedTierGroupIndex].max === 99999 ? '2000+' : groupedTiers[selectedTierGroupIndex].min + '-' + groupedTiers[selectedTierGroupIndex].max} students`, 'Basic analytics', 'Email support', 'Multi-college support']
                              : tier.tier_name === 'Professional'
                                ? [`${groupedTiers[selectedTierGroupIndex].max === 99999 ? '2000+' : groupedTiers[selectedTierGroupIndex].min + '-' + groupedTiers[selectedTierGroupIndex].max} students`, 'Advanced analytics', 'Priority support', 'All features']
                                : [`${groupedTiers[selectedTierGroupIndex].max === 99999 ? '2000+' : groupedTiers[selectedTierGroupIndex].min + '-' + groupedTiers[selectedTierGroupIndex].max} students`, 'Enterprise analytics', '24/7 support', 'All features']
                          );

                          return (
                            <button
                              key={tier.id}
                              onClick={() => setStudentTier(tier)}
                              className={`relative flex flex-col p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 text-center transition-all duration-300 ${isSelected
                                  ? 'border-blue-500 bg-blue-50/50 shadow-xl shadow-blue-500/15 sm:scale-[1.02]'
                                  : isRecommended
                                    ? 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-lg shadow-md'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }`}
                            >
                              {/* Recommended Badge */}
                              {isRecommended && (
                                <div
                                  className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 text-white text-[10px] sm:text-xs font-semibold rounded-full shadow-md"
                                  style={{ backgroundColor: 'rgb(30, 78, 216)' }}
                                >
                                  Recommended
                                </div>
                              )}

                              {/* Plan Name */}
                              <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-4 ${isRecommended ? 'text-blue-600' : 'text-gray-800'}`}>
                                {tier.tier_name}
                              </h3>

                              {/* ESFE Special Badge */}
                              {hasEsfePrice && (
                                <div className="mb-2 sm:mb-3">
                                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-500 text-white text-[10px] sm:text-xs font-bold rounded-full">
                                    <span>🎉</span> ESFE Special
                                  </span>
                                </div>
                              )}

                              {/* Price Section */}
                              <div className="mb-3 sm:mb-4">
                                {/* Original price with strikethrough when ESFE is active */}
                                {hasEsfePrice && (
                                  <div className="text-base sm:text-lg text-gray-400 line-through mb-1">
                                    ₹{parseFloat(tier.price || 0).toLocaleString()}
                                  </div>
                                )}
                                {/* Display price - ESFE price when active, regular price otherwise */}
                                <div className={`text-3xl sm:text-5xl font-bold tracking-tight ${hasEsfePrice ? 'text-emerald-600' : 'text-gray-900'}`}>
                                  ₹{hasEsfePrice ? parseFloat(tier.esfe_price || 0).toLocaleString() : parseFloat(tier.price || 0).toLocaleString()}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 mt-1">per {role?.id === 'recruiter' ? 'candidate' : 'student'}</div>
                                {/* Savings badge */}
                                {hasEsfePrice && (
                                  <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-white bg-emerald-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                                      Save {tier.esfe_discount_percent}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Features - Hidden on mobile for compact view */}
                              <div className="hidden sm:block space-y-3 mb-6 text-left flex-grow">
                                {tierFeatures.slice(0, 4).map((feature, i) => (
                                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Select Button */}
                              <div
                                className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all ${isSelected
                                    ? 'text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                style={isSelected ? { backgroundColor: 'rgb(30, 78, 216)' } : {}}
                              >
                                {isSelected ? (
                                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4" /> Selected
                                  </span>
                                ) : (
                                  'Select Plan'
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : isStudentRole ? (
              <>
                {/* ESFE Event Banner for Students */}
                {isPromoActive && promoEvent?.end_date && (
                  <div className="mb-6 relative overflow-hidden rounded-2xl shadow-lg">
                    <style>{`
                      .flip-clock-container-student {
                        transform: scale(0.75);
                        transform-origin: center;
                      }
                      @media (min-width: 640px) {
                        .flip-clock-container-student {
                          transform: scale(1);
                        }
                      }
                    `}</style>

                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgb(30, 78, 216) 0%, rgb(59, 130, 246) 100%)' }} />

                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <linearGradient id="shape1-student" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                        </linearGradient>
                      </defs>
                      <ellipse cx="700" cy="30" rx="150" ry="100" fill="url(#shape1-student)" />
                      <ellipse cx="50" cy="180" rx="120" ry="80" fill="url(#shape1-student)" />
                    </svg>

                    <div className="relative z-10 px-3 sm:px-6 py-4 sm:py-5 text-white text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-emerald-500 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
                          Limited Time
                        </span>
                        <h2 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                          {promoEvent?.banner_text || 'ESFE Event Special Pricing!'}
                        </h2>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] sm:text-[11px] text-white/70 uppercase tracking-widest font-medium mb-2 sm:mb-3">
                          Offer Ends In
                        </span>
                        <div className="flip-clock-container-student">
                          <FlipClockCountdown
                            to={new Date(promoEvent.end_date)}
                            labels={['DAYS', 'HOURS', 'MIN', 'SEC']}
                            labelStyle={{
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              color: 'rgba(255,255,255,0.7)',
                              letterSpacing: '0.03em'
                            }}
                            digitBlockStyle={{
                              width: 32,
                              height: 44,
                              fontSize: 22,
                              fontWeight: 700,
                              backgroundColor: '#1e293b',
                              color: '#fff',
                              borderRadius: 5
                            }}
                            dividerStyle={{ color: '#334155', height: 1 }}
                            separatorStyle={{ color: 'rgba(255,255,255,0.5)', size: '4px' }}
                            duration={0.5}
                            onComplete={() => setPromoEvent(null)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{getStepContent(role?.id).step2.heading}</h2>
                  <p className="text-gray-500 mt-1">{getStepContent(role?.id).step2.subtitle}</p>
                </div>

                {tiersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {studentTiers.map(tier => (
                      <StudentPlanCard
                        key={tier.id}
                        plan={tier}
                        isSelected={studentTier?.id === tier.id}
                        onSelect={setStudentTier}
                        isPromoActive={isPromoActive}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{getStepContent(role?.id).step2.heading}</h2>
                  <p className="text-gray-500 mt-1">{getStepContent(role?.id).step2.subtitle}</p>
                </div>
                <div className="space-y-4">
                  {plans.map(p => <PlanCard key={p.id} plan={p} isSelected={plan?.id === p.id} onSelect={setPlan} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Role-Specific Details */}
        {step === 3 && (
          <div>
            {role && <SelectedRoleBadge role={role} onChangeRole={() => setStep(1)} />}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAdminRole ? 'Institution Details' : getStepContent(role?.id).step3.heading}
              </h2>
              <p className="text-gray-500 mt-1">
                {isAdminRole ? 'Enter your institution information' : getStepContent(role?.id).step3.subtitle}
              </p>
            </div>

            {/* Form Fields First */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 mb-6">
              {renderFormFields()}
            </div>

            {/* Student Count Input - Modern Compact Design */}
            {isAdminRole && studentTier && (() => {
              const hasEsfePrice = isPromoActive && studentTier.esfe_active && studentTier.esfe_price;
              const pricePerStudent = hasEsfePrice ? parseFloat(studentTier.esfe_price) : parseFloat(studentTier.price);
              const originalPricePerStudent = parseFloat(studentTier.price);
              const count = parseInt(studentCount) || 0;
              const totalPrice = Math.round(pricePerStudent * count);
              const originalTotalPrice = Math.round(originalPricePerStudent * count);

              const minStudents = studentTier.min_students;
              const maxStudents = studentTier.max_students;
              const isUnlimited = maxStudents === 99999;
              const isBelowMin = count > 0 && count < minStudents;
              const isAboveMax = count > 0 && !isUnlimited && count > maxStudents;
              const isValidCount = count >= minStudents && (isUnlimited || count <= maxStudents);
              const hasError = count > 0 && !isValidCount;
              const capacityLabel = role?.id === 'recruiter' ? 'candidates' : 'students';

              return (
                <div className={`rounded-2xl border-2 transition-all duration-300 ${hasError
                    ? 'bg-red-50 border-red-200'
                    : isValidCount && count > 0
                      ? hasEsfePrice ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-100'
                  }`}>
                  {/* Header with inline range info */}
                  <div className="px-4 sm:px-5 py-3 border-b border-gray-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${hasError ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <Users className={`w-4 h-4 ${hasError ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          Number of {role?.id === 'recruiter' ? 'Candidates' : 'Students'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className={`px-2 py-0.5 rounded-md ${isBelowMin ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {minStudents.toLocaleString()}
                        </span>
                        <span className="text-gray-400">—</span>
                        <span className={`px-2 py-0.5 rounded-md ${isAboveMax ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {isUnlimited ? '∞' : maxStudents.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Input and Result Row */}
                  <div className="px-4 sm:px-5 py-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Input */}
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={studentCount}
                          onChange={(e) => setStudentCount(e.target.value)}
                          placeholder="Enter count"
                          min={minStudents}
                          max={isUnlimited ? undefined : maxStudents}
                          className={`w-full h-12 px-4 text-lg font-bold rounded-xl border-2 outline-none transition-all ${hasError
                              ? 'border-red-300 bg-white text-red-600 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 bg-white text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                            }`}
                        />
                        {hasError && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-red-500 text-lg">⚠</span>
                          </div>
                        )}
                      </div>

                      {/* Multiplication sign and price */}
                      {count > 0 && (
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                          <span className="text-gray-400 text-lg">×</span>
                          <div className="text-center">
                            {hasEsfePrice && (
                              <div className="text-xs text-gray-400 line-through">₹{originalPricePerStudent.toLocaleString()}</div>
                            )}
                            <div className={`font-bold ${hasEsfePrice ? 'text-emerald-600' : 'text-gray-700'}`}>
                              ₹{pricePerStudent.toLocaleString()}
                            </div>
                          </div>
                          <span className="text-gray-400 text-lg">=</span>

                          {/* Total */}
                          <div className={`px-4 py-2 rounded-xl font-bold text-lg sm:text-xl ${hasError
                              ? 'bg-red-100 text-red-600'
                              : hasEsfePrice
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            ₹{totalPrice.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Error or Success Message */}
                    {count > 0 && (
                      <div className={`mt-3 text-center text-sm font-medium ${hasError ? 'text-red-600' : hasEsfePrice ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                        {hasError ? (
                          isBelowMin
                            ? `⚠ Need at least ${minStudents.toLocaleString()} ${capacityLabel}`
                            : `⚠ Maximum ${maxStudents.toLocaleString()} ${capacityLabel} for this plan`
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span>✓ {count.toLocaleString()} {capacityLabel}</span>
                            {hasEsfePrice && (
                              <span className="inline-flex items-center gap-1 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                                Save ₹{(originalTotalPrice - totalPrice).toLocaleString()}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 4: Order Summary */}
        {step === 4 && currentPricing && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
              <p className="text-gray-500 mt-1">Review before payment</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="font-semibold text-gray-900">{currentPricing.name}</div>
                  <div className="text-sm text-gray-500">{role?.label}</div>
                  {isAdminRole && studentTier && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                      <Users className="w-4 h-4" />
                      <span>{currentPricing.studentCount?.toLocaleString()} {currentPricing.capacityLabel}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {isAdminRole && currentPricing.pricePerStudent ? (
                    // Admin role pricing breakdown
                    <div className="space-y-1">
                      {/* Show original price per student with strikethrough when ESFE active */}
                      {currentPricing.isEsfe && currentPricing.originalPricePerStudent && (
                        <div className="text-sm text-gray-400 line-through">
                          ₹{currentPricing.originalPricePerStudent.toLocaleString()} per {role?.id === 'recruiter' ? 'candidate' : 'student'}
                        </div>
                      )}
                      <div className={`text-sm ${currentPricing.isEsfe ? 'text-emerald-600 font-semibold' : 'text-gray-600'}`}>
                        ₹{currentPricing.pricePerStudent.toLocaleString()} <span className={currentPricing.isEsfe ? 'text-emerald-500' : 'text-gray-400'}>per {role?.id === 'recruiter' ? 'candidate' : 'student'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        × {currentPricing.studentCount?.toLocaleString()} {currentPricing.capacityLabel}
                      </div>
                      {currentPricing.isEsfe && currentPricing.originalPrice && (
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <span className="text-sm text-gray-400 line-through">₹{currentPricing.originalPrice.toLocaleString()}</span>
                          <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
                            Save {currentPricing.discountPercent}%
                          </span>
                        </div>
                      )}
                      <div className={`text-2xl font-bold mt-1 ${currentPricing.isEsfe ? 'text-emerald-600' : 'text-gray-900'}`}>
                        = ₹{currentPricing.price.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    // Non-admin role pricing
                    <>
                      {currentPricing.isEsfe && currentPricing.originalPrice && (
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-sm text-gray-400 line-through">₹{currentPricing.originalPrice.toLocaleString()}</span>
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            {currentPricing.discountPercent}% OFF
                          </span>
                        </div>
                      )}
                      <div className={`text-2xl font-bold ${currentPricing.isEsfe ? 'text-green-600' : 'text-gray-900'}`}>
                        ₹{currentPricing.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">per {currentPricing.duration}</div>
                    </>
                  )}
                </div>
              </div>

              {/* ESFE Special Badge in Order Summary */}
              {currentPricing.isEsfe && (
                <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-orange-700">
                    <span>🎉</span>
                    <span className="font-semibold text-sm">ESFE Event Special Pricing Applied!</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{getDisplayName()}</span></div>
                {getInstitutionName() && (
                  <div className="flex justify-between"><span className="text-gray-500">{isAdminRole ? 'Institution' : role?.id === 'recruiter' ? 'Company' : 'Institution'}</span><span className="font-medium">{getInstitutionName()}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{form.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{form.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{form.city}, {form.state}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                {isAdminRole && currentPricing.pricePerStudent && (
                  <div className={`mb-3 p-3 rounded-xl ${currentPricing.isEsfe ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                    <div className="text-sm text-center">
                      {/* Show original calculation with strikethrough when ESFE active */}
                      {currentPricing.isEsfe && currentPricing.originalPricePerStudent && (
                        <div className="text-gray-400 line-through mb-1">
                          ₹{currentPricing.originalPricePerStudent.toLocaleString()} × {currentPricing.studentCount?.toLocaleString()} = ₹{currentPricing.originalPrice?.toLocaleString()}
                        </div>
                      )}
                      {/* Current calculation */}
                      <div className={currentPricing.isEsfe ? 'text-emerald-700' : 'text-gray-600'}>
                        <span className="font-medium">₹{currentPricing.pricePerStudent.toLocaleString()}</span>
                        <span className={currentPricing.isEsfe ? 'text-emerald-500' : 'text-gray-400'}> × </span>
                        <span className="font-medium">{currentPricing.studentCount?.toLocaleString()} {currentPricing.capacityLabel}</span>
                        <span className={currentPricing.isEsfe ? 'text-emerald-500' : 'text-gray-400'}> = </span>
                        <span className={`font-bold ${currentPricing.isEsfe ? 'text-emerald-600' : 'text-blue-600'}`}>₹{currentPricing.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    {currentPricing.isEsfe && currentPricing.originalPrice && (
                      <div className="text-xs text-gray-400 line-through mb-0.5">₹{currentPricing.originalPrice.toLocaleString()}</div>
                    )}
                    <span className={`text-2xl font-bold ${currentPricing.isEsfe ? 'text-emerald-600' : 'text-blue-600'}`}>
                      ₹{currentPricing.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: Shield, label: 'Secure' }, { icon: Zap, label: 'Instant' }, { icon: Award, label: 'Support' }].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                  <Icon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm sm:text-base hover:bg-gray-50">
              Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={nextStep} disabled={!canProceed()} className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-blue-600 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button onClick={handlePayment} disabled={loading || !currentPricing || !razorpayReady} className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-blue-600 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-blue-700 disabled:bg-blue-400">
              {loading ? (
                <><div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              ) : !razorpayReady ? (
                <><div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</>
              ) : (
                <><CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />Pay ₹{currentPricing?.price.toLocaleString()}</>
              )}
            </button>
          )}
        </div>
        {/* Payment Error Display */}
        {paymentError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{paymentError}</p>
            <button
              onClick={() => setPaymentError(null)}
              className="mt-2 w-full text-xs text-red-500 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(EventSales);
