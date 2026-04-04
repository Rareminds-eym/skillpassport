import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ImportMapping {
  oldPattern: RegExp;
  newPath: string;
  description: string;
}

const IMPORT_MAPPINGS: ImportMapping[] = [
  // Organization services
  { oldPattern: /@\/services\/organization\/licenseManagementService/g, newPath: '@/entities/organization', description: 'licenseManagementService' },
  { oldPattern: /@\/services\/organization\/memberInvitationService/g, newPath: '@/entities/organization', description: 'memberInvitationService' },
  { oldPattern: /@\/services\/organization\/organizationBillingService/g, newPath: '@/entities/organization', description: 'organizationBillingService' },
  { oldPattern: /@\/services\/organization\/organizationEntitlementService/g, newPath: '@/entities/organization', description: 'organizationEntitlementService' },
  { oldPattern: /@\/services\/organization\/organizationMemberService/g, newPath: '@/entities/organization', description: 'organizationMemberService' },
  { oldPattern: /@\/services\/organization\/organizationPaymentService/g, newPath: '@/entities/organization', description: 'organizationPaymentService' },
  { oldPattern: /@\/services\/organization\/organizationSubscriptionService/g, newPath: '@/entities/organization', description: 'organizationSubscriptionService' },
  { oldPattern: /@\/services\/organizationService/g, newPath: '@/entities/organization', description: 'organizationService' },
  
  // User services
  { oldPattern: /@\/services\/permissionService/g, newPath: '@/entities/user', description: 'permissionService' },
  { oldPattern: /@\/services\/roleLookupService/g, newPath: '@/entities/user', description: 'roleLookupService' },
  { oldPattern: /@\/services\/userApiService/g, newPath: '@/entities/user', description: 'userApiService' },
  { oldPattern: /@\/services\/userManagementService/g, newPath: '@/entities/user', description: 'userManagementService' },
  { oldPattern: /@\/services\/userSettingsService/g, newPath: '@/entities/user', description: 'userSettingsService' },
  
  // Student services
  { oldPattern: /@\/services\/studentActivityService/g, newPath: '@/entities/student', description: 'studentActivityService' },
  { oldPattern: /@\/services\/studentClassService/g, newPath: '@/entities/student', description: 'studentClassService' },
  { oldPattern: /@\/services\/studentEnrollmentService/g, newPath: '@/entities/student', description: 'studentEnrollmentService' },
  { oldPattern: /@\/services\/studentExamService/g, newPath: '@/entities/student', description: 'studentExamService' },
  { oldPattern: /@\/services\/studentManagementService/g, newPath: '@/entities/student', description: 'studentManagementService' },
  { oldPattern: /@\/services\/studentService/g, newPath: '@/entities/student', description: 'studentService' },
  { oldPattern: /@\/services\/studentSettingsService/g, newPath: '@/entities/student', description: 'studentSettingsService' },
];

async function updateImportsInFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changeCount = 0;
  
  for (const mapping of IMPORT_MAPPINGS) {
    if (mapping.oldPattern.test(content)) {
      content = content.replace(mapping.oldPattern, mapping.newPath);
      changeCount++;
    }
  }
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changeCount;
}

async function updateAllImports(): Promise<void> {
  console.log('Updating entity service imports across codebase...\n');
  
  const patterns = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx'
  ];
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
    });
    
    for (const file of files) {
      const changes = await updateImportsInFile(file);
      if (changes > 0) {
        totalFiles++;
        totalChanges += changes;
        console.log(`✓ Updated ${changes} import(s) in: ${file}`);
      }
    }
  }
  
  console.log(`\n✓ Import update complete!`);
  console.log(`  Files updated: ${totalFiles}`);
  console.log(`  Total changes: ${totalChanges}`);
}

updateAllImports().catch(console.error);
