import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { X, Upload, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function AddLearningCourseModal({ isOpen, onClose, studentId, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    provider: '',
    start_date: '',
    end_date: '',
    status: 'ongoing',
    completed_modules: 0,
    total_modules: 0,
    hours_spent: 0,
    certificate_url: '',
    skills_covered: '',
    description: ''
  });
  
  const [isExternal, setIsExternal] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [assessmentScore, setAssessmentScore] = useState(null);
  const [certificateLevel, setCertificateLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showInitialVerification, setShowInitialVerification] = useState(true);
  const [initialVerificationData, setInitialVerificationData] = useState({
    courseName: '',
    provider: '',
    certificateUrl: ''
  });

  // Known organizations that don't require assessment
  const knownOrganizations = [
    'Coursera', 'Udemy', 'edX', 'LinkedIn Learning', 'Pluralsight',
    'Udacity', 'Khan Academy', 'FreeCodeCamp', 'Codecademy'
  ];

  // AI Certificate Verification
  const verifyCertificateWithAI = async () => {
    setVerifying(true);
    setError('');
    
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('AI API key not configured. Please add OPENAI_API_KEY to your .env file');
      }

      const prompt = `You are a certificate verification assistant. Analyze the following certificate/training details and determine if it appears legitimate and valuable.

Certificate Details:
- Course Name: ${formData.title}
- Provider: ${formData.provider || 'Not specified'}
- Organization: ${formData.organization || 'Not specified'}
- Certificate URL: ${formData.certificate_url || 'Not provided'}
- Skills Covered: ${formData.skills_covered || 'Not specified'}
- Duration: ${formData.start_date} to ${formData.end_date || 'Ongoing'}
- Modules: ${formData.completed_modules}/${formData.total_modules}
- Hours Spent: ${formData.hours_spent}

Please analyze:
1. Is this a legitimate/recognized training provider?
2. Does the course content match the skills claimed?
3. Is the certificate URL format valid (if provided)?
4. Are the completion metrics reasonable?
5. Overall credibility score (0-100)

Respond in JSON format:
{
  "isLegitimate": true/false,
  "credibilityScore": 0-100,
  "providerRecognition": "well-known/recognized/unknown/suspicious",
  "concerns": ["list any red flags"],
  "recommendations": ["suggestions for improvement"],
  "summary": "brief assessment"
}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`AI verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const verification = JSON.parse(jsonMatch[0]);
      setVerificationResult(verification);
      
      return verification;
    } catch (err) {
      console.error('AI verification error:', err);
      setError(`Verification failed: ${err.message}`);
      return null;
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check if organization is external
    if (name === 'organization' || name === 'provider' || name === 'skills_covered') {
      const org = name === 'organization' ? value : formData.organization;
      const provider = name === 'provider' ? value : formData.provider;
      const skills = name === 'skills_covered' ? value : formData.skills_covered;
      const orgToCheck = org || provider;
      
      // If skills are provided, check if organization is external
      if (skills && skills.trim().length > 0) {
        const isKnown = knownOrganizations.some(known => 
          orgToCheck.toLowerCase().includes(known.toLowerCase())
        );
        // Set external if organization is not known OR if no organization is provided
        setIsExternal(!isKnown);
      } else {
        setIsExternal(false);
      }
    }
  };

  const generateAssessmentQuestions = async () => {
    // Generate skill-based assessment questions
    const skills = formData.skills_covered.split(',').map(s => s.trim()).filter(Boolean);
    
    if (skills.length === 0) {
      setError('Please add skills covered to generate assessment');
      return;
    }

    // Sample questions - in production, this could be AI-generated or from a question bank
    const questions = skills.slice(0, 5).map((skill, idx) => ({
      id: idx + 1,
      skill,
      question: `Rate your proficiency in ${skill}`,
      type: 'scale',
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    }));

    setAssessmentQuestions(questions);
    setShowAssessment(true);
  };

  const handleAnswerChange = (questionId, answer) => {
    setCurrentAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    const scoreMap = { 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Expert': 100 };
    const scores = Object.values(currentAnswers).map(ans => scoreMap[ans] || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    setAssessmentScore(avgScore);
    
    // Determine certificate level based on score
    let level = '';
    if (avgScore >= 85) level = 'Expert';
    else if (avgScore >= 70) level = 'Advanced';
    else if (avgScore >= 50) level = 'Intermediate';
    else level = 'Beginner';
    
    setCertificateLevel(level);
    return { score: avgScore, level };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // FIRST: Check if assessment is required for external courses with skills
    if (isExternal && !assessmentScore && formData.skills_covered && formData.skills_covered.trim().length > 0) {
      generateAssessmentQuestions();
      return;
    }

    // SECOND: After assessment, check if verification is done
    if (isExternal && !verificationResult && formData.skills_covered && formData.skills_covered.trim().length > 0) {
      setError('Please verify the certificate with AI before adding it to your profile.');
      return;
    }

    setLoading(true);

    try {

      // Insert training record
      const { data: training, error: trainingError } = await supabase
        .from('trainings')
        .insert({
          student_id: studentId,
          title: formData.title,
          organization: formData.organization || formData.provider,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status,
          completed_modules: parseInt(formData.completed_modules) || 0,
          total_modules: parseInt(formData.total_modules) || 0,
          hours_spent: parseInt(formData.hours_spent) || 0,
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
          issuer: formData.organization || formData.provider,
          issued_on: formData.end_date || new Date().toISOString().split('T')[0],
          link: formData.certificate_url,
          level: certificateLevel || null,
          description: formData.description,
          approval_status: 'approved',
          enabled: true
        };

        const { error: certError } = await supabase
          .from('certificates')
          .insert(certificateData);

        if (certError) throw certError;
      }

      // Add skills if provided
      if (formData.skills_covered) {
        const skills = formData.skills_covered.split(',').map(s => s.trim()).filter(Boolean);
        const skillRecords = skills.map(skill => ({
          student_id: studentId,
          training_id: training.id,
          name: skill,
          type: 'technical',
          level: assessmentScore ? Math.ceil(assessmentScore / 20) : 3,
          approval_status: 'approved',
          enabled: true
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
    setFormData({
      title: '',
      organization: '',
      provider: '',
      start_date: '',
      end_date: '',
      status: 'ongoing',
      completed_modules: 0,
      total_modules: 0,
      hours_spent: 0,
      certificate_url: '',
      skills_covered: '',
      description: ''
    });
    setIsExternal(false);
    setShowAssessment(false);
    setAssessmentQuestions([]);
    setCurrentAnswers({});
    setAssessmentScore(null);
    setCertificateLevel('');
    setError('');
    setVerifying(false);
    setVerificationResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-900">Add Learning Course</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add courses from external platforms (Coursera, Udemy, etc.)
          </p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!showAssessment ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Advanced React Development"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <input
                    type="text"
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    placeholder="e.g., Coursera, Udemy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="Issuing organization"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modules Completed
                  </label>
                  <input
                    type="number"
                    name="completed_modules"
                    value={formData.completed_modules}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Modules
                  </label>
                  <input
                    type="number"
                    name="total_modules"
                    value={formData.total_modules}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Spent
                  </label>
                  <input
                    type="number"
                    name="hours_spent"
                    value={formData.hours_spent}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate URL
                  </label>
                  <input
                    type="url"
                    name="certificate_url"
                    value={formData.certificate_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills Covered (comma separated)
                  </label>
                  <textarea
                    name="skills_covered"
                    value={formData.skills_covered}
                    onChange={handleInputChange}
                    placeholder="React, TypeScript, Testing, Node.js"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of what you learned in this training..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* AI Verification Result */}
              {verificationResult && (
                <div className={`border-2 rounded-lg p-4 ${
                  verificationResult.isLegitimate 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {verificationResult.isLegitimate ? (
                      <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        verificationResult.isLegitimate ? 'text-green-900' : 'text-red-900'
                      }`}>
                        AI Verification: {verificationResult.isLegitimate ? 'Verified' : 'Needs Review'}
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Credibility Score:</span>
                          <span className={`font-bold ${
                            verificationResult.credibilityScore >= 70 
                              ? 'text-green-700' 
                              : verificationResult.credibilityScore >= 50 
                                ? 'text-yellow-700' 
                                : 'text-red-700'
                          }`}>
                            {verificationResult.credibilityScore}/100
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Provider Recognition:</span>
                          <span className="capitalize">{verificationResult.providerRecognition}</span>
                        </div>
                        
                        <p className="mt-2 text-gray-700">{verificationResult.summary}</p>
                        
                        {verificationResult.concerns && verificationResult.concerns.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium text-red-800 mb-1">Concerns:</p>
                            <ul className="list-disc list-inside space-y-1 text-red-700">
                              {verificationResult.concerns.map((concern, idx) => (
                                <li key={idx}>{concern}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {verificationResult.recommendations && verificationResult.recommendations.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium text-blue-800 mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                              {verificationResult.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isExternal && formData.skills_covered && formData.skills_covered.trim().length > 0 && !assessmentScore && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900">
                        📝 Assessment Required
                      </p>
                      <p className="text-sm text-blue-800 mt-1 font-medium">
                        Since this is from an external platform, you must complete a skill assessment 
                        before adding this course to your profile.
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        Click "Continue to Assessment" button below to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isExternal && formData.skills_covered && formData.skills_covered.trim().length > 0 && assessmentScore !== null && !verificationResult && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-yellow-900">
                        ⚠️ Verification Required
                      </p>
                      <p className="text-sm text-yellow-800 mt-1 font-medium">
                        Great! Assessment completed. Now verify the certificate 
                        with AI before adding it to your profile. This ensures legitimacy and value.
                      </p>
                      <p className="text-xs text-yellow-700 mt-2">
                        Click "Verify Certificate" button below to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                {/* Step 1: Assessment required first for external courses with skills */}
                {isExternal && formData.skills_covered && formData.skills_covered.trim().length > 0 && !assessmentScore ? (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Take Assessment
                  </button>
                ) : /* Step 2: After assessment, verification required */ 
                isExternal && formData.skills_covered && formData.skills_covered.trim().length > 0 && assessmentScore !== null && !verificationResult ? (
                  <button
                    type="button"
                    onClick={verifyCertificateWithAI}
                    disabled={verifying}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Certificate'
                    )}
                  </button>
                ) : /* Step 3: After both assessment and verification, allow save */ (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Add Learning'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
                <h3 className="font-semibold text-indigo-900 mb-2">Skill Assessment</h3>
                <p className="text-sm text-indigo-700">
                  Please rate your proficiency in the following skills to determine your certificate level.
                </p>
              </div>

              <div className="space-y-4">
                {assessmentQuestions.map((q) => (
                  <div key={q.id} className="border border-gray-200 rounded-md p-4">
                    <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, option)}
                          className={`px-4 py-2 rounded-md border transition-colors ${
                            currentAnswers[q.id] === option
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {assessmentScore !== null && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                  <h4 className="font-semibold text-green-900 mb-2">Assessment Complete!</h4>
                  <p className="text-sm text-green-700">
                    Your score: <span className="font-bold">{assessmentScore.toFixed(0)}%</span>
                  </p>
                  <p className="text-sm text-green-700">
                    Certificate Level: <span className="font-bold">{certificateLevel}</span>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssessment(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                {assessmentScore === null ? (
                  <button
                    type="button"
                    onClick={calculateScore}
                    disabled={Object.keys(currentAnswers).length !== assessmentQuestions.length}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Calculate Score
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Complete & Save'}
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
