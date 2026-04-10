#!/usr/bin/env python3
"""
Move role-specific UI components from shared/ui/ to appropriate feature ui/ segments.
Task 7.1 of FSD Violations Cleanup
"""

import os
import shutil
from pathlib import Path
import re

# Define role-specific components and their target features
COMPONENT_MOVES = [
    # Admin components
    {
        'source': 'src/shared/ui/admin/modals/ClassManagementModals.tsx',
        'target': 'src/features/college-admin/ui/modals/ClassManagementModals.tsx',
        'old_import': r"from ['\"]@/shared/ui/admin/modals/ClassManagementModals['\"]",
        'new_import': "from '@/features/college-admin'",
    },
    {
        'source': 'src/shared/ui/admin/modals/DocumentViewerModal.tsx',
        'target': 'src/features/school-admin/ui/modals/DocumentViewerModal.tsx',
        'old_import': r"from ['\"]@/shared/ui/admin/modals/DocumentViewerModal['\"]",
        'new_import': "from '@/features/school-admin'",
    },
    {
        'source': 'src/shared/ui/admin/modals/FacultyDocumentViewerModal.tsx',
        'target': 'src/features/college-admin/ui/modals/FacultyDocumentViewerModal.tsx',
        'old_import': r"from ['\"]@/shared/ui/admin/modals/FacultyDocumentViewerModal['\"]",
        'new_import': "from '@/features/college-admin'",
    },
    {
        'source': 'src/shared/ui/admin/universityAdmin/FeeStructureModal.tsx',
        'target': 'src/features/university-admin/ui/FeeStructureModal.tsx',
        'old_import': r"from ['\"]@/shared/ui/admin/universityAdmin/FeeStructureModal['\"]",
        'new_import': "from '@/features/university-admin'",
    },
    {
        'source': 'src/shared/ui/admin/universityAdmin/ResultsAnalytics.tsx',
        'target': 'src/features/university-admin/ui/ResultsAnalytics.tsx',
        'old_import': r"from ['\"]@/shared/ui/admin/universityAdmin/ResultsAnalytics['\"]",
        'new_import': "from '@/features/university-admin'",
    },
    {
        'source': 'src/shared/ui/admin/universityAdmin/ResultsComponents.tsx',
        'target': 'src/features/university-admin/ui/ResultsComponents.tsx',
        'old_import': r"from ['\"]@/shared/ui/admin/universityAdmin/ResultsComponents['\"]",
        'new_import': "from '@/features/university-admin'",
    },
    # Exam components
    {
        'source': 'src/shared/ui/exams',
        'target': 'src/features/exams/ui',
        'old_import': r"from ['\"]@/shared/ui/exams/([^'\"]+)['\"]",
        'new_import': "from '@/features/exams'",
    },
    # Educator AI Button
    {
        'source': 'src/shared/ui/FloatingEducatorAIButton.tsx',
        'target': 'src/features/educator/ui/FloatingEducatorAIButton.tsx',
        'old_import': r"from ['\"]@/shared/ui/FloatingEducatorAIButton['\"]",
        'new_import': "from '@/features/educator'",
    },
    # Recruiter AI Button
    {
        'source': 'src/shared/ui/FloatingRecruiterAIButton.tsx',
        'target': 'src/features/recruiter-pipeline/ui/FloatingRecruiterAIButton.tsx',
        'old_import': r"from ['\"]@/shared/ui/FloatingRecruiterAIButton['\"]",
        'new_import': "from '@/features/recruiter-pipeline'",
    },
    # Student Profile Drawer (entity-specific)
    {
        'source': 'src/shared/ui/StudentProfileDrawer',
        'target': 'src/entities/student/ui/StudentProfileDrawer',
        'old_import': r"from ['\"]@/shared/ui/StudentProfileDrawer['\"]",
        'new_import': "from '@/entities/student'",
    },
    # Assessment Report Drawer (feature-specific)
    {
        'source': 'src/shared/ui/AssessmentReportDrawer',
        'target': 'src/features/assessment/ui/AssessmentReportDrawer',
        'old_import': r"from ['\"]@/shared/ui/AssessmentReportDrawer['\"]",
        'new_import': "from '@/features/assessment'",
    },
]

