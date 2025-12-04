/**
 * Test Script: Copy Curriculum Template Feature
 * 
 * This script tests the copy curriculum functionality
 * Run this in browser console after logging in as an educator
 */

async function testCopyCurriculumFlow() {
  console.log('🧪 Starting Copy Curriculum Template Test...\n');

  // Step 1: Get current user
  console.log('Step 1: Authenticating user...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Authentication failed:', authError);
    return;
  }
  console.log('✅ User authenticated:', user.email);

  // Step 2: Get educator details
  console.log('\nStep 2: Fetching educator details...');
  const { data: educator, error: educatorError } = await supabase
    .from('school_educators')
    .select('id, school_id, first_name, last_name')
    .eq('user_id', user.id)
    .single();

  if (educatorError || !educator) {
    console.error('❌ Educator not found:', educatorError);
    return;
  }
  console.log('✅ Educator found:', educator.first_name, educator.last_name);
  console.log('   School ID:', educator.school_id);

  // Step 3: Check for existing curriculums
  console.log('\nStep 3: Checking existing curriculums...');
  const { data: existingCurriculums, error: fetchError } = await supabase
    .from('curriculums')
    .select(`
      id,
      subject,
      class,
      academic_year,
      status,
      curriculum_chapters (count)
    `)
    .eq('school_id', educator.school_id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    console.error('❌ Failed to fetch curriculums:', fetchError);
    return;
  }

  console.log(`✅ Found ${existingCurriculums.length} existing curriculum(s):`);
  existingCurriculums.forEach((curr, idx) => {
    console.log(`   ${idx + 1}. ${curr.subject} - Class ${curr.class} (${curr.academic_year}) - Status: ${curr.status}`);
  });

  if (existingCurriculums.length === 0) {
    console.log('\n⚠️  No curriculums found. Please create one first before testing copy feature.');
    return;
  }

  // Step 4: Select source curriculum (first one)
  const sourceCurriculum = existingCurriculums[0];
  console.log('\n Step 4: Selected source curriculum:');
  console.log('   ID:', sourceCurriculum.id);
  console.log('   Subject:', sourceCurriculum.subject);
  console.log('   Class:', sourceCurriculum.class);
  console.log('   Academic Year:', sourceCurriculum.academic_year);

  // Step 5: Fetch detailed source curriculum
  console.log('\nStep 5: Fetching source curriculum details...');
  const { data: sourceDetails, error: detailsError } = await supabase
    .from('curriculums')
    .select(`
      id,
      subject,
      class,
      academic_year,
      curriculum_chapters (
        id,
        name,
        order_number,
        curriculum_learning_outcomes (
          id,
          outcome,
          outcome_assessment_mappings (
            id
          )
        )
      )
    `)
    .eq('id', sourceCurriculum.id)
    .single();

  if (detailsError) {
    console.error('❌ Failed to fetch details:', detailsError);
    return;
  }

  const chapterCount = sourceDetails.curriculum_chapters.length;
  const outcomeCount = sourceDetails.curriculum_chapters.reduce(
    (sum, ch) => sum + ch.curriculum_learning_outcomes.length, 0
  );
  const mappingCount = sourceDetails.curriculum_chapters.reduce(
    (sum, ch) => sum + ch.curriculum_learning_outcomes.reduce(
      (s, lo) => s + lo.outcome_assessment_mappings.length, 0
    ), 0
  );

  console.log('✅ Source curriculum details:');
  console.log(`   Chapters: ${chapterCount}`);
  console.log(`   Learning Outcomes: ${outcomeCount}`);
  console.log(`   Assessment Mappings: ${mappingCount}`);

  // Step 6: Define target parameters
  const targetSubject = sourceCurriculum.subject;
  const targetClass = sourceCurriculum.class;
  const targetAcademicYear = '2025-2026'; // Different year

  console.log('\nStep 6: Target parameters:');
  console.log('   Subject:', targetSubject);
  console.log('   Class:', targetClass);
  console.log('   Academic Year:', targetAcademicYear);

  // Step 7: Check if target already exists
  console.log('\nStep 7: Checking if target already exists...');
  const { data: existingTarget } = await supabase
    .from('curriculums')
    .select('id')
    .eq('school_id', educator.school_id)
    .eq('subject', targetSubject)
    .eq('class', targetClass)
    .eq('academic_year', targetAcademicYear)
    .maybeSingle();

  if (existingTarget) {
    console.log('⚠️  Target curriculum already exists. Deleting it first...');
    
    // Delete existing target
    const { error: deleteError } = await supabase
      .from('curriculums')
      .delete()
      .eq('id', existingTarget.id);

    if (deleteError) {
      console.error('❌ Failed to delete existing target:', deleteError);
      return;
    }
    console.log('✅ Existing target deleted');
  } else {
    console.log('✅ Target does not exist, safe to copy');
  }

  // Step 8: Call copy function
  console.log('\nStep 8: Calling copy_curriculum_template function...');
  const { data: newCurriculumId, error: copyError } = await supabase
    .rpc('copy_curriculum_template', {
      p_source_curriculum_id: sourceCurriculum.id,
      p_target_school_id: educator.school_id,
      p_target_subject: targetSubject,
      p_target_class: targetClass,
      p_target_academic_year: targetAcademicYear,
      p_created_by: educator.id
    });

  if (copyError) {
    console.error('❌ Copy failed:', copyError);
    return;
  }

  console.log('✅ Curriculum copied successfully!');
  console.log('   New Curriculum ID:', newCurriculumId);

  // Step 9: Verify copied curriculum
  console.log('\nStep 9: Verifying copied curriculum...');
  const { data: copiedCurriculum, error: verifyError } = await supabase
    .from('curriculums')
    .select(`
      id,
      subject,
      class,
      academic_year,
      status,
      curriculum_chapters (
        id,
        name,
        order_number,
        curriculum_learning_outcomes (
          id,
          outcome,
          outcome_assessment_mappings (
            id
          )
        )
      )
    `)
    .eq('id', newCurriculumId)
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
    return;
  }

  const copiedChapterCount = copiedCurriculum.curriculum_chapters.length;
  const copiedOutcomeCount = copiedCurriculum.curriculum_chapters.reduce(
    (sum, ch) => sum + ch.curriculum_learning_outcomes.length, 0
  );
  const copiedMappingCount = copiedCurriculum.curriculum_chapters.reduce(
    (sum, ch) => sum + ch.curriculum_learning_outcomes.reduce(
      (s, lo) => s + lo.outcome_assessment_mappings.length, 0
    ), 0
  );

  console.log('✅ Copied curriculum verified:');
  console.log(`   Chapters: ${copiedChapterCount} (expected: ${chapterCount})`);
  console.log(`   Learning Outcomes: ${copiedOutcomeCount} (expected: ${outcomeCount})`);
  console.log(`   Assessment Mappings: ${copiedMappingCount} (expected: ${mappingCount})`);
  console.log(`   Status: ${copiedCurriculum.status} (expected: draft)`);

  // Step 10: Validation
  console.log('\nStep 10: Validation...');
  const validations = [
    { name: 'Chapters match', pass: copiedChapterCount === chapterCount },
    { name: 'Outcomes match', pass: copiedOutcomeCount === outcomeCount },
    { name: 'Mappings match', pass: copiedMappingCount === mappingCount },
    { name: 'Status is draft', pass: copiedCurriculum.status === 'draft' },
    { name: 'Subject matches', pass: copiedCurriculum.subject === targetSubject },
    { name: 'Class matches', pass: copiedCurriculum.class === targetClass },
    { name: 'Academic year matches', pass: copiedCurriculum.academic_year === targetAcademicYear },
  ];

  let allPassed = true;
  validations.forEach(v => {
    if (v.pass) {
      console.log(`   ✅ ${v.name}`);
    } else {
      console.log(`   ❌ ${v.name}`);
      allPassed = false;
    }
  });

  // Final result
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Copy Curriculum feature is working correctly.');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the results above.');
  }
  console.log('='.repeat(60));

  return {
    success: allPassed,
    sourceCurriculumId: sourceCurriculum.id,
    newCurriculumId: newCurriculumId,
    stats: {
      chapters: { source: chapterCount, copied: copiedChapterCount },
      outcomes: { source: outcomeCount, copied: copiedOutcomeCount },
      mappings: { source: mappingCount, copied: copiedMappingCount }
    }
  };
}

// Run the test
console.log('📝 Copy Curriculum Template Test Script');
console.log('To run the test, execute: testCopyCurriculumFlow()');
console.log('Make sure you are logged in as an educator with existing curriculums.\n');

// Auto-run if in test environment
if (typeof window !== 'undefined' && window.location.pathname.includes('curriculum')) {
  console.log('🚀 Auto-running test in 3 seconds...');
  setTimeout(() => {
    testCopyCurriculumFlow().catch(err => {
      console.error('💥 Test failed with error:', err);
    });
  }, 3000);
}
