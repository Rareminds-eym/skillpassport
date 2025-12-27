import {
    AlertCircle,
    Award,
    BookOpen,
    Briefcase,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Landmark,
    Library,
    Lightbulb,
    Link as LinkIcon,
    Loader,
    PlusCircle,
    Sparkles,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// Platform icon components
const PlatformIcon = ({ platformId, className = "w-8 h-8" }) => {
  const iconProps = { className };
  switch (platformId) {
    case 'coursera':
      return <GraduationCap {...iconProps} />;
    case 'linkedin':
      return <Briefcase {...iconProps} />;
    case 'udemy':
      return <BookOpen {...iconProps} />;
    case 'edx':
      return <Landmark {...iconProps} />;
    case 'pluralsight':
      return <Lightbulb {...iconProps} />;
    case 'other':
      return <PlusCircle {...iconProps} />;
    default:
      return <Library {...iconProps} />;
  }
};

// Platform configurations
const PLATFORMS = [
  {
    id: 'coursera',
    name: 'Coursera',
    bgColor: 'bg-[#0056D2]/10',
    hoverBg: 'hover:bg-[#0056D2]/20',
    borderColor: 'border-[#0056D2]',
    iconColor: 'text-[#0056D2]',
    urlPattern: /coursera\.org/i,
    verifyUrlTemplate: (certId) => `https://www.coursera.org/verify/${certId}`
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Learning',
    bgColor: 'bg-[#0A66C2]/10',
    hoverBg: 'hover:bg-[#0A66C2]/20',
    borderColor: 'border-[#0A66C2]',
    iconColor: 'text-[#0A66C2]',
    urlPattern: /linkedin\.com\/learning/i,
    verifyUrlTemplate: null
  },
  {
    id: 'udemy',
    name: 'Udemy',
    bgColor: 'bg-[#A435F0]/10',
    hoverBg: 'hover:bg-[#A435F0]/20',
    borderColor: 'border-[#A435F0]',
    iconColor: 'text-[#A435F0]',
    urlPattern: /udemy\.com/i,
    verifyUrlTemplate: (certId) => `https://www.udemy.com/certificate/${certId}`
  },
  {
    id: 'edx',
    name: 'edX',
    bgColor: 'bg-[#02262B]/10',
    hoverBg: 'hover:bg-[#02262B]/20',
    borderColor: 'border-[#02262B]',
    iconColor: 'text-[#02262B]',
    urlPattern: /edx\.org/i,
    verifyUrlTemplate: (certId) => `https://courses.edx.org/certificates/${certId}`
  },
  {
    id: 'pluralsight',
    name: 'Pluralsight',
    bgColor: 'bg-[#F15B2A]/10',
    hoverBg: 'hover:bg-[#F15B2A]/20',
    borderColor: 'border-[#F15B2A]',
    iconColor: 'text-[#F15B2A]',
    urlPattern: /pluralsight\.com/i,
    verifyUrlTemplate: null
  },
  {
    id: 'other',
    name: 'Other Platform',
    bgColor: 'bg-gray-100',
    hoverBg: 'hover:bg-gray-200',
    borderColor: 'border-gray-400',
    iconColor: 'text-gray-500',
    urlPattern: null,
    verifyUrlTemplate: null
  }
];

const CATEGORIES = [
  'Technology', 'Business', 'Data Science', 'Design', 'Marketing',
  'Finance', 'Healthcare', 'Personal Development', 'Other'
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' }
];


export default function AddLearningCourseModal({ isOpen, onClose, studentId, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [formData, setFormData] = useState({
    certificate_url: '', title: '', organization: '', instructor: '',
    completion_date: '', certificate_id: '', description: '', category: '', difficulty: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [skillTags, setSkillTags] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const verificationStatusRef = useRef(null);
  const errorRef = useRef(null);
  const totalSteps = 5;

  useEffect(() => {
    if (verificationStatus && verificationStatusRef.current) {
      verificationStatusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [verificationStatus]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const detectPlatformFromUrl = (url) => {
    for (const platform of PLATFORMS) {
      if (platform.urlPattern && platform.urlPattern.test(url)) return platform;
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'certificate_url' && value) {
      const detected = detectPlatformFromUrl(value);
      if (detected && !selectedPlatform) setSelectedPlatform(detected);
    }
    if (name === 'certificate_url' || name === 'certificate_id') {
      setVerificationStatus(null);
      setExtractionSuccess(false);
    }
  };

  const handleAddSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skillTags.includes(trimmed)) {
      setSkillTags(prev => [...prev, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillTags(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };


  const verifyCertificateUrl = async (urlToVerify = null) => {
    const certificateUrlToCheck = urlToVerify || formData.certificate_url;
    if (!certificateUrlToCheck) {
      setError('Please enter a certificate URL first');
      return false;
    }

    setExtracting(true);
    setError('');

    try {
      let certificateUrl = certificateUrlToCheck;

      if (certificateUrl.includes('ude.my/')) {
        const certId = certificateUrl.split('ude.my/')[1];
        certificateUrl = `https://www.udemy.com/certificate/${certId}`;
        if (!urlToVerify) setFormData(prev => ({ ...prev, certificate_url: certificateUrl }));
      }

      if (selectedPlatform && selectedPlatform.id !== 'other' && selectedPlatform.urlPattern) {
        if (!selectedPlatform.urlPattern.test(certificateUrl)) {
          const detectedPlatform = PLATFORMS.find(p => p.urlPattern && p.urlPattern.test(certificateUrl));
          if (detectedPlatform) {
            setError(`This appears to be a ${detectedPlatform.name} certificate, but you selected ${selectedPlatform.name}.`);
          } else {
            setError(`This URL doesn't appear to be from ${selectedPlatform.name}.`);
          }
          setVerificationStatus('failed');
          return false;
        }
      }

      const workerUrl = import.meta.env.VITE_CLOUDFLARE_CERTIFICATE_WORKER_URL || 'https://fetch-certificate.rareminds.workers.dev';

      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: certificateUrl })
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          throw new Error('Worker endpoint not found.');
        }
        throw new Error('Invalid response from verification service');
      }

      if (!response.ok || !result?.success) {
        const errorMsg = result?.error || 'Certificate verification failed';
        setError(errorMsg.includes('404') ? 'Certificate not found. Please verify the URL or ID.' : errorMsg);
        setVerificationStatus('failed');
        return false;
      }

      const platformName = selectedPlatform?.name || '';
      if (platformName && platformName !== 'Other Platform') {
        setFormData(prev => ({ ...prev, organization: platformName }));
      }

      setVerificationStatus('success');
      setExtractionSuccess(true);
      return true;
    } catch (err) {
      setError(`Certificate verification failed: ${err.message}`);
      setVerificationStatus('failed');
      return false;
    } finally {
      setExtracting(false);
    }
  };


  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const { data: training, error: trainingError } = await supabase
        .from('trainings')
        .insert({
          student_id: studentId,
          title: formData.title,
          organization: formData.organization || selectedPlatform?.name,
          start_date: null,
          end_date: formData.completion_date || null,
          status: 'completed',
          completed_modules: 0,
          total_modules: 0,
          hours_spent: 0,
          description: formData.description,
          approval_status: 'approved',
          source: 'external_course'
        })
        .select()
        .single();

      if (trainingError) throw trainingError;

      if (formData.certificate_url) {
        await supabase.from('certificates').insert({
          student_id: studentId,
          training_id: training.id,
          title: formData.title,
          issuer: formData.organization || selectedPlatform?.name,
          issued_on: formData.completion_date || new Date().toISOString().split('T')[0],
          link: formData.certificate_url,
          level: formData.difficulty || null,
          description: formData.description,
          approval_status: 'approved',
          enabled: true,
          platform: selectedPlatform?.id,
          certificate_id: formData.certificate_id,
          instructor: formData.instructor,
          category: formData.category
        });
      }

      if (skillTags.length > 0) {
        const levelMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        await supabase.from('skills').insert(
          skillTags.map(skill => ({
            student_id: studentId,
            training_id: training.id,
            name: skill,
            type: 'technical',
            level: levelMap[formData.difficulty] || 2,
            approval_status: 'pending',
            enabled: true,
            source: 'external_certificate',
            platform: selectedPlatform?.id
          }))
        );
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to add learning course');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedPlatform(null);
    setFormData({
      certificate_url: '', title: '', organization: '', instructor: '',
      completion_date: '', certificate_id: '', description: '', category: '', difficulty: ''
    });
    setSkillTags([]);
    setSkillInput('');
    setError('');
    setVerifying(false);
    setVerificationResult(null);
    setExtractionSuccess(false);
    setVerificationStatus(null);
  };


  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return selectedPlatform !== null;
      case 2: return formData.certificate_url.trim() !== '' || formData.certificate_id.trim() !== '';
      case 3: return formData.title.trim() !== '' && formData.completion_date !== '';
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!canProceedToNextStep() || currentStep >= totalSteps) return;

    if (currentStep === 2 && !extractionSuccess) {
      if (formData.certificate_url) {
        if (!(await verifyCertificateUrl())) return;
      } else if (formData.certificate_id) {
        if (!selectedPlatform?.verifyUrlTemplate) {
          setError('This platform does not support verification by certificate ID. Please provide a certificate URL.');
          return;
        }
        const constructedUrl = selectedPlatform.verifyUrlTemplate(formData.certificate_id);
        setFormData(prev => ({ ...prev, certificate_url: constructedUrl }));
        if (!(await verifyCertificateUrl(constructedUrl))) {
          setError('Certificate ID verification failed.');
          return;
        }
      } else {
        setError('Please enter a certificate URL or provide a certificate ID.');
        return;
      }
    }

    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setError('');
      setVerificationStatus(null);
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-5">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import External Certificate</h2>
              <p className="text-white/80 text-sm mt-0.5">Add your achievements from external learning platforms</p>
            </div>
          </div>
          {/* Progress Steps */}
          <div className="mt-5 px-4 max-w-md mx-auto">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((step, index) => (
                <div key={step} className="flex items-center flex-1 last:flex-initial">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    step === currentStep ? 'bg-white text-indigo-600 shadow-lg scale-110' :
                    step < currentStep ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    {step < currentStep ? <CheckCircle size={14} /> : step}
                  </div>
                  {index < 4 && <div className={`flex-1 h-0.5 mx-2 ${step < currentStep ? 'bg-white/50' : 'bg-white/20'}`} />}
                </div>
              ))}
            </div>
            <div className="flex items-center mt-2">
              {['Platform', 'Verify', 'Details', 'Skills', 'Review'].map((label, index) => (
                <div key={label} className="flex items-center flex-1 last:flex-initial">
                  <span className={`w-8 text-xs text-center flex-shrink-0 ${index + 1 === currentStep ? 'text-white font-medium' : 'text-white/70'}`}>{label}</span>
                  {index < 4 && <div className="flex-1 mx-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {error && (
            <div ref={errorRef} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-4">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Platform Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Where did you complete this course?</h3>
                <p className="text-gray-500 text-sm mt-1">Select the platform where you earned your certificate</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => {
                      if (selectedPlatform?.id !== platform.id) {
                        setFormData({ certificate_url: '', title: '', organization: '', instructor: '', completion_date: '', certificate_id: '', description: '', category: '', difficulty: '' });
                        setSkillTags([]);
                        setExtractionSuccess(false);
                        setVerificationStatus(null);
                        setVerificationResult(null);
                        setError('');
                      }
                      setSelectedPlatform(platform);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      selectedPlatform?.id === platform.id
                        ? `${platform.borderColor} ${platform.bgColor} shadow-md scale-[1.02]`
                        : `border-gray-200 hover:border-gray-300 ${platform.hoverBg}`
                    }`}
                  >
                    <PlatformIcon platformId={platform.id} className={`w-8 h-8 ${selectedPlatform?.id === platform.id ? platform.iconColor : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${selectedPlatform?.id === platform.id ? 'text-gray-900' : 'text-gray-700'}`}>{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Step 2: Verify Certificate */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Verify Your Certificate</h3>
                <p className="text-gray-500 text-sm mt-1">Provide certificate details for verification</p>
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{selectedPlatform?.id === 'other' ? 'Certificate URL' : 'Certificate URL or ID'}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{selectedPlatform?.id === 'other' ? 'Enter your certificate verification URL' : 'Enter your certificate verification URL or certificate number'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={formData.certificate_url || formData.certificate_id}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        if (selectedPlatform?.id === 'other' || value.startsWith('http') || value.includes('.')) {
                          setFormData(prev => ({ ...prev, certificate_url: value, certificate_id: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, certificate_id: value, certificate_url: '' }));
                        }
                        setVerificationStatus(null);
                        setExtractionSuccess(false);
                      }}
                      placeholder={selectedPlatform?.id === 'other' ? "https://example.com/certificate/123" : "https://ude.my/UC-xxx or UC-794d8663-..."}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">{selectedPlatform?.id === 'other' ? 'Paste the full certificate verification URL' : 'Paste the full URL or just the certificate ID'}</p>
                </div>
              </div>

              {verificationStatus === 'success' && (
                <div ref={verificationStatusRef} className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">Certificate Verified!</h4>
                      <p className="text-sm text-green-700 mt-1">Your certificate has been successfully verified. Click Continue to proceed.</p>
                      {formData.certificate_url && (
                        <a href={formData.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-2 font-medium">
                          <LinkIcon size={14} /> View Certificate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!verificationStatus && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">Enter your certificate URL or ID to verify your certificate against the platform's verification system.</p>
                </div>
              )}
            </div>
          )}


          {/* Step 3: Certificate Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificate Details</h3>
                <p className="text-gray-500 text-sm mt-1">Enter the certificate information</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title <span className="text-red-500">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Machine Learning Specialization" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Issuing Organization</label>
                  <input type="text" name="organization" value={formData.organization || selectedPlatform?.name || ''} onChange={handleInputChange} placeholder="e.g., Stanford University" disabled={selectedPlatform?.id !== 'other'} className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm ${selectedPlatform?.id !== 'other' ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructor Name</label>
                  <input type="text" name="instructor" value={formData.instructor} onChange={handleInputChange} placeholder="e.g., Andrew Ng" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Completion Date <span className="text-red-500">*</span></label>
                <input type="date" name="completion_date" value={formData.completion_date} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Certificate URL</label>
                  <input type="url" name="certificate_url" value={formData.certificate_url} readOnly disabled className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Certificate ID</label>
                  <input type="text" name="certificate_id" value={formData.certificate_id} onChange={handleInputChange} placeholder="e.g., UC-ABC123" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of what you learned..." rows="2" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none" />
              </div>
            </div>
          )}


          {/* Step 4: Skills & Learning */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Skills & Learning</h3>
                <p className="text-gray-500 text-sm mt-1">Add the skills you learned (optional)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills Learned</label>
                <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {skillTags.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)} className="hover:text-indigo-900"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                  <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} onBlur={() => skillInput && handleAddSkill(skillInput)} placeholder="Type a skill and press Enter..." className="w-full outline-none text-sm" />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Press Enter or comma to add each skill</p>
              </div>
              {skillTags.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Skills Assessment</p>
                      <p className="text-sm text-amber-700 mt-1">Skills from external certificates will be marked as <strong>"Rareminds Assessment Pending"</strong> until verified.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                    <option value="">Select category...</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty Level</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                    <option value="">Select level...</option>
                    {DIFFICULTY_LEVELS.map(level => <option key={level.id} value={level.id}>{level.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}


          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Review Your Certificate</h3>
                <p className="text-gray-500 text-sm mt-1">Verify the details before importing</p>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedPlatform?.bgColor || 'bg-gray-100'}`}>
                    <PlatformIcon platformId={selectedPlatform?.id} className={`w-7 h-7 ${selectedPlatform?.iconColor || 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg">{formData.title || 'Untitled Course'}</h4>
                    <p className="text-gray-600 text-sm mt-1">{formData.organization || selectedPlatform?.name}{formData.instructor && ` • ${formData.instructor}`}</p>
                    {formData.completion_date && (
                      <p className="text-gray-500 text-sm mt-1">Completed: {new Date(formData.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    )}
                  </div>
                </div>
                {skillTags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">SKILLS</p>
                    <div className="flex flex-wrap gap-2">
                      {skillTags.map((skill, idx) => <span key={idx} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{skill}</span>)}
                    </div>
                  </div>
                )}
                {formData.certificate_url && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a href={formData.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      <Award size={16} /> View Certificate
                    </a>
                  </div>
                )}
              </div>
              {verificationResult && (
                <div className={`rounded-xl p-4 ${verificationResult.isLegitimate ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${verificationResult.isLegitimate ? 'text-green-600' : 'text-amber-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${verificationResult.isLegitimate ? 'text-green-900' : 'text-amber-900'}`}>{verificationResult.summary || 'Certificate verified'}</p>
                      {verificationResult.credibilityScore && <p className="text-xs text-gray-600 mt-1">Credibility Score: {verificationResult.credibilityScore}%</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button onClick={handleBack} disabled={currentStep === 1} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${currentStep === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}>
            <ChevronLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
            {currentStep < totalSteps ? (
              <button onClick={handleNext} disabled={!canProceedToNextStep() || extracting} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium ${canProceedToNextStep() && !extracting ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                {extracting ? <><Loader className="w-4 h-4 animate-spin" /> Verifying...</> : <>Continue <ChevronRight size={18} /></>}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || verifying} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium ${!loading && !verifying ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : verifying ? <><Loader className="w-4 h-4 animate-spin" /> Verifying...</> : <><CheckCircle size={18} /> Import Certificate</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}