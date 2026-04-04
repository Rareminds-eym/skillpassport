import * as fs from 'fs';
import * as path from 'path';

interface ServiceMapping {
  servicePath: string;
  serviceName: string;
  targetLayer: string;
  targetDomain: string;
  targetPath: string;
  confidence: string;
  reasoning: string;
}

const ENTITY_SERVICES = {
  organization: [
    'src/services/organization/index.ts',
    'src/services/organization/licenseManagementService.ts',
    'src/services/organization/memberInvitationService.ts',
    'src/services/organization/organizationBillingService.ts',
    'src/services/organization/organizationEntitlementService.ts',
    'src/services/organization/organizationMemberService.ts',
    'src/services/organization/organizationPaymentService.ts',
    'src/services/organization/organizationSubscriptionService.ts',
    'src/services/organizationService.ts'
  ],
  user: [
    'src/services/permissionService.ts',
    'src/services/roleLookupService.ts',
    'src/services/userApiService.ts',
    'src/services/userManagementService.ts',
    'src/services/userSettingsService.js'
  ],
  student: [
    'src/services/studentActivityService.js',
    'src/services/studentClassService.ts',
    'src/services/studentEnrollmentService.ts',
    'src/services/studentExamService.ts',
    'src/services/studentManagementService.ts',
    'src/services/studentService.ts',
    'src/services/studentSettingsService.js'
  ]
};

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

function moveFile(sourcePath: string, targetPath: string): void {
  const fullSourcePath = path.resolve(sourcePath);
  const fullTargetPath = path.resolve(targetPath);

  if (!fs.existsSync(fullSourcePath)) {
    console.log(`⚠ Source file not found: ${sourcePath}`);
    return;
  }

  // Ensure target directory exists
  const targetDir = path.dirname(fullTargetPath);
  ensureDirectoryExists(targetDir);

  // Read source file
  const content = fs.readFileSync(fullSourcePath, 'utf-8');

  // Write to target
  fs.writeFileSync(fullTargetPath, content, 'utf-8');
  console.log(`✓ Moved: ${sourcePath} → ${targetPath}`);

  // Delete source
  fs.unlinkSync(fullSourcePath);
}

function createEntityStructure(entityName: string): void {
  const basePath = `src/entities/${entityName}`;
  
  ensureDirectoryExists(`${basePath}/api`);
  ensureDirectoryExists(`${basePath}/model`);
  ensureDirectoryExists(`${basePath}/ui`);

  // Create index.ts if it doesn't exist
  const indexPath = `${basePath}/index.ts`;
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `// ${entityName} entity public API\nexport * from './api';\nexport * from './model';\n`, 'utf-8');
    console.log(`✓ Created: ${indexPath}`);
  }

  // Create api/index.ts if it doesn't exist
  const apiIndexPath = `${basePath}/api/index.ts`;
  if (!fs.existsSync(apiIndexPath)) {
    fs.writeFileSync(apiIndexPath, `// ${entityName} entity API exports\n`, 'utf-8');
    console.log(`✓ Created: ${apiIndexPath}`);
  }
}

function migrateEntityServices(): void {
  console.log('Starting entity services migration...\n');

  // Create student entity structure (doesn't exist yet)
  console.log('Creating student entity structure...');
  createEntityStructure('student');

  // Migrate organization services
  console.log('\n=== Migrating Organization Services ===');
  for (const servicePath of ENTITY_SERVICES.organization) {
    const fileName = path.basename(servicePath);
    const targetPath = `src/entities/organization/api/${fileName}`;
    moveFile(servicePath, targetPath);
  }

  // Migrate user services
  console.log('\n=== Migrating User Services ===');
  for (const servicePath of ENTITY_SERVICES.user) {
    const fileName = path.basename(servicePath);
    const targetPath = `src/entities/user/api/${fileName}`;
    moveFile(servicePath, targetPath);
  }

  // Migrate student services
  console.log('\n=== Migrating Student Services ===');
  for (const servicePath of ENTITY_SERVICES.student) {
    const fileName = path.basename(servicePath);
    const targetPath = `src/entities/student/api/${fileName}`;
    moveFile(servicePath, targetPath);
  }

  console.log('\n✓ Entity services migration complete!');
  console.log('\nNext steps:');
  console.log('1. Update import paths across the codebase');
  console.log('2. Update entity public APIs (index.ts files)');
  console.log('3. Fix any entity layer violations');
}

// Run migration
migrateEntityServices();
