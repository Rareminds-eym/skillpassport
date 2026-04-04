import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/pages/educator/Messages.tsx',
  'src/pages/admin/collegeAdmin/StudentCollegeAdminCommunication.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(
      /from ['"]@\/shared\/lib\/hooks\/useCollegeEducatorAdminConversations\.js['"]/g,
      "from '@/features/educator'"
    );
    content = content.replace(
      /from ['"]@\/shared\/lib\/hooks\/useCollegeEducatorAdminMessages\.js['"]/g,
      "from '@/features/educator'"
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('✅ All college educator admin imports fixed!');
