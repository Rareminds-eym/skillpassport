# CoreFeatures Component - GSAP ScrollTrigger Guide

## Overview
The CoreFeatures component uses GSAP ScrollTrigger to create a horizontal scrolling experience where all cards are in a single row and scroll left as you scroll down the page.

## Animation Details

### How It Works
- **Layout**: All 5 cards displayed in a single horizontal row
- **Initial Position**: First card starts centered on the screen
- **Scroll Behavior**: As you scroll down, cards move horizontally from right to left
- **Pin Effect**: Section is pinned during the horizontal scroll
- **Scrub**: Animation is smoothly synced with scroll position (scrub: 1)
- **Card Width**: Each card is 350px wide with gaps between them

### Features
- ✅ 5 feature cards with unique icons
- ✅ Horizontal scroll animation synced with vertical scrolling
- ✅ First card centered on initial view
- ✅ Hover effects (lift + color change)
- ✅ Smooth scrubbing animation
- ✅ Full-screen pinned section

## Customization

### Change Card Width
```typescript
// In card style, line 169
style={{ width: '350px' }}  // Change this value

// Also update centering calculation, line 163
style={{ paddingLeft: 'calc(50vw - 175px)' }}  // Use half of card width
```

### Adjust Scroll Speed (Scrub)
```typescript
// In scrollTrigger config, line 128
scrub: 1,  // Lower = faster, higher = smoother/slower (0.5-3 recommended)
```

### Change Gap Between Cards
```typescript
// In cards container, line 162
className="flex gap-6 lg:gap-8"  // Change gap-6 and gap-8 values
```

### Modify Scroll Distance
```typescript
// In gsap.to x calculation, line 121
return -(containerWidth - viewportWidth + 200);  // Change 200 for more/less padding
```

### Disable Pin Effect
```typescript
// In scrollTrigger config, line 129
pin: false,  // Set to false to disable pinning
```

### Change Section Height
```typescript
// In section style, line 145
style={{ minHeight: '100vh' }}  // Change vh value or use pixels
```

## Available Features

1. **Skill Validation Engine** - Authenticates skills via structured assessment data
2. **Digital Badging & Certificates** - Tamper-proof and shareable proof of competence
3. **Analytics Dashboard** - Visualize training ROI and identify skill gaps
4. **Competency Mapping** - Align internal frameworks with industry standards
5. **Enterprise APIs** - Integrate and scale across locations and departments

## Adding More Features

```typescript
const features = [
  // ... existing features
  {
    title: 'Your Feature Title',
    description: 'Your feature description',
    icon: (
      <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Your SVG path */}
      </svg>
    ),
  },
];
```

## Layout Details

The component uses a horizontal flexbox layout:
- **Display**: Flex row with no wrapping
- **Card Width**: Fixed at 350px per card
- **First Card**: Centered using `calc(50vw - 175px)` padding
- **Gaps**: 24px between cards (gap-6) on mobile, 32px (gap-8) on large screens

### Change to Different Starting Position
```jsx
// To start from left edge:
style={{ paddingLeft: '20px' }}

// To start from right:
style={{ paddingLeft: 'calc(100vw - 370px)' }}

// Current (centered):
style={{ paddingLeft: 'calc(50vw - 175px)' }}
```

## GSAP ScrollTrigger Config

### toggleActions Explained
Format: `"onEnter onLeave onEnterBack onLeaveBack"`

Current: `'play none none reverse'`
- **onEnter**: play - animation plays when entering
- **onLeave**: none - nothing happens when leaving
- **onEnterBack**: none - nothing happens when scrolling back
- **onLeaveBack**: reverse - animation reverses when scrolling up past trigger

### Other Options
- `'play pause resume reset'`
- `'play complete complete reset'`
- `'play none none none'`

## Performance Tips

1. **Use will-change**: Already optimized with transforms
2. **Cleanup**: ScrollTriggers are properly killed on unmount
3. **GPU Acceleration**: Uses transform and opacity (GPU-accelerated properties)

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS/Android)

## Troubleshooting

### Cards don't animate
- Check if GSAP is installed: `npm list gsap`
- Check console for errors
- Verify ScrollTrigger is registered

### Animation feels jerky
- Reduce stagger delay
- Increase duration
- Change easing function

### Cards stay invisible
- Check initial gsap.set() is working
- Verify scrollTrigger start/end points
- Check if section is in viewport

## Advanced: Custom Animations

### Add Scale Animation
```typescript
gsap.to(cards, {
  x: 0,
  opacity: 1,
  scale: 1,  // Add scale
  duration: 0.8,
  stagger: 0.15,
  ease: 'power3.out',
  // ... rest of config
});

// And set initial scale
gsap.set(cards, {
  x: 200,
  opacity: 0,
  scale: 0.8,  // Start smaller
});
```

### Add Rotation
```typescript
gsap.set(cards, {
  x: 200,
  opacity: 0,
  rotation: 15,  // Rotate initially
});

gsap.to(cards, {
  x: 0,
  opacity: 1,
  rotation: 0,  // Rotate back to normal
  // ... rest
});
```

### Different Animation Per Card
```typescript
cards.forEach((card, index) => {
  gsap.to(card, {
    x: 0,
    opacity: 1,
    duration: 0.8,
    delay: index * 0.15,
    ease: index % 2 === 0 ? 'power3.out' : 'elastic.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
    },
  });
});
```

## Dependencies

- **gsap**: ^3.12.5
- **React**: ^18.3.1
- **TypeScript**: ^5.5.3
