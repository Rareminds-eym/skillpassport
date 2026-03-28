import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SupabaseFromCall {
  file: string;
  line: number;
  table: string;
  operation: string;
  code: string;
  targetFeature: string;
  targetServicePath: string;
  suggestedFunctionName: string;
}

class SupabaseFromExtractor {
  private results: SupabaseFromCall[] = [];

  async extractFromPages(): Promise<SupabaseFromCall[]> {
    const pagesDir = path.join(process.cwd(), 'src/pages');
    const files = await glob('**/*.{tsx,jsx,ts,js}', { cwd: pagesDir });

    for (const file of files) {
      const filePath = path.join(pagesDir, file);
      await this.analyzeFile(filePath, file);
    }

    return this.results;
  }

  private async analyzeFile(filePath: string, relativePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Match supabase.from('table') patterns
      const fromMatch = line.match(/supabase\.from\(['"]([^'"]+)['"]\)/);
      
      if (fromMatch) {
        const table = fromMatch[1];
        const operation = this.detectOperation(line);
        const targetFeature = this.determineFeature(table);
        
        this.results.push({
          file: `src/pages/${relativePath}`,
          line: index + 1,
          table,
          operation,
          code: line.trim(),
          targetFeature,
          targetServicePath: `src/features/${targetFeature}/api/${this.getServiceFileName(table)}`,
          suggestedFunctionName: this.generateFunctionName(table, operation)
        });
      }
    });
  }

  private detectOperation(line: string): string {
    if (line.includes('.select(')) return 'select';
    if (line.includes('.insert(')) return 'insert';
    if (line.includes('.update(')) return 'update';
    if (line.includes('.delete(')) return 'delete';
    if (line.includes('.upsert(')) return 'upsert';
    return 'unknown';
  }

  private determineFeature(table: string): string {
    // Map tables to features based on domain
    const tableToFeature: Record<string, string> = {
      // College admin tables
      'college_timetable_slots': 'college-admin',
      'college_timetables': 'college-admin',
      'college_breaks': 'college-admin',
      'college_lecturers': 'college-admin',
      'college_faculty_leaves': 'college-admin',
      'college_faculty_substitutions': 'college-admin',
      'college_events': 'college-admin',
      'college_event_registrations': 'college-admin',
      
      // School admin tables
      'timetable_slots': 'school-admin',
      
      // Opportunities/recruitment tables
      'opportunities': 'opportunities',
      'shortlist_candidates': 'opportunities',
      
      // Course tables
      'courses': 'courses',
      'course_skills': 'courses',
      'course_classes': 'courses',
      'course_modules': 'courses',
      'lessons': 'courses',
      'lesson_resources': 'courses',
      'lesson_plans': 'courses',
      
      // Student tables
      'students': 'student-profile',
      
      // Organization tables
      'organizations': 'college-admin',
      
      // Mentor/educator tables
      'mentor_notes': 'counselling',
    };

    return tableToFeature[table] || 'shared';
  }

  private getServiceFileName(table: string): string {
    // Convert table name to service file name
    // e.g., 'college_events' -> 'collegeEventsService.ts'
    const camelCase = table.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return `${camelCase}Service.ts`;
  }

  private generateFunctionName(table: string, operation: string): string {
    // Generate function name based on table and operation
    // e.g., 'college_events' + 'select' -> 'getCollegeEvents'
    const camelCase = table.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    const operationPrefix: Record<string, string> = {
      'select': 'get',
      'insert': 'create',
      'update': 'update',
      'delete': 'delete',
      'upsert': 'upsert'
    };

    const prefix = operationPrefix[operation] || 'handle';
    return `${prefix}${camelCase.charAt(0).toUpperCase() + camelCase.slice(1)}`;
  }

  generateReport(results: SupabaseFromCall[]): string {
    let report = '=== Supabase.from() Calls in Pages ===\n\n';
    report += `Total calls found: ${results.length}\n\n`;

    // Group by feature
    const byFeature = results.reduce((acc, call) => {
      if (!acc[call.targetFeature]) {
        acc[call.targetFeature] = [];
      }
      acc[call.targetFeature].push(call);
      return acc;
    }, {} as Record<string, SupabaseFromCall[]>);

    for (const [feature, calls] of Object.entries(byFeature)) {
      report += `\n## Feature: ${feature} (${calls.length} calls)\n\n`;
      
      for (const call of calls) {
        report += `### ${call.file}:${call.line}\n`;
        report += `- Table: ${call.table}\n`;
        report += `- Operation: ${call.operation}\n`;
        report += `- Code: ${call.code}\n`;
        report += `- Target: ${call.targetServicePath}\n`;
        report += `- Function: ${call.suggestedFunctionName}()\n\n`;
      }
    }

    return report;
  }

  generateMigrationPlan(results: SupabaseFromCall[]): string {
    let plan = '=== Migration Plan ===\n\n';
    
    // Group by target service file
    const byService = results.reduce((acc, call) => {
      if (!acc[call.targetServicePath]) {
        acc[call.targetServicePath] = [];
      }
      acc[call.targetServicePath].push(call);
      return acc;
    }, {} as Record<string, SupabaseFromCall[]>);

    for (const [servicePath, calls] of Object.entries(byService)) {
      plan += `\n## ${servicePath}\n\n`;
      plan += `Functions to create:\n`;
      
      const uniqueFunctions = [...new Set(calls.map(c => c.suggestedFunctionName))];
      uniqueFunctions.forEach(fn => {
        plan += `- ${fn}()\n`;
      });
      
      plan += `\nPages to update:\n`;
      const uniquePages = [...new Set(calls.map(c => c.file))];
      uniquePages.forEach(page => {
        plan += `- ${page}\n`;
      });
      plan += '\n';
    }

    return plan;
  }
}

// Run the extraction
async function main() {
  const extractor = new SupabaseFromExtractor();
  const results = await extractor.extractFromPages();

  console.log(extractor.generateReport(results));
  console.log('\n' + '='.repeat(80) + '\n');
  console.log(extractor.generateMigrationPlan(results));

  // Save results to JSON for further processing
  const outputPath = path.join(process.cwd(), 'src/migration/reports/supabase-from-calls.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✓ Results saved to: ${outputPath}`);
}

main().catch(console.error);
