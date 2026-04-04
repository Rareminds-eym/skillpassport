#!/usr/bin/env python3
"""
Move entity-specific components from shared/ui to appropriate entity/feature locations.
Task 7.3: Move entity-specific components to entities/features
"""

import os
import shutil
import re
from pathlib import Path

def ensure_dir(path):
    """Create directory if it doesn't exist"""
    os.makedirs(path, exist_ok=True)

def move_directory(source, target):
    """Move a directory and all its contents"""
    if not os.path.exists(source):
        print(f"⚠️  Source not found: {source}")
        return False
    
    # Ensure target parent directory exists
    ensure_dir(os.path.dirname(target))
    
    # If target exists, remove it first
    if os.path.exists(target):
        print(f"🗑️  Removing existing target: {target}")
        shutil.rmtree(target)
    
    # Move the directory
    print(f"📦 Moving: {source} -> {target}")
    shutil.move(source, target)
    return True

def update_imports_in_file(filepath, old_import, new_import):
    """Update import statements in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file contains the old import
        if old_import not in content:
            return False
        
        # Replace the import
        updated_content = content.replace(old_import, new_import)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"  ✅ Updated: {filepath}")
        return True
    except Exception as e:
        print(f"  ❌ Error updating {filepath}: {e}")
        return False

def find_and_update_imports(src_dir, old_import, new_import):
    """Find all files importing from old path and update them"""
    updated_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        # Skip node_modules and other non-source directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build', '.migration-backups']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                if update_imports_in_file(filepath, old_import, new_import):
                    updated_count += 1
    
    return updated_count

def main():
    print("=" * 80)
    print("Task 7.3: Move entity-specific components from shared/ui")
    print("=" * 80)
    
    # Define component moves
    # StudentProfileDrawer is student-entity specific
    # AssessmentReportDrawer is assessment-feature specific
    moves = [
        {
            'name': 'StudentProfileDrawer',
            'source': 'src/shared/ui/StudentProfileDrawer',
            'target': 'src/features/student-profile/ui/StudentProfileDrawer',
            'old_import': "from '@/shared/ui/StudentProfileDrawer'",
            'new_import': "from '@/features/student-profile'",
            'reason': 'Student-specific component belongs in student-profile feature'
        },
        {
            'name': 'AssessmentReportDrawer',
            'source': 'src/shared/ui/AssessmentReportDrawer',
            'target': 'src/features/assessment/ui/AssessmentReportDrawer',
            'old_import': "from '@/shared/ui/AssessmentReportDrawer'",
            'new_import': "from '@/features/assessment'",
            'reason': 'Assessment-specific component belongs in assessment feature'
        }
    ]
    
    total_moved = 0
    total_imports_updated = 0
    
    for move in moves:
        print(f"\n📋 Processing: {move['name']}")
        print(f"   Reason: {move['reason']}")
        
        # Move the component
        if move_directory(move['source'], move['target']):
            total_moved += 1
            
            # Update imports across codebase
            print(f"\n🔍 Updating imports from {move['old_import']} to {move['new_import']}")
            updated = find_and_update_imports('src', move['old_import'], move['new_import'])
            total_imports_updated += updated
            print(f"   Updated {updated} files")
        else:
            print(f"   ⚠️  Skipped (source not found)")
    
    print("\n" + "=" * 80)
    print("Summary:")
    print(f"  Components moved: {total_moved}")
    print(f"  Import statements updated: {total_imports_updated}")
    print("=" * 80)
    
    # Now update feature index files to export these components
    print("\n📝 Updating feature index files...")
    
    # Update student-profile feature index
    student_profile_index = 'src/features/student-profile/index.ts'
    if os.path.exists(student_profile_index):
        with open(student_profile_index, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add StudentProfileDrawer export if not present
        if 'StudentProfileDrawer' not in content:
            # Add export at the end
            content += "\n// Student Profile Drawer\nexport { default as StudentProfileDrawer } from './ui/StudentProfileDrawer/StudentProfileDrawer';\n"
            content += "export type { StudentProfileDrawerProps } from './ui/StudentProfileDrawer/types';\n"
            
            with open(student_profile_index, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Updated: {student_profile_index}")
    
    # Update assessment feature index
    assessment_index = 'src/features/assessment/index.ts'
    if os.path.exists(assessment_index):
        with open(assessment_index, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add AssessmentReportDrawer export if not present
        if 'AssessmentReportDrawer' not in content:
            # Add export at the end
            content += "\n// Assessment Report Drawer\nexport { default as AssessmentReportDrawer } from './ui/AssessmentReportDrawer';\n"
            
            with open(assessment_index, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Updated: {assessment_index}")
    
    print("\n✅ Task 7.3 complete!")
    print("\nNext steps:")
    print("  1. Run: npm run build:dev")
    print("  2. Fix any remaining import errors")
    print("  3. Test the affected pages")

if __name__ == '__main__':
    main()
