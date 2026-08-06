
import { extractLocation, extractPincode } from './regex';
import { parseResumeDeterministic } from './parser';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (!pass) {
    console.log('  expected:', JSON.stringify(expected));
    console.log('  actual  :', JSON.stringify(actual));
  }
}

function headerText(locationLine: string): string {
  return `First Last\n${locationLine}\nemail@example.com | 555-123-4567\n\nPROFILE\nSome summary text.`;
}

console.log('=== extractLocation() against the full requested test matrix ===');

assertEqual(extractLocation(headerText('Chennai, Tamil Nadu, India')), { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }, 'Chennai, Tamil Nadu, India');
assertEqual(extractLocation(headerText('Bangalore, Karnataka')), { city: 'Bangalore', state: 'Karnataka', country: 'India' }, 'Bangalore, Karnataka (state-only, country inferred)');
assertEqual(extractLocation(headerText('Chennai, India')), { city: 'Chennai', state: '', country: 'India' }, 'Chennai, India');
assertEqual(extractLocation(headerText('India')), { city: '', state: '', country: 'India' }, 'India (single token, country-table match)');
assertEqual(extractLocation(headerText('San Francisco, CA, USA')), { city: 'San Francisco', state: 'California', country: 'United States' }, 'San Francisco, CA, USA');
assertEqual(extractLocation(headerText('London, United Kingdom')), { city: 'London', state: '', country: 'United Kingdom' }, 'London, United Kingdom');
assertEqual(extractLocation(headerText('Dubai, UAE')), { city: 'Dubai', state: '', country: 'United Arab Emirates' }, 'Dubai, UAE (alias resolution)');
assertEqual(extractLocation(headerText('Remote')), { city: '', state: '', country: '' }, 'Remote (denylisted work-mode token)');
assertEqual(extractLocation(headerText('Hyderabad')), { city: '', state: '', country: '' }, 'Hyderabad (bare single token, not confidently a city — correctly left empty)');
assertEqual(extractLocation(headerText('New York, NY')), { city: 'New York', state: 'New York', country: 'United States' }, 'New York, NY (US state code, country inferred)');
assertEqual(extractLocation(headerText('Singapore')), { city: '', state: '', country: 'Singapore' }, 'Singapore (single token, country-table match)');

console.log('\n=== extractPincode() ===');
assertEqual(extractPincode(`First Last\nChennai, Tamil Nadu, India - 600001\nemail@example.com`), '600001', 'Indian PIN code (6 digits)');
assertEqual(extractPincode(`First Last\nSan Francisco, CA 94105\nemail@example.com`), '94105', 'US ZIP code (5 digits)');
assertEqual(extractPincode(`First Last\nRemote\nemail@example.com`), '', 'No pincode present -> empty');

console.log('\n=== Full end-to-end via parseResumeDeterministic (real regression resume) ===');
const fullResume = `Priya Ramesh
priya.ramesh.dev@gmail.com | +91 98765 43210 | Chennai, Tamil Nadu, India
linkedin.com/in/priya-ramesh-dev | github.com/priyarameshdev

PROFILE
Software developer with hands-on experience in React, TypeScript, Java, and Supabase.

EDUCATION
Bachelor of Technology in Computer Science and Engineering
SriEshwar College of Engineering, Anna University
Graduated: 2026 | CGPA: 8.7

EXPERIENCE
Rareminds Technologies | Software Developer Intern | 6 Months
Developed and maintained frontend features for a skills platform using React, TypeScript, and Vite.

PROJECTS
Fruit Ordering Platform | React.js • Express.js • Supabase
Developed a fruit ordering platform enabling customers to browse products.
GitHub: github.com/priyarameshdev/fruit-ordering-platform

TECHNICAL SKILLS
Java, Spring Boot, React

CERTIFICATIONS
AWS Cloud Practitioner - Amazon Web Services, 2025

LANGUAGES
English, Tamil, Hindi

INTERESTS
Reading, Basketball, Yoga
`;

const result = parseResumeDeterministic(fullResume);
console.log('city:', result.city);
console.log('state:', result.state);
console.log('country:', result.country);
console.log('pincode:', result.pincode);
console.log('address:', JSON.stringify(result.address), '(must stay empty, out of scope)');
console.log('date_of_birth:', JSON.stringify(result.date_of_birth), '(must stay empty, out of scope)');

assertEqual(result.city, 'Chennai', 'End-to-end: city');
assertEqual(result.state, 'Tamil Nadu', 'End-to-end: state');
assertEqual(result.country, 'India', 'End-to-end: country');
assertEqual(result.address, '', 'End-to-end: address unaffected (out of scope)');
assertEqual(result.date_of_birth, '', 'End-to-end: date_of_birth unaffected (out of scope)');

// Regression: education/experience/projects unaffected by this change
assertEqual(result.education.length, 1, 'Regression: education still 1 entry');
assertEqual(result.experience.length, 1, 'Regression: experience still 1 entry');
assertEqual(result.projects.length, 1, 'Regression: projects still correctly parsed');
assertEqual(result.interests, ['Reading', 'Basketball', 'Yoga'], 'Regression: interests still populated');

console.log('\nDone.');
