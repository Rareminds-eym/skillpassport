#!/usr/bin/env tsx

/**
 * Script to eliminate direct service imports from pages
 * Replaces relative service imports with feature/shared public API imports
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ServiceMapping {
  oldImport: RegExp;
  newImport: string;
  description: string;
}

// Mapping of service imports to their new FSD locations
const serviceMappings: ServiceMapping[] = [
  // Storage services
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/storageApiService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'storageApiService → shared/api'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/storageApiService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'storageApiService → shared/api (3 levels)'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/storageService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'storageService → shared/api'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/storageService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'storageService → shared/api (4 levels)'
  },
  
  // File services
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/fileService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'fileService → shared/api'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/fileUploadService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'fileUploadService → shared/api'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/fileUploadService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'fileUploadService → shared/api (3 levels)'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/authenticatedMediaService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'authenticatedMediaService → shared/api'
  },
  
  // Notification service
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/notificationService\.ts['"]/g,
    newImport: "from '@/shared/api'",
    description: 'notificationService → shared/api'
  },
  
  // Dashboard service
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/dashboardService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'dashboardService → shared/api'
  },
  
  // Organization services
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/organization\/organizationPaymentService['"]/g,
    newImport: "from '@/features/subscription'",
    description: 'organizationPaymentService → subscription feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/organization\/organizationMemberService['"]/g,
    newImport: "from '@/entities/organization'",
    description: 'organizationMemberService → organization entity'
  },
  
  // Educator services
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/educator\/assignmentsService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'assignmentsService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/educator\/assignmentsService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'assignmentsService → college-admin feature (3 levels)'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/educator\/coursesService['"]/g,
    newImport: "from '@/features/courses'",
    description: 'coursesService → courses feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/educator\/coursesService['"]/g,
    newImport: "from '@/features/courses'",
    description: 'coursesService → courses feature (3 levels)'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/educator\/dashboardApi['"]/g,
    newImport: "from '@/features/educator-dashboard'",
    description: 'dashboardApi → educator-dashboard feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/educator\/mentorNotes['"]/g,
    newImport: "from '@/features/counselling'",
    description: 'mentorNotes → counselling feature'
  },
  
  // College services
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/lessonPlanService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'lessonPlanService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/departmentService['"]/g,
    newImport: "from '@/entities/department'",
    description: 'departmentService → department entity'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'college services → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/examinationService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'examinationService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/assessmentService['"]/g,
    newImport: "from '@/features/assessment'",
    description: 'assessmentService → assessment feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/markEntryService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'markEntryService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/transcriptService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'transcriptService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/attendanceService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'attendanceService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/timetableService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'timetableService → college-admin feature'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/facultyService['"]/g,
    newImport: "from '@/entities/faculty'",
    description: 'facultyService → faculty entity'
  },
  
  // Settings service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/settingsService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'settingsService → shared/api'
  },
  
  // Teacher service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/teacherService['"]/g,
    newImport: "from '@/entities/teacher'",
    description: 'teacherService → teacher entity'
  },
  
  // User service
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/userApiService['"]/g,
    newImport: "from '@/entities/user'",
    description: 'userApiService → user entity'
  },
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/userApiService['"]/g,
    newImport: "from '@/entities/user'",
    description: 'userApiService → user entity (4 levels)'
  },
  
  // Role service
  {
    oldImport: /from ['"]\.\.\/\.\.\/services\/roleLookupService['"]/g,
    newImport: "from '@/features/auth'",
    description: 'roleLookupService → auth feature'
  },
  
  // Library service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/libraryService['"]/g,
    newImport: "from '@/features/library'",
    description: 'libraryService → library feature'
  },
  
  // Recruiter services
  {
    oldImport: /from ['"]\.\.\/\.\.\/features\/recruiter-copilot\/services\/recruiterInsights['"]/g,
    newImport: "from '@/features/recruiter-copilot'",
    description: 'recruiterInsights → recruiter-copilot feature'
  },
  
  // Curriculum service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/curriculumService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'curriculumService → college-admin feature'
  },
  
  // Course mapping service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/services\/college\/courseMappingService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'courseMappingService → college-admin feature'
  },
  
  // Class swap service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/classSwapService['"]/g,
    newImport: "from '@/features/college-admin'",
    description: 'classSwapService → college-admin feature'
  },
  
  // Faculty service
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/facultyService['"]/g,
    newImport: "from '@/entities/faculty'",
    description: 'facultyService → faculty entity'
  },
  
  // Library service (6 levels deep)
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/services\/libraryService['"]/g,
    newImport: "from '@/features/library'",
    description: 'libraryService → library feature (6 levels)'
  },
  
  // File upload service (4 levels deep)
  {
    oldImport: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/fileUploadService['"]/g,
    newImport: "from '@/shared/api'",
    description: 'fileUploadService → shared/api (4 levels)'
  },
];

async function eliminatePageServiceImports() {
  console.log('🔍 Scanning pages for direct service imports...\n');

  // Find all page files
  const pageFiles = await glob('src/pages/**/*.{jsx,tsx,js,ts}', {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
  });

  console.log(`Found ${pageFiles.length} page files\n`);

  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of pageFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    let fileReplacements = 0;

    for (const mapping of serviceMappings) {
      const matches = content.match(mapping.oldImport);
      if (matches) {
        content = content.replace(mapping.oldImport, mapping.newImport);
        fileReplacements += matches.length;
        modified = true;
        console.log(`  ✓ ${path.relative(process.cwd(), file)}: ${mapping.description}`);
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      filesModified++;
      totalReplacements += fileReplacements;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);

  // Check for remaining service imports
  console.log('\n🔍 Checking for remaining service imports...\n');
  
  const remainingImports: { file: string; line: number; import: string }[] = [];
  
  for (const file of pageFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.match(/from ['"]\.\.\/.*\/services\//)) {
        remainingImports.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          import: line.trim()
        });
      }
    });
  }

  if (remainingImports.length > 0) {
    console.log(`⚠️  Found ${remainingImports.length} remaining service imports:\n`);
    remainingImports.forEach(({ file, line, import: imp }) => {
      console.log(`   ${file}:${line}`);
      console.log(`   ${imp}\n`);
    });
  } else {
    console.log('✅ Zero direct service imports remain in pages!');
  }
}

eliminatePageServiceImports().catch(console.error);
