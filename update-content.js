/**
 * Content Update Helper Script
 * 
 * This script helps you find and replace placeholder content across all documentation files.
 * 
 * Usage:
 *   node update-content.js find "skillpassport.com"
 *   node update-content.js replace "skillpassport.com" "yourdomain.com"
 *   node update-content.js list-placeholders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to update
const FILES_TO_UPDATE = [
  'index.html',
  'README.md',
  'ai-master-truth.md',
  'ai-content-blocks.md',
  'AI_SYSTEM_README.md',
  'CHANGELOG.md',
  'FEATURES_COMPARISON.md',
  'CONTENT_UPDATE_GUIDE.md',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/manifest.json',
  'public/.well-known/ai-plugin.json',
  'public/openapi.json',
  'public/schema.json',
  'public/humans.txt',
  'docs/API_REFERENCE.md',
  'docs/INTEGRATION_GUIDE.md',
  'docs/FAQ.md'
];

// Common placeholders to replace
const PLACEHOLDERS = {
  'skillpassport.com': 'YOUR_DOMAIN_HERE',
  'Skill Ecosystem': 'YOUR_PRODUCT_NAME',
  'Rareminds': 'YOUR_COMPANY_NAME',
  'support@skillpassport.com': 'YOUR_SUPPORT_EMAIL',
  'api@skillpassport.com': 'YOUR_API_EMAIL',
  'sales@skillpassport.com': 'YOUR_SALES_EMAIL',
  '₹50/student/year': 'YOUR_BASIC_PRICE',
  '₹100/student/year': 'YOUR_PRO_PRICE',
  '10,000+ students': 'YOUR_STUDENT_COUNT',
  '500+ courses': 'YOUR_COURSE_COUNT',
  '85%+ accuracy': 'YOUR_ACCURACY_METRIC'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findInFiles(searchTerm) {
  log(`\n🔍 Searching for: "${searchTerm}"\n`, 'cyan');
  
  let totalMatches = 0;
  
  FILES_TO_UPDATE.forEach(file => {
    if (!fs.existsSync(file)) {
      log(`⚠️  File not found: ${file}`, 'yellow');
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const matches = [];
    
    lines.forEach((line, index) => {
      if (line.includes(searchTerm)) {
        matches.push({
          lineNumber: index + 1,
          content: line.trim()
        });
      }
    });
    
    if (matches.length > 0) {
      log(`📄 ${file} (${matches.length} matches)`, 'bright');
      matches.forEach(match => {
        log(`   Line ${match.lineNumber}: ${match.content.substring(0, 80)}...`, 'reset');
      });
      log('');
      totalMatches += matches.length;
    }
  });
  
  if (totalMatches === 0) {
    log('✅ No matches found!', 'green');
  } else {
    log(`📊 Total matches: ${totalMatches}`, 'bright');
  }
}

function replaceInFiles(searchTerm, replaceTerm, dryRun = false) {
  log(`\n🔄 ${dryRun ? 'Preview' : 'Replacing'}: "${searchTerm}" → "${replaceTerm}"\n`, 'cyan');
  
  let totalReplacements = 0;
  const updatedFiles = [];
  
  FILES_TO_UPDATE.forEach(file => {
    if (!fs.existsSync(file)) {
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const newContent = content.split(searchTerm).join(replaceTerm);
    
    if (content !== newContent) {
      const count = (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      if (!dryRun) {
        fs.writeFileSync(file, newContent, 'utf8');
        log(`✅ Updated ${file} (${count} replacements)`, 'green');
      } else {
        log(`📝 Would update ${file} (${count} replacements)`, 'yellow');
      }
      
      totalReplacements += count;
      updatedFiles.push(file);
    }
  });
  
  if (totalReplacements === 0) {
    log('ℹ️  No replacements needed', 'blue');
  } else {
    log(`\n📊 Total replacements: ${totalReplacements} in ${updatedFiles.length} files`, 'bright');
    
    if (dryRun) {
      log('\n💡 Run without --dry-run to apply changes', 'cyan');
    } else {
      log('\n✨ Changes applied successfully!', 'green');
    }
  }
}

function listPlaceholders() {
  log('\n📋 Common Placeholders to Replace:\n', 'cyan');
  
  Object.entries(PLACEHOLDERS).forEach(([placeholder, description]) => {
    log(`  ${placeholder}`, 'yellow');
    log(`    → ${description}\n`, 'reset');
  });
  
  log('💡 Usage:', 'cyan');
  log('  node update-content.js replace "placeholder" "your-value"', 'reset');
  log('  node update-content.js replace "skillpassport.com" "mysite.com"\n', 'reset');
}

function showHelp() {
  log('\n📚 Content Update Helper\n', 'cyan');
  log('Commands:', 'bright');
  log('  find <term>                  Find occurrences of a term', 'reset');
  log('  replace <old> <new>          Replace old term with new term', 'reset');
  log('  replace <old> <new> --dry-run Preview changes without applying', 'reset');
  log('  list-placeholders            Show common placeholders', 'reset');
  log('  help                         Show this help\n', 'reset');
  
  log('Examples:', 'bright');
  log('  node update-content.js find "skillpassport.com"', 'reset');
  log('  node update-content.js replace "skillpassport.com" "mysite.com"', 'reset');
  log('  node update-content.js replace "Rareminds" "My Company" --dry-run', 'reset');
  log('  node update-content.js list-placeholders\n', 'reset');
}

function generateUpdateScript() {
  log('\n📝 Generating personalized update script...\n', 'cyan');
  
  const script = `#!/bin/bash
# Personalized Content Update Script
# Generated: ${new Date().toISOString()}

# INSTRUCTIONS:
# 1. Update the values below with your actual information
# 2. Run: bash update-all-content.sh
# 3. Review changes before committing

# Your Information
DOMAIN="yourdomain.com"
PRODUCT_NAME="Your Product Name"
COMPANY_NAME="Your Company Name"
SUPPORT_EMAIL="support@yourdomain.com"
API_EMAIL="api@yourdomain.com"
SALES_EMAIL="sales@yourdomain.com"
BASIC_PRICE="Your Basic Price"
PRO_PRICE="Your Pro Price"

# Run replacements
echo "🔄 Updating content..."

node update-content.js replace "skillpassport.com" "$DOMAIN"
node update-content.js replace "Skill Ecosystem" "$PRODUCT_NAME"
node update-content.js replace "Rareminds" "$COMPANY_NAME"
node update-content.js replace "support@skillpassport.com" "$SUPPORT_EMAIL"
node update-content.js replace "api@skillpassport.com" "$API_EMAIL"
node update-content.js replace "sales@skillpassport.com" "$SALES_EMAIL"
node update-content.js replace "₹50/student/year" "$BASIC_PRICE"
node update-content.js replace "₹100/student/year" "$PRO_PRICE"

echo "✅ Content update complete!"
echo "📝 Review changes and commit when ready"
`;

  fs.writeFileSync('update-all-content.sh', script);
  log('✅ Created: update-all-content.sh', 'green');
  log('\n📝 Next steps:', 'cyan');
  log('  1. Edit update-all-content.sh with your information', 'reset');
  log('  2. Run: bash update-all-content.sh', 'reset');
  log('  3. Review changes before committing\n', 'reset');
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help') {
  showHelp();
} else if (command === 'find') {
  if (!args[1]) {
    log('❌ Error: Please provide a search term', 'red');
    log('Usage: node update-content.js find "search-term"\n', 'yellow');
  } else {
    findInFiles(args[1]);
  }
} else if (command === 'replace') {
  if (!args[1] || !args[2]) {
    log('❌ Error: Please provide both old and new terms', 'red');
    log('Usage: node update-content.js replace "old-term" "new-term"\n', 'yellow');
  } else {
    const dryRun = args.includes('--dry-run');
    replaceInFiles(args[1], args[2], dryRun);
  }
} else if (command === 'list-placeholders') {
  listPlaceholders();
} else if (command === 'generate-script') {
  generateUpdateScript();
} else {
  log(`❌ Unknown command: ${command}`, 'red');
  showHelp();
}
