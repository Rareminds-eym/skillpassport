filepath = 'src/shared/lib/hooks/index.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("'../../../features/college-admin/model/useProgramSections'", "'@/features/college-admin/model/useProgramSections'"),
    ("'../../../features/student-profile/model/useProfileCompletionPrompt'", "'@/features/student-profile/model/useProfileCompletionPrompt'"),
    ("'../../../features/ai-tutor/model/useVideoSummarizer'", "'@/features/ai-tutor/model/useVideoSummarizer'"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed hooks/index.ts relative imports')
