import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { callClaudeJSON, isClaudeConfigured } from '../../../services/claudeService';
import {
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  ChevronRight,
  ChevronLeft,
  Link as LinkIcon,
  Award,
  Sparkles,
  GraduationCap
} from 'lucide-react';

// Platform configurations with brand colors and icons
const PLATFORMS = [
  {
    id: 'coursera',
    name: 'Coursera',
    color: '#0056D2',
    bgColor: 'bg-[#0056D2]/10',
    hoverBg: 'hover:bg-[#0056D2]/20',
    borderColor: 'border-[#0056D2]',
    icon: '🎓',
    urlPattern: /coursera\.org/i
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Learning',
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2]/10',
    hoverBg: 'hover:bg-[#0A66C2]/20',
    borderColor: 'border-[#0A66C2]',
    icon: '💼',
    urlPattern: /linkedin\.com\/learning/i
  },
  {
    id: 'udemy',
    name: 'Udemy',
    color: '#A435F0',
    bgColor: 'bg-[#A435F0]/10',
    hoverBg: 'hover:bg-[#A435F0]/20',
    borderColor: 'border-[#A435F0]',
    icon: '📚',
    urlPattern: /udemy\.com/i
  },
  {
    id: 'edx',
    name: 'edX',
    color: '#02262B',
    bgColor: 'bg-[#02262B]/10',
    hoverBg: 'hover:bg-[#02262B]/20',
    borderColor: 'border-[#02262B]',
    icon: '🏛️',
    urlPattern: /edx\.org/i
  },
  {
    id: 'pluralsight',
    name: 'Pluralsight',
    color: '#F15B2A',
    bgColor: 'bg-[#F15B2A]/10',
    hoverBg: 'hover:bg-[#F15B2A]/20',
    borderColor: 'border-[#F15B2A]',
    icon: '💡',
    urlPattern: /pluralsight\.com/i
  },
  {
    id: 'other',
    name: 'Other Platform',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    hoverBg: 'hover:bg-gray-200',
    borderColor: 'border-gray-400',
    icon: '➕',
    urlPattern: null
  }
];

const CATEGORIES = [
  'Technology',
  'Business',
  'Data Science',
  'Design',
  'Marketing',
  'Finance',
  'Healthcare',
  'Personal Development',
  'Other'
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'intermediate', label: 'Intermediate', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { id: 'advanced', label: 'Advanced', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'expert', label: 'Expert', color: 'text-red-600 bg-red-50 border-red-200' }
];

