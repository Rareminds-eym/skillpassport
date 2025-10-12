# SkillEcosystem Component

A hanging cards design section for the homepage that displays the comprehensive skill management ecosystem.

## Design Features

### Visual Layout
- **Hanging Line**: Uses SVG line from `/assets/HomePage/Line 9.svg`
- **Golden Pins**: Canvas-drawn circular pins that attach cards to the line
- **Variable Heights**: Each card hangs at a different level for visual interest
- **Smooth Strings**: Connecting lines from pins to cards

### Card Configuration

Each card has the following properties:
- `title`: Card heading
- `description`: Card description text
- `position.cardTop`: Vertical position of the card (in pixels)
- `position.left`: Horizontal position of the card (as percentage)
- `pinPosition.x`: Horizontal position of the pin (as percentage)
- `pinPosition.y`: Vertical position of the pin (in pixels)
- `stringLength`: Length of the string connecting pin to card (in pixels)

### Current Cards Layout

1. **Skill Validation Engine** (Left)
   - Position: 10% horizontal, 120px from top
   - Pin: 10% horizontal, 35px from top
   - String: 80px

2. **Digital Badging & Certificates** (Center-left)
   - Position: 28% horizontal, 180px from top
   - Pin: 28% horizontal, 50px from top
   - String: 130px

3. **Analytics Dashboard** (Center)
   - Position: 46% horizontal, 90px from top
   - Pin: 46% horizontal, 20px from top
   - String: 70px

4. **Competency Mapping** (Center-right)
   - Position: 64% horizontal, 150px from top
   - Pin: 64% horizontal, 45px from top
   - String: 105px

5. **Enterprise APIs** (Right)
   - Position: 84% horizontal, 70px from top
   - Pin: 84% horizontal, 15px from top
   - String: 55px

## Styling Details

### Cards
- Width: 280px
- Padding: 24px (1.5rem)
- Border radius: 24px (rounded-3xl)
- Background: White with shadow-xl
- Border: 1px solid gray-100
- Hover effect: Moves up 2px with enhanced shadow

### Icons
- Size: 56px × 56px (14 × 14 in Tailwind units)
- Background: Gray-50 with rounded corners
- Border: 1px solid gray-200

### Pins
- Outer circle: 16px radius, golden color (#C9A86A)
- Inner circle: 9px radius, brown color (#8B7355)
- Highlight: 4px white circle for 3D effect
- Border: 2px stroke (#A88F5E)

### Strings
- Color: rgba(190, 190, 190, 0.5)
- Width: 2px
- Style: Solid line

## How to Customize

### To add a new card:
```tsx
{
  title: 'New Feature',
  description: 'Description of the feature.',
  position: { cardTop: 140, left: 35 },
  pinPosition: { x: 35, y: 40 },
  stringLength: 100
}
```

### To adjust card positions:
- Modify `position.cardTop` to change vertical position
- Modify `position.left` to change horizontal position (0-100%)
- Ensure `pinPosition.x` matches the horizontal position
- Adjust `pinPosition.y` to position pin on the wavy line
- Set `stringLength` to bridge the distance between pin and card

### To change colors:
- Card backgrounds: Update `bg-white` className
- Pin colors: Modify fillStyle values in canvas drawing code
- String color: Update strokeStyle in canvas drawing code

## Technical Implementation

- **React Hooks**: Uses `useEffect` and `useRef` for canvas manipulation
- **Canvas API**: Draws pins and strings dynamically
- **Responsive**: Adapts to different screen sizes
- **Performance**: Canvas updates only on window resize
- **TypeScript**: Fully typed component

## Files Involved
- Component: `src/components/Homepage/SkillEcosystem.tsx`
- Export: `src/components/Homepage/index.js`
- Usage: `src/pages/homepage/Home.jsx`
- SVG Asset: `public/assets/HomePage/Line 9.svg`
