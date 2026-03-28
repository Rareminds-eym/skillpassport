from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix CourseDetailModal import
    if "import CourseDetailModal from '@/features/courses';" in content:
        content = content.replace(
            "import CourseDetailModal from '@/features/courses';",
            "import { CourseDetailModal } from '@/features/courses';"
        )
    
    # Fix WeeklyLearningTracker import
    if "import WeeklyLearningTracker from '@/features/courses';" in content:
        content = content.replace(
            "import WeeklyLearningTracker from '@/features/courses';",
            "import { WeeklyLearningTracker } from '@/entities/student/ui';"
        )
    
    # Fix CourseAdvancedFilters import
    if "import CourseAdvancedFilters from '@/features/courses';" in content:
        content = content.replace(
            "import CourseAdvancedFilters from '@/features/courses';",
            "import { CourseAdvancedFilters } from '@/widgets/student-dashboard';"
        )
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('src')
    fixed = 0
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_file(filepath):
                print(f"Fixed: {filepath}")
                fixed += 1
    print(f"\nTotal files fixed: {fixed}")

if __name__ == '__main__':
    main()
