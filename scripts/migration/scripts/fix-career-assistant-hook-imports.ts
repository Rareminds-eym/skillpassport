import * as fs from 'fs';
import * as path from 'path';

/**
 * Fix career-assistant hook imports that are incorrectly pointing to @/shared/lib/hooks
 * These hooks should be imported from @/features/career-assistant/hooks
 */

const fixes = [
  {
    file: 'src/features/career-assistant/components/CareerAssistant.tsx',
    replacements: [
      {
        from: "import { useOptimizedMessages, Message } from '@/shared/lib/hooks/useOptimizedMessages';",
        to: "import { useOptimizedMessages, Message } from '@/features/career-assistant/hooks/useOptimizedMessages';"
      },
      {
        from: "import { useSmartScroll } from '@/shared/lib/hooks/useSmartScroll';",
        to: "import { useSmartScroll } from '@/features/career-assistant/hooks/useSmartScroll';"
      },
      {
        from: "import { useConversationSwitcher } from '@/shared/lib/hooks/useConversationSwitcher';",
        to: "import { useConversationSwitcher } from '@/features/career-assistant/hooks/useConversationSwitcher';"
      },
      {
        from: "import { VirtualMessage } from '@/shared/lib/hooks/useVirtualMessage';",
        to: "import { VirtualMessage } from '@/features/career-assistant/hooks/useVirtualMessage';"
      }
    ]
  },
  {
    file: 'src/features/career-assistant/components/ConversationSidebar.tsx',
    replacements: [
      {
        from: "import { VirtualMessage } from '@/shared/lib/hooks/useVirtualMessage';",
        to: "import { VirtualMessage } from '@/features/career-assistant/hooks/useVirtualMessage';"
      }
    ]
  }
];

function applyFixes() {
  let totalFixed = 0;
  
  for (const fix of fixes) {
    const filePath = path.resolve(process.cwd(), fix.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileFixed = false;
    
    for (const replacement of fix.replacements) {
      if (content.includes(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        fileFixed = true;
        console.log(`✓ Fixed import in ${fix.file}`);
        console.log(`  ${replacement.from}`);
        console.log(`  → ${replacement.to}`);
      }
    }
    
    if (fileFixed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalFixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} files`);
}

applyFixes();
