# RBAC Setup Guide - Student Dashboard

## ✅ Files Created

1. `src/config/abilities.js` - Permission definitions
2. `src/context/AbilityContext.jsx` - CASL context provider
3. `src/hooks/useAbility.js` - Custom hook
4. `src/components/RBAC/PermissionGate.jsx` - Route guard (already used in routes)
5. `src/components/RBAC/RoleSwitcher.jsx` - Demo mode switcher

## 🚀 Installation Steps

### Step 1: Install CASL

```bash
npm install @casl/ability @casl/react
```

### Step 2: Wrap Your App

Update `src/App.jsx` or `src/main.jsx`:

```javascript
import { AbilityProvider } from './context/AbilityContext';

<AuthProvider>
  <AbilityProvider>
    <SubscriptionProvider>
      <App />
    </SubscriptionProvider>
  </AbilityProvider>
</AuthProvider>
```

### Step 3: Add Role Switcher to Navbar

Find your student dashboard navbar component and add:

```javascript
import { RoleSwitcher } from '../components/RBAC/RoleSwitcher';

// In your navbar JSX:
<RoleSwitcher />
```

### Step 4: Enable Demo Mode (Optional)

Add to `.env.development`:

```env
VITE_ENABLE_DEMO_MODE=true
```

## 🎭 Demo Personas

Your system now has 4 demo personas:

1. **View-Only Student** 👁️
   - Can view everything
   - Cannot edit anything
   - Good for: Showing read-only mode

2. **Basic Student** 🎓
   - Can view and edit profile
   - Can create applications
   - Cannot access Career AI
   - Cannot see analytics
   - Good for: Showing free tier

3. **Premium Student** ⭐
   - Full access to all features
   - Can access Career AI
   - Can see analytics
   - Good for: Showing paid tier

4. **Restricted Student** 🔒
   - Can only view profile and dashboard
   - Cannot access most features
   - Good for: Showing suspended account

## 📝 Usage Examples

### In Components (Declarative)

```javascript
import { Can } from '../../context/AbilityContext';

<Can I="update" a="Profile">
  <button>Edit Profile</button>
</Can>
```

### In Components (Imperative)

```javascript
import { useAbility } from '../../hooks/useAbility';

function MyComponent() {
  const { can } = useAbility();
  
  if (!can('update', 'Profile')) {
    return <div>You cannot edit profiles</div>;
  }
  
  return <button>Edit</button>;
}
```

### Routes (Already Done!)

Your routes already use `PermissionGate`:

```javascript
<Route path="profile" element={
  <PermissionGate action="read" subject="Profile">
    <Profile />
  </PermissionGate>
} />
```

## 🧪 Testing

1. Start your app: `npm run dev`
2. Login as a student
3. Click the "Demo Mode" button in navbar
4. Select different personas
5. Navigate to different pages
6. See how access changes!

## 🎯 What This Gives You

✅ **Demo Mode** - Switch between student personas for presentations
✅ **No Database** - All permissions defined in code
✅ **Works with FeatureGate** - RBAC + Subscription checks
✅ **Production Ready** - Can be used in production
✅ **Easy to Extend** - Add more personas in `abilities.js`

## 🔧 Customization

### Add New Persona

Edit `src/config/abilities.js`:

```javascript
case 'demo_my_new_persona':
  can('read', 'Profile');
  can('update', 'Profile');
  // Add more permissions
  break;
```

Then add to `getDemoPersonaInfo()`:

```javascript
demo_my_new_persona: {
  name: 'My New Persona',
  description: 'Description here',
  icon: '🎨',
  color: 'bg-green-100 text-green-700'
}
```

### Change Permissions

Edit `defineAbilitiesFor()` in `src/config/abilities.js` to change what real users can do.

Edit `defineAbilitiesForDemo()` to change what demo personas can do.

## ❓ FAQ

**Q: Do I need a database?**
A: No! All permissions are in code.

**Q: Will this work in production?**
A: Yes! Demo mode only shows if `VITE_ENABLE_DEMO_MODE=true` or in development.

**Q: How does this work with FeatureGate?**
A: They work together! PermissionGate checks role, FeatureGate checks subscription.

**Q: Can I add recruiter/mentor roles?**
A: Yes, but they would need their own dashboards. This is for student dashboard only.

## 🎉 You're Done!

Your RBAC system is ready to use. Just install CASL and wrap your app with AbilityProvider!
