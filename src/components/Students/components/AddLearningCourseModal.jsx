import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { callClaudeJSON, callClaudeVisionJSON, isClaudeConfigured } from '../../../services/claudeService';
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
  GraduationCap,
  Upload,
  Image as ImageIcon,
  BookOpen,
  Briefcase,
  Library,
  Landmark,
  Lightbulb,
  PlusCircle
} from 'lucide-react';

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

// Platform configurations with brand colors, icons, and verification URL templates
const PLATFORMS = [
  {
    id: 'coursera',
    name: 'Coursera',
    color: '#0056D2',
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
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2]/10',
    hoverBg: 'hover:bg-[#0A66C2]/20',
    borderColor: 'border-[#0A66C2]',
    iconColor: 'text-[#0A66C2]',
    urlPattern: /linkedin\.com\/learning/i,
    verifyUrlTemplate: null // LinkedIn doesn't have a simple verification URL
  },
  {
    id: 'udemy',
    name: 'Udemy',
    color: '#A435F0',
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
    color: '#02262B',
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
    color: '#F15B2A',
    bgColor: 'bg-[#F15B2A]/10',
    hoverBg: 'hover:bg-[#F15B2A]/20',
    borderColor: 'border-[#F15B2A]',
    iconColor: 'text-[#F15B2A]',
    urlPattern: /pluralsight\.com/i,
    verifyUrlTemplate: null // Pluralsight verification varies
  },
  {
    id: 'other',
    name: 'Other Platform',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    hoverBg: 'hover:bg-gray-200',
    borderColor: 'border-gray-400',
    iconColor: 'text-gray-500',
    urlPattern: null,
    verifyUrlTemplate: null
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

// Month name to number mapping
const MONTH_MAP = {
  'jan': '01', 'january': '01',
  'feb': '02', 'february': '02',
  'mar': '03', 'march': '03',
  'apr': '04', 'april': '04',
  'may': '05',
  'jun': '06', 'june': '06',
  'jul': '07', 'july': '07',
  'aug': '08', 'august': '08',
  'sep': '09', 'sept': '09', 'september': '09',
  'oct': '10', 'october': '10',
  'nov': '11', 'november': '11',
  'dec': '12', 'december': '12',
};

/**
 * Parse various date formats and return YYYY-MM-DD
 * Handles: "Jan. 28, 2025", "January 28, 2025", "28/01/2025", "2025-01-28", etc.
 */
const parseFlexibleDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Clean up the string
  const cleaned = dateStr.trim().replace(/\./g, '').replace(/,/g, '');
  
  // Try "Month DD YYYY" or "Month DD, YYYY" format (e.g., "Jan 28 2025")
  const monthFirstMatch = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/i);
  if (monthFirstMatch) {
    const [, month, day, year] = monthFirstMatch;
    const monthNum = MONTH_MAP[month.toLowerCase()];
    if (monthNum) {
      return `${year}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }
  
  // Try "DD Month YYYY" format (e.g., "28 Jan 2025")
  const dayFirstMatch = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    const monthNum = MONTH_MAP[month.toLowerCase()];
    if (monthNum) {
      return `${year}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }
  
  // Try "DD/MM/YYYY" or "DD-MM-YYYY" format
  const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try "MM/DD/YYYY" format (US style) - assume if first number > 12, it's day
  const usMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usMatch) {
    const [, first, second, year] = usMatch;
    if (parseInt(first) > 12) {
      // First is day (DD/MM/YYYY)
      return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
    } else {
      // First is month (MM/DD/YYYY)
      return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
    }
  }
  
  // Try standard Date parsing as last resort
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore
  }
  
  return dateStr; // Return original if all parsing fails
};

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
  const [certificateImage, setCertificateImage] = useState(null);
  const [certificateImagePreview, setCertificateImagePreview] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'failed', null
  const fileInputRef = useRef(null);
  const verificationStatusRef = useRef(null);
  const errorRef = useRef(null);

  // Scroll verification status into view when it changes
  useEffect(() => {
    if (verificationStatus && verificationStatusRef.current) {
      verificationStatusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [verificationStatus]);

  // Scroll error message into view when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const totalSteps = 5;

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
    
    // Reset verification status when user changes certificate URL or ID
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

  // Handle certificate image/PDF upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    // Validate file type
    if (!isImage && !isPdf) {
      setError('Please upload an image file (PNG, JPG) or PDF');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setCertificateImage(file);
    
    if (isImage) {
      // Create preview URL for images
      const reader = new FileReader();
      reader.onload = (e) => {
        setCertificateImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, set a placeholder preview
      setCertificateImagePreview('pdf');
    }
    
    setError('');
    
    // Reset verification status when new file is uploaded
    setVerificationStatus(null);
    setExtractionSuccess(false);
  };

  // Convert PDF to image using pdf.js
  const convertPdfToImage = async (pdfFile) => {
    // Dynamically import pdf.js
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Use inline worker to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
    
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Get first page
    
    const scale = 2; // Higher scale for better quality
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/png');
  };

  // Extract certificate details from uploaded image/PDF using Claude Vision
  const extractFromImage = async () => {
    if (!certificateImage) {
      setError('Please upload a certificate image or PDF first');
      return;
    }

    if (!isClaudeConfigured()) {
      setError('AI extraction requires Claude API key. Please configure VITE_CLAUDE_API_KEY.');
      return;
    }

    setExtracting(true);
    setError('');
    setExtractionSuccess(false);

    try {
      const platformName = selectedPlatform?.name || 'unknown platform';
      const isPdf = certificateImage.type === 'application/pdf';
      
      let imageBase64;
      let mediaType = 'image/png';
      
      if (isPdf) {
        // Convert PDF to image first
        console.log('📄 Converting PDF to image...');
        const pdfImageDataUrl = await convertPdfToImage(certificateImage);
        imageBase64 = pdfImageDataUrl.split(',')[1];
      } else {
        // Convert image to base64
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(certificateImage);
        });
        mediaType = certificateImage.type || 'image/png';
      }

      console.log('🖼️ Extracting certificate data from image using Claude Vision');

      const prompt = `You are analyzing a certificate image from ${platformName}. Extract ALL information EXACTLY as shown on the certificate.

IMPORTANT - LOOK CAREFULLY FOR THESE ITEMS:

1. COURSE TITLE - The main course or certification name (usually the largest text)

2. INSTRUCTOR(S) - Look for:
   - "Instructor:", "Instructors:", "Taught by:", "By:"
   - Names near the course title or at the bottom

3. COMPLETION DATE - Look for:
   - "Date:", "Completed:", "Issued:", "Completion Date:"
   - Convert to YYYY-MM-DD format (e.g., "Jan 28, 2025" → "2025-01-28")

4. STUDENT NAME - The recipient's name (usually prominent on the certificate)

5. CERTIFICATE ID/NUMBER - VERY IMPORTANT! Look for:
   - "Certificate no:", "Certificate ID:", "Reference Number:", "Credential ID:"
   - For Udemy: Look for IDs starting with "UC-" (e.g., "UC-794d8663-2295-4407-84f6-f7cb2f0f1c01")
   - For Coursera: Look for alphanumeric codes
   - Usually found at the bottom or in small text

6. CERTIFICATE URL - CRITICAL! Look EVERYWHERE for:
   - "ude.my/" followed by the certificate ID (Udemy short URLs)
   - "coursera.org/verify/" URLs
   - "credential.net/" URLs
   - Any URL or web address shown on the certificate
   - QR codes often have URLs nearby
   - For Udemy: The URL format is typically "ude.my/UC-xxxxx" or "udemy.com/certificate/UC-xxxxx"

7. SKILLS - Any skills, technologies, or topics mentioned

Return a JSON object:
{
  "courseTitle": "Exact course name",
  "instructor": "Instructor name(s) or empty string",
  "completionDate": "YYYY-MM-DD format",
  "studentName": "Student name or empty string",
  "certificateId": "Full certificate ID exactly as shown",
  "certificateUrl": "Full URL including https:// - construct from short URL if needed (e.g., if you see 'ude.my/UC-xxx', return 'https://ude.my/UC-xxx')",
  "skills": ["skill1", "skill2"],
  "category": "Technology/Business/Data Science/Design/Marketing/Finance/Healthcare/Personal Development/Other"
}

CRITICAL RULES:
- If you see "ude.my/UC-xxx", the certificateUrl should be "https://ude.my/UC-xxx"
- If you see a certificate ID like "UC-xxx" but no URL, construct it as "https://ude.my/UC-xxx" for Udemy
- Extract the COMPLETE certificate ID - don't truncate it
- Return ONLY the JSON object, no other text.`;

      const extracted = await callClaudeVisionJSON(prompt, imageBase64, mediaType, { maxTokens: 800 });
      
      console.log('🖼️ Vision extracted:', extracted);

      // Format completion date if provided - with robust parsing
      let completionDate = extracted.completionDate || '';
      if (completionDate && !completionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try to parse various date formats
        completionDate = parseFlexibleDate(completionDate);
      }

      // Format certificate URL - handle various cases
      let certificateUrl = extracted.certificateUrl || '';
      const certificateId = extracted.certificateId || '';
      
      // If no URL but we have certificate ID, try to construct URL based on platform
      if (!certificateUrl && certificateId) {
        if (selectedPlatform?.id === 'udemy' || certificateId.startsWith('UC-')) {
          certificateUrl = `https://ude.my/${certificateId}`;
        } else if (selectedPlatform?.id === 'coursera') {
          certificateUrl = `https://www.coursera.org/verify/${certificateId}`;
        } else if (selectedPlatform?.id === 'edx') {
          certificateUrl = `https://courses.edx.org/certificates/${certificateId}`;
        }
      }
      
      // Ensure URL has https:// prefix
      if (certificateUrl && !certificateUrl.startsWith('http')) {
        if (certificateUrl.includes('ude.my')) {
          certificateUrl = `https://${certificateUrl}`;
        } else if (certificateUrl.includes('coursera.org')) {
          certificateUrl = `https://${certificateUrl}`;
        } else if (certificateUrl.includes('udemy.com')) {
          certificateUrl = `https://${certificateUrl}`;
        } else {
          certificateUrl = `https://${certificateUrl}`;
        }
      }
      
      // Expand short Udemy URLs
      if (certificateUrl.includes('ude.my/')) {
        const certId = certificateUrl.split('ude.my/')[1];
        if (certId) {
          // Keep the short URL format as it redirects properly
          certificateUrl = `https://ude.my/${certId}`;
        }
      }

      console.log('📋 Processed certificate URL:', certificateUrl);
      console.log('📋 Certificate ID:', certificateId);

      setFormData(prev => ({
        ...prev,
        title: extracted.courseTitle || prev.title,
        organization: platformName !== 'Other Platform' ? platformName : prev.organization,
        instructor: extracted.instructor || prev.instructor,
        completion_date: completionDate || prev.completion_date,
        certificate_id: certificateId || prev.certificate_id,
        certificate_url: certificateUrl || prev.certificate_url,
        category: extracted.category || prev.category,
      }));

      if (extracted.skills?.length > 0) {
        setSkillTags(prev => [...prev, ...extracted.skills.filter(s => s && !prev.includes(s))]);
      }

      setExtractionSuccess(true);
      
      // Return the extracted certificate URL for verification
      return certificateUrl;
    } catch (err) {
      console.error('Image extraction error:', err);
      setError(`Could not extract from image: ${err.message}. Please fill in the fields manually.`);
      return null;
    } finally {
      setExtracting(false);
    }
  };

  // Verify certificate URL is valid (returns 200)
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

      // Expand short URLs to full URLs
      if (certificateUrl.includes('ude.my/')) {
        const certId = certificateUrl.split('ude.my/')[1];
        certificateUrl = `https://www.udemy.com/certificate/${certId}`;
        // Update the form with expanded URL if not passed as parameter
        if (!urlToVerify) {
          setFormData(prev => ({ ...prev, certificate_url: certificateUrl }));
        }
      }

      // Validate URL matches selected platform (skip for "Other Platform")
      if (selectedPlatform && selectedPlatform.id !== 'other' && selectedPlatform.urlPattern) {
        if (!selectedPlatform.urlPattern.test(certificateUrl)) {
          // Check which platform the URL actually belongs to
          const detectedPlatform = PLATFORMS.find(p => p.urlPattern && p.urlPattern.test(certificateUrl));
          if (detectedPlatform) {
            setError(`This appears to be a ${detectedPlatform.name} certificate, but you selected ${selectedPlatform.name}. Please go back and select the correct platform.`);
          } else {
            setError(`This URL doesn't appear to be from ${selectedPlatform.name}. Please check the URL or select a different platform.`);
          }
          setVerificationStatus('failed');
          return false;
        }
      }

      // Use Cloudflare Worker to verify certificate page exists
      console.log('🔍 Verifying certificate URL:', certificateUrl);
      
      const workerUrl = import.meta.env.VITE_CLOUDFLARE_CERTIFICATE_WORKER_URL || 
                        'https://fetch-certificate.rareminds.workers.dev';
      
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: certificateUrl })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Certificate verification failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result?.success) {
        throw new Error(result?.error || 'Certificate URL is not valid');
      }

      console.log('✅ Certificate URL verified successfully');
      
      // Set organization based on platform
      const platformName = selectedPlatform?.name || '';
      if (platformName && platformName !== 'Other Platform') {
        setFormData(prev => ({ ...prev, organization: platformName }));
      }
      
      setVerificationStatus('success');
      setExtractionSuccess(true);
      return true;
    } catch (err) {
      console.error('Certificate verification error:', err);
      setError('Certificate verification failed');
      setVerificationStatus('failed');
      return false;
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
          source: 'external_course'
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
          category: formData.category
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
      description: '',
      category: '',
      difficulty: ''
    });
    setSkillTags([]);
    setSkillInput('');
    setError('');
    setVerifying(false);
    setVerificationResult(null);
    setCertificateImage(null);
    setCertificateImagePreview(null);
    setExtractionSuccess(false);
    setVerificationStatus(null);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null;
      case 2:
        // Verify step - need either image uploaded, URL, or certificate ID (ID only for known platforms)
        if (selectedPlatform?.id === 'other') {
          // For "Other Platform", only allow image or URL (not certificate ID)
          return certificateImage !== null || formData.certificate_url.trim() !== '';
        }
        return certificateImage !== null || formData.certificate_url.trim() !== '' || formData.certificate_id.trim() !== '';
      case 3:
        // Details step - need title and completion date
        return formData.title.trim() !== '' && formData.completion_date !== '';
      case 4:
        return true; // Skills are optional
      case 5:
        return true; // Review
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceedToNextStep() || currentStep >= totalSteps) return;
    
    // If on step 2 (Verify), extract/verify certificate details
    if (currentStep === 2 && !extractionSuccess) {
      if (certificateImage) {
        // Extract from uploaded image using AI Vision
        const extractedUrl = await extractFromImage();
        
        // After extraction, verify the certificate URL if one was extracted
        if (extractedUrl) {
          console.log('🔍 Verifying extracted certificate URL:', extractedUrl);
          
          // Try to verify the URL
          const isValid = await verifyCertificateUrl(extractedUrl);
          if (!isValid) {
            // Verification failed, but we extracted data - allow user to proceed with warning
            // The error is already shown, but don't block completely
            console.log('⚠️ URL verification failed, but extraction succeeded');
            // Don't return - let user see the extracted data and decide
          }
        } else {
          // No URL extracted from image - check if we at least got a certificate ID
          if (formData.certificate_id && selectedPlatform?.verifyUrlTemplate) {
            // Try to construct and verify URL from certificate ID
            const constructedUrl = selectedPlatform.verifyUrlTemplate(formData.certificate_id);
            console.log('🔗 Constructed URL from extracted certificate ID:', constructedUrl);
            setFormData(prev => ({ ...prev, certificate_url: constructedUrl }));
            
            const isValid = await verifyCertificateUrl(constructedUrl);
            if (!isValid) {
              console.log('⚠️ Constructed URL verification failed');
            }
          } else {
            // No URL and no certificate ID - show warning but allow proceeding
            setError('Could not extract certificate URL. Please verify the details manually in the next step.');
            // Don't return - allow user to proceed and enter URL manually
          }
        }
        
        // Mark extraction as successful so user can proceed
        setExtractionSuccess(true);
      } else if (formData.certificate_url) {
        // Only verify that the certificate URL is valid
        const isValid = await verifyCertificateUrl();
        if (!isValid) {
          return; // Don't proceed if verification failed
        }
      } else if (formData.certificate_id) {
        // Only certificate ID provided - construct URL from platform and verify
        if (!selectedPlatform || !selectedPlatform.verifyUrlTemplate) {
          setError('This platform does not support verification by certificate ID. Please provide a certificate URL or upload an image.');
          return;
        }
        
        // Construct verification URL from certificate ID
        const constructedUrl = selectedPlatform.verifyUrlTemplate(formData.certificate_id);
        console.log('🔗 Constructed verification URL from certificate ID:', constructedUrl);
        
        // Update form with constructed URL
        setFormData(prev => ({ ...prev, certificate_url: constructedUrl }));
        
        // Verify the constructed URL
        const isValid = await verifyCertificateUrl(constructedUrl);
        if (!isValid) {
          setError('Certificate ID verification failed. Please check the certificate ID or provide a valid URL.');
          return; // Don't proceed if verification failed
        }
      } else {
        // No verification method provided
        setError('Please upload a certificate image, enter a certificate URL, or provide a certificate ID.');
        return;
      }
    }
    
    setError(''); // Clear any errors when moving to next step
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setError(''); // Clear any errors when going back
      setVerificationStatus(null); // Reset verification status
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
          <div className="mt-5 px-4 max-w-md mx-auto">
            {/* Circles and lines row */}
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((step, index) => (
                <div key={step} className="flex items-center flex-1 last:flex-initial">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all flex-shrink-0 ${
                      step === currentStep
                        ? 'bg-white text-indigo-600 shadow-lg scale-110'
                        : step < currentStep
                          ? 'bg-white/30 text-white'
                          : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle size={14} /> : step}
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step < currentStep ? 'bg-white/50' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
            {/* Labels row */}
            <div className="flex items-center mt-2">
              {['Platform', 'Verify', 'Details', 'Skills', 'Review'].map((label, index) => (
                <div key={label} className="flex items-center flex-1 last:flex-initial">
                  <span
                    className={`w-8 text-xs text-center flex-shrink-0 ${
                      index + 1 === currentStep ? 'text-white font-medium' : 'text-white/70'
                    }`}
                  >
                    {label}
                  </span>
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
                      // Reset form data when switching platforms
                      if (selectedPlatform?.id !== platform.id) {
                        setFormData({
                          certificate_url: '',
                          title: '',
                          organization: '',
                          instructor: '',
                          completion_date: '',
                          certificate_id: '',
                          description: '',
                          category: '',
                          difficulty: ''
                        });
                        setSkillTags([]);
                        setSkillInput('');
                        setCertificateImage(null);
                        setCertificateImagePreview(null);
                        setExtractionSuccess(false);
                        setVerificationStatus(null);
                        setVerificationResult(null);
                        setError('');
                      }
                      setSelectedPlatform(platform);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${selectedPlatform?.id === platform.id
                      ? `${platform.borderColor} ${platform.bgColor} shadow-md scale-[1.02]`
                      : `border-gray-200 hover:border-gray-300 ${platform.hoverBg}`
                      }`}
                  >
                    <PlatformIcon 
                      platformId={platform.id} 
                      className={`w-8 h-8 ${selectedPlatform?.id === platform.id ? platform.iconColor : 'text-gray-400'}`} 
                    />
                    <span className={`text-sm font-medium ${selectedPlatform?.id === platform.id ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                      {platform.name}
                    </span>
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
                <p className="text-gray-500 text-sm mt-1">Upload an image or provide certificate details for verification</p>
              </div>

              <div className="space-y-4">
                {/* Image Upload Section - Primary Option */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">Upload Certificate Image or PDF</h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Upload a screenshot, photo, or PDF of your certificate (Recommended)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    
                    {certificateImagePreview ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        {certificateImagePreview === 'pdf' ? (
                          <div className="w-full h-48 bg-gray-50 flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h1c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1h-.5v1.5H8V13h.5zm3 0h1.5c.55 0 1 .45 1 1v2.5c0 .55-.45 1-1 1H11.5V13zm4 0h2v1h-1.5v.5h1v1h-1v2h-1V13h.5z"/>
                            </svg>
                            <span className="text-sm font-medium text-gray-700 mt-2">{certificateImage?.name}</span>
                            <span className="text-xs text-gray-500">PDF Document</span>
                          </div>
                        ) : (
                          <img 
                            src={certificateImagePreview} 
                            alt="Certificate preview" 
                            className="w-full h-48 object-contain bg-gray-50"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCertificateImage(null);
                            setCertificateImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            setExtractionSuccess(false);
                            setVerificationStatus(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 bg-green-500/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <CheckCircle size={14} />
                          <span className="text-xs font-medium">
                            {certificateImagePreview === 'pdf' ? 'PDF uploaded' : 'Image uploaded'} - Click Continue to extract details
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-colors flex flex-col items-center gap-2"
                      >
                        <Upload className="w-10 h-10 text-purple-400" />
                        <span className="text-sm font-medium text-gray-700">Click to upload certificate</span>
                        <span className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-500">OR</span>
                  </div>
                </div>

                {/* URL/ID Section - Alternative Option */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {selectedPlatform?.id === 'other' ? 'Use Certificate URL' : 'Use Certificate URL or ID'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {selectedPlatform?.id === 'other' 
                          ? 'Enter your certificate verification URL'
                          : 'Enter your certificate verification URL or certificate number'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {selectedPlatform?.id === 'other' ? 'Certificate URL' : 'Certificate URL or ID'}
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        name="certificate_url_or_id"
                        value={formData.certificate_url || formData.certificate_id}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          // For "Other Platform", always treat as URL
                          if (selectedPlatform?.id === 'other') {
                            setFormData(prev => ({ ...prev, certificate_url: value, certificate_id: '' }));
                          } else {
                            // Auto-detect if it's a URL or certificate ID
                            if (value.startsWith('http') || value.includes('.')) {
                              setFormData(prev => ({ ...prev, certificate_url: value, certificate_id: '' }));
                            } else {
                              setFormData(prev => ({ ...prev, certificate_id: value, certificate_url: '' }));
                            }
                          }
                          setVerificationStatus(null);
                          setExtractionSuccess(false);
                        }}
                        placeholder={selectedPlatform?.id === 'other' 
                          ? "https://example.com/certificate/123" 
                          : "https://ude.my/UC-xxx or UC-794d8663-2295-4407-84f6-f7cb2f0f1c01"
                        }
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {selectedPlatform?.id === 'other' 
                        ? 'Paste the full certificate verification URL'
                        : 'Paste the full URL or just the certificate ID'
                      }
                    </p>
                  </div>
                </div>

                {/* Verification Status Display */}
                {verificationStatus && (
                  <div ref={verificationStatusRef}>
                    {verificationStatus === 'success' && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900">Certificate Verified!</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Your certificate has been successfully verified. Click Continue to proceed.
                            </p>
                            {formData.certificate_url && (
                              <a 
                                href={formData.certificate_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-2 font-medium"
                              >
                                <LinkIcon size={14} />
                                View Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


                  </div>
                )}

                {/* Info Note - only show when no verification status */}
                {!verificationStatus && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      For best results, upload a clear screenshot of your certificate. This allows us to automatically extract all details including course name, instructor, and completion date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Certificate Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificate Details</h3>
                <p className="text-gray-500 text-sm mt-1">Review and edit the extracted information</p>
              </div>

              <div className="space-y-4">
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
                      value={formData.organization || selectedPlatform?.name || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Stanford University"
                      disabled={selectedPlatform?.id !== 'other'}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm ${
                        selectedPlatform?.id !== 'other'
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      }`}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Certificate URL
                    </label>
                    <input
                      type="url"
                      name="certificate_url"
                      value={formData.certificate_url}
                      readOnly
                      disabled
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Certificate ID
                    </label>
                    <input
                      type="text"
                      name="certificate_id"
                      value={formData.certificate_id}
                      onChange={handleInputChange}
                      placeholder="e.g., UC-ABC123"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of what you learned..."
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
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

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
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
              disabled={!canProceedToNextStep() || extracting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {extracting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  {certificateImage ? 'Extracting...' : 'Verifying...'}
                </>
              ) : currentStep === 2 && certificateImage ? (
                <>
                  <Sparkles size={18} />
                  Extract & Verify
                </>
              ) : currentStep === 2 && (formData.certificate_url || formData.certificate_id) ? (
                <>
                  <Sparkles size={18} />
                  Verify & Continue
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={18} />
                </>
              )}
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
