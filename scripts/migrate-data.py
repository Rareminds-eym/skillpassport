#!/usr/bin/env python3
"""
Script to migrate data directories from src/data/ to appropriate FSD model/ segments.
"""

import os
import re
from pathlib import Path
from typing import Dict

# Data migration mapping: old_path -> new_path
DATA_MIGRATIONS: Dict[str, str] = {
    # Assessment data
    'src/data/assessment/certificateConfig.ts': 'src/features/assessment/model/certificateConfig.ts',
    'src/data/assessment/courses.ts': 'src/features/assessment/model/courses.ts',
    'src/data/assessment/quizQuestions.ts': 'src/features/assessment/model/quizQuestions.ts',
    'src/data/assessment/testQuestions.ts': 'src/features/assessment/model/testQuestions.ts',
    'src/data/assessment/questions': 'src/features/assessment/model/questions',
    
    # Educator mock data
    'src/data/educator/mockActivities.ts': 'src/features/educator/model/mockActivities.ts',
    'src/data/educator/mockAnalytics.ts': 'src/features/educator/model/mockAnalytics.ts',
    'src/data/educator/mockClasses.ts': 'src/features/educator/model/mockClasses.ts',
    'src/data/educator/mockCourses.ts': 'src/features/educator/model/mockCourses.ts',
    'src/data/educator/mockMedia.ts': 'src/features/educator/model/mockMedia.ts',
    'src/data/educator/mockMentorNotes.ts': 'src/features/educator/model/mockMentorNotes.ts',
    'src/data/educator/mockStudents.ts': 'src/features/educator/model/mockStudents.ts',
    
    # Mock data (shared test data)
    'src/data/mock/assessmentsMockData.ts': 'src/shared/model/mock/assessmentsMockData.ts',
    'src/data/mock/examinationMockData.ts': 'src/shared/model/mock/examinationMockData.ts',
    'src/data/mock/mockContracts.ts': 'src/shared/model/mock/mockContracts.ts',
    'src/data/mock/mockProjects.ts': 'src/shared/model/mock/mockProjects.ts',
    'src/data/mock/mockProposals.ts': 'src/shared/model/mock/mockProposals.ts',
    
    # Root data files
    'src/data/notificationsData.ts': 'src/shared/model/notificationsData.ts',
    'src/data/sampleData.ts': 'src/shared/model/sampleData.ts',
}

# Import path mapping
IMPORT_MAPPINGS: Dict[str, str] = {
    '@/data/assessment/certificateConfig': '@/features/assessment/model/certificateConfig',
    '@/data/assessment/courses': '@/features/assessment/model/courses',
    '@/data/assessment/quizQuestions': '@/features/assessment/model/quizQuestions',
    '@/data/assessment/testQuestions': '@/features/assessment/model/testQuestions',
    '@/data/assessment/questions': '@/features/assessment/model/questions',
    
    '@/data/educator/mockActivities': '@/features/educator/model/mockActivities',
    '@/data/educator/mockAnalytics': '@/features/educator/model/mockAnalytics',
    '@/data/educator/mockClasses': '@/features/educator/model/mockClasses',
    '@/data/educator/mockCourses': '@/features/educator/model/mockCourses',
    '@/data/educator/mockMedia': '@/features/educator/model/mockMedia',
    '@/data/educator/mockMentorNotes': '@/features/educator/model/mockMentorNotes',
    '@/data/educator/mockStudents': '@/features/educator/model/mockStudents',
    
    '@/data/mock/assessmentsMockData': '@/shared/model/mock/assessmentsMockData',
    '@/data/mock/examinationMockData': '@/shared/model/mock/examinationMockData',
    '@/data/mock/mockContracts': '@/shared/model/mock/mockContracts',
    '@/data/mock/mockProjects': '@/shared/model/mock/mockProjects',
    '@/data/mock/mockProposals': '@/shared/model/mock/mockProposals',
    
    '@/data/notificationsData': '@/shared/model/notificationsData',
    '@/data/sampleData': '@/shared/model/sampleData',
}


def ensure_directory_exists(file_path: str) -> None:
    """Create directory if it doesn't exist."""
    directory = os.path.dirname(file_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"  ✓ Created directory: {directory}")


def move_file_or_directory(old_path: str, new_path: str) -> bool:
    """Move a file or directory to its new location."""
    if not os.path.exists(old_path):
        print(f"  ⚠ Source not found: {old_path}")
        return False
    
    ensure_directory_exists(new_path if os.path.isfile(old_path) else os.path.dirname(new_path))
    
    if os.path.isdir(old_path):
        # Move directory
        import shutil
        if os.path.exists(new_path):
            print(f"  ⚠ Destination already exists: {new_path}")
            return False
        shutil.copytree(old_path, new_path)
        print(f"  ✓ Moved directory: {old_path} -> {new_path}")
    else:
        # Move file
        with open(old_path, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(new_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Moved file: {old_path} -> {new_path}")
    
    return True


def update_imports_in_file(file_path: str, import_mappings: Dict[str, str]) -> int:
    """Update import statements in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ⚠ Error reading {file_path}: {e}")
        return 0
    
    original_content = content
    changes = 0
    
    for old_import, new_import in import_mappings.items():
        pattern = re.compile(
            r"(import\s+(?:[\w\s{},*]+)\s+from\s+['\"])" + re.escape(old_import) + r"(['\"])",
            re.MULTILINE
        )
        if pattern.search(content):
            content = pattern.sub(r'\1' + new_import + r'\2', content)
            changes += len(pattern.findall(original_content))
    
    if changes > 0:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        except Exception as e:
            print(f"  ⚠ Error writing {file_path}: {e}")
            return 0
    
    return changes


def main():
    print("=" * 80)
    print("DATA DIRECTORY MIGRATION SCRIPT")
    print("=" * 80)
    print()
    
    # Step 1: Move data files/directories
    print("Step 1: Moving data files to FSD model/ segments")
    print("-" * 80)
    moved_count = 0
    for old_path, new_path in DATA_MIGRATIONS.items():
        if move_file_or_directory(old_path, new_path):
            moved_count += 1
    print(f"\n✓ Moved {moved_count} data files/directories\n")
    
    # Step 2: Update imports
    print("Step 2: Updating import statements across codebase")
    print("-" * 80)
    
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    files = []
    for ext in extensions:
        files.extend(Path('src').rglob(f'*{ext}'))
    files = [str(f) for f in files]
    
    print(f"Found {len(files)} files to scan")
    
    total_changes = 0
    files_changed = 0
    
    for file_path in files:
        changes = update_imports_in_file(file_path, IMPORT_MAPPINGS)
        if changes > 0:
            total_changes += changes
            files_changed += 1
            print(f"  ✓ Updated {changes} import(s) in: {file_path}")
    
    print(f"\n✓ Updated {total_changes} imports across {files_changed} files\n")
    
    # Summary
    print("=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)
    print(f"Data files/directories moved: {moved_count}")
    print(f"Files with updated imports: {files_changed}")
    print(f"Total import statements updated: {total_changes}")
    print()
    print("⚠ NEXT STEPS:")
    print("  1. Run 'npm run build:dev' to verify all imports resolve")
    print("  2. Delete src/data/ directory after verification")
    print()


if __name__ == '__main__':
    main()
