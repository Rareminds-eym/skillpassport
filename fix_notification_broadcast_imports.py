#!/usr/bin/env python3
"""
Fix useNotificationBroadcast import - it should be from broadcast feature, not messaging.
"""

from pathlib import Path
import re

def fix_file(filepath):
    """Fix useNotificationBroadcast import in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix: import { useNotificationBroadcast } from '@/features/messaging'
        # To: import { useNotificationBroadcast } from '@/features/broadcast/model/useNotificationBroadcast'
        content = re.sub(
            r"import\s*\{\s*useNotificationBroadcast\s*\}\s*from\s*['\"]@/features/messaging['\"]",
            "import { useNotificationBroadcast } from '@/features/broadcast/model/useNotificationBroadcast'",
            content
        )
        
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
