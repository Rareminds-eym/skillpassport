"""Fix imports that were incorrectly rewritten to wrong feature indexes."""
from pathlib import Path

src_dir = Path('src')
total_fixed = 0

for filepath in src_dir.rglob('*.ts*'):
    try:
        content = filepath.read_text(encoding='utf-8')
        original = content

        # useEducatorSchool is in features/educator, not educator-copilot
        content = content.replace(
            "from '@/features/educator-copilot'",
            "from '@/features/educator'"
        ).replace(
            'from "@/features/educator-copilot"',
            'from "@/features/educator"'
        )

        if content != original:
            filepath.write_text(content, encoding='utf-8')
            print(f"Fixed: {filepath}")
            total_fixed += 1
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f"\nTotal files fixed: {total_fixed}")
