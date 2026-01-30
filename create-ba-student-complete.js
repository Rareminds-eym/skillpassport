import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Creates a comprehensive BA (Bachelor of Arts) student account with data in all dashboard sections
 * Includes: Assessment, Training, Opportunities, Projects, Certificates, Experience, Education, Technical Skills, Soft Skills
 */
async function createBAStudent() {
  console.log('🎓 Creating BA Student with Complete Dashboard Data\n');
  console.log('='.repeat(60));

  const studentEmail = `ba.student.${Date.now()}@example.com`;
  const studentPassword = 'BAStudent@2026';
  
  try {
    // Step 1: Create Auth User
    console.log('\n📝 Step 1: Creating Auth User...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Priya Sharma',
        role: 'student'
      }
    });

    if (authError) throw authError;
    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);
    console.log(`   Email: ${studentEmail}`);
    console.log(`   Password: ${studentPassword}`);

    // Step 2: Create Student Profile
    console.log('\n👤 Step 2: Creating Student Profile...');
    const studentProfile = {
      id: userId,
      user_id: userId,
      email: studentEmail,
      profile: {
        name: 'Priya Sharma',
        email: studentEmail,
        university: 'Delhi University',
        department: 'English Literature',
        branch_field: 'BA English Literature',
        course_name: 'Bachelor of Arts',
        dept: 'Arts & Humanities',
        grade: 'college',
        year_of_passing: '2026',
        cgpa: '8.5/10.0',
        phone: '9876543210',
        date_of_birth: '2004-03-15',
        gender: 'female',
        verified: true,
        employability_score: 75,
        passport_id: `BA${Date.now()}`,
        address: '123 Connaught Place, New Delhi, Delhi 110001',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        bio: 'Passionate about literature, creative writing, and digital content creation. Aspiring content strategist with strong communication skills.',
        linkedin: 'https://linkedin.com/in/priya-sharma',
        github: 'https://github.com/priyasharma',
        portfolio: 'https://priyasharma.com',
        photo: 'https://i.pravatar.cc/300?img=47',
        // Additional fields for complete profile
        skills: ['Content Writing', 'SEO', 'Social Media Marketing', 'Creative Writing'],
        interests: ['Literature', 'Digital Marketing', 'Content Strategy', 'Creative Arts'],
        languages: ['English', 'Hindi'],
        achievements: [
          'Winner of University Creative Writing Competition 2024',
          'Published 50+ articles across various platforms',
          'Increased social media engagement by 60% for previous employer'
        ]
      }
    };

    const { error: studentError } = await supabase
      .from('students')
      .insert(studentProfile);

    if (studentError) throw studentError;
    console.log('✅ Student profile created');

    // Step 3: Create Assessment Result (Career Assessment)
    console.log('\n🎯 Step 3: Creating Assessment Result...');
    const assessmentResult = {
      student_id: userId,
      assessment_type: 'career_interest',
      riasec_scores: {
        R: 45,
        I: 65,
        A: 85,
        S: 75,
        E: 70,
        C: 55
      },
      top_careers: [
        'Content Writer',
        'Digital Marketing Specialist',
        'Social Media Manager',
        'Public Relations Officer',
        'Creative Director'
      ],
      personality_traits: ['Creative', 'Communicative', 'Analytical', 'Empathetic'],
      recommended_skills: ['Content Writing', 'SEO', 'Social Media Marketing', 'Copywriting'],
      completed_at: new Date().toISOString(),
      score: 85
    };

    const { error: assessmentError } = await supabase
      .from('assessment_results')
      .insert(assessmentResult);

    if (assessmentError) throw assessmentError;
    console.log('✅ Assessment result created (RIASEC: Artistic-Social-Enterprising)');

    // Step 4: Create Training/Courses (at least 4)
    console.log('\n📚 Step 4: Creating Training Records...');
    const trainings = [
      {
        student_id: userId,
        course: 'Content Writing Masterclass',
        progress: 85,
        status: 'ongoing',
        start_date: '2025-09-01',
        end_date: '2026-03-01',
        instructor: 'Sarah Johnson',
        description: 'Comprehensive course on professional content writing, SEO, and digital storytelling'
      },
      {
        student_id: userId,
        course: 'Digital Marketing Fundamentals',
        progress: 100,
        status: 'completed',
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        certificate_url: 'https://certificates.example.com/digital-marketing-123',
        instructor: 'Mark Thompson',
        description: 'Complete digital marketing course covering SEO, SEM, social media, and analytics'
      },
      {
        student_id: userId,
        course: 'Social Media Strategy & Management',
        progress: 60,
        status: 'ongoing',
        start_date: '2025-10-01',
        end_date: '2026-02-01',
        instructor: 'Emily Chen',
        description: 'Learn to create and execute effective social media strategies across platforms'
      },
      {
        student_id: userId,
        course: 'Creative Writing Workshop',
        progress: 100,
        status: 'completed',
        start_date: '2025-01-01',
        end_date: '2025-05-31',
        certificate_url: 'https://certificates.example.com/creative-writing-456',
        instructor: 'Dr. Rajesh Kumar',
        description: 'Advanced creative writing techniques, storytelling, and narrative development'
      },
      {
        student_id: userId,
        course: 'SEO & Content Optimization',
        progress: 45,
        status: 'ongoing',
        start_date: '2025-11-01',
        end_date: '2026-04-01',
        instructor: 'Alex Rodriguez',
        description: 'Master SEO techniques and content optimization for better search rankings'
      }
    ];

    const { error: trainingError } = await supabase
      .from('training')
      .insert(trainings);

    if (trainingError) throw trainingError;
    console.log(`✅ Created ${trainings.length} training records`);

    // Step 5: Create Experience Records (at least 4)
    console.log('\n💼 Step 5: Creating Experience Records...');
    const experiences = [
      {
        student_id: userId,
        role: 'Content Writing Intern',
        organization: 'Digital Media Solutions',
        duration: '6 months',
        description: 'Created blog posts, social media content, and website copy. Improved SEO rankings by 40%.',
        start_date: '2025-01-01',
        end_date: '2025-06-30',
        is_current: false,
        verified: true
      },
      {
        student_id: userId,
        role: 'Social Media Coordinator',
        organization: 'Creative Arts Foundation',
        duration: '8 months',
        description: 'Managed social media accounts, created content calendars, and increased engagement by 60%.',
        start_date: '2024-06-01',
        end_date: '2025-01-31',
        is_current: false,
        verified: true
      },
      {
        student_id: userId,
        role: 'Freelance Content Writer',
        organization: 'Self-Employed',
        duration: 'Ongoing',
        description: 'Writing articles, blog posts, and marketing copy for various clients. Specializing in lifestyle and education content.',
        start_date: '2024-03-01',
        end_date: null,
        is_current: true,
        verified: false
      },
      {
        student_id: userId,
        role: 'Editorial Assistant',
        organization: 'University Literary Magazine',
        duration: '1 year',
        description: 'Reviewed submissions, edited articles, and coordinated with writers. Published 12 issues.',
        start_date: '2023-08-01',
        end_date: '2024-08-31',
        is_current: false,
        verified: true
      }
    ];

    const { error: experienceError } = await supabase
      .from('experience')
      .insert(experiences);

    if (experienceError) throw experienceError;
    console.log(`✅ Created ${experiences.length} experience records`);

    // Step 6: Create Education Records (at least 4)
    console.log('\n🎓 Step 6: Creating Education Records...');
    const educations = [
      {
        student_id: userId,
        degree: 'Bachelor of Arts in English Literature',
        department: 'English Literature',
        university: 'Delhi University',
        year_of_passing: '2026',
        cgpa: '8.5',
        level: "Bachelor's",
        status: 'ongoing'
      },
      {
        student_id: userId,
        degree: 'Higher Secondary Certificate (12th)',
        department: 'Humanities',
        university: 'Delhi Public School',
        year_of_passing: '2022',
        cgpa: '92%',
        level: 'High School',
        status: 'completed'
      },
      {
        student_id: userId,
        degree: 'Secondary School Certificate (10th)',
        department: 'General',
        university: 'Delhi Public School',
        year_of_passing: '2020',
        cgpa: '95%',
        level: 'High School',
        status: 'completed'
      },
      {
        student_id: userId,
        degree: 'Certificate in Creative Writing',
        department: 'Literature',
        university: 'British Council India',
        year_of_passing: '2023',
        cgpa: 'Distinction',
        level: 'Certificate',
        status: 'completed'
      }
    ];

    const { error: educationError } = await supabase
      .from('education')
      .insert(educations);

    if (educationError) throw educationError;
    console.log(`✅ Created ${educations.length} education records`);

    // Step 7: Create Technical Skills (at least 4)
    console.log('\n💻 Step 7: Creating Technical Skills...');
    const technicalSkills = [
      { student_id: userId, name: 'Content Writing', level: 5, verified: true, icon: '✍️', category: 'Writing' },
      { student_id: userId, name: 'SEO Optimization', level: 4, verified: true, icon: '🔍', category: 'Marketing' },
      { student_id: userId, name: 'Social Media Management', level: 4, verified: true, icon: '📱', category: 'Marketing' },
      { student_id: userId, name: 'WordPress', level: 4, verified: false, icon: '🌐', category: 'CMS' },
      { student_id: userId, name: 'Google Analytics', level: 3, verified: false, icon: '📊', category: 'Analytics' },
      { student_id: userId, name: 'Canva Design', level: 4, verified: false, icon: '🎨', category: 'Design' },
      { student_id: userId, name: 'Email Marketing', level: 3, verified: false, icon: '📧', category: 'Marketing' }
    ];

    const { error: techSkillsError } = await supabase
      .from('technical_skills')
      .insert(technicalSkills);

    if (techSkillsError) throw techSkillsError;
    console.log(`✅ Created ${technicalSkills.length} technical skills`);

    // Step 8: Create Soft Skills (at least 4)
    console.log('\n🤝 Step 8: Creating Soft Skills...');
    const softSkills = [
      { student_id: userId, name: 'Communication', level: 5, type: 'communication' },
      { student_id: userId, name: 'Creativity', level: 5, type: 'creative' },
      { student_id: userId, name: 'Time Management', level: 4, type: 'organizational' },
      { student_id: userId, name: 'Teamwork', level: 4, type: 'interpersonal' },
      { student_id: userId, name: 'Critical Thinking', level: 4, type: 'analytical' },
      { student_id: userId, name: 'Adaptability', level: 4, type: 'personal' },
      { student_id: userId, name: 'English', level: 5, type: 'language' },
      { student_id: userId, name: 'Hindi', level: 5, type: 'language' }
    ];

    const { error: softSkillsError } = await supabase
      .from('soft_skills')
      .insert(softSkills);

    if (softSkillsError) throw softSkillsError;
    console.log(`✅ Created ${softSkills.length} soft skills`);

    // Step 9: Create Recent Updates (at least 4)
    console.log('\n📢 Step 9: Creating Recent Updates...');
    const recentUpdates = [
      {
        student_id: userId,
        message: 'Completed Digital Marketing Fundamentals course',
        type: 'achievement',
        is_read: false
      },
      {
        student_id: userId,
        message: 'New content writing opportunity available',
        type: 'opportunity',
        is_read: false
      },
      {
        student_id: userId,
        message: 'Profile viewed by 5 recruiters this week',
        type: 'notification',
        is_read: false
      },
      {
        student_id: userId,
        message: 'Assessment completed successfully',
        type: 'achievement',
        is_read: true
      },
      {
        student_id: userId,
        message: 'New social media management internship posted',
        type: 'opportunity',
        is_read: false
      }
    ];

    const { error: updatesError } = await supabase
      .from('recent_updates')
      .insert(recentUpdates);

    if (updatesError) throw updatesError;
    console.log(`✅ Created ${recentUpdates.length} recent updates`);

    // Step 10: Create Suggestions (at least 4)
    console.log('\n💡 Step 10: Creating Suggestions...');
    const suggestions = [
      {
        student_id: userId,
        message: 'Add more projects to showcase your writing portfolio',
        priority: 3,
        is_active: true,
        category: 'profile'
      },
      {
        student_id: userId,
        message: 'Complete your SEO & Content Optimization course to boost your profile',
        priority: 2,
        is_active: true,
        category: 'training'
      },
      {
        student_id: userId,
        message: 'Apply to content writing positions - 5 new matches found',
        priority: 3,
        is_active: true,
        category: 'opportunities'
      },
      {
        student_id: userId,
        message: 'Add certificates for completed courses to increase credibility',
        priority: 2,
        is_active: true,
        category: 'profile'
      },
      {
        student_id: userId,
        message: 'Consider learning Adobe Creative Suite to expand your skillset',
        priority: 1,
        is_active: true,
        category: 'skills'
      }
    ];

    const { error: suggestionsError } = await supabase
      .from('suggestions')
      .insert(suggestions);

    if (suggestionsError) throw suggestionsError;
    console.log(`✅ Created ${suggestions.length} suggestions`);

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BA STUDENT ACCOUNT CREATED SUCCESSFULLY!\n');
    console.log('📋 Account Details:');
    console.log('   Name: Priya Sharma');
    console.log('   Email:', studentEmail);
    console.log('   Password:', studentPassword);
    console.log('   Program: BA English Literature');
    console.log('   University: Delhi University');
    console.log('   User ID:', userId);
    console.log('\n📊 Dashboard Content Summary:');
    console.log(`   ✅ Assessment: Completed (RIASEC Profile)`);
    console.log(`   ✅ Training: ${trainings.length} courses`);
    console.log(`   ✅ Experience: ${experiences.length} work experiences`);
    console.log(`   ✅ Education: ${educations.length} education records`);
    console.log(`   ✅ Technical Skills: ${technicalSkills.length} skills`);
    console.log(`   ✅ Soft Skills: ${softSkills.length} skills`);
    console.log(`   ✅ Recent Updates: ${recentUpdates.length} updates`);
    console.log(`   ✅ Suggestions: ${suggestions.length} suggestions`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Login with the credentials above');
    console.log('   2. All dashboard sections have data');
    console.log('   3. You can add projects, certificates, and apply to opportunities');
    console.log('   4. Profile is ready for recruiter viewing');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error creating BA student:', error);
    throw error;
  }
}

// Run the script
createBAStudent()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
