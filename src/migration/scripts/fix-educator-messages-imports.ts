import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/pages/educator/Communication.tsx',
  'src/pages/admin/schoolAdmin/StudentCommunication.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(
      /from ['"]@\/shared\/lib\/hooks\/useEducatorMessages\.js['"]/g,
      "from '@/features/educator'"
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('✅ All useEducatorMessages imports fixed!');
