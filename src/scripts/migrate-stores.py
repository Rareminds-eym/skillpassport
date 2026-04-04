#!/usr/bin/env python3
"""
Script to migrate Zustand stores from src/stores/ to appropriate FSD locations.
This script:
1. Moves store files to feature/model/ or shared/model/ segments
2. Updates all import statements across the codebase
3. Creates necessary directories
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Store migration mapping: old_path -> new_path
STORE_MIGRATIONS: Dict[str, str] = {
    'src/stores/authStore.ts': 'src/features/auth/model/authStore.ts',
    'src/stores/assessmentStore.ts': 'src/features/assessment/model/assessmentStore.ts',
    'src/stores/subscriptionStore.ts': 'src/features/subscription/model/subscriptionStore.ts',
    'src/stores/themeStore.ts': 'src/shared/model/themeStore.ts',
    'src/stores/portfolioStore.ts': 'src/features/digital-portfolio/model/portfolioStore.ts',
    'src/stores/searchStore.ts': 'src/shared/model/searchStore.ts',
    'src/stores/tourStore.ts': 'src/shared/model/tourStore.ts',
    'src/stores/useMessageStore.ts': 'src/features/messaging/model/messageStore.ts',
    'src/stores/careerAssistantStore.ts': 'src/features/career-assistant/model/careerAssistantStore.ts',
    'src/stores/counsellingStore.ts': 'src/features/counselling/model/counsellingStore.ts',
    'src/stores/globalPresenceStore.ts': 'src/shared/model/globalPresenceStore.ts',
    'src/stores/promotionalStore.ts': 'src/features/promotional/model/promotionalStore.ts',
    'src/stores/testStore.ts': 'src/features/assessment/model/testStore.ts',
}

# Import path mapping: old_import -> new_import
IMPORT_MAPPINGS: Dict[str, str] = {
    '@/stores/authStore': '@/features/auth/model/authStore',
    '@/stores/assessmentStore': '@/features/assessment/model/assessmentStore',
    '@/stores/subscriptionStore': '@/features/subscription/model/subscriptionStore',
    '@/stores/themeStore': '@/shared/model/themeStore',
    '@/stores/portfolioStore': '@/features/digital-portfolio/model/portfolioStore',
    '@/stores/searchStore': '@/shared/model/searchStore',
    '@/stores/tourStore': '@/shared/model/tourStore',
    '@/stores/useMessageStore': '@/features/messaging/model/messageStore',
    '@/stores/careerAssistantStore': '@/features/career-assistant/model/careerAssistantStore',
    '@/stores/counsellingStore': '@/features/counselling/model/counsellingStore',
    '@/stores/globalPresenceStore': '@/shared/model/globalPresenceStore',
    '@/stores/promotionalStore': '@/features/promotional/model/promotionalStore',
    '@/stores/testStore': '@/features/assessment/model/testStore',
    # Also handle index imports
    '@/stores': '@/stores',  # Will need manual review for index imports
}


def ensure_directory_exists(file_path: str) -> None:
    """Create directory if it doesn't exist."""
    directory = os.path.dirname(file_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"  ✓ Created directory: {directory}")


def move_store_file(old_path: str, new_path: str) -> bool:
    """Move a store file to its new location."""
    if not os.path.exists(old_path):
        print(f"  ⚠ Source file not found: {old_path}")
        return False
    
    ensure_directory_exists(new_path)
    
    # Read the file content
    with open(old_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Write to new location
    with open(new_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Moved: {old_path} -> {new_path}")
    return True


def find_files_with_imports(root_dir: str, extensions: List[str]) -> List[str]:
    """Find all files with specified extensions."""
    files = []
    for ext in extensions:
        files.extend(Path(root_dir).rglob(f'*{ext}'))
    return [str(f) for f in files]


def update_imports_in_file(file_path: str, import_mappings: Dict[str, str]) -> int:
    """Update import statements in a file. Returns number of changes made."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ⚠ Error reading {file_path}: {e}")
        return 0
    
    original_content = content
    changes = 0
    
    # Update each import mapping
    for old_import, new_import in import_mappings.items():
        if old_import == '@/stores' and new_import == '@/stores':
            continue  # Skip the index import for now
        
        # Pattern 1: import ... from '@/stores/...'
        pattern1 = re.compile(
            r"(import\s+(?:[\w\s{},*]+)\s+from\s+['\"])" + re.escape(old_import) + r"(['\"])",
            re.MULTILINE
        )
        if pattern1.search(content):
            content = pattern1.sub(r'\1' + new_import + r'\2', content)
            changes += len(pattern1.findall(original_content))
    
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
    print("ZUSTAND STORE MIGRATION SCRIPT")
    print("=" * 80)
    print()
    
    # Step 1: Move store files
    print("Step 1: Moving store files to FSD locations")
    print("-" * 80)
    moved_count = 0
    for old_path, new_path in STORE_MIGRATIONS.items():
        if move_store_file(old_path, new_path):
            moved_count += 1
    print(f"\n✓ Moved {moved_count} store files\n")
    
    # Step 2: Update imports across codebase
    print("Step 2: Updating import statements across codebase")
    print("-" * 80)
    
    # Find all TypeScript/JavaScript files
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    files = find_files_with_imports('src', extensions)
    
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
    
    # Step 3: Summary
    print("=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)
    print(f"Store files moved: {moved_count}")
    print(f"Files with updated imports: {files_changed}")
    print(f"Total import statements updated: {total_changes}")
    print()
    print("⚠ MANUAL REVIEW REQUIRED:")
    print("  1. Check src/stores/index.ts for any remaining exports")
    print("  2. Verify all imports from '@/stores' (without specific file) are updated")
    print("  3. Run 'npm run build:dev' to verify all imports resolve correctly")
    print("  4. Delete src/stores/ directory after verification")
    print()


if __name__ == '__main__':
    main()
