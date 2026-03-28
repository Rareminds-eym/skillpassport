#!/usr/bin/env python3
"""Fix MessageService default imports to named imports"""

import re
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

files_to_fix = [
    "src/features/messaging/model/useCollegeLecturerConversations.ts",
    "src/features/messaging/model/useUnreadMessagesCount.ts",
    "src/features/messaging/model/useCollegeLecturerMessages.ts",
    "src/features/educator/model/useEducatorMessages.ts",
    "src/features/educator/model/useEducatorAdminMessages.ts",
    "src/features/educator/model/useCollegeEducatorAdminConversations.ts",
    "src/entities/student/model/useConversationStudents.ts",
    "src/entities/student/model/useStudentAdminMessages.ts",
    "src/entities/student/model/useStudentCollegeAdminMessages.ts",
    "src/entities/student/model/useStudentCollegeLecturerMessages.ts",
]

for file_path in files_to_fix:
    full_path = ROOT_DIR / file_path
    if not full_path.exists():
        print(f"Skip: {file_path} (not found)")
        continue
    
    content = full_path.read_text(encoding='utf-8')
    
    # Replace default import with named import
    new_content = re.sub(
        r"import MessageService from '@/features/messaging';",
        "import { MessageService } from '@/features/messaging';",
        content
    )
    
    if new_content != content:
        full_path.write_text(new_content, encoding='utf-8')
        print(f"Fixed: {file_path}")
    else:
        print(f"Skip: {file_path} (no change needed)")

print("\nDone!")
