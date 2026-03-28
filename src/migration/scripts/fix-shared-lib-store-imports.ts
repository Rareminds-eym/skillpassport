import * as fs from 'fs';
import * as path from 'path';

/**
 * Fix relative store imports in shared/lib to use @/stores
 */

const files = [
  'src/shared/lib/hooks/useAddOnCatalog.ts',
  'src/shared/lib/hooks/useMentorAllocation.ts',
  'src/shared/lib/hooks/useOffers.ts',
  'src/shared/lib/hooks/useProfileCompletionPrompt.ts',
  'src/shared/lib/hooks/useProgramSections.ts'
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
    
    // Fix various store imports
    content = content.replace(/from ['"]\.\.\/stores['"]/g, 'from "@/stores"');
    content = content.replace(/from ['"]\.\.\/stores\/portfolioStore['"]/g, 'from "@/stores/portfolioStore"');
    content = content.replace(/from ['"]\.\.\/stores\/themeStore['"]/g, 'from "@/stores/themeStore"');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fixed++;
      console.log(`✓ Fixed import in ${file}`);
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} files`);
}

fixImports();
