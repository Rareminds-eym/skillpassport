from pathlib import Path
import re

functions_dir = Path('functions')
fixed = 0

for filepath in functions_dir.rglob('*.ts'):
    content = filepath.read_text(encoding='utf-8')
    new_content = content.replace(
        "from '../../../src/functions-lib",
        "from '../../lib"
    ).replace(
        'from "../../../src/functions-lib',
        'from "../../lib'
    )
    if new_content != content:
        filepath.write_text(new_content, encoding='utf-8')
        print(f"Fixed: {filepath}")
        fixed += 1

print(f"\nTotal fixed: {fixed} files")
