/**
 * Test CSV Parsing Logic - Node.js version
 * Run: node test-csv-node.js
 */

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'student-import-template.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Simple CSV parser (mimics Papa.parse behavior)
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse headers with same transform as Papa.parse
  const rawHeaders = lines[0].split(',');
  const headers = rawHeaders.map(h => 
    h.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric (including underscores)
  );
  
  console.log('📋 Headers found:', headers.length);
  console.log('📋 Skill-related headers:', headers.filter(h => h.includes('skill')));
  
  // Parse first data row
  const dataLine = lines[1];
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < dataLine.length; i++) {
    const char = dataLine[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  
  // Create object
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] || '';
  });
  
  return [row];
}

// Parse CSV
const data = parseCSV(csvContent);
const learner = data[0];

console.log('\n=== CSV Parsing Test ===\n');
console.log('✅ CSV file loaded:', csvPath);
console.log('✅ Total rows:', data.length);
console.log('\n=== First Learner Data ===');
console.log('Name:', learner.name);
console.log('Email:', learner.email);
console.log('Contact:', learner.contactnumber);

// Test skill extraction (mimics the modal logic)
console.log('\n=== Skill Extraction Test ===');
const skills = [];

for (let i = 1; i <= 5; i++) {
  const skillName = learner[`skill${i}name`];
  if (skillName && skillName.trim()) {
    let levelValue = null;
    let proficiencyValue = null;
    
    const rawLevel = learner[`skill${i}level`]?.trim();
    const rawProficiency = learner[`skill${i}proficiencylevel`]?.trim();
    
    console.log(`\nSkill ${i} - Raw data from CSV:`);
    console.log(`  skill_${i}_name: "${skillName}"`);
    console.log(`  skill_${i}_type: "${learner[`skill${i}type`]}"`);
    console.log(`  skill_${i}_level: "${rawLevel}"`);
    console.log(`  skill_${i}_proficiency_level: "${rawProficiency}"`);
    
    // Check if level is a number
    if (rawLevel && !isNaN(parseInt(rawLevel))) {
      levelValue = parseInt(rawLevel);
      console.log(`  ✅ Level parsed as number: ${levelValue}`);
    } else if (rawLevel) {
      proficiencyValue = rawLevel;
      console.log(`  ✅ Level is text, using as proficiency: "${proficiencyValue}"`);
    }
    
    // Use proficiency_level if provided and not used above
    if (rawProficiency && !proficiencyValue) {
      proficiencyValue = rawProficiency;
      console.log(`  ✅ Using proficiency_level: "${proficiencyValue}"`);
    }
    
    const skill = {
      name: skillName.trim(),
      type: learner[`skill${i}type`]?.trim() || 'technical',
      level: levelValue,
      proficiency_level: proficiencyValue,
    };
    
    skills.push(skill);
    console.log(`  📦 Final skill object:`, skill);
  }
}

console.log(`\n✅ Total skills extracted: ${skills.length}`);

// Test project extraction
console.log('\n=== Project Extraction Test ===');
const projects = [];

for (let i = 1; i <= 2; i++) {
  const projectTitle = learner[`project${i}title`];
  if (projectTitle && projectTitle.trim()) {
    const project = {
      title: projectTitle.trim(),
      description: learner[`project${i}description`]?.trim() || null,
      start_date: learner[`project${i}startdate`] || null,
      end_date: learner[`project${i}enddate`] || null,
      tech_stack: learner[`project${i}techstack`] ? 
        learner[`project${i}techstack`].split(',').map(t => t.trim()) : [],
      demo_link: learner[`project${i}demolink`]?.trim() || null,
      github_link: learner[`project${i}githublink`]?.trim() || null,
      role: learner[`project${i}role`]?.trim() || null,
    };
    projects.push(project);
    console.log(`\nProject ${i}:`, {
      title: project.title,
      tech_stack: project.tech_stack,
      role: project.role
    });
  }
}

console.log(`\n✅ Total projects extracted: ${projects.length}`);

// Test certificate extraction
console.log('\n=== Certificate Extraction Test ===');
const certifications = [];

for (let i = 1; i <= 2; i++) {
  const certTitle = learner[`certificate${i}title`];
  if (certTitle && certTitle.trim()) {
    const cert = {
      title: certTitle.trim(),
      issuer: learner[`certificate${i}issuer`]?.trim() || null,
      issued_on: learner[`certificate${i}issuedon`] || null,
      credential_id: learner[`certificate${i}credentialid`]?.trim() || null,
      link: learner[`certificate${i}link`]?.trim() || null,
      platform: learner[`certificate${i}platform`]?.trim() || null,
    };
    certifications.push(cert);
    console.log(`\nCertificate ${i}:`, {
      title: cert.title,
      issuer: cert.issuer,
      platform: cert.platform
    });
  }
}

console.log(`\n✅ Total certifications extracted: ${certifications.length}`);

// Summary
console.log('\n=== SUMMARY ===');
console.log('Rich profile data extracted:');
console.log(`  Projects: ${projects.length}`);
console.log(`  Certifications: ${certifications.length}`);
console.log(`  Skills: ${skills.length}`);
console.log(`  Education: 0 (check education_1_degree column)`);

if (skills.length === 0) {
  console.log('\n❌ ERROR: No skills extracted!');
  console.log('Debugging info:');
  console.log('All column names starting with "skill":', 
    Object.keys(learner).filter(k => k.startsWith('skill')).slice(0, 10)
  );
}

console.log('\n✅ Test complete!');
