import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/pages/admin/schoolAdmin/finance/hooks/useFeeTracking.ts',
  'src/pages/admin/schoolAdmin/components/TimetableBuilderEnhanced.tsx',
  'src/pages/admin/universityAdmin/hr/PayrollManagement.tsx',
  'src/pages/admin/universityAdmin/hr/LeaveManagement.tsx',
  'src/features/assessment/api/assessment/assessmentDataPrep.js'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace all variations of relative config/logging imports
    content = content.replace(
      /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/config\/logging['"]/g,
      "from '@/shared/config/logging'"
    );
    content = content.replace(
      /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/config\/logging['"]/g,
      "from '@/shared/config/logging'"
    );
    content = content.replace(
      /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/config\/logging['"]/g,
      "from '@/shared/config/logging'"
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('✅ All config/logging imports fixed!');
