import os
import re
from pathlib import Path

violations = {}
shared_dir = Path('src/shared')

# Comprehensive patterns for all violation types
patterns = {
    'features': re.compile(r'@/features'),
    'widgets': re.compile(r'@/widgets'),
    'pages': re.compile(r'@/pages'),
    'app': re.compile(r'@/app'),
    'stores': re.compile(r'@/stores'),
    'entities': re.compile(r'@/entities'),
}

for file in shared_dir.rglob('*'):
    if file.suffix in ['.ts', '.tsx', '.js', '.jsx']:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                
                file_violations = []
                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if line.strip().startswith('//'):
                        continue
                    
                    for layer, pattern in patterns.items():
                        if pattern.search(line):
                            file_violations.append({
                                'line': i,
                                'layer': layer,
                                'content': line.strip()
                            })
                
                if file_violations:
                    violations[str(file).replace('\\', '/')] = file_violations
                    
        except Exception as e:
            print(f"Error reading {file}: {e}")

print(f'=' * 80)
print(f'FSD VIOLATION ANALYSIS - SHARED LAYER')
print(f'=' * 80)
print(f'\nTotal files with violations: {len(violations)}')
print(f'Total violation instances: {sum(len(v) for v in violations.values())}\n')

# Summary by layer
layer_counts = {}
for file_viols in violations.values():
    for v in file_viols:
        layer = v['layer']
        layer_counts[layer] = layer_counts.get(layer, 0) + 1

print('Violations by layer:')
for layer, count in sorted(layer_counts.items(), key=lambda x: -x[1]):
    print(f'  {layer}: {count}')

print(f'\n' + '=' * 80)
print('DETAILED VIOLATIONS:')
print('=' * 80)

for file, file_violations in sorted(violations.items()):
    print(f'\n📁 {file}')
    print(f'   Total violations: {len(file_violations)}')
    
    for v in file_violations:
        print(f'   Line {v["line"]:4d} | {v["layer"]:10s} | {v["content"][:80]}')