def move_component(source, target):
    """Move a file or directory from source to target."""
    source_path = Path(source)
    target_path = Path(target)
    
    if not source_path.exists():
        print(f"⚠️  Source not found: {source}")
        return False
    
    # Create target directory
    target_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Move the file or directory
    if source_path.is_dir():
        if target_path.exists():
            shutil.rmtree(target_path)
        shutil.copytree(source_path, target_path)
        print(f"✅ Moved directory: {source} -> {target}")
    else:
        shutil.copy2(source_path, target_path)
        print(f"✅ Moved file: {source} -> {target}")
    
    return True

def update_imports_in_file(filepath, old_pattern, new_import):
    """Update import statements in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace the import pattern
        content = re.sub(old_pattern, new_import, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"⚠️  Error updating {filepath}: {e}")
        return False

def update_all_imports(old_pattern, new_import):
    """Update imports across the entire codebase."""
    src_dir = Path('src')
    updated_files = []
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if update_imports_in_file(filepath, old_pattern, new_import):
                updated_files.append(str(filepath))
    
    return updated_files

def update_feature_index(feature_path, component_name):
    """Add export to feature index file."""
    index_path = Path(feature_path) / 'index.ts'
    
    # Create index if it doesn't exist
    if not index_path.exists():
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text('// Feature public API\n\n')
    
    # Read existing content
    content = index_path.read_text()
    
    # Check if export already exists
    if component_name in content:
        return
    
    # Add export
    export_line = f"export {{ default as {component_name} }} from './ui/{component_name}';\n"
    
    with open(index_path, 'a', encoding='utf-8') as f:
        f.write(export_line)
    
    print(f"✅ Added export to {index_path}")

def remove_from_shared_index():
    """Remove role-specific components from shared/ui/index.ts."""
    index_path = Path('src/shared/ui/index.ts')
    
    if not index_path.exists():
        return
    
    content = index_path.read_text()
    
    # Remove exports for moved components
    lines_to_remove = [
        'FloatingEducatorAIButton',
        'FloatingRecruiterAIButton',
        'AssessmentReportDrawer',
    ]
    
    lines = content.split('\n')
    filtered_lines = [
        line for line in lines
        if not any(component in line for component in lines_to_remove)
    ]
    
    index_path.write_text('\n'.join(filtered_lines))
    print(f"✅ Updated shared/ui/index.ts")

def main():
    print("=" * 60)
    print("Task 7.1: Move role-specific UI components to features")
    print("=" * 60)
    print()
    
    moved_count = 0
    updated_files_total = []
    
    # Move each component
    for move in COMPONENT_MOVES:
        source = move['source']
        target = move['target']
        old_import = move['old_import']
        new_import = move['new_import']
        
        print(f"\n📦 Processing: {Path(source).name}")
        print(f"   From: {source}")
        print(f"   To: {target}")
        
        # Move the component
        if move_component(source, target):
            moved_count += 1
            
            # Update imports across codebase
            print(f"   Updating imports...")
            updated_files = update_all_imports(old_import, new_import)
            updated_files_total.extend(updated_files)
            
            if updated_files:
                print(f"   ✅ Updated {len(updated_files)} files")
            
            # Update feature index
            component_name = Path(target).stem
            feature_path = Path(target).parent.parent
            if 'ui' in str(target):
                update_feature_index(feature_path, component_name)
    
    # Remove from shared index
    print(f"\n📝 Updating shared/ui/index.ts...")
    remove_from_shared_index()
    
    # Summary
    print(f"\n" + "=" * 60)
    print(f"✅ SUMMARY")
    print(f"=" * 60)
    print(f"Components moved: {moved_count}")
    print(f"Files updated: {len(set(updated_files_total))}")
    print()
    print("Next steps:")
    print("1. Run: npm run build:dev")
    print("2. Fix any remaining import issues")
    print("3. Remove empty directories from shared/ui/")

if __name__ == '__main__':
    main()
