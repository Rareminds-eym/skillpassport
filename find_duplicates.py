#!/usr/bin/env python3
"""
Find duplicate files in the codebase by comparing content.
"""
import hashlib
from pathlib import Path
from collections import defaultdict

def get_file_hash(filepath):
    """Calculate MD5 hash of file content."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception as e:
        return None

def find_duplicates(root_dir='.'):
    """Find all duplicate files in the directory tree."""
    hash_map = defaultdict(list)
    
    # Directories to skip
    skip_dirs = {
        'node_modules', '.git', '.wrangler', 'dist', 'build', 
        '.next', '.cache', 'coverage', '__pycache__', '.vscode',
        '.migration-backups'
    }
    
    # File extensions to check
    extensions = {
        '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss',
        '.html', '.md', '.py', '.sh', '.bat', '.toml', '.yaml', '.yml'
    }
    
    root = Path(root_dir)
    total_files = 0
    
    print("Scanning files...")
    
    for filepath in root.rglob('*'):
        # Skip directories
        if filepath.is_dir():
            continue
            
        # Skip if in excluded directory
        if any(skip_dir in filepath.parts for skip_dir in skip_dirs):
            continue
            
        # Skip if not in our extension list
        if filepath.suffix not in extensions:
            continue
            
        # Skip very large files (> 5MB)
        try:
            if filepath.stat().st_size > 5 * 1024 * 1024:
                continue
        except:
            continue
            
        file_hash = get_file_hash(filepath)
        if file_hash:
            hash_map[file_hash].append(filepath)
            total_files += 1
    
    print(f"Scanned {total_files} files\n")
    
    # Find duplicates
    duplicates = {h: files for h, files in hash_map.items() if len(files) > 1}
    
    if not duplicates:
        print("No duplicate files found!")
        return
    
    print(f"Found {len(duplicates)} sets of duplicate files:\n")
    print("=" * 80)
    
    for idx, (file_hash, files) in enumerate(duplicates.items(), 1):
        print(f"\nDuplicate Set #{idx} ({len(files)} files):")
        print(f"Hash: {file_hash}")
        print(f"Size: {files[0].stat().st_size} bytes")
        print("\nFiles:")
        for f in sorted(files):
            print(f"  - {f}")
        print("-" * 80)
    
    # Summary
    total_duplicate_files = sum(len(files) - 1 for files in duplicates.values())
    print(f"\nSummary:")
    print(f"  Total duplicate sets: {len(duplicates)}")
    print(f"  Total redundant files: {total_duplicate_files}")
    print(f"  (keeping 1 from each set, {total_duplicate_files} could be removed)")

if __name__ == '__main__':
    find_duplicates()
