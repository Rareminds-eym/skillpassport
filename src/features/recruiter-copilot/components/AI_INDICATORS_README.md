# AI Thinking Indicators

ChatGPT-style thinking and status indicators for your AI chat interfaces.

## Components

### 1. `AIThinkingBubble`
The main thinking indicator with animated dots and optional status message.

**Props:**
- `status?: string` - Status message to display above the bubble (e.g., "Searching database...")
- `showStatusPill?: boolean` - Whether to show the status pill (default: true if status provided)

**Usage:**
```tsx
import { AIThinkingBubble } from './AIThinkingIndicators';

// Basic usage
<AIThinkingBubble />

// With status
<AIThinkingBubble status="Analyzing your request..." />
```

**Features:**
- Smooth fade-in animation
- 3 animated dots with staggered bounce
- Chat bubble shape with tail
- Optional status pill with pulsing indicator
- Matches your existing chat bubble style

---

### 2. `AIStatusPill`
Standalone status pill for showing AI activity without the full thinking bubble.

**Props:**
- `status: string` - The status message to display
- `variant?: 'default' | 'searching' | 'processing' | 'running'` - Color theme

**Usage:**
```tsx
import { AIStatusPill } from './AIThinkingIndicators';

<AIStatusPill status="Thinking..." variant="default" />
<AIStatusPill status="Searching files..." variant="searching" />
<AIStatusPill status="Processing data..." variant="processing" />
<AIStatusPill status="Running code..." variant="running" />
```

**Variants:**
- `default` - Blue/purple gradient (general thinking)
- `searching` - Green gradient (search operations)
- `processing` - Amber gradient (data processing)
- `running` - Purple/pink gradient (code execution)

---

### 3. `AISkeletonMessage`
Skeleton placeholder for long streaming responses.

**Props:**
- `lines?: number` - Number of skeleton lines to show (default: 3)

**Usage:**
```tsx
import { AISkeletonMessage } from './AIThinkingIndicators';

<AISkeletonMessage lines={4} />
```

**Features:**
- Animated skeleton lines
- Progressive appearance (staggered animation)
- Shimmer effect
- Matches chat bubble styling

---

### 4. `AITypingIndicator`
Minimal typing indicator - just dots, compact and clean.

**Props:**
- `text: string` - Label text (default: "Typing")
- `variant?: 'bubble' | 'inline'` - Display style

**Usage:**
```tsx
import { AITypingIndicator } from './AIThinkingIndicators';

// Bubble variant (full chat bubble)
<AITypingIndicator text="AI is typing" variant="bubble" />

// Inline variant (compact)
<AITypingIndicator text="Processing" variant="inline" />
```

---

## Integration Examples

### Basic Integration

```tsx
import { AIThinkingBubble } from './AIThinkingIndicators';

const ChatComponent = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      
      {loading && (
        <div className="flex justify-start">
          <AIThinkingBubble />
        </div>
      )}
    </div>
  );
};
```

### With Status Updates

```tsx
const [loading, setLoading] = useState(false);
const [aiStatus, setAiStatus] = useState('');

const handleSend = async (query: string) => {
  setLoading(true);
  setAiStatus('Analyzing your request...');
  
  // Update status at different stages
  setTimeout(() => setAiStatus('Searching database...'), 800);
  setTimeout(() => setAiStatus('Processing results...'), 1600);
  
  const response = await processQuery(query);
  
  setLoading(false);
  setAiStatus('');
};

// Render
{loading && (
  <div className="flex justify-start">
    <AIThinkingBubble status={aiStatus} />
  </div>
)}
```

### Multi-Stage Progress

```tsx
const stages = [
  'Understanding query...',
  'Searching talent database...',
  'Analyzing candidates...',
  'Generating insights...'
];

let currentStage = 0;

// Update status as you progress
setAiStatus(stages[currentStage++]);
```

---

## Styling Notes

All components use:
- **Framer Motion** for smooth animations
- **Tailwind CSS** for styling
- Consistent with your chat bubble design (rounded-2xl, shadows, etc.)
- Subtle, non-intrusive animations
- Accessible color contrasts

### Custom Colors

To match your brand colors, modify the gradient classes:

```tsx
// In AIStatusPill
const customVariant = 'from-pink-50 to-rose-50 border-pink-100/50 text-pink-700';
```

### Animation Speed

Adjust timing in the component:

```tsx
// Faster dots
transition={{ duration: 0.6, ... }}

// Slower fade-in
transition={{ duration: 0.4 }}
```

---

## Design Philosophy

These indicators follow ChatGPT's UX principles:

1. **Calm & Unobtrusive** - Subtle animations, low contrast
2. **Informative** - Clear status messages when needed
3. **Consistent** - Match your existing chat bubble style
4. **Smooth** - All transitions are fluid, no jarring movements
5. **Progressive** - Show status updates as work progresses

---

## Files

- `AIThinkingIndicators.tsx` - Main component file
- `AIThinkingIndicators.examples.tsx` - Usage examples and demos
- `RecruiterCopilot.tsx` - Live implementation in your chat UI

---

## Tips

1. **Status Messages**: Keep them short (3-5 words max)
2. **Timing**: Update status every 800-1200ms for natural feel
3. **Progressive**: Show status that matches actual work being done
4. **Cleanup**: Always clear status when done/error
5. **Accessibility**: Status text is read by screen readers

---

## Future Enhancements

Possible additions:
- Progress percentage indicator
- Estimated time remaining
- Cancel/stop button integration
- Voice/sound effects
- Haptic feedback (mobile)
- Custom animation presets

---

Need help? Check `AIThinkingIndicators.examples.tsx` for complete working examples!

