import jsPDF from 'jspdf';
import {
  AlertCircle,
  Award,
  Download,
  Eye,
  FileText,
  Grid3X3,
  List,
  Loader2,
  Medal,
  Search,
  Trophy,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import KPICard from '../../../components/admin/KPICard';
import { supabase } from '../../../lib/supabaseClient';

const CompetitionResults = () => {
  const [activeTab, setActiveTab] = useState('results'); // 'results' or 'certificates'
  const [competitions, setCompetitions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [awardFilter, setAwardFilter] = useState('all');
  const [certificateCategoryFilter, setCertificateCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 items per page for 3x2 grid

  // Competition Results Modal
  const [resultsModal, setResultsModal] = useState({ open: false, competition: null });
  const [competitionResults, setCompetitionResults] = useState([]);
  const [savingResults, setSavingResults] = useState(false);
  const [competitionCertificates, setCompetitionCertificates] = useState([]);

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          console.log('🔍 Checking Supabase auth user:', user.email);
          userEmail = user.email;

          // Check school_educators table - use maybeSingle() to avoid 406 error
          const { data: educator } = await supabase
            .from('school_educators')
            .select('id, school_id, email')
            .eq('user_id', user.id)
            .maybeSingle();

          if (educator?.school_id) {
            schoolId = educator.school_id;
            userId = educator.id;
            educatorId = educator.id;
            userRole = 'educator';
            console.log(
              '✅ Found school_id in school_educators:',
              schoolId,
              'educator_id:',
              educatorId
            );
          } else {
            // Check organizations table by email
            const { data: org } = await supabase
              .from('organizations')
              .select('id, email')
              .eq('organization_type', 'school')
              .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (org?.id) {
              schoolId = org.id;
              userId = org.id;
              userRole = 'school_admin';
              console.log('✅ Found school_id in organizations table:', schoolId);
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
        role: userRole,
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
        .select(
          `
          comp_id,
          name,
          description,
          level,
          category,
          competition_date,
          status,
          school_id
        `
        )
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
            registrations_count: countError ? 0 : count,
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
        .select(
          `
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
        `
        )
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
        .select(
          `
          registration_id,
          student_email,
          team_name,
          students (
            name,
            email,
            grade,
            section
          )
        `
        )
        .eq('comp_id', competition.comp_id)
        .eq('status', 'registered');

      if (regError) throw regError;

      // Load existing results if any
      const { data: existingResults, error: resultsError } = await supabase
        .from('competition_results')
        .select('*')
        .eq('comp_id', competition.comp_id);

      if (resultsError) throw resultsError;

      // Load certificates for this competition
      const { data: competitionCerts, error: certsError } = await supabase
        .from('club_certificates')
        .select(
          `
          certificate_id,
          student_email,
          title,
          description,
          certificate_type,
          issued_date,
          credential_id,
          metadata,
          students (
            name,
            grade,
            section
          )
        `
        )
        .eq('related_comp_id', competition.comp_id)
        .eq('school_id', currentUser.school_id);

      if (certsError) {
        console.error('Error loading competition certificates:', certsError);
        setCompetitionCertificates([]);
      } else {
        setCompetitionCertificates(competitionCerts || []);
      }

      // Merge registrations with existing results
      const resultsData = registrations.map((reg) => {
        const existingResult = existingResults?.find((r) => r.student_email === reg.student_email);

        return {
          registration_id: reg.registration_id,
          student_email: reg.student_email,
          // @ts-expect-error - Auto-suppressed for migration
          student_name: reg.students?.name || 'Unknown Student',
          // @ts-expect-error - Auto-suppressed for migration
          grade: reg.students?.grade,
          // @ts-expect-error - Auto-suppressed for migration
          section: reg.students?.section,
          team_name: reg.team_name,
          rank: existingResult?.rank || null,
          score: existingResult?.score || null,
          award: existingResult?.award || null,
          notes: existingResult?.performance_notes || '',
          result_id: existingResult?.result_id || null,
        };
      });

      setCompetitionResults(resultsData);
    } catch (error) {
      console.error('Error loading registrations:', error);
      setNotice({ type: 'error', text: 'Failed to load participants' });
    }
  };

  const handleResultChange = (studentEmail, field, value) => {
    setCompetitionResults((prev) =>
      prev.map((result) =>
        result.student_email === studentEmail ? { ...result, [field]: value } : result
      )
    );
  };

  const handleSaveResults = async () => {
    try {
      setSavingResults(true);

      // Validate all results have scores
      const incomplete = competitionResults.filter((r) => r.score === null || r.score === '');
      if (incomplete.length > 0) {
        setNotice({ type: 'error', text: 'Please enter scores for all participants' });
        return;
      }

      // Auto-assign ranks and awards based on scores
      const sorted = [...competitionResults].sort(
        (a, b) => parseFloat(b.score) - parseFloat(a.score)
      );
      const withRanks = sorted.map((result, index) => ({
        ...result,
        rank: index + 1,
        award:
          index === 0
            ? 'Gold Medal - 1st Place'
            : index === 1
              ? 'Silver Medal - 2nd Place'
              : index === 2
                ? 'Bronze Medal - 3rd Place'
                : parseFloat(result.score) >= 70
                  ? 'Certificate of Merit'
                  : 'Certificate of Participation',
      }));

      // Separate new records from updates
      const newRecords = [];
      const updateRecords = [];

      withRanks.forEach((result) => {
        const payload = {
          comp_id: resultsModal.competition.comp_id,
          registration_id: result.registration_id,
          student_email: result.student_email,
          rank: result.rank,
          score: parseFloat(result.score),
          award: result.award,
          performance_notes: result.notes || null,
          certificate_issued: false,
        };

        // Set recorder fields based on user type
        if (currentUser.educator_id) {
          // @ts-expect-error - Auto-suppressed for migration
          payload.recorded_by_type = 'educator';
          // @ts-expect-error - Auto-suppressed for migration
          payload.recorded_by_educator_id = currentUser.educator_id;
          // @ts-expect-error - Auto-suppressed for migration
          payload.recorded_by_admin_id = null;
        } else {
          // @ts-expect-error - Auto-suppressed for migration
          payload.recorded_by_type = 'admin';
          // @ts-expect-error - Auto-suppressed for migration
          payload.recorded_by_educator_id = null;
          // @ts-expect-error - Auto-suppressed for migration
          payload.recorded_by_admin_id = currentUser.id;
        }

        if (result.result_id) {
          // This is an update
          // @ts-expect-error - Auto-suppressed for migration
          payload.result_id = result.result_id;
          updateRecords.push(payload);
        } else {
          // This is a new record
          newRecords.push(payload);
        }
      });

      // Insert new records
      if (newRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('competition_results')
          .insert(newRecords);

        if (insertError) throw insertError;
      }

      // Update existing records
      if (updateRecords.length > 0) {
        const { error: updateError } = await supabase
          .from('competition_results')
          .upsert(updateRecords, {
            onConflict: 'result_id',
            ignoreDuplicates: false,
          });

        if (updateError) throw updateError;
      }

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

      // Reload certificates for the modal
      const { data: updatedCerts } = await supabase
        .from('club_certificates')
        .select(
          `
          certificate_id,
          student_email,
          title,
          description,
          certificate_type,
          issued_date,
          credential_id,
          metadata,
          students (
            name,
            grade,
            section
          )
        `
        )
        .eq('related_comp_id', resultsModal.competition.comp_id)
        .eq('school_id', currentUser.school_id);

      setCompetitionCertificates(updatedCerts || []);

      setNotice({
        type: 'success',
        text: `Results saved successfully for ${resultsModal.competition?.name}! Certificates generated.`,
      });

      // Don't close the modal, keep it open to show certificates
      loadCompetitions(); // Refresh the list
    } catch (error) {
      console.error('Error saving results:', error);
      setNotice({
        type: 'error',
        text: `Failed to save results: ${error.message}`,
      });
    } finally {
      setSavingResults(false);
    }
  };

  const generateCertificatesForCompetition = async (compId, resultsWithRanks) => {
    try {
      // Auto-generate certificates for all participants
      const certificatesToCreate = resultsWithRanks.map((result) => {
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
            competition_date: resultsModal.competition.competition_date,
          },
        };

        // Set issuer fields based on user type
        if (currentUser.educator_id) {
          // @ts-expect-error - Auto-suppressed for migration
          certificatePayload.issued_by_type = 'educator';
          // @ts-expect-error - Auto-suppressed for migration
          certificatePayload.issued_by_educator_id = currentUser.educator_id;
          // @ts-expect-error - Auto-suppressed for migration
          certificatePayload.issued_by_admin_id = null;
        } else {
          // @ts-expect-error - Auto-suppressed for migration
          certificatePayload.issued_by_type = 'admin';
          // @ts-expect-error - Auto-suppressed for migration
          certificatePayload.issued_by_educator_id = null;
          // @ts-expect-error - Auto-suppressed for migration
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
    if (numScore >= 90) return 'Gold Medal';
    if (numScore >= 80) return 'Silver Medal';
    if (numScore >= 70) return 'Bronze Medal';
    return 'Participation';
  };

  // Filter competitions based on search and filters
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || comp.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || comp.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Filter certificates based on search and filters
  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.students?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCertCategory =
      certificateCategoryFilter === 'all' ||
      cert.competitions?.category === certificateCategoryFilter;

    // Fix award filtering to match the actual award text format
    let matchesAward = true;
    if (awardFilter !== 'all') {
      // Check both metadata.award and title for award information
      const awardText = (cert.metadata?.award || '').toLowerCase();
      const titleText = (cert.title || '').toLowerCase();

      switch (awardFilter) {
        case 'gold':
          matchesAward = awardText.includes('gold medal') || titleText.includes('gold medal');
          break;
        case 'silver':
          matchesAward = awardText.includes('silver medal') || titleText.includes('silver medal');
          break;
        case 'bronze':
          matchesAward = awardText.includes('bronze medal') || titleText.includes('bronze medal');
          break;
        case 'merit':
          matchesAward =
            awardText.includes('certificate of merit') ||
            titleText.includes('certificate of merit');
          break;
        case 'participation':
          matchesAward =
            awardText.includes('certificate of participation') ||
            titleText.includes('certificate of participation');
          break;
        default:
          matchesAward = true;
      }
    }

    // Debug logging (remove in production)
    if (awardFilter !== 'all' || certificateCategoryFilter !== 'all') {
      console.log('Certificate filtering:', {
        title: cert.title,
        award: cert.metadata?.award,
        category: cert.competitions?.category,
        awardFilter,
        certificateCategoryFilter,
        matchesAward,
        matchesCertCategory,
        matchesSearch,
      });
    }

    return matchesSearch && matchesCertCategory && matchesAward;
  });

  // Pagination logic
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Get paginated data
  const paginatedCompetitions = getCurrentPageData(filteredCompetitions);
  const paginatedCertificates = getCurrentPageData(filteredCertificates);

  // Get total pages for current tab
  const totalPages =
    activeTab === 'results'
      ? getTotalPages(filteredCompetitions)
      : getTotalPages(filteredCertificates);

  // Reset pagination when switching tabs or changing filters
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setAwardFilter('all');
    setCertificateCategoryFilter('all');
  };

  // Reset pagination when search/filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, awardFilter, certificateCategoryFilter]);

  const downloadCertificate = async (certificate) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Background gradient effect (using rectangles)
      doc.setFillColor(240, 248, 255); // Light blue background
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Border
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setLineWidth(3);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      doc.setLineWidth(1);
      doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

      // Decorative corners
      doc.setFillColor(59, 130, 246); // Blue corners
      doc.circle(20, 20, 3, 'F');
      doc.circle(pageWidth - 20, 20, 3, 'F');
      doc.circle(20, pageHeight - 20, 3, 'F');
      doc.circle(pageWidth - 20, pageHeight - 20, 3, 'F');

      // Header - Certificate of Achievement
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246); // Blue header
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
      doc.setDrawColor(59, 130, 246); // Blue underline
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
      doc.setTextColor(59, 130, 246); // Blue title
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
        doc.setFillColor(239, 246, 255); // Light blue box
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
        day: 'numeric',
      });

      doc.text(`Date: ${issueDate}`, 30, footerY);

      if (certificate.credential_id) {
        doc.text(`Certificate ID: ${certificate.credential_id}`, pageWidth - 30, footerY, {
          align: 'right',
        });
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Competition Results</h1>
              <p className="text-gray-600 mt-2">Enter and manage competition results and awards</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Completed"
            value={competitions.filter((c) => c.status === 'completed').length}
            icon={<Award className="w-6 h-6" />}
            color="blue"
            loading={loading}
          />

          <KPICard
            title="Ongoing"
            value={competitions.filter((c) => c.status === 'ongoing').length}
            icon={<Trophy className="w-6 h-6" />}
            color="green"
            loading={loading}
          />

          <KPICard
            title="Upcoming"
            value={competitions.filter((c) => c.status === 'upcoming').length}
            icon={<Medal className="w-6 h-6" />}
            color="yellow"
            loading={loading}
          />

          <KPICard
            title="Certificates"
            value={certificates.length}
            icon={<FileText className="w-6 h-6" />}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="relative flex items-center p-2 gap-2 min-w-fit">
              {/* Sliding Background Indicator */}
              <div
                className={`absolute top-2 bottom-2 rounded-md transition-all duration-500 ease-in-out shadow-lg bg-blue-600`}
                style={{
                  width: 'calc(70% - 6px)',
                  left: activeTab === 'results' ? '10px' : 'calc(90% + 2px)',
                }}
              />

              <button
                onClick={() => handleTabChange('results')}
                className={`relative z-10 px-8 py-3 rounded-md font-medium transition-all duration-300 min-w-fit ${
                  activeTab === 'results' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy
                    size={18}
                    className={`transition-all duration-300 ${
                      activeTab === 'results' ? 'scale-110' : ''
                    }`}
                  />
                  <span>Competition Results</span>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('certificates')}
                className={`relative z-10 px-8 py-3 rounded-md font-medium transition-all duration-300 min-w-fit ${
                  activeTab === 'certificates' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {/* <div className="flex items-center gap-3">
                  <FileText size={18} className={`transition-all duration-300 ${
                    activeTab === "certificates" ? "scale-110" : ""
                  }`} />
                  <span>Certificates ({certificates.length})</span>
                </div> */}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'results' ? 'Search competitions...' : 'Search certificates...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {activeTab === 'results' && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="arts">Arts</option>
                    <option value="sports">Sports</option>
                    <option value="robotics">Robotics</option>
                    <option value="science">Science</option>
                    <option value="literature">Literature</option>
                  </select>
                </>
              )}

              {activeTab === 'certificates' && (
                <>
                  <select
                    value={certificateCategoryFilter}
                    onChange={(e) => setCertificateCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="arts">Arts</option>
                    <option value="sports">Sports</option>
                    <option value="robotics">Robotics</option>
                    <option value="science">Science</option>
                    <option value="literature">Literature</option>
                  </select>

                  <select
                    value={awardFilter}
                    onChange={(e) => setAwardFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Awards</option>
                    <option value="gold">Gold Medal</option>
                    <option value="silver">Silver Medal</option>
                    <option value="bronze">Bronze Medal</option>
                    <option value="merit">Certificate of Merit</option>
                    <option value="participation">Certificate of Participation</option>
                  </select>
                </>
              )}

              {/* Grid Toggle Button */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              notice.type === 'error'
                ? 'bg-red-50 text-red-700'
                : notice.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-blue-50 text-blue-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="text-sm underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Competitions List */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {filteredCompetitions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Competitions Found</h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? `No competitions match your search "${searchQuery}"`
                    : 'Competition results will appear here once events are created.'}
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {paginatedCompetitions.map((comp) => (
                    <div
                      key={comp.comp_id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden min-h-[280px]"
                    >
                      {/* Competition Header */}
                      <div className="bg-blue-50 p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <Trophy size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 capitalize">
                                  {comp.level}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comp.competition_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              comp.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : comp.status === 'ongoing'
                                  ? 'bg-blue-100 text-blue-700'
                                  : comp.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {comp.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Competition Content */}
                      <div className="p-6 flex flex-col justify-between flex-1">
                        {comp.description && (
                          <p className="text-sm text-gray-600 mb-4">{comp.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-xs text-gray-600">Category</p>
                            <p className="font-semibold text-gray-900 capitalize">
                              {comp.category || 'General'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Participants</p>
                            <p className="font-semibold text-gray-900">
                              {comp.registrations_count || 0}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => openResultsModal(comp)}
                          disabled={comp.status === 'upcoming' || comp.status === 'cancelled'}
                          className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                            comp.status === 'upcoming' || comp.status === 'cancelled'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {comp.status === 'completed' ? 'View Results' : 'Enter Results'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredCompetitions.length)} of{' '}
                      {filteredCompetitions.length} competitions
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Certificates List */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {filteredCertificates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Certificates Found</h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? `No certificates match your search "${searchQuery}"`
                    : 'Certificates will appear here after competition results are saved.'}
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {paginatedCertificates.map((cert) => (
                    <div
                      key={cert.certificate_id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden min-h-[280px]"
                    >
                      {/* Certificate Header */}
                      <div className="bg-blue-50 p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <Award size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                {cert.certificate_type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Content */}
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.title}</h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {cert.description}
                          </p>

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Student:</span>
                              <span className="font-semibold text-gray-900 text-xs">
                                {cert.student_email}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Issued:</span>
                              <span className="font-semibold text-gray-900">
                                {new Date(cert.issued_date).toLocaleDateString()}
                              </span>
                            </div>
                            {cert.metadata?.rank && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Rank:</span>
                                <span className="font-bold text-blue-600">
                                  #{cert.metadata.rank}
                                </span>
                              </div>
                            )}
                            {cert.metadata?.score && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Score:</span>
                                <span className="font-bold text-green-600">
                                  {cert.metadata.score}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setCertificatePreview({ open: true, certificate: cert })}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredCertificates.length)} of{' '}
                      {filteredCertificates.length} certificates
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Results Entry Modal */}
        {resultsModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 text-white">
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
                      setCompetitionCertificates([]);
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

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
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
                              onChange={(e) =>
                                handleResultChange(result.student_email, 'score', e.target.value)
                              }
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

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Performance Notes
                            </label>
                            <input
                              type="text"
                              value={result.notes || ''}
                              onChange={(e) =>
                                handleResultChange(result.student_email, 'notes', e.target.value)
                              }
                              placeholder="Optional notes"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Certificate
                            </label>
                            {(() => {
                              const studentCert = competitionCertificates.find(
                                (cert) => cert.student_email === result.student_email
                              );
                              if (studentCert) {
                                return (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        setCertificatePreview({
                                          open: true,
                                          certificate: studentCert,
                                        })
                                      }
                                      className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center justify-center gap-1"
                                      title="View Certificate"
                                    >
                                      <Eye size={12} />
                                      View
                                    </button>
                                    <button
                                      onClick={() => downloadCertificate(studentCert)}
                                      className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 flex items-center justify-center gap-1"
                                      title="Download Certificate"
                                    >
                                      <Download size={12} />
                                      PDF
                                    </button>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-xs text-gray-500 py-2 text-center">
                                    {result.score
                                      ? 'Save results to generate'
                                      : 'Enter score first'}
                                  </div>
                                );
                              }
                            })()}
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
                        setCompetitionCertificates([]);
                      }}
                      disabled={savingResults}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveResults}
                      disabled={savingResults}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-600 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
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
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-blue-400 rounded-lg p-8 mb-6">
                  <div className="text-center mb-6">
                    <Award className="mx-auto text-blue-500 mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {certificatePreview.certificate?.title}
                    </h2>
                    <p className="text-gray-600">{certificatePreview.certificate?.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white rounded-lg p-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Student Email</p>
                      <p className="font-semibold text-gray-900">
                        {certificatePreview.certificate?.student_email}
                      </p>
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
                      <p className="font-mono text-sm text-gray-900">
                        {certificatePreview.certificate?.credential_id}
                      </p>
                    </div>
                    {certificatePreview.certificate?.metadata?.rank && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Rank</p>
                        <p className="font-bold text-blue-600 text-lg">
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
                        <p className="font-bold text-blue-600 text-lg">
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
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
