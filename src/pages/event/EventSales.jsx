/**
 * Event Sales - Multi-Step Form with Progress Indicator
 * Role-specific detail forms for different user types
 */

import { useState, useMemo, memo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Check, User, Mail, Phone, MapPin, Building, CreditCard, ChevronRight, 
  Shield, Zap, Award, Users, GraduationCap, Briefcase, Globe, Hash, BookOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getEntityContent } from '../../utils/getEntityContent';
import { isTestPricing } from '../../config/payment';
import Header from '../../layouts/Header';

const RAZORPAY_KEY_ID = import.meta.env.TEST_VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID;

// Admin role types
const ADMIN_ROLES = ['school-admin', 'college-admin', 'university-admin'];

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

// Load Razorpay
const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

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

// Student Tier Card
const StudentTierCard = memo(({ tier, isSelected, onSelect }) => (
  <button onClick={() => onSelect(tier)} className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 relative ${isSelected ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl shadow-blue-500/10' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'}`}>
    {tier.is_recommended && <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full">Recommended</div>}
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-bold text-gray-900">{tier.min_students} - {tier.max_students} Students</span>
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
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isAdminRole = role && ADMIN_ROLES.includes(role.id);

  // Dynamic steps
  const steps = useMemo(() => {
    if (isAdminRole) {
      return [
        { id: 1, title: 'Role', icon: User },
        { id: 2, title: 'Students', icon: Users },
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
  }, [isAdminRole]);

  const { plans } = useMemo(() => role && !isAdminRole ? getEntityContent(role.type) : { plans: [] }, [role, isAdminRole]);

  // Fetch student tiers for admin roles
  useEffect(() => {
    const fetchTiers = async () => {
      if (!role || !isAdminRole) return;
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
  }, [role, isAdminRole]);

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
    }
  }, [role?.id]);

  const updateForm = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  // Validate form based on role
  const validateForm = () => {
    const e = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^\d{10}$/;

    // Common validations
    if (!form.email?.trim() || !emailRegex.test(form.email)) e.email = 'Valid email required';
    if (!form.phone?.trim() || !phoneRegex.test(form.phone.replace(/\D/g, ''))) e.phone = 'Valid 10-digit phone required';
    if (!form.address?.trim()) e.address = 'Address required';
    if (!form.city?.trim()) e.city = 'City required';
    if (!form.state) e.state = 'State required';
    if (!form.pincode?.trim() || form.pincode.length !== 6) e.pincode = 'Valid 6-digit pincode required';

    // Role-specific validations
    switch (role?.id) {
      case 'school-admin':
        if (!form.school_name?.trim()) e.school_name = 'School name required';
        if (!form.school_type) e.school_type = 'School type required';
        if (!form.principal_name?.trim()) e.principal_name = 'Principal name required';
        break;
      case 'college-admin':
        if (!form.college_name?.trim()) e.college_name = 'College name required';
        if (!form.college_type) e.college_type = 'College type required';
        if (!form.dean_name?.trim()) e.dean_name = 'Dean/Principal name required';
        break;
      case 'university-admin':
        if (!form.university_name?.trim()) e.university_name = 'University name required';
        if (!form.university_type) e.university_type = 'University type required';
        if (!form.vc_name?.trim()) e.vc_name = 'VC/Registrar name required';
        break;
      case 'school-student':
        if (!form.full_name?.trim()) e.full_name = 'Name required';
        if (!form.school_name?.trim()) e.school_name = 'School name required';
        if (!form.class_grade?.trim()) e.class_grade = 'Class required';
        break;
      case 'college-student':
      case 'university-student':
        if (!form.full_name?.trim()) e.full_name = 'Name required';
        if (!form.institution_name?.trim()) e.institution_name = 'Institution name required';
        if (!form.course?.trim()) e.course = 'Course required';
        break;
      case 'educator':
        if (!form.full_name?.trim()) e.full_name = 'Name required';
        if (!form.institution_name?.trim()) e.institution_name = 'Institution name required';
        if (!form.designation?.trim()) e.designation = 'Designation required';
        break;
      case 'recruiter':
        if (!form.full_name?.trim()) e.full_name = 'Name required';
        if (!form.company_name?.trim()) e.company_name = 'Company name required';
        if (!form.designation?.trim()) e.designation = 'Designation required';
        break;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canProceed = () => {
    if (step === 1) return !!role;
    if (step === 2) return isAdminRole ? !!studentTier : !!plan;
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
    if (isAdminRole && studentTier) {
      return { name: `${studentTier.tier_name} (${studentTier.min_students}-${studentTier.max_students} students)`, price: studentTier.price, duration: studentTier.duration };
    }
    if (plan) return { name: plan.name, price: parseInt(plan.price), duration: plan.duration };
    return null;
  }, [isAdminRole, studentTier, plan]);

  const handlePayment = async () => {
    if (loading || !currentPricing) return;
    setLoading(true);
    try {
      await loadRazorpay();
      
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
      }

      const { data: reg, error: err } = await supabase.from('event_registrations').insert(registrationData).select().single();
      if (err) throw err;

      new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: currentPricing.price * 100,
        currency: 'INR',
        name: 'Skill Passport',
        description: currentPricing.name,
        prefill: { name: getDisplayName(), email: form.email, contact: form.phone },
        theme: { color: '#3B82F6' },
        handler: async (res) => {
          // Update payment status
          await supabase.from('event_registrations').update({ 
            razorpay_payment_id: res.razorpay_payment_id, 
            payment_status: 'completed' 
          }).eq('id', reg.id);

          // Create user account after successful payment
          try {
            const displayName = getDisplayName();
            const nameParts = displayName?.split(' ') || ['User'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            const userResponse = await supabase.functions.invoke('create-event-user', {
              body: {
                email: form.email,
                firstName,
                lastName,
                role: role.id,
                phone: form.phone,
                registrationId: reg.id,
                metadata: {
                  institution: getInstitutionName(),
                  plan: currentPricing.name,
                  eventName,
                  ...roleDetails
                }
              }
            });

            if (userResponse.error) {
              console.error('User creation error:', userResponse.error);
            }

            // Navigate with temp password if available
            const tempPassword = userResponse.data?.temporaryPassword;
            navigate(`/register/plans/success?id=${reg.id}&plan=${encodeURIComponent(currentPricing.name)}${tempPassword ? `&tp=${encodeURIComponent(tempPassword)}` : ''}`);
          } catch (userErr) {
            console.error('User creation failed:', userErr);
            // Still navigate to success even if user creation fails
            navigate(`/register/plans/success?id=${reg.id}&plan=${encodeURIComponent(currentPricing.name)}`);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }).open();
    } catch (e) {
      console.error('Payment error:', e);
      setLoading(false);
      alert('Payment failed. Please try again.');
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
            <InputField label="School Name" icon={Building} placeholder="ABC Public School" value={form.school_name} onChange={e => updateForm('school_name', e.target.value)} error={errors.school_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="School Board/Type" icon={BookOpen} options={SCHOOL_TYPES} value={form.school_type} onChange={e => updateForm('school_type', e.target.value)} error={errors.school_type} required />
              <InputField label="Registration Number" icon={Hash} placeholder="Optional" value={form.registration_number} onChange={e => updateForm('registration_number', e.target.value)} />
            </div>
            <InputField label="Principal Name" icon={User} placeholder="Dr. John Smith" value={form.principal_name} onChange={e => updateForm('principal_name', e.target.value)} error={errors.principal_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="principal@school.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="School Address" icon={MapPin} placeholder="123 Education Street" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Mumbai" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="400001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            <InputField label="College Name" icon={Building} placeholder="ABC College of Engineering" value={form.college_name} onChange={e => updateForm('college_name', e.target.value)} error={errors.college_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="College Type" icon={GraduationCap} options={COLLEGE_TYPES} value={form.college_type} onChange={e => updateForm('college_type', e.target.value)} error={errors.college_type} required />
              <InputField label="University Affiliation" placeholder="XYZ University" value={form.university_affiliation} onChange={e => updateForm('university_affiliation', e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Dean/Principal Name" icon={User} placeholder="Dr. Jane Doe" value={form.dean_name} onChange={e => updateForm('dean_name', e.target.value)} error={errors.dean_name} required />
              <InputField label="AICTE/UGC Code" icon={Hash} placeholder="Optional" value={form.aicte_code} onChange={e => updateForm('aicte_code', e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="admin@college.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="College Address" icon={MapPin} placeholder="123 College Road" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Bangalore" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="560001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            <InputField label="University Name" icon={Building} placeholder="XYZ University" value={form.university_name} onChange={e => updateForm('university_name', e.target.value)} error={errors.university_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="University Type" icon={GraduationCap} options={UNIVERSITY_TYPES} value={form.university_type} onChange={e => updateForm('university_type', e.target.value)} error={errors.university_type} required />
              <InputField label="UGC Recognition No." icon={Hash} placeholder="Optional" value={form.ugc_number} onChange={e => updateForm('ugc_number', e.target.value)} />
            </div>
            <InputField label="Vice Chancellor / Registrar Name" icon={User} placeholder="Prof. John Smith" value={form.vc_name} onChange={e => updateForm('vc_name', e.target.value)} error={errors.vc_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Email" icon={Mail} type="email" placeholder="registrar@university.edu" value={form.email} onChange={e => updateForm('email', e.target.value)} error={errors.email} required />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="9876543210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} error={errors.phone} required />
            </div>
            <InputField label="University Address" icon={MapPin} placeholder="University Campus" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Delhi" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="110001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            <InputField label="School Name" icon={Building} placeholder="ABC Public School" value={form.school_name} onChange={e => updateForm('school_name', e.target.value)} error={errors.school_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Class/Grade" icon={BookOpen} placeholder="Class 10" value={form.class_grade} onChange={e => updateForm('class_grade', e.target.value)} error={errors.class_grade} required />
              <InputField label="Roll Number" placeholder="Optional" value={form.roll_number} onChange={e => updateForm('roll_number', e.target.value)} />
            </div>
            <InputField label="Address" icon={MapPin} placeholder="123 Main Street" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Mumbai" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="400001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            <InputField label="Institution Name" icon={Building} placeholder="ABC College/University" value={form.institution_name} onChange={e => updateForm('institution_name', e.target.value)} error={errors.institution_name} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <InputField label="Course" icon={BookOpen} placeholder="B.Tech CSE" value={form.course} onChange={e => updateForm('course', e.target.value)} error={errors.course} required />
              <InputField label="Year" placeholder="3rd Year" value={form.year} onChange={e => updateForm('year', e.target.value)} />
              <InputField label="Roll Number" placeholder="Optional" value={form.roll_number} onChange={e => updateForm('roll_number', e.target.value)} />
            </div>
            <InputField label="Address" icon={MapPin} placeholder="123 Main Street" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Bangalore" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="560001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            <InputField label="Institution Name" icon={Building} placeholder="ABC School/College" value={form.institution_name} onChange={e => updateForm('institution_name', e.target.value)} error={errors.institution_name} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <InputField label="Department" icon={BookOpen} placeholder="Mathematics" value={form.department} onChange={e => updateForm('department', e.target.value)} />
              <InputField label="Designation" placeholder="Senior Teacher" value={form.designation} onChange={e => updateForm('designation', e.target.value)} error={errors.designation} required />
              <InputField label="Employee ID" placeholder="Optional" value={form.employee_id} onChange={e => updateForm('employee_id', e.target.value)} />
            </div>
            <InputField label="Address" icon={MapPin} placeholder="123 Main Street" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Chennai" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="600001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            <InputField label="Company Name" icon={Briefcase} placeholder="ABC Technologies" value={form.company_name} onChange={e => updateForm('company_name', e.target.value)} error={errors.company_name} required />
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Designation" placeholder="HR Manager" value={form.designation} onChange={e => updateForm('designation', e.target.value)} error={errors.designation} required />
              <SelectField label="Industry" icon={Building} options={INDUSTRY_TYPES} value={form.industry} onChange={e => updateForm('industry', e.target.value)} />
            </div>
            <InputField label="Company Address" icon={MapPin} placeholder="123 Business Park" value={form.address} onChange={e => updateForm('address', e.target.value)} error={errors.address} required />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="State" options={STATES} value={form.state} onChange={e => updateForm('state', e.target.value)} error={errors.state} required />
              <InputField label="City" icon={Building} placeholder="Hyderabad" value={form.city} onChange={e => updateForm('city', e.target.value)} error={errors.city} required />
              <InputField label="Pincode" placeholder="500001" value={form.pincode} onChange={e => updateForm('pincode', e.target.value)} error={errors.pincode} required />
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
            {isAdminRole ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Select Student Count</h2>
                  <p className="text-gray-500 mt-1">Choose based on your institution size</p>
                </div>
                {tiersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentTiers.map(tier => (
                      <StudentTierCard key={tier.id} tier={tier} isSelected={studentTier?.id === tier.id} onSelect={setStudentTier} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                  <p className="text-gray-500 mt-1">Select the plan that fits your needs</p>
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAdminRole ? 'Institution Details' : 'Your Details'}
              </h2>
              <p className="text-gray-500 mt-1">
                {isAdminRole ? 'Enter your institution information' : 'Enter your information'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              {renderFormFields()}
            </div>
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
                      <span>{studentTier.min_students} - {studentTier.max_students} students</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">₹{currentPricing.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">per {currentPricing.duration}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{getDisplayName()}</span></div>
                {getInstitutionName() && (
                  <div className="flex justify-between"><span className="text-gray-500">{isAdminRole ? 'Institution' : role?.id === 'recruiter' ? 'Company' : 'Institution'}</span><span className="font-medium">{getInstitutionName()}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{form.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{form.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{form.city}, {form.state}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">₹{currentPricing.price.toLocaleString()}</span>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">
              Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={nextStep} disabled={!canProceed()} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handlePayment} disabled={loading || !currentPricing} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-400">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              ) : (
                <><CreditCard className="w-5 h-5" />Pay ₹{currentPricing?.price.toLocaleString()}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(EventSales);
