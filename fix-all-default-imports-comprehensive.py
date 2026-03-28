from pathlib import Path
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern to match: import ComponentName from '@/features/...'
    # This will catch all default imports from features
    pattern = r"import (\w+) from '(@/features/[^']+)'"
    
    def replace_with_named(match):
        component = match.group(1)
        module = match.group(2)
        return f"import {{ {component} }} from '{module}'"
    
    content = re.sub(pattern, replace_with_named, content)
    
    # Also handle double quotes
    pattern = r'import (\w+) from "(@/features/[^"]+)"'
    
    def replace_with_named_double(match):
        component = match.group(1)
        module = match.group(2)
        return f'import {{ {component} }} from "{module}"'
    
    content = re.sub(pattern, replace_with_named_double, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('src/pages')
    fixed = 0
    files_fixed = []
    
    for filepath in src_dir.rglob('*'):
        if filepath.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            try:
                if fix_file(filepath):
                    fixed += 1
                    files_fixed.append(str(filepath))
                    print(f"Fixed: {filepath}")
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
    
    print(f"\n✅ Total files fixed: {fixed}")
    
if __name__ == '__main__':
    main()