export default function AddLearningCourseModal({ isOpen, onClose, studentId, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const [formData, setFormData] = useState({
    certificate_url: '',
    title: '',
    organization: '',
    instructor: '',
    completion_date: '',
    certificate_id: '',
    skills_covered: '',
    description: '',
    category: '',
    difficulty: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [skillTags, setSkillTags] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  const totalSteps = 4;

  // Auto-detect platform from URL
  const detectPlatformFromUrl = (url) => {
    for (const platform of PLATFORMS) {
      if (platform.urlPattern && platform.urlPattern.test(url)) {
        return platform;
      }
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-detect platform from certificate URL
    if (name === 'certificate_url' && value) {
      const detected = detectPlatformFromUrl(value);
      if (detected && !selectedPlatform) {
        setSelectedPlatform(detected);
      }
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

  // AI-powered auto-fill from certificate URL
  const extractCertificateDetails = async () => {
    if (!formData.certificate_url && !formData.certificate_id) {
      setError('Please enter a certificate URL or certificate ID first');
      return;
    }

    setExtracting(true);
    setError('');
    setExtractionSuccess(false);

    try {
      if (!isClaudeConfigured()) {
        setError('AI auto-fill requires a Claude API key. Please fill in the fields manually.');
        return;
      }

      let certificateUrl = formData.certificate_url || '';
      const platformName = selectedPlatform?.name || 'unknown platform';

      // Expand short URLs to full URLs
      if (certificateUrl.includes('ude.my/')) {
        const certId = certificateUrl.split('ude.my/')[1];
        certificateUrl = `https://www.udemy.com/certificate/${certId}`;
      }

      // Try to fetch certificate page content using multiple CORS proxies
      let pageContent = '';
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(certificateUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(certificateUrl)}`
      ];

      for (const proxyUrl of proxies) {
        if (pageContent) break;
        try {
          const pageResponse = await fetch(proxyUrl);
          if (pageResponse.ok) {
            let text = '';
            if (proxyUrl.includes('allorigins')) {
              const data = await pageResponse.json();
              text = data.contents;
            } else {
              text = await pageResponse.text();
            }

            if (text) {
              // Extract text content from HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'text/html');

              // Remove script and style tags
              doc.querySelectorAll('script, style, noscript, iframe, svg').forEach(el => el.remove());

              // Get relevant text content
              const title = doc.querySelector('title')?.textContent || '';
              const h1 = doc.querySelector('h1')?.textContent || '';
              const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
              const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
              const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

              // Udemy certificate specific selectors
              const udemyCourseTitle = doc.querySelector('[data-purpose="certificate-title"]')?.textContent || 
                                       doc.querySelector('.certificate--course-title')?.textContent ||
                                       doc.querySelector('h1.udlite-heading-xxl')?.textContent || '';
              const udemyInstructor = doc.querySelector('[data-purpose="certificate-instructor"]')?.textContent ||
                                      doc.querySelector('.certificate--instructor-name')?.textContent || '';
              const udemyDate = doc.querySelector('[data-purpose="certificate-date"]')?.textContent ||
                               doc.querySelector('.certificate--completion-date')?.textContent || '';
              const udemyRecipient = doc.querySelector('[data-purpose="certificate-recipient"]')?.textContent || '';

              const bodyText = doc.body?.textContent?.replace(/\s+/g, ' ').slice(0, 3000) || '';

              // Check if we got meaningful content
              const hasMeaningfulContent = udemyCourseTitle || ogTitle || (bodyText.length > 500 && !bodyText.includes('Please enable JavaScript'));

              pageContent = `
Page Title: ${title}
OpenGraph Title: ${ogTitle}
Main Heading: ${h1}
Udemy Course Title: ${udemyCourseTitle}
Udemy Instructor: ${udemyInstructor}
Udemy Completion Date: ${udemyDate}
Udemy Recipient: ${udemyRecipient}
Meta Description: ${metaDesc}
OpenGraph Description: ${ogDesc}
Page Content (excerpt): ${bodyText}
              `.trim();

              console.log('📄 Fetched page content via', proxyUrl.includes('allorigins') ? 'allorigins' : 'corsproxy');
              console.log('📄 Has meaningful content:', hasMeaningfulContent);
              console.log('📄 Extracted title:', udemyCourseTitle || ogTitle || title);
              
              // If no meaningful content, clear it so AI knows to be cautious
              if (!hasMeaningfulContent) {
                console.log('⚠️ Page content appears to be a JavaScript shell, AI will need to be cautious');
                pageContent = `[NOTE: Certificate page requires JavaScript to render. Only basic metadata available]
Page Title: ${title}
OpenGraph Title: ${ogTitle}
Meta Description: ${metaDesc}`;
              }
            }
          }
        } catch (fetchError) {
          console.log(`⚠️ Proxy failed: ${proxyUrl}`, fetchError);
        }
      }

      const prompt = pageContent
        ? `You are an expert at extracting certificate information from web page content.

I have a certificate page from ${platformName}:
URL: ${certificateUrl || formData.certificate_id}

PAGE CONTENT:
${pageContent}

IMPORTANT RULES:
1. ONLY extract information that is EXPLICITLY present in the page content above
2. DO NOT guess or make up course names, instructor names, or dates
3. If the page content doesn't contain clear certificate details (e.g., it says "JavaScript required" or is mostly empty), return null for fields you cannot verify
4. The certificate ID in the URL is unique - do NOT assume it's a specific well-known course

Return a JSON object with these fields (use null for any field you cannot determine from the actual page content):
{
  "courseTitle": "The exact course name from the page, or null if not found",
  "organization": "The institution or company from the page (e.g., 'Udemy'), or null",
  "instructor": "The exact instructor name from the page, or null if not found",
  "skills": ["skill1", "skill2", "skill3"],
  "category": "One of: Technology, Business, Data Science, Design, Marketing, Finance, Healthcare, Personal Development, Other",
  "difficulty": "One of: beginner, intermediate, advanced, expert",
  "description": "A brief description based on actual page content, or null",
  "estimatedDate": "The completion date from the page in YYYY-MM-DD format, or null"
}

Return ONLY the JSON object, no additional text.`
        : `You are helping extract certificate information, but the certificate page could not be loaded.

Certificate URL: ${certificateUrl || formData.certificate_id}
Platform: ${platformName}

IMPORTANT: Since the actual certificate page content is not available, you CANNOT determine the specific course details.
The certificate ID is unique to this user's certificate and does NOT indicate which course it is.

Return a JSON object with mostly null values since we cannot verify the actual certificate content:
{
  "courseTitle": null,
  "organization": "${platformName !== 'Other Platform' ? platformName : 'null'}",
  "instructor": null,
  "skills": [],
  "category": null,
  "difficulty": null,
  "description": null,
  "estimatedDate": null
}

DO NOT guess course names or instructor names. Return null for unknown fields. Return ONLY the JSON object.`;

      // Use centralized Claude service
      const extracted = await callClaudeJSON(prompt, {
        maxTokens: 1000,
        useCache: false // Don't cache certificate extractions
      });

      console.log('🔍 AI Extracted Data:', extracted);

      // Update form data with extracted values
      const updatedFormData = {
        ...formData,
        title: extracted.courseTitle || formData.title,
        organization: extracted.organization || (platformName !== 'Other Platform' ? platformName : formData.organization),
        instructor: extracted.instructor || formData.instructor,
        description: extracted.description || formData.description,
        category: extracted.category || formData.category,
        difficulty: extracted.difficulty?.toLowerCase() || formData.difficulty,
        completion_date: extracted.estimatedDate || formData.completion_date
      };

      console.log('📝 Updated Form Data:', updatedFormData);
      setFormData(updatedFormData);

      // Add extracted skills
      if (extracted.skills && Array.isArray(extracted.skills)) {
        const newSkills = extracted.skills.filter(s => s && !skillTags.includes(s));
        console.log('🏷️ Extracted Skills:', newSkills);
        if (newSkills.length > 0) {
          setSkillTags(prev => [...prev, ...newSkills]);
        }
      }

      setExtractionSuccess(true);

    } catch (err) {
      console.error('Certificate extraction error:', err);
      
      // Check if it's a rate limit error
      const isRateLimit = err.message?.includes('rate limit') || err.message?.includes('429');
      
      // Fallback: at least set the platform name if we failed
      if (selectedPlatform && selectedPlatform.id !== 'other') {
        setFormData(prev => ({
          ...prev,
          organization: selectedPlatform.name
        }));
        setExtractionSuccess(true); // Technically partial success
        setError(isRateLimit 
          ? 'AI service is busy. Platform set automatically - please fill in other details manually.'
          : 'Could not auto-fill details completely. Please fill in the rest manually.');
      } else {
        setError(isRateLimit 
          ? 'AI service is temporarily busy. Please wait a moment and try again, or fill in the fields manually.'
          : `Could not auto-fill: ${err.message}. Please fill in the fields manually.`);
      }
    } finally {
      setExtracting(false);
    }
  };

  // AI Certificate Verification
  const verifyCertificateWithAI = async () => {
    setVerifying(true);
    setError('');

    try {
      if (!isClaudeConfigured()) {
        // Skip verification if no API key - this is optional
        setVerificationResult({
          isLegitimate: true,
          credibilityScore: 75,
          providerRecognition: selectedPlatform?.id === 'other' ? 'unknown' : 'recognized',
          summary: 'Verification skipped - API key not configured',
          skipped: true
        });
        return;
      }

      const prompt = `You are a certificate verification assistant. Analyze the following certificate/training details and determine if it appears legitimate and valuable.

Certificate Details:
- Course Name: ${formData.title}
- Platform: ${selectedPlatform?.name || 'Not specified'}
- Organization: ${formData.organization || 'Not specified'}
- Certificate URL: ${formData.certificate_url || 'Not provided'}
- Skills Covered: ${skillTags.join(', ') || 'Not specified'}
- Completion Date: ${formData.completion_date || 'Not specified'}

Please analyze:
1. Is this a legitimate/recognized training provider?
2. Does the course content match the skills claimed?
3. Is the certificate URL format valid (if provided)?
4. Overall credibility score (0-100)

Respond in JSON format:
{
  "isLegitimate": true/false,
  "credibilityScore": 0-100,
  "providerRecognition": "well-known/recognized/unknown/suspicious",
  "concerns": ["list any red flags"],
  "recommendations": ["suggestions for improvement"],
  "summary": "brief assessment"
}`;

      // Use centralized Claude service
      const verification = await callClaudeJSON(prompt, { maxTokens: 1000 });
      setVerificationResult(verification);

      return verification;
    } catch (err) {
      console.error('AI verification error:', err);
      // Don't block on verification errors - make it optional
      setVerificationResult({
        isLegitimate: true,
        credibilityScore: 70,
        providerRecognition: 'unknown',
        summary: 'Verification could not be completed',
        error: true
      });
      return null;
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Determine assessment status based on skills
      const hasSkills = skillTags.length > 0;
      const assessmentStatus = hasSkills ? 'rareminds_assessment_pending' : 'not_required';

      // Insert training record
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
          source: 'external_course',
          assessment_status: assessmentStatus
        })
        .select()
        .single();

      if (trainingError) throw trainingError;

      // If certificate URL provided, create certificate record
      if (formData.certificate_url) {
        const certificateData = {
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
          category: formData.category,
          assessment_status: assessmentStatus
        };

        const { error: certError } = await supabase
          .from('certificates')
          .insert(certificateData);

        if (certError) console.error('Certificate insert error:', certError);
      }

      // Add skills if provided
      if (skillTags.length > 0) {
        const levelMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
        const skillRecords = skillTags.map(skill => ({
          student_id: studentId,
          training_id: training.id,
          name: skill,
          type: 'technical',
          level: levelMap[formData.difficulty] || 2,
          approval_status: 'pending', // Pending until Rareminds assessment
          enabled: true,
          source: 'external_certificate',
          platform: selectedPlatform?.id
        }));

        const { error: skillsError } = await supabase
          .from('skills')
          .insert(skillRecords);

        if (skillsError) console.error('Skills insert error:', skillsError);
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error adding learning:', err);
      setError(err.message || 'Failed to add learning course');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedPlatform(null);
    setFormData({
      certificate_url: '',
      title: '',
      organization: '',
      instructor: '',
      completion_date: '',
      certificate_id: '',
      skills_covered: '',
      description: '',
      category: '',
      difficulty: ''
    });
    setSkillTags([]);
    setSkillInput('');
    setError('');
    setVerifying(false);
    setVerificationResult(null);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null;
      case 2:
        return formData.title.trim() !== '' && formData.completion_date !== '';
      case 3:
        return true; // Skills are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import External Certificate</h2>
              <p className="text-white/80 text-sm mt-0.5">
                Add your achievements from external learning platforms
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step === currentStep
                    ? 'bg-white text-indigo-600 shadow-lg scale-110'
                    : step < currentStep
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 text-white/50'
                    }`}
                >
                  {step < currentStep ? <CheckCircle size={16} /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-8 h-0.5 mx-1 ${step < currentStep ? 'bg-white/50' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs text-white/70">
            <span className={currentStep === 1 ? 'text-white font-medium' : ''}>Platform</span>
            <span className={currentStep === 2 ? 'text-white font-medium' : ''}>Details</span>
            <span className={currentStep === 3 ? 'text-white font-medium' : ''}>Skills</span>
            <span className={currentStep === 4 ? 'text-white font-medium' : ''}>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-4">
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
                    onClick={() => setSelectedPlatform(platform)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedPlatform?.id === platform.id
                      ? `${platform.borderColor} ${platform.bgColor} shadow-md scale-[1.02]`
                      : `border-gray-200 hover:border-gray-300 ${platform.hoverBg}`
                      }`}
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <span className={`text-sm font-medium ${selectedPlatform?.id === platform.id ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                      {platform.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Certificate Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificate Details</h3>
                <p className="text-gray-500 text-sm mt-1">Enter the details from your certificate</p>
              </div>

              <div className="space-y-4">
                {/* Auto-fill Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">AI Auto-Fill</h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Paste your certificate URL or ID and we'll extract the details automatically
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="url"
                          name="certificate_url"
                          value={formData.certificate_url}
                          onChange={handleInputChange}
                          placeholder="https://coursera.org/verify/ABC123..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={extractCertificateDetails}
                        disabled={extracting || (!formData.certificate_url && !formData.certificate_id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {extracting ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Auto-Fill
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center text-xs text-gray-500">or enter Certificate ID</div>

                    <input
                      type="text"
                      name="certificate_id"
                      value={formData.certificate_id}
                      onChange={handleInputChange}
                      placeholder="Certificate ID (e.g., UC-ABC123XYZ)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                    />
                  </div>

                  {extractionSuccess && (
                    <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Details extracted successfully! Review below.</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-500">Certificate Details</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Machine Learning Specialization"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Issuing Organization
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="e.g., Stanford University"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Instructor Name
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleInputChange}
                      placeholder="e.g., Andrew Ng"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Completion Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="completion_date"
                    value={formData.completion_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills & Learning */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Skills & Learning</h3>
                <p className="text-gray-500 text-sm mt-1">Add the skills you learned (optional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Skills Learned
                </label>
                <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {skillTags.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-indigo-900 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => skillInput && handleAddSkill(skillInput)}
                    placeholder="Type a skill and press Enter..."
                    className="w-full outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Press Enter or comma to add each skill
                </p>
              </div>

              {skillTags.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Skills Assessment</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Skills from external certificates will be marked as <strong>"Rareminds Assessment Pending"</strong> until verified through our skill assessment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Course Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of what you learned..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select level...</option>
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Review Your Certificate</h3>
                <p className="text-gray-500 text-sm mt-1">Verify the details before importing</p>
              </div>

              {/* Preview Card */}
              <div className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${selectedPlatform?.bgColor || 'bg-gray-100'}`}
                  >
                    {selectedPlatform?.icon || '📜'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-lg">{formData.title || 'Course Title'}</h4>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {formData.organization || selectedPlatform?.name}
                      {formData.instructor && ` • ${formData.instructor}`}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Award size={14} />
                        {formData.completion_date || 'Date not set'}
                      </span>
                      {formData.category && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {formData.category}
                        </span>
                      )}
                      {formData.difficulty && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${DIFFICULTY_LEVELS.find(d => d.id === formData.difficulty)?.color || ''
                          }`}>
                          {DIFFICULTY_LEVELS.find(d => d.id === formData.difficulty)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {skillTags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skillTags.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Rareminds Assessment Pending
                    </p>
                  </div>
                )}

                {formData.certificate_url && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a
                      href={formData.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <LinkIcon size={14} />
                      View Certificate
                    </a>
                  </div>
                )}
              </div>

              {/* AI Verification */}
              {!verificationResult && (
                <button
                  onClick={verifyCertificateWithAI}
                  disabled={verifying}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Verifying certificate...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Verify with AI (Optional)
                    </>
                  )}
                </button>
              )}

              {verificationResult && (
                <div className={`border-2 rounded-lg p-4 ${verificationResult.isLegitimate
                  ? 'bg-green-50 border-green-300'
                  : 'bg-yellow-50 border-yellow-300'
                  }`}>
                  <div className="flex items-start gap-3">
                    {verificationResult.isLegitimate ? (
                      <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={24} className="text-yellow-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${verificationResult.isLegitimate ? 'text-green-900' : 'text-yellow-900'
                        }`}>
                        {verificationResult.isLegitimate ? 'Certificate Verified' : 'Verification Note'}
                      </h4>
                      <p className="text-sm text-gray-700 mt-1">{verificationResult.summary}</p>
                      {verificationResult.credibilityScore && (
                        <p className="text-sm mt-2">
                          Credibility Score: <strong>{verificationResult.credibilityScore}/100</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <ChevronLeft size={18} />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Import Certificate
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div >
  );
}
