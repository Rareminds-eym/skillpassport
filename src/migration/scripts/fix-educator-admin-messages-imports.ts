import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/pages/admin/schoolAdmin/EducatorCommunication.tsx',
  'src/pages/admin/schoolAdmin/StudentCommunication.tsx',
  'src/pages/educator/Communication.tsx',
  'src/pages/educator/AdminCommunication.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(
      /from ['"]@\/shared\/lib\/hooks\/useEducatorAdminMessages\.js['"]/g,
      "from '@/features/educator'"
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('✅ All useEducatorAdminMessages imports fixed!');
