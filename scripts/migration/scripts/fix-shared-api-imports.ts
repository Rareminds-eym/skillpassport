import * as fs from 'fs';
import * as path from 'path';

/**
 * Fix incorrect @/shared/lib/api imports to @/shared/api
 */

const files = [
  'src/shared/lib/debug/debugSupabase.js',
  'src/entities/student/model/useStudentTrainings.ts',
  'src/migration/utils/dataMigrationAdapted.js',
  'src/migration/utils/dataMigration.js',
  'src/features/digital-portfolio/api/portfolioService.ts'
];

function fixImports() {
  let fixed = 0;
  
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Fix the import
    content = content.replace(
      /from ["']@\/shared\/lib\/api["']/g,
      'from "@/shared/api/supabaseClient"'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fixed++;
      console.log(`✓ Fixed import in ${file}`);
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} files`);
}

fixImports();
