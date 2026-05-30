/**
 * Certificate Generation Test Page
 * Test the certificate generation with different scenarios
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent } from '@/shared/ui';
import { Download, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/features/auth';

interface TestScenario {
  id: string;
  name: string;
  learnerName: string;
  learnerId: string;
  courseName: string;
  courseType: 'course' | 'webinar';
  educatorName: string;
  issuedOnDate: string | null;
}

const testScenarios: TestScenario[] = [
  {
    id: 'test-course-1',
    name: 'Regular Course - Short Name',
    learnerName: 'John Doe',
    learnerId: 'LRN001',
    courseName: 'Introduction to React',
    courseType: 'course',
    educatorName: 'Dr. Sarah Johnson',
    issuedOnDate: null
  },
  {
    id: 'test-course-2',
    name: 'Regular Course - Long Name',
    learnerName: 'Jane Smith',
    learnerId: 'LRN002',
    courseName: 'Advanced Full Stack Web Development with Modern JavaScript Frameworks',
    courseType: 'course',
    educatorName: 'Prof. Michael Chen',
    issuedOnDate: null
  },
  {
    id: 'test-webinar-1',
    name: 'Webinar - Short Name',
    learnerName: 'Alice Johnson',
    learnerId: 'LRN003',
    courseName: 'AI in Education',
    courseType: 'webinar',
    educatorName: 'Dr. Emily Brown',
    issuedOnDate: '2024-01-15'
  },
  {
    id: 'test-webinar-2',
    name: 'Webinar - Long Name',
    learnerName: 'Bob Williams',
    learnerId: 'LRN004',
    courseName: 'Future of Machine Learning and Artificial Intelligence in Modern Software Development',
    courseType: 'webinar',
    educatorName: 'Prof. David Lee',
    issuedOnDate: '2024-02-20'
  },
  {
    id: 'test-course-3',
    name: 'Course - No Learner ID',
    learnerName: 'Charlie Brown',
    learnerId: '',
    courseName: 'Python Programming Basics',
    courseType: 'course',
    educatorName: 'Ms. Rachel Green',
    issuedOnDate: null
  }
];

export default function CertificateTest() {
  const user = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [generatedCertificates, setGeneratedCertificates] = useState<Record<string, {
    url: string;
    credentialId: string;
  }>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error('Please login to access the certificate test page');
      navigate('/login');
    }
  }, [user, navigate]);

  // Don't render if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleGenerateCertificate = async (scenario: TestScenario) => {
    setLoading(scenario.id);
    
    try {
      // Import the certificate generation functions directly
      const { generateCertificateHTML } = await import('@/features/certificate-generation/lib/certificateTemplate');
      
      // Generate credential ID
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const credentialId = `CERT-${timestamp}-${random}`;
      
      // Determine completion date
      let completionDate: string;
      if (scenario.courseType === 'webinar' && scenario.issuedOnDate) {
        completionDate = scenario.issuedOnDate;
      } else {
        completionDate = new Date().toISOString().split('T')[0];
      }
      
      // Generate HTML
      const certificateHTML = generateCertificateHTML(
        {
          studentName: scenario.learnerName,
          studentId: scenario.learnerId || 'N/A',
          courseName: scenario.courseName,
          completionDate: completionDate,
          instructorName: scenario.educatorName,
          credentialId: credentialId,
          courseType: scenario.courseType
        },
        window.location.origin
      );
      
      // Convert HTML to image using html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Create temporary container with proper dimensions
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = '3579px';
      container.style.height = '2551px';
      container.style.overflow = 'visible';
      container.style.display = 'block';
      container.innerHTML = certificateHTML;
      document.body.appendChild(container);
      
      try {
        // Wait for images to load
        const images = container.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = () => {
                console.warn('Image failed to load:', img.src);
                resolve(null);
              };
              setTimeout(() => resolve(null), 8000);
            });
          })
        );
        
        // Longer delay to ensure complete rendering
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get the actual rendered height
        const actualHeight = Math.max(
          container.scrollHeight,
          container.offsetHeight,
          container.clientHeight,
          2551
        );
        
        console.log('Container dimensions:', {
          scrollHeight: container.scrollHeight,
          offsetHeight: container.offsetHeight,
          clientHeight: container.clientHeight,
          actualHeight
        });
        
        // Generate canvas with proper settings
        const canvas = await html2canvas(container, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          logging: true,
          backgroundColor: '#ffffff',
          width: 3579,
          height: actualHeight,
          windowWidth: 3579,
          windowHeight: actualHeight,
          scrollX: 0,
          scrollY: -window.scrollY,
          x: 0,
          y: 0
        });
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        
        // Store the data URL
        setGeneratedCertificates(prev => ({
          ...prev,
          [scenario.id]: {
            url: dataUrl,
            credentialId: credentialId
          }
        }));
        
        // Auto-download
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${scenario.courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Certificate generated and downloaded!`);
      } finally {
        // Clean up
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast.error('An error occurred while generating the certificate');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadCertificate = async (scenario: TestScenario) => {
    const cert = generatedCertificates[scenario.id];
    if (!cert) return;

    try {
      // Download the data URL
      const link = document.createElement('a');
      link.href = cert.url;
      link.download = `${scenario.courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Certificate downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handlePreviewCertificate = (scenario: TestScenario) => {
    const cert = generatedCertificates[scenario.id];
    if (!cert) return;

    // Open data URL in new tab
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Certificate Preview - ${scenario.courseName}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <img src="${cert.url}" alt="Certificate" />
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Certificate Generation Test Page
              </h1>
              <p className="text-gray-600">
                Test certificate generation with different scenarios (courses, webinars, various name lengths)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logged in as:</p>
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Authentication Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Test Mode - No Upload</h4>
                <p className="text-sm text-blue-700">
                  This test page generates certificates locally and downloads them directly as PNG files. 
                  No data is uploaded to the server or saved to the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testScenarios.map((scenario) => {
            const isGenerated = !!generatedCertificates[scenario.id];
            const isLoading = loading === scenario.id;

            return (
              <Card key={scenario.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Scenario Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {scenario.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        scenario.courseType === 'webinar' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {scenario.courseType === 'webinar' ? 'Webinar' : 'Course'}
                      </span>
                    </div>
                    {isGenerated && (
                      <FileCheck className="w-6 h-6 text-green-500" />
                    )}
                  </div>

                  {/* Scenario Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Learner:</span>
                      <span className="text-gray-600">{scenario.learnerName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Learner ID:</span>
                      <span className="text-gray-600">{scenario.learnerId || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Course:</span>
                      <span className="text-gray-600">{scenario.courseName}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Instructor:</span>
                      <span className="text-gray-600">{scenario.educatorName}</span>
                    </div>
                    {scenario.issuedOnDate && (
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32">Issued On:</span>
                        <span className="text-gray-600">{scenario.issuedOnDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Generated Certificate Info */}
                  {isGenerated && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-medium text-green-800 mb-1">
                        Certificate Generated
                      </p>
                      <p className="text-xs text-green-700 font-mono break-all">
                        ID: {generatedCertificates[scenario.id].credentialId}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateCertificate(scenario)}
                      disabled={isLoading}
                      className="flex-1"
                      variant={isGenerated ? 'outline' : 'default'}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          {isGenerated ? 'Regenerate' : 'Generate'}
                        </>
                      )}
                    </Button>

                    {isGenerated && (
                      <>
                        <Button
                          onClick={() => handlePreviewCertificate(scenario)}
                          variant="outline"
                          size="icon"
                          title="Preview"
                        >
                          <FileCheck className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDownloadCertificate(scenario)}
                          variant="outline"
                          size="icon"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Testing Instructions
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">1.</span>
                <span>Click "Generate" on any scenario to create a certificate</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">2.</span>
                <span>Once generated, use the preview icon to view the certificate in a new tab</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">3.</span>
                <span>Use the download icon to save the certificate as a PNG file</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">4.</span>
                <span>Test different scenarios to verify course vs webinar formatting</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">5.</span>
                <span>Check that long course names are properly formatted</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">6.</span>
                <span>Verify that webinar dates use the "issued_on" date instead of current date</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* What to Check */}
        <Card className="mt-4">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              What to Verify
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">For Courses:</h4>
                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                  <li>"Certificate of COMPLETION"</li>
                  <li>"has successfully completed the course on"</li>
                  <li>"completed on [current date]"</li>
                  <li>Instructor signature visible</li>
                  <li>Admin signature visible</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">For Webinars:</h4>
                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                  <li>"Certificate of PARTICIPATION"</li>
                  <li>"has actively participated in the webinar session on"</li>
                  <li>"conducted on [issued_on date]"</li>
                  <li>Instructor signature visible</li>
                  <li>Admin signature visible</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
