#!/usr/bin/env python3
"""
Fix Default Export Issues

When the script added exports, it sometimes used named export syntax for default exports.
This script finds and fixes those issues.
"""

import re
from pathlib import Path

SRC_DIR = Path('src')

# Map of services that are default exports
DEFAULT_EXPORTS = {
    'addOnAnalyticsService': 'api/addOnAnalyticsService',
    'addOnPaymentService': 'api/addOnPaymentService',
    'usageStatisticsService': 'api/usageStatisticsService',
}

def check_if_default_export(file_path: Path) -> bool:
    """Check if a file uses default export"""
    if not file_path.exists():
        return False
    
    content = file_path.read_text(encoding='utf-8')
    return 'export default' in content

def fix_default_exports_in_index(index_path: Path):
    """Fix default export syntax in index files"""
    content = index_path.read_text(encoding='utf-8')
    original_content = content
    
    # Pattern: export { serviceName } from './path/service';
    # Should be: export { default as serviceName } from './path/service';
    
    # Find all export statements
    for match in re.finditer(r"export \{ (\w+) \} from '(\./[^']+)';", content):
        export_name = match.group(1)
        export_path = match.group(2)
        
        # Construct full path
        feature_dir = index_path.parent
        full_path = (feature_dir / export_path).with_suffix('.ts')
        
        # Check if it's a default export
        if check_if_default_export(full_path):
            old_line = match.group(0)
            new_line = f"export {{ default as {export_name} }} from '{export_path}';"
            content = content.replace(old_line, new_line)
            print(f"  Fixed default export: {export_name}")
    
    if content != original_content:
        index_path.write_text(content, encoding='utf-8')
        return True
    return False

def main():
    print("Fixing default export issues...")
    
    # Find all index.ts files in features
    index_files = list((SRC_DIR / 'features').rglob('index.ts'))
    
    fixed_count = 0
    for index_file in index_files:
        print(f"\nChecking: {index_file.relative_to(SRC_DIR)}")
        if fix_default_exports_in_index(index_file):
            fixed_count += 1
    
    print(f"\n{'='*60}")
    print(f"Fixed {fixed_count} files")
    print("Run 'npm run build:dev' to verify")

if __name__ == '__main__':
    main()
