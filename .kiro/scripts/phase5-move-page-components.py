"""
Phase 5: Move heavy components from pages layer to features layer.

Moves:
1. pages/admin/collegeAdmin/components/ → features/college-admin/ui/
2. pages/admin/collegeAdmin/finance/    → features/college-admin/ui/finance/
3. pages/admin/collegeAdmin/events/     → features/college-admin/ui/events/
4. pages/admin/schoolAdmin/components/  → features/school-admin/ui/
5. pages/admin/collegeAdmin/ToastProvider.tsx → app/providers/ToastProvider.tsx

Then updates all import statements in pages to reference new locations.
"""

import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent  # workspace root
SRC = ROOT / "src"

MOVES = [
    # (source_dir, dest_dir)
    (
        SRC / "pages/admin/collegeAdmin/components",
        SRC / "features/college-admin/ui/components",
    ),
    (
        SRC / "pages/admin/collegeAdmin/finance",
        SRC / "features/college-admin/ui/finance",
    ),
    (
        SRC / "pages/admin/collegeAdmin/events",
        SRC / "features/college-admin/ui/events",
    ),
    (
        SRC / "pages/admin/schoolAdmin/components",
        SRC / "features/school-admin/ui/components",
    ),
]

FILE_MOVES = [
    (
        SRC / "pages/admin/collegeAdmin/ToastProvider.tsx",
        SRC / "app/providers/ToastProvider.tsx",
    ),
]

# Import path rewrites: (old_pattern, new_pattern)
# These are applied to ALL .ts/.tsx/.js/.jsx files in src/
IMPORT_REWRITES = [
    # collegeAdmin components
    (
        r"from ['\"](\./|@/)?(\.\.\/)*pages/admin/collegeAdmin/components(/[^'\"]*)?['\"]",
        None,  # handled specially
    ),
]


def copy_tree(src: Path, dst: Path):
    """Copy directory tree, merging into dst if it exists."""
    dst.mkdir(parents=True, exist_ok=True)
    for item in src.rglob("*"):
        if item.is_file():
            rel = item.relative_to(src)
            target = dst / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
            print(f"  Copied: {item.relative_to(ROOT)} → {target.relative_to(ROOT)}")


def update_imports_in_file(filepath: Path, rewrites: list[tuple[str, str]]) -> bool:
    """Apply import rewrites to a file. Returns True if modified."""
    try:
        content = filepath.read_text(encoding="utf-8")
    except Exception:
        return False

    original = content
    for old, new in rewrites:
        content = re.sub(old, new, content)

    if content != original:
        filepath.write_text(content, encoding="utf-8")
        return True
    return False


def build_rewrites() -> list[tuple[str, str]]:
    """Build the list of (regex_pattern, replacement) tuples."""
    rewrites = []

    # pages/admin/collegeAdmin/components/* → @/features/college-admin/ui/components/*
    rewrites.append((
        r"(from\s+['\"])(\./|\.\./)*pages/admin/collegeAdmin/components(/[^'\"]*)?(['\"])",
        r"\1@/features/college-admin/ui/components\3\4",
    ))

    # pages/admin/collegeAdmin/finance/* → @/features/college-admin/ui/finance/*
    rewrites.append((
        r"(from\s+['\"])(\./|\.\./)*pages/admin/collegeAdmin/finance(/[^'\"]*)?(['\"])",
        r"\1@/features/college-admin/ui/finance\3\4",
    ))

    # pages/admin/collegeAdmin/events/* → @/features/college-admin/ui/events/*
    rewrites.append((
        r"(from\s+['\"])(\./|\.\./)*pages/admin/collegeAdmin/events(/[^'\"]*)?(['\"])",
        r"\1@/features/college-admin/ui/events\3\4",
    ))

    # pages/admin/schoolAdmin/components/* → @/features/school-admin/ui/components/*
    rewrites.append((
        r"(from\s+['\"])(\./|\.\./)*pages/admin/schoolAdmin/components(/[^'\"]*)?(['\"])",
        r"\1@/features/school-admin/ui/components\3\4",
    ))

    # pages/admin/collegeAdmin/ToastProvider → @/app/providers/ToastProvider
    rewrites.append((
        r"(from\s+['\"])(\./|\.\./)*pages/admin/collegeAdmin/ToastProvider(['\"])",
        r"\1@/app/providers/ToastProvider\3",
    ))

    return rewrites


def main():
    print("=== Phase 5: Moving heavy page components to features ===\n")

    # Step 1: Copy directories
    print("Step 1: Copying directories...")
    for src_dir, dst_dir in MOVES:
        if src_dir.exists():
            print(f"\n  {src_dir.relative_to(ROOT)} → {dst_dir.relative_to(ROOT)}")
            copy_tree(src_dir, dst_dir)
        else:
            print(f"  SKIP (not found): {src_dir.relative_to(ROOT)}")

    # Step 2: Copy individual files
    print("\nStep 2: Copying individual files...")
    for src_file, dst_file in FILE_MOVES:
        if src_file.exists():
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_file, dst_file)
            print(f"  Copied: {src_file.relative_to(ROOT)} → {dst_file.relative_to(ROOT)}")
        else:
            print(f"  SKIP (not found): {src_file.relative_to(ROOT)}")

    # Step 3: Update imports across all source files
    print("\nStep 3: Updating import statements...")
    rewrites = build_rewrites()
    modified = 0
    extensions = {".ts", ".tsx", ".js", ".jsx"}

    for filepath in SRC.rglob("*"):
        if filepath.suffix in extensions and filepath.is_file():
            # Skip migration backups
            if ".migration-backups" in str(filepath):
                continue
            if update_imports_in_file(filepath, rewrites):
                print(f"  Updated: {filepath.relative_to(ROOT)}")
                modified += 1

    print(f"\nTotal files with updated imports: {modified}")

    # Step 4: Update internal imports within moved files
    # Files in the moved directories may use relative imports like ./components/X
    # or ../FacultyLeaveManagement — these need to be updated to absolute paths
    print("\nStep 4: Fixing internal imports in moved files...")
    moved_dirs = [dst for _, dst in MOVES]
    moved_files_dir = [SRC / "app/providers"]

    internal_rewrites = [
        # Within college-admin/ui/components, relative imports to sibling files
        # These should already work since they're relative within the same dir
        # But imports like '../FacultyLeaveManagement' need updating
        (
            r"(from\s+['\"])(\.\./)+FacultyLeaveManagement(['\"])",
            r"\1@/pages/admin/collegeAdmin/FacultyLeaveManagement\3",
        ),
        (
            r"(from\s+['\"])(\.\./)+([A-Z][^'\"]*?)(['\"])",
            None,  # too broad, skip
        ),
    ]

    # Only fix the specific known cross-reference
    specific_rewrites = [
        (
            r"(from\s+['\"])\.\.\/FacultyLeaveManagement(['\"])",
            r"\1@/pages/admin/collegeAdmin/FacultyLeaveManagement\2",
        ),
    ]

    for moved_dir in moved_dirs:
        if not moved_dir.exists():
            continue
        for filepath in moved_dir.rglob("*"):
            if filepath.suffix in extensions and filepath.is_file():
                if update_imports_in_file(filepath, specific_rewrites):
                    print(f"  Fixed internal: {filepath.relative_to(ROOT)}")
                    modified += 1

    print(f"\n=== Done. Total files modified: {modified} ===")
    print("\nNext steps:")
    print("  1. Run: npm run build:dev")
    print("  2. Fix any remaining import errors")
    print("  3. Remove original source directories once build passes")


if __name__ == "__main__":
    main()
