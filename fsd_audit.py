"""Comprehensive FSD audit - check for broken imports, misplaced code, and violations."""
import re
from pathlib import Path
from collections import defaultdict

src = Path('src')
skip_dirs = {'migration', '__tests__', 'test', 'node_modules', '.migration-backups'}
issues = []

def should_skip(path):
    return any(s in path.parts for s in skip_dirs)

# 1. Check for imports from non-existent paths
print("=" * 60)
print("1. BROKEN IMPORTS (importing from paths that don't exist)")
print("=" * 60)
broken = []
for f in src.rglob('*'):
    if f.is_file() and f.suffix in ('.ts', '.tsx', '.js', '.jsx') and not should_skip(f):
        try:
            content = f.read_text(encoding='utf-8')
            for m in re.finditer(r"from ['\"](@/[^'\"]+)['\"]", content):
                imp = m.group(1)
                # Convert @/ to src/
                rel = imp.replace('@/', 'src/')
                # Check if it resolves
                p = Path(rel)
                exists = (p.exists() or 
                         p.with_suffix('.ts').exists() or 
                         p.with_suffix('.tsx').exists() or
                         p.with_suffix('.js').exists() or
                         p.with_suffix('.jsx').exists() or
                         (p.is_dir() and (p / 'index.ts').exists()) or
                         (p.is_dir() and (p / 'index.js').exists()) or
                         (p.is_dir() and (p / 'index.tsx').exists()))
                if not exists:
                    broken.append((str(f).replace('\\','/'), imp))
        except: pass

for f, imp in broken[:30]:
    print(f"  {f}")
    print(f"    -> {imp}")
print(f"\n  Total: {len(broken)} broken imports\n")

# 2. Non-FSD directories in src/
print("=" * 60)
print("2. NON-FSD DIRECTORIES IN src/")
print("=" * 60)
fsd_dirs = {'app', 'pages', 'widgets', 'features', 'entities', 'shared'}
ok_dirs = {'assets', 'styles', '__tests__', 'test', 'migration', 'scripts'}
for d in sorted(src.iterdir()):
    if d.is_dir() and d.name not in fsd_dirs and d.name not in ok_dirs and not d.name.startswith('.'):
        count = sum(1 for _ in d.rglob('*') if _.is_file())
        print(f"  {d.name}/ ({count} files) - NOT an FSD layer")

# 3. Features with non-standard segments
print(f"\n{'=' * 60}")
print("3. FEATURES WITH NON-STANDARD SEGMENTS")
print("=" * 60)
standard_segs = {'api', 'model', 'ui', 'lib', '__tests__'}
for feat in sorted((src / 'features').iterdir()):
    if feat.is_dir():
        for seg in sorted(feat.iterdir()):
            if seg.is_dir() and seg.name not in standard_segs:
                print(f"  features/{feat.name}/{seg.name}/ - non-standard segment")

# 4. Cloudflare workers importing from FSD layers
print(f"\n{'=' * 60}")
print("4. WORKER/FUNCTIONS IMPORTING FROM FSD LAYERS")
print("=" * 60)
worker_dirs = [src / 'functions-lib']
cf_root = Path('cloudflare-workers')
if cf_root.exists():
    for d in cf_root.rglob('*'):
        if d.is_dir() and d.name == 'src':
            worker_dirs.append(d)
for wd in worker_dirs:
    if wd.exists():
        for f in wd.rglob('*'):
            if f.is_file() and f.suffix in ('.ts', '.tsx', '.js', '.jsx'):
                try:
                    content = f.read_text(encoding='utf-8')
                    for m in re.finditer(r"from ['\"](@/(?:features|entities|widgets|pages|app)/[^'\"]+)['\"]", content):
                        print(f"  {str(f).replace(chr(92),'/')}: imports {m.group(1)}")
                except: pass

# 5. Entities importing from features
print(f"\n{'=' * 60}")
print("5. ENTITIES IMPORTING FROM FEATURES (FSD violation)")
print("=" * 60)
count = 0
for f in (src / 'entities').rglob('*'):
    if f.is_file() and f.suffix in ('.ts', '.tsx', '.js', '.jsx') and not should_skip(f):
        try:
            content = f.read_text(encoding='utf-8')
            for line in content.split('\n'):
                if re.search(r"from ['\"]@/features/", line) and not line.strip().startswith('//') and not line.strip().startswith('*'):
                    print(f"  {str(f).replace(chr(92),'/')}")
                    print(f"    {line.strip()}")
                    count += 1
                    break
        except: pass
print(f"  Total: {count}")

# 6. Shared importing from features (not re-exports in index)
print(f"\n{'=' * 60}")
print("6. SHARED IMPORTING FROM FEATURES")
print("=" * 60)
count = 0
for f in (src / 'shared').rglob('*'):
    if f.is_file() and f.suffix in ('.ts', '.tsx', '.js', '.jsx') and not should_skip(f):
        try:
            content = f.read_text(encoding='utf-8')
            for line in content.split('\n'):
                if re.search(r"from ['\"]@/features/", line) and not line.strip().startswith('//') and not line.strip().startswith('*'):
                    print(f"  {str(f).replace(chr(92),'/')}")
                    print(f"    {line.strip()}")
                    count += 1
                    break
        except: pass
print(f"  Total: {count}")

# 7. Features importing from stores directly
print(f"\n{'=' * 60}")
print("7. FEATURES IMPORTING FROM @/stores")
print("=" * 60)
count = 0
for f in (src / 'features').rglob('*'):
    if f.is_file() and f.suffix in ('.ts', '.tsx', '.js', '.jsx') and not should_skip(f):
        try:
            content = f.read_text(encoding='utf-8')
            for line in content.split('\n'):
                if re.search(r"from ['\"]@/stores", line) and not line.strip().startswith('//') and not line.strip().startswith('*'):
                    count += 1
                    break
        except: pass
print(f"  Total: {count} feature files import from @/stores")

print(f"\n{'=' * 60}")
print("AUDIT COMPLETE")
print("=" * 60)
