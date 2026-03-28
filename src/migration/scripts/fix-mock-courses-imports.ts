import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/pages/educator/CoursesWithSupabase.tsx',
  'src/pages/educator/Courses.tsx',
  'src/pages/admin/universityAdmin/Courses.tsx',
  'src/pages/admin/schoolAdmin/Courses.tsx',
  'src/pages/admin/collegeAdmin/Courses.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(
      /from ['"]@\/shared\/lib\/test\/educator\/mockCourses['"]/g,
      "from '@/data/educator/mockCourses'"
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('✅ All mockCourses imports fixed!');
