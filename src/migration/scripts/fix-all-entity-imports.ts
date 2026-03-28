import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive fix for all entity import issues:
 * 1. Add missing exports to entity index files
 * 2. Fix imports pointing to non-existent entities (redirect to features)
 */

// Step 1: Add missing exports to student entity
function fixStudentEntityExports() {
  const studentIndexPath = path.resolve(process.cwd(), 'src/entities/student/index.ts');
  let content = fs.readFileSync(studentIndexPath, 'utf-8');
  
  const missingExports = [
    "export { useStudentTechnicalSkills, useStudentSoftSkills } from './model/useStudentSkills';",
    "export { useStudentEducatorConversations } from './model/useStudentEducatorMessages';",
    "export { useCreateStudentAdminConversation } from './model/useStudentAdminMessages';",
    "export { useCreateStudentCollegeAdminConversation } from './model/useStudentCollegeAdminMessages';",
  ];
  
  let added = 0;
  for (const exportLine of missingExports) {
    if (!content.includes(exportLine)) {
      content += '\n' + exportLine;
      added++;
      console.log(`✓ Added export: ${exportLine}`);
    }
  }
  
  if (added > 0) {
    fs.writeFileSync(studentIndexPath, content, 'utf-8');
    console.log(`✅ Updated student entity index with ${added} new exports\n`);
  }
}

// Step 2: Add missing exports to student entity model index
function fixStudentModelExports() {
  const modelIndexPath = path.resolve(process.cwd(), 'src/entities/student/model/index.ts');
  let content = fs.readFileSync(modelIndexPath, 'utf-8');
  
  const missingExports = [
    "export { useStudentTechnicalSkills, useStudentSoftSkills } from './useStudentSkills';",
    "export { useStudentEducatorConversations } from './useStudentEducatorMessages';",
    "export { useCreateStudentAdminConversation } from './useStudentAdminMessages';",
    "export { useCreateStudentCollegeAdminConversation } from './useStudentCollegeAdminMessages';",
  ];
  
  let added = 0;
  for (const exportLine of missingExports) {
    if (!content.includes(exportLine)) {
      content += '\n' + exportLine;
      added++;
      console.log(`✓ Added export: ${exportLine}`);
    }
  }
  
  if (added > 0) {
    fs.writeFileSync(modelIndexPath, content, 'utf-8');
    console.log(`✅ Updated student model index with ${added} new exports\n`);
  }
}

// Step 3: Fix imports from non-existent @/entities/faculty → @/features/college-admin
const facultyImportFixes = [
  {
    file: 'src/pages/admin/collegeAdmin/components/FacultyManagementDashboard.tsx',
    from: "import { getFacultyStatistics } from '@/entities/faculty';",
    to: "import { getFacultyStatistics } from '@/features/college-admin/api/facultyService';"
  }
];

function fixFacultyImports() {
  let fixed = 0;
  for (const fix of facultyImportFixes) {
    const filePath = path.resolve(process.cwd(), fix.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(fix.from)) {
      content = content.replace(fix.from, fix.to);
      fs.writeFileSync(filePath, content, 'utf-8');
      fixed++;
      console.log(`✓ Fixed faculty import in ${fix.file}`);
    }
  }
  
  if (fixed > 0) {
    console.log(`✅ Fixed ${fixed} faculty imports\n`);
  }
}

// Step 4: Check for lib/studentType exports
function fixStudentTypeExports() {
  const studentLibPath = path.resolve(process.cwd(), 'src/entities/student/lib');
  
  if (!fs.existsSync(studentLibPath)) {
    console.log('⚠️  Creating student lib directory...');
    fs.mkdirSync(studentLibPath, { recursive: true });
  }
  
  const indexPath = path.join(studentLibPath, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    const content = `// Student lib exports
export * from './studentType';
`;
    fs.writeFileSync(indexPath, content, 'utf-8');
    console.log('✓ Created student lib index');
  }
  
  // Update main student entity index to export lib
  const studentIndexPath = path.resolve(process.cwd(), 'src/entities/student/index.ts');
  let content = fs.readFileSync(studentIndexPath, 'utf-8');
  
  if (!content.includes("export * from './lib';")) {
    content += "\nexport * from './lib';\n";
    fs.writeFileSync(studentIndexPath, content, 'utf-8');
    console.log('✓ Added lib exports to student entity index');
  }
  
  console.log('✅ Student lib exports configured\n');
}

// Run all fixes
console.log('🔧 Fixing all entity import issues...\n');
fixStudentEntityExports();
fixStudentModelExports();
fixFacultyImports();
fixStudentTypeExports();
console.log('✅ All entity import fixes complete!');
