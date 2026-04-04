import * as fs from 'fs';
import * as path from 'path';

const fixes = [
  // Hook imports
  {
    file: 'src/pages/educator/Messages.tsx',
    oldImport: "from "@/features/messaging"",
    newImport: "from '@/features/messaging'"
  },
  // Recruiter UI
  {
    file: 'src/pages/recruiter/Pipelines.tsx',
    oldImport: "from "@/features/recruiter"",
    newImport: "from '@/features/recruiter'"
  },
  // Redundant shared path
  {
    file: 'src/features/career-assistant/components/CareerAssistant.tsx',
    oldImport: "from "@/shared/ui/CareerAIToolsGrid"",
    newImport: "from '@/shared/ui/CareerAIToolsGrid'"
  }
];

console.log('🔧 Fixing critical import errors...\n');

let fixed = 0;
let skipped = 0;

for (const fix of fixes) {
  const filePath = path.resolve(fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped (file not found): ${fix.file}`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes(fix.oldImport)) {
    content = content.replace(fix.oldImport, fix.newImport);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${fix.file}`);
    fixed++;
  } else {
    console.log(`⚠️  Skipped (pattern not found): ${fix.file}`);
    skipped++;
  }
}

console.log(`\n✅ Fixed ${fixed} files, skipped ${skipped}`);
