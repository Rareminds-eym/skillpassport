#!/usr/bin/env python3
"""
Fix recruiter-pipeline imports - components should be imported from recruiter-pipeline, not recruiter.
"""

from pathlib import Path
import re

# Components that should be imported from recruiter-pipeline
PIPELINE_COMPONENTS = [
    'AdvancedShortlistFilters',
    'OfferAdvancedFilters',
    'PipelineHeader',
    'PipelineQuickFilters',
    'PipelineBulkActionsBar',
    'AIRecommendedColumn',
    'AddFromTalentPoolModal',
    'KanbanColumn',
    'NextActionModal',
    'PipelineCandidate',
    'AIRecommendation',
    'STAGES',
    'ShortlistFilters',
    'OfferFilters',
    'OfferSortOptions'
]

def fix_file(filepath):
    """Fix recruiter-pipeline imports in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: import Component from '@/features/recruiter'
        # Pattern 2: import { Component } from '@/features/recruiter'
        # Pattern 3: import Component, { Other } from '@/features/recruiter'
        
        # Replace @/features/recruiter with @/features/recruiter-pipeline for pipeline components
        for component in PIPELINE_COMPONENTS:
            # Pattern: import Component from '@/features/recruiter'
            pattern1 = rf"import\s+{component}\s+from\s+['\"]@/features/recruiter['\"]"
            replacement1 = f"import {component} from '@/features/recruiter-pipeline'"
            content = re.sub(pattern1, replacement1, content)
            
            # Pattern: import { Component } from '@/features/recruiter'
            # This is trickier - need to handle mixed imports
            
        # Handle mixed imports like: import Component, { Other } from '@/features/recruiter'
        # where Component is a pipeline component
        for component in PIPELINE_COMPONENTS:
            pattern = rf"import\s+{component}\s*,\s*\{{\s*([^}}]+)\s*\}}\s*from\s+['\"]@/features/recruiter['\"]"
            match = re.search(pattern, content)
            if match:
                other_imports = match.group(1)
                # Split into two imports
                replacement = f"import {component} from '@/features/recruiter-pipeline';\nimport {{ {other_imports} }} from '@/features/recruiter'"
                content = re.sub(pattern, replacement, content)
        
        # If content changed, write it back
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function to fix all files."""
    src_dir = Path('src')
    fixed_count = 0
    
    # Find all TypeScript/JavaScript files
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            if fix_file(filepath):
                print(f"✓ Fixed: {filepath}")
                fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} file(s)")

if __name__ == '__main__':
    main()
