from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the problematic import
    if 'import AssessmentReportDrawer from \'@/shared/ui\'' in content:
        content = content.replace(
            'import AssessmentReportDrawer from \'@/shared/ui\'',
            'import { AssessmentReportDrawer } from \'@/shared/ui\''
        )
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    files_to_fix = [
        'src/pages/educator/AssessmentResults.tsx',
        'src/pages/admin/universityAdmin/AssessmentResults.tsx',
        'src/pages/admin/schoolAdmin/AssessmentResults.tsx',
        'src/pages/admin/collegeAdmin/AssessmentResults.tsx'
    ]
    
    fixed = 0
    for filepath in files_to_fix:
        path = Path(filepath)
        if path.exists() and fix_file(path):
            print(f"Fixed: {filepath}")
            fixed += 1
    
    print(f"\nTotal files fixed: {fixed}")

if __name__ == '__main__':
    main()
