# Hero Dithering Card Integration Guide

## ✅ Integration Complete!

The hero-dithering-card component has been successfully integrated into your React + TypeScript + Tailwind CSS project.

## 📦 What Was Installed

### NPM Dependencies
```bash
npm install @paper-design/shaders-react
```

### Files Created

1. **Component File**: `src/components/ui/hero-dithering-card.tsx`
   - Main CTASection component with dithering shader effect
   - Responsive design with hover interactions
   - Lazy-loaded shader for performance

2. **Demo Page**: `src/pages/demo/HeroDitheringDemo.tsx`
   - Example usage of the component
   - Can be accessed via routing

3. **Updated Configuration**:
   - `tailwind.config.js` - Added shadcn/ui design tokens
   - `src/index.css` - Added CSS variables for theming

## 🎨 Component Features

### Visual Effects
- **Dithering Shader**: Animated background effect using @paper-design/shaders-react
- **Hover Interaction**: Speed increases on hover (0.2 → 0.6)
- **Responsive Design**: Adapts from mobile to desktop
- **Dark Mode Support**: Built-in dark mode compatibility

### Design Elements
- Animated badge with pulsing indicator
- Large serif typography for headlines
- Smooth button hover effects with scale and ring
- Rounded corners (48px border radius)

## 🚀 Usage Examples

### Basic Usage
```tsx
import { CTASection } from "@/components/ui/hero-dithering-card";

function MyPage() {
  return <CTASection />;
}
```

### With Custom Wrapper
```tsx
import { CTASection } from "@/components/ui/hero-dithering-card";

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <CTASection />
    </div>
  );
}
```

### Accessing the Demo
Add a route to your router configuration:
```tsx
import HeroDitheringDemo from "@/pages/demo/HeroDitheringDemo";

// In your router setup
{
  path: "/demo/hero-dithering",
  element: <HeroDitheringDemo />
}
```

## 🎯 Customization Options

### Changing Colors
Edit the component file to customize colors:

```tsx
<Dithering
  colorBack="#00000000"  // Background (transparent)
  colorFront="#EC4E02"   // Accent color (change this!)
  // ... other props
/>
```

### Modifying Text Content
Update the text in `hero-dithering-card.tsx`:

```tsx
{/* Badge */}
<div className="mb-8 inline-flex items-center gap-2 ...">
  AI-Powered Writing  {/* Change this */}
</div>

{/* Headline */}
<h2 className="...">
  Your words, <br />
  <span>delivered perfectly.</span>  {/* Change this */}
</h2>

{/* Description */}
<p className="...">
  Join 2,847 founders...  {/* Change this */}
</p>

{/* Button */}
<button className="...">
  <span>Start Typing</span>  {/* Change this */}
</button>
```

### Adjusting Shader Settings
```tsx
<Dithering
  shape="warp"           // Options: "warp", "circle", "square"
  type="4x4"             // Options: "2x2", "4x4", "8x8"
  speed={0.2}            // Adjust animation speed
  minPixelRatio={1}      // Adjust quality
/>
```

## 🎨 Design Token Reference

The component uses these shadcn/ui design tokens:

- `bg-card` - Card background
- `border-border` - Border color
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-primary` - Button background
- `text-primary-foreground` - Button text
- `text-primary` - Badge text

## 📱 Responsive Behavior

- **Mobile (< 768px)**: 
  - Text scales down (5xl → 7xl)
  - Padding adjusts
  - Min height: 600px

- **Desktop (≥ 768px)**:
  - Full typography scale (7xl → 8xl)
  - Larger padding
  - Enhanced hover effects

## 🔧 Troubleshooting

### Shader Not Loading
If the dithering effect doesn't appear:
1. Check browser console for errors
2. Ensure `@paper-design/shaders-react` is installed
3. Verify the Suspense fallback is rendering

### Styling Issues
If colors don't match:
1. Verify CSS variables are in `src/index.css`
2. Check Tailwind config has design tokens
3. Ensure dark mode class is applied if needed

### Performance Issues
If animation is laggy:
1. Reduce `speed` prop value
2. Increase `minPixelRatio` (lowers quality but improves performance)
3. Consider disabling on mobile devices

## 🎯 Best Practices

1. **Use as Hero Section**: Place at the top of landing pages
2. **Customize Content**: Update text to match your brand
3. **Test Dark Mode**: Verify appearance in both themes
4. **Mobile Testing**: Check on actual devices
5. **Performance**: Monitor FPS on lower-end devices

## 📍 Where to Use This Component

### Recommended Placements
- Landing pages (homepage)
- Product launch pages
- Marketing campaign pages
- Feature announcement pages
- Pre-registration pages (like your SkillPassportPreRegistration)

### Example Integration in Your App
```tsx
// In src/pages/register/SkillPassportPreRegistration.jsx
import { CTASection } from "@/components/ui/hero-dithering-card";

export default function SkillPassportPreRegistration() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      {/* Add the hero section */}
      <CTASection />
      
      {/* Rest of your content */}
      <section>...</section>
      
      <Footer />
    </div>
  );
}
```

## 🔗 Dependencies

- `lucide-react` - Icons (already installed ✅)
- `@paper-design/shaders-react` - Shader effects (newly installed ✅)
- `framer-motion` - Animations (already installed ✅)
- `react` - Core library (already installed ✅)

## 📚 Additional Resources

- [Paper Design Shaders](https://github.com/paper-design/shaders-react)
- [Lucide Icons](https://lucide.dev/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## ✨ Next Steps

1. Visit `/demo/hero-dithering` to see the component in action
2. Customize the text and colors to match your brand
3. Integrate into your landing pages
4. Test on different devices and browsers
5. Optimize performance if needed

---

**Integration completed successfully!** 🎉

The component is ready to use and fully compatible with your existing TypeScript + Tailwind CSS + React setup.
