
import React, { useState, useEffect } from 'react';
import { Trophy, X, Medal, Award, Loader2, AlertCircle, FileText, Download, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import jsPDF from 'jspdf';

const CompetitionResults = () => {
  const [activeTab, setActiveTab] = useState('results'); // 'results' or 'certificates'
  const [competitions, setCompetitions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Competition Results Modal
  const [resultsModal, setResultsModal] = useState({ open: false, competition: null });
  const [competitionResults, setCompetitionResults] = useState([]);
  const [savingResults, setSavingResults] = useState(false);
  
  // Certificate Preview Modal
  const [certificatePreview, setCertificatePreview] = useState({ open: false, certificate: null });

  // Load current user and initial data
  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCompetitions();
      if (activeTab === 'certificates') {
        loadCertificates();
      }
    }
  }, [currentUser, activeTab]);

  const loadCurrentUser = async () => {
    try {
      let schoolId = null;
      let userId = null;
      let userEmail = null;
      let educatorId = null;
      let userRole = null;
      
      // First, check if user is logged in via AuthContext (for school admins)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('📦 Found user in localStorage:', userData.email, 'role:', userData.role);
          
          if (userData.role === 'school_admin' && userData.schoolId) {
            schoolId = userData.schoolId;
            userId = userData.id;
            userEmail = userData.email;
            userRole = 'school_admin';
            console.log('✅ School admin detected, using schoolId from localStorage:', schoolId);
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      // If not found in localStorage, try Supabase Auth (for educators/teachers)
      if (!schoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('🔍 Checking Supabase auth user:', user.email);
          userEmail = user.email;
          
          // Check school_educators table
          const { data: educator } = await supabase
            .from('school_educators')
            .select('id, school_id, email')
            .eq('user_id', user.id)
            .single();
          
          if (educator?.school_id) {
            schoolId = educator.school_id;
            userId = educator.id;
            educatorId = educator.id;
            userRole = 'educator';
            console.log('✅ Found school_id in school_educators:', schoolId, 'educator_id:', educatorId);
          } else {
            // Check schools table by email
            const { data: school } = await supabase
              .from('schools')
              .select('id, email')
              .eq('email', user.email)
              .single();
            
            if (school?.id) {
              schoolId = school.id;
              userId = school.id;
              userRole = 'school_admin';
              console.log('✅ Found school_id in schools table:', schoolId);
            }
          }
        }
      }

      if (!schoolId) {
        setNotice({ type: 'error', text: 'Please log in to continue' });
        setLoading(false);
        return;
      }

      setCurrentUser({ 
        id: userId, 
        school_id: schoolId, 
        email: userEmail,
        educator_id: educatorId,
        role: userRole
      });
    } catch (error) {
      console.error('Error loading user:', error);
      setNotice({ type: 'error', text: 'Failed to load user information' });
      setLoading(false);
    }
  };

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      
      // Fetch competitions with registration count
      const { data: compsData, error: compsError } = await supabase
        .from('competitions')
        .select(`
          comp_id,
          name,
          description,
          level,
          category,
          competition_date,
          status,
          school_id
        `)
        .eq('school_id', currentUser.school_id)
        .order('competition_date', { ascending: false });

      if (compsError) throw compsError;

      // For each competition, get registration count
      const competitionsWithCount = await Promise.all(
        compsData.map(async (comp) => {
          const { count, error: countError } = await supabase
            .from('competition_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('comp_id', comp.comp_id)
            .eq('status', 'registered');

          return {
            ...comp,
            registrations_count: countError ? 0 : count
          };
        })
      );

      setCompetitions(competitionsWithCount);
    } catch (error) {
      console.error('Error loading competitions:', error);
      setNotice({ type: 'error', text: 'Failed to load competitions' });
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      setLoading(true);
      
      // Fetch certificates with related data
      const { data: certsData, error: certsError } = await supabase
        .from('club_certificates')
        .select(`
          certificate_id,
          student_email,
          title,
          description,
          certificate_type,
          issued_date,
          credential_id,
          related_comp_id,
          is_verified,
          students (
            name,
            grade,
            section
          ),
          competitions (
            name,
            level,
            category
          )
        `)
        .eq('school_id', currentUser.school_id)
        .eq('certificate_type', 'competition')
        .order('issued_date', { ascending: false });

      if (certsError) throw certsError;

      setCertificates(certsData || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setNotice({ type: 'error', text: 'Failed to load certificates' });
    } finally {
      setLoading(false);
    }
  };

  const openResultsModal = async (competition) => {
    try {
      setResultsModal({ open: true, competition });
      
      // Load registered students
      const { data: registrations, error: regError } = await supabase
        .from('competition_registrations')
        .select(`
          registration_id,
          student_email,
          team_name,
          students (
            name,
            email,
            grade,
            section
          )
        `)
        .eq('comp_id', competition.comp_id)
        .eq('status', 'registered');

      if (regError) throw regError;

      // Load existing results if any
      const { data: existingResults, error: resultsError } = await supabase
        .from('competition_results')
        .select('*')
        .eq('comp_id', competition.comp_id);

      if (resultsError) throw resultsError;

      // Merge registrations with existing results
      const resultsData = registrations.map(reg => {
        const existingResult = existingResults?.find(
          r => r.student_email === reg.student_email
        );

        return {
          registration_id: reg.registration_id,
          student_email: reg.student_email,
          student_name: reg.students?.name || 'Unknown Student',
          grade: reg.students?.grade,
          section: reg.students?.section,
          team_name: reg.team_name,
          rank: existingResult?.rank || null,
          score: existingResult?.score || null,
          award: existingResult?.award || null,
          notes: existingResult?.performance_notes || '',
          result_id: existingResult?.result_id || null
        };
      });

      setCompetitionResults(resultsData);
    } catch (error) {
      console.error('Error loading registrations:', error);
      setNotice({ type: 'error', text: 'Failed to load participants' });
    }
  };

  const handleResultChange = (studentEmail, field, value) => {
    setCompetitionResults(prev =>
      prev.map(result =>
        result.student_email === studentEmail
          ? { ...result, [field]: value }
          : result
      )
    );
  };

  const handleSaveResults = async () => {
    try {
      setSavingResults(true);

      // Validate all results have scores
      const incomplete = competitionResults.filter(r => r.score === null || r.score === '');
      if (incomplete.length > 0) {
        setNotice({ type: "error", text: "Please enter scores for all participants" });
        return;
      }

      // Auto-assign ranks and awards based on scores
      const sorted = [...competitionResults].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
      const withRanks = sorted.map((result, index) => ({
        ...result,
        rank: index + 1,
        award: index === 0 ? 'Gold Medal - 1st Place' :
               index === 1 ? 'Silver Medal - 2nd Place' :
               index === 2 ? 'Bronze Medal - 3rd Place' :
               parseFloat(result.score) >= 70 ? 'Certificate of Merit' :
               'Certificate of Participation'
      }));

      // Prepare data for upsert
      const resultsToSave = withRanks.map(result => {
        const payload = {
          comp_id: resultsModal.competition.comp_id,
          registration_id: result.registration_id,
          student_email: result.student_email,
          rank: result.rank,
          score: parseFloat(result.score),
          award: result.award,
          performance_notes: result.notes || null,
          certificate_issued: false
        };
        
        // Set recorder fields based on user type
        // The constraint requires EXACTLY ONE of these pairs to be set:
        // (recorded_by_educator_id IS NOT NULL AND recorded_by_admin_id IS NULL AND recorded_by_type = 'educator') OR
        // (recorded_by_educator_id IS NULL AND recorded_by_admin_id IS NOT NULL AND recorded_by_type = 'admin')
        
        if (currentUser.educator_id) {
          // User is an educator
          payload.recorded_by_type = 'educator';
          payload.recorded_by_educator_id = currentUser.educator_id;
          payload.recorded_by_admin_id = null;
        } else {
          // User is a school admin
          payload.recorded_by_type = 'admin';
          payload.recorded_by_educator_id = null;
          payload.recorded_by_admin_id = currentUser.id;
        }
        
        // Only include result_id if it exists (for updates)
        if (result.result_id) {
          payload.result_id = result.result_id;
        }
        
        return payload;
      });

      // Upsert results (insert or update)
      const { error: upsertError } = await supabase
        .from('competition_results')
        .upsert(resultsToSave, {
          onConflict: 'result_id',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      // Update competition status to completed if not already
      if (resultsModal.competition.status !== 'completed') {
        const { error: updateError } = await supabase
          .from('competitions')
          .update({ status: 'completed' })
          .eq('comp_id', resultsModal.competition.comp_id);

        if (updateError) throw updateError;
      }

      // Auto-generate certificates for all participants
      await generateCertificatesForCompetition(resultsModal.competition.comp_id, withRanks);

      setNotice({
        type: "success",
        text: `Results saved successfully for ${resultsModal.competition?.name}! Certificates generated.`
      });
      
      setResultsModal({ open: false, competition: null });
      setCompetitionResults([]);
      loadCompetitions(); // Refresh the list
    } catch (error) {
      console.error('Error saving results:', error);
      setNotice({ 
        type: 'error', 
        text: `Failed to save results: ${error.message}` 
      });
    } finally {
      setSavingResults(false);
    }
  };

  const generateCertificatesForCompetition = async (compId, resultsWithRanks) => {
    try {
      // Auto-generate certificates for all participants
      const certificatesToCreate = resultsWithRanks.map(result => {
        const certificatePayload = {
          student_email: result.student_email,
          school_id: currentUser.school_id,
          title: `${resultsModal.competition.name} - ${result.award}`,
          description: `Awarded for achieving ${result.award} in ${resultsModal.competition.name}`,
          certificate_type: 'competition',
          issuer: resultsModal.competition.name,
          issued_date: new Date().toISOString().split('T')[0],
          related_comp_id: compId,
          template_used: 'competition_standard',
          metadata: {
            rank: result.rank,
            score: parseFloat(result.score),
            award: result.award,
            competition_level: resultsModal.competition.level,
            competition_category: resultsModal.competition.category,
            competition_date: resultsModal.competition.competition_date
          }
        };

        // Set issuer fields based on user type
        if (currentUser.educator_id) {
          certificatePayload.issued_by_type = 'educator';
          certificatePayload.issued_by_educator_id = currentUser.educator_id;
          certificatePayload.issued_by_admin_id = null;
        } else {
          certificatePayload.issued_by_type = 'admin';
          certificatePayload.issued_by_educator_id = null;
          certificatePayload.issued_by_admin_id = currentUser.id;
        }

        return certificatePayload;
      });

      // Insert certificates
      const { error: certError } = await supabase
        .from('club_certificates')
        .insert(certificatesToCreate);

      if (certError) {
        console.error('Error creating certificates:', certError);
        throw certError;
      }

      console.log(`✅ Generated ${certificatesToCreate.length} certificates`);
    } catch (error) {
      console.error('Certificate generation error:', error);
      throw error;
    }
  };

  const getAwardPreview = (score) => {
    if (!score) return 'Enter score first';
    const numScore = parseFloat(score);
    if (numScore >= 90) return '🥇 Gold Medal';
    if (numScore >= 80) return '🥈 Silver Medal';
    if (numScore >= 70) return '🥉 Bronze Medal';
    return '📜 Participation';
  };

  const downloadCertificate = async (certificate) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Background gradient effect (using rectangles)
      doc.setFillColor(255, 250, 240); // Light cream
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Border
      doc.setDrawColor(218, 165, 32); // Golden
      doc.setLineWidth(3);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      doc.setLineWidth(1);
      doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

      // Decorative corners
      doc.setFillColor(218, 165, 32);
      doc.circle(20, 20, 3, 'F');
      doc.circle(pageWidth - 20, 20, 3, 'F');
      doc.circle(20, pageHeight - 20, 3, 'F');
      doc.circle(pageWidth - 20, pageHeight - 20, 3, 'F');

      // Header - Certificate of Achievement
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(218, 165, 32);
      doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 40, { align: 'center' });

      // Subtitle line
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('This is to certify that', pageWidth / 2, 55, { align: 'center' });

      // Student Name
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const studentName = certificate.students?.name || certificate.student_email;
      doc.text(studentName, pageWidth / 2, 70, { align: 'center' });

      // Underline for name
      doc.setDrawColor(218, 165, 32);
      doc.setLineWidth(0.5);
      const nameWidth = doc.getTextWidth(studentName);
      doc.line(pageWidth / 2 - nameWidth / 2 - 10, 72, pageWidth / 2 + nameWidth / 2 + 10, 72);

      // Achievement text
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('has successfully achieved', pageWidth / 2, 85, { align: 'center' });

      // Award/Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(218, 165, 32);
      const title = certificate.title || 'Excellence in Competition';
      doc.text(title, pageWidth / 2, 100, { align: 'center', maxWidth: pageWidth - 60 });

      // Competition details
      if (certificate.competitions?.name) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80, 80, 80);
        doc.text(`in ${certificate.competitions.name}`, pageWidth / 2, 112, { align: 'center' });
      }

      // Performance details box
      if (certificate.metadata?.rank || certificate.metadata?.score) {
        const boxY = 125;
        doc.setFillColor(255, 248, 220);
        doc.roundedRect(pageWidth / 2 - 50, boxY, 100, 20, 3, 3, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        
        let detailsText = '';
        if (certificate.metadata?.rank) {
          detailsText += `Rank: #${certificate.metadata.rank}`;
        }
        if (certificate.metadata?.score) {
          if (detailsText) detailsText += '  |  ';
          detailsText += `Score: ${certificate.metadata.score}`;
        }
        
        doc.text(detailsText, pageWidth / 2, boxY + 12, { align: 'center' });
      }

      // Date and Credential ID
      const footerY = pageHeight - 40;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const issueDate = new Date(certificate.issued_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.text(`Date: ${issueDate}`, 30, footerY);
      
      if (certificate.credential_id) {
        doc.text(`Certificate ID: ${certificate.credential_id}`, pageWidth - 30, footerY, { align: 'right' });
      }

      // Signature line
      const sigY = pageHeight - 50;
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
      
      doc.setFontSize(9);
      doc.text('Authorized Signature', pageWidth / 2, sigY + 5, { align: 'center' });

      // Save the PDF
      const fileName = `Certificate_${studentName.replace(/\s+/g, '_')}_${certificate.certificate_id}.pdf`;
      doc.save(fileName);

      setNotice({ type: 'success', text: 'Certificate downloaded successfully!' });
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      setNotice({ type: 'error', text: 'Failed to generate certificate PDF' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
          <p className="text-gray-600">Loading competitions...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access competition results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <Trophy size={40} />
            <div>
              <h1 className="text-3xl font-bold mb-2">Competition Results</h1>
              <p className="text-indigo-100">Enter and manage competition results and awards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Notice */}
        {notice && (
          <div className={`mb-6 p-4 rounded-lg ${
            notice.type === 'error' ? 'bg-red-50 text-red-700' :
            notice.type === 'success' ? 'bg-green-50 text-green-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="text-sm underline">Dismiss</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'results'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy size={20} />
                Competition Results
              </div>
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'certificates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={20} />
                Certificates ({certificates.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Quick Stats */}
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {competitions.filter(c => c.status === 'completed').length}
                  </p>
                </div>
                <Award className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ongoing</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {competitions.filter(c => c.status === 'ongoing').length}
                  </p>
                </div>
                <Trophy className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {competitions.filter(c => c.status === 'upcoming').length}
                  </p>
                </div>
                <Medal className="text-gray-400" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Competitions List */}
        {activeTab === 'results' && (
        <div className="space-y-4">
          {competitions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Competitions Yet</h3>
              <p className="text-gray-500">Competition results will appear here once events are created.</p>
            </div>
          ) : (
            competitions.map(comp => (
              <div
                key={comp.comp_id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="text-yellow-500" size={24} />
                      <h3 className="text-xl font-bold text-gray-900">{comp.name}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        comp.status === 'completed' ? 'bg-green-100 text-green-700' :
                        comp.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                        comp.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {comp.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {comp.description && (
                      <p className="text-sm text-gray-600 mb-3">{comp.description}</p>
                    )}
                    
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Level</p>
                        <p className="font-semibold text-gray-900 capitalize">{comp.level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-semibold text-gray-900 capitalize">{comp.category || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(comp.competition_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Participants</p>
                        <p className="font-semibold text-gray-900">{comp.registrations_count || 0}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openResultsModal(comp)}
                    disabled={comp.status === 'upcoming' || comp.status === 'cancelled'}
                    className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      comp.status === 'upcoming' || comp.status === 'cancelled'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {comp.status === 'completed' ? 'View/Edit Results' : 'Enter Results'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        )}

        {/* Certificates View
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Certificates Yet</h3>
                <p className="text-gray-500">Certificates will appear here after competition results are saved.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map(cert => (
                  <div
                    key={cert.certificate_id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="text-yellow-500" size={24} />
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cert.certificate_type === 'competition' ? 'bg-purple-100 text-purple-700' :
                          cert.certificate_type === 'excellence' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {cert.certificate_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cert.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-medium text-gray-900">{cert.student_email}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Issued:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(cert.issued_date).toLocaleDateString()}
                        </span>
                      </div>
                      {cert.metadata?.rank && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rank:</span>
                          <span className="font-bold text-indigo-600">#{cert.metadata.rank}</span>
                        </div>
                      )}
                      {cert.metadata?.score && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-bold text-green-600">{cert.metadata.score}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCertificatePreview({ open: true, certificate: cert })}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => downloadCertificate(cert)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )} */}

        {/* Certificates List */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Certificates Yet</h3>
                <p className="text-gray-500">Certificates will appear here after competition results are saved.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map(cert => (
                  <div
                    key={cert.certificate_id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="text-yellow-500" size={24} />
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                          {cert.certificate_type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cert.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-semibold text-gray-900 text-xs">{cert.student_email}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Issued:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(cert.issued_date).toLocaleDateString()}
                        </span>
                      </div>
                      {cert.credential_id && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">ID:</span>
                          <span className="font-mono text-xs text-gray-700">{cert.credential_id}</span>
                        </div>
                      )}
                      {cert.metadata?.rank && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rank:</span>
                          <span className="font-bold text-indigo-600">#{cert.metadata.rank}</span>
                        </div>
                      )}
                      {cert.metadata?.score && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-bold text-green-600">{cert.metadata.score}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setCertificatePreview({ open: true, certificate: cert })}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Entry Modal */}
        {resultsModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{resultsModal.competition?.name}</h3>
                    <p className="text-sm text-indigo-100 mt-1">
                      Enter scores and results for all participants
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResultsModal({ open: false, competition: null });
                      setCompetitionResults([]);
                    }}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {competitionResults.map((result, index) => (
                    <div
                      key={result.student_email}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Student Details
                            </label>
                            <div className="text-sm font-semibold text-gray-900">
                              {result.student_name}
                            </div>
                            <div className="text-xs text-gray-500">{result.student_email}</div>
                            <div className="text-xs text-gray-500">
                              Grade {result.grade} - {result.section}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Score * (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={result.score || ''}
                              onChange={(e) => handleResultChange(result.student_email, 'score', e.target.value)}
                              placeholder="0-100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Award (Auto)
                            </label>
                            <div className="text-sm text-gray-600 italic py-2">
                              {getAwardPreview(result.score)}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Performance Notes
                            </label>
                            <input
                              type="text"
                              value={result.notes || ''}
                              onChange={(e) => handleResultChange(result.student_email, 'notes', e.target.value)}
                              placeholder="Optional notes about performance"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {competitionResults.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="mx-auto mb-4 text-gray-300" size={48} />
                    <p>No participants registered for this competition</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{competitionResults.length}</span> participants
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResultsModal({ open: false, competition: null });
                        setCompetitionResults([]);
                      }}
                      disabled={savingResults}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveResults}
                      disabled={savingResults}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingResults && <Loader2 className="animate-spin" size={16} />}
                      {savingResults ? 'Saving...' : 'Save Results & Generate Certificates'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Preview Modal */}
        {certificatePreview.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award size={28} />
                    <h3 className="text-xl font-bold">Certificate Details</h3>
                  </div>
                  <button
                    onClick={() => setCertificatePreview({ open: false, certificate: null })}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-lg p-8 mb-6">
                  <div className="text-center mb-6">
                    <Award className="mx-auto text-yellow-500 mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {certificatePreview.certificate?.title}
                    </h2>
                    <p className="text-gray-600">{certificatePreview.certificate?.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white rounded-lg p-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Student Email</p>
                      <p className="font-semibold text-gray-900">{certificatePreview.certificate?.student_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Issued Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(certificatePreview.certificate?.issued_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Certificate Type</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {certificatePreview.certificate?.certificate_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Credential ID</p>
                      <p className="font-mono text-sm text-gray-900">{certificatePreview.certificate?.credential_id}</p>
                    </div>
                    {certificatePreview.certificate?.metadata?.rank && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Rank</p>
                        <p className="font-bold text-indigo-600 text-lg">
                          #{certificatePreview.certificate.metadata.rank}
                        </p>
                      </div>
                    )}
                    {certificatePreview.certificate?.metadata?.score && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Score</p>
                        <p className="font-bold text-green-600 text-lg">
                          {certificatePreview.certificate.metadata.score}
                        </p>
                      </div>
                    )}
                    {certificatePreview.certificate?.metadata?.award && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Award</p>
                        <p className="font-bold text-yellow-600 text-lg">
                          {certificatePreview.certificate.metadata.award}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCertificatePreview({ open: false, certificate: null })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => downloadCertificate(certificatePreview.certificate)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionResults;