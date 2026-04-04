"""
Fix imports that were incorrectly changed from educator-copilot to educator.
Strategy: Find all symbols exported from educator-copilot but NOT from educator,
then fix any files importing those symbols from educator.
"""
import re
from pathlib import Path

# Symbols that live in educator-copilot (not in educator)
# These were incorrectly changed by the blanket replacement script
EDUCATOR_COPILOT_ONLY_SYMBOLS = [
    'createTeacher', 'updateTeacher', 'deleteTeacher', 'getTeachers', 'getTeacherById',
    'getCurrentEducator', 'getCurrentEducatorId',
    'getAssignmentsByStudentId', 'getAssignmentStats', 'updateAssignmentStatus',
    'submitAssignmentWithStagedFiles', 'getAssignmentWithFiles',
    'uploadInstructionFile', 'deleteInstructionFile',
    'getLessonPlans', 'createLessonPlan', 'updateLessonPlan', 'deleteLessonPlan',
    'submitLessonPlan', 'getCurriculums', 'getChapters', 'getLearningOutcomes',
    'getSubjects', 'getClasses', 'LessonPlan', 'LessonPlanFormData',
    'getGeographicDistribution', 'getTopHiringColleges', 'getQualityMetrics',
    'FunnelRangePreset',
    'buildEducatorContext',
    'educatorIntelligenceEngine', 'educatorWelcomeConfig', 'educatorChatConfig',
    'dashboardApi', 'DashboardKPIs', 'RecentActivity', 'Announcement', 'SkillAnalytics',
    'getAssignmentStats',
]

src_dir = Path('src')
total_fixed = 0

for filepath in src_dir.rglob('*.ts*'):
    # Skip educator-copilot files themselves
    if 'educator-copilot' in str(filepath):
        continue
    
    try:
        content = filepath.read_text(encoding='utf-8')
        original = content
        
        # Find imports from @/features/educator that contain educator-copilot-only symbols
        # Pattern: import { ..., SYMBOL, ... } from '@/features/educator'
        lines = content.split('\n')
        new_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check if this is an import from educator
            if "from '@/features/educator'" in line or 'from "@/features/educator"' in line:
                # Collect the full import statement (may span multiple lines)
                import_start = i
                import_text = line
                while i < len(lines) - 1 and '{' in import_text and '}' not in import_text:
                    i += 1
                    import_text += '\n' + lines[i]
                
                # Check if any educator-copilot-only symbols are in this import
                has_copilot_symbol = any(sym in import_text for sym in EDUCATOR_COPILOT_ONLY_SYMBOLS)
                
                if has_copilot_symbol:
                    # Replace the source
                    fixed = import_text.replace(
                        "from '@/features/educator'",
                        "from '@/features/educator-copilot'"
                    ).replace(
                        'from "@/features/educator"',
                        'from "@/features/educator-copilot"'
                    )
                    new_lines.extend(fixed.split('\n'))
                else:
                    new_lines.extend(import_text.split('\n'))
            else:
                new_lines.append(line)
            i += 1
        
        new_content = '\n'.join(new_lines)
        if new_content != content:
            filepath.write_text(new_content, encoding='utf-8')
            print(f"Fixed: {filepath}")
            total_fixed += 1
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f"\nTotal files fixed: {total_fixed}")
