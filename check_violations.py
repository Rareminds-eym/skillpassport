import os
import re
from pathlib import Path

violations = []
shared_dir = Path('src/shared')

# Pattern to match imports from higher layers - more comprehensive
pattern = re.compile(r'[\'"]@/(features|widgets|pages|app|stores|entities)(/[^\'"]*)?[\'"]')

for file in shared_dir.rglob('*'):
    if file.suffix in ['.ts', '.tsx', '.js', '.jsx']:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    matches = pattern.findall(line)
                    if matches:
                        violations.append({
                            'file': str(file).replace('\\', '/'),
                            'line': i,
                            'content': line.strip(),
                            'imports_from': list(set(matches))
                        })
        except Exception as e:
            pass

print(f'Total violations found: {len(violations)}\n')
print('=' * 80)

# Group by file
files_dict = {}
for v in violations:
    if v['file'] not in files_dict:
        files_dict[v['file']] = []
    files_dict[v['file']].append(v)

for file, file_violations in sorted(files_dict.items()):
    print(f'\n{file}')
    print(f'  Violations: {len(file_violations)}')
    for v in file_violations:
        print(f'    Line {v["line"]}: imports from {v["imports_from"]}')
        print(f'      {v["content"][:100]}')
