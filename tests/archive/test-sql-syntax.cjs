const fs = require('fs');

const sql = fs.readFileSync('import-all-internships.sql', 'utf8');

// Check for common issues
const issues = [];

// Check for en-dashes in numeric positions (after comma, before comma in numeric context)
const numericDashPattern = /,\s*\d+[–—]\d+\s*,/g;
const matches = sql.match(numericDashPattern);
if (matches) {
  issues.push(`Found ${matches.length} numeric fields with en-dashes: ${matches.slice(0, 3).join(', ')}`);
}

// Count INSERT statements
const insertCount = (sql.match(/INSERT INTO/g) || []).length;
console.log(`✅ Total INSERT statements: ${insertCount}`);

// Check for balanced parentheses in each INSERT
const inserts = sql.split('INSERT INTO').slice(1);
let unbalanced = 0;
inserts.forEach((insert, idx) => {
  const open = (insert.match(/\(/g) || []).length;
  const close = (insert.match(/\)/g) || []).length;
  if (open !== close) {
    unbalanced++;
    if (unbalanced <= 3) {
      console.log(`⚠️  INSERT ${idx + 1}: Unbalanced parentheses (${open} open, ${close} close)`);
    }
  }
});

if (unbalanced === 0) {
  console.log('✅ All INSERT statements have balanced parentheses');
} else {
  console.log(`⚠️  ${unbalanced} INSERT statements have unbalanced parentheses`);
}

// Report issues
if (issues.length === 0) {
  console.log('✅ No syntax issues detected!');
  console.log('\n🎉 SQL file is ready to import!');
} else {
  console.log('\n❌ Issues found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
}
