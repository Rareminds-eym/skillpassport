# QR Code Generation Utility

## Overview

The `qrCode.ts` utility provides functions to generate QR codes for learner public profiles in the SkillPassport application. The generated QR codes contain only the public profile URL, ensuring no sensitive data (PII) is encoded.

## Security Features ✅

- **No PII**: Only public profile URL is encoded
- **URL Encoding**: Learner IDs are properly URL-encoded to prevent injection
- **Input Validation**: Strict validation of learner IDs
- **High Error Correction**: Uses 'H' level (30% recovery capability)
- **SSR Compatible**: Works in both browser and server environments

## Functions

### `generateProfileQRCode(learnerId: string): Promise<string>`

Main function to generate a QR code as a base64 data URL.

**Parameters:**
- `learnerId` (string): The learner's unique identifier

**Returns:**
- `Promise<string>`: Resolves to a data URL (e.g., `data:image/png;base64,...`)

**Throws:**
- `Error`: If learnerId is invalid or QR generation fails

**Example:**
```typescript
import { generateProfileQRCode } from '@/shared/lib/utils';

async function MyComponent() {
  try {
    const dataUrl = await generateProfileQRCode('learner-123');
    return <img src={dataUrl} alt="Profile QR Code" />;
  } catch (error) {
    console.error('QR generation failed:', error);
  }
}
```

### `generateProfileQRCodeSync(learnerId, onSuccess, onError?)`

Convenience wrapper for synchronous-style usage in event handlers and callbacks.

**Parameters:**
- `learnerId` (string): The learner's unique identifier
- `onSuccess` (function): Callback when QR code is generated `(dataUrl: string) => void`
- `onError` (function, optional): Callback on error `(error: Error) => void`

**Example:**
```typescript
import { generateProfileQRCodeSync } from '@/shared/lib/utils';

function handleGenerateQR() {
  generateProfileQRCodeSync(
    'learner-123',
    (dataUrl) => {
      console.log('Success!', dataUrl);
      setQrCode(dataUrl);
    },
    (error) => {
      console.error('Failed:', error);
      setError(error.message);
    }
  );
}
```

## QR Code Specifications

| Property | Value | Description |
|----------|-------|-------------|
| **Format** | PNG | Image format |
| **Size** | 300x300px | Generated dimensions |
| **Error Correction** | H (High) | ~30% recovery capability |
| **Margin** | 4 modules | Quiet zone around QR code |
| **Colors** | Black on White | Standard contrast |
| **Encoding** | UTF-8 | Character encoding |

## URL Format

Generated QR codes contain URLs in the following format:

```
https://skillpassport.com/learner/profile/{learnerId}
```

Or in development:
```
http://localhost:3000/learner/profile/{learnerId}
```

The base URL is automatically determined from `window.location.origin` in browser environments.

## Validation Rules

The utility validates learner IDs according to these rules:

| Rule | Behavior |
|------|----------|
| **Empty string** | ❌ Throws error: "Invalid learnerId: cannot be empty or whitespace only" |
| **Whitespace only** | ❌ Throws error: "Invalid learnerId: cannot be empty or whitespace only" |
| **null/undefined** | ❌ Throws error: "Invalid learnerId: must be a non-empty string" |
| **Non-string** | ❌ Throws error: "Invalid learnerId: must be a non-empty string" |
| **Valid string** | ✅ Trims whitespace and generates QR code |
| **Special characters** | ✅ URL-encodes automatically |

## Error Handling

### Validation Errors

```typescript
try {
  await generateProfileQRCode(''); // Empty string
} catch (error) {
  // error.message: "Invalid learnerId: cannot be empty or whitespace only"
}
```

### Generation Errors

```typescript
try {
  await generateProfileQRCode('learner-123');
} catch (error) {
  // error.message: "Failed to generate QR code: <reason>"
}
```

## React Integration Examples

### Example 1: Basic Component

```typescript
import { useState, useEffect } from 'react';
import { generateProfileQRCode } from '@/shared/lib/utils';

function ProfileQRCode({ learnerId }: { learnerId: string }) {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateProfileQRCode(learnerId)
      .then(setQrCode)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [learnerId]);

  if (loading) return <div>Loading...</div>;
  
  return (
    <img 
      src={qrCode} 
      alt="Profile QR Code"
      className="w-32 h-32"
    />
  );
}
```

### Example 2: With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { generateProfileQRCode } from '@/shared/lib/utils';

function useProfileQRCode(learnerId: string) {
  return useQuery({
    queryKey: ['profile-qr', learnerId],
    queryFn: () => generateProfileQRCode(learnerId),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

function ProfileCard({ learnerId }: { learnerId: string }) {
  const { data, isLoading, error } = useProfileQRCode(learnerId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <img src={data} alt="QR Code" />;
}
```

### Example 3: Download as File

```typescript
import { generateProfileQRCode } from '@/shared/lib/utils';

async function downloadQRCode(learnerId: string) {
  const dataUrl = await generateProfileQRCode(learnerId);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `profile-${learnerId}-qr.png`;
  link.click();
  
  URL.revokeObjectURL(link.href);
}
```

## Testing

The utility includes comprehensive tests covering:

✅ Valid inputs with various learner ID formats  
✅ URL encoding of special characters  
✅ Whitespace trimming  
✅ Empty string validation  
✅ Type validation (null, undefined, non-string)  
✅ Generation error handling  
✅ Security requirements (no PII in URL)  
✅ Error correction level verification  
✅ Sync wrapper callback behavior  

Run tests:
```bash
npm test -- qrCode.test.ts
```

## Performance Considerations

- **Generation Time**: ~50-100ms per QR code
- **Image Size**: ~2-5KB (base64 encoded)
- **Caching**: Recommended for frequently accessed profiles
- **Batch Generation**: Use `Promise.all()` for multiple learners

```typescript
// Batch generation example
const learnerIds = ['learner-1', 'learner-2', 'learner-3'];
const qrCodes = await Promise.all(
  learnerIds.map(id => generateProfileQRCode(id))
);
```

## Browser Compatibility

The utility uses the `qrcode` library (v1.5.4) which supports:

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Node.js environments (SSR)
- ✅ React Native (with appropriate base64 handling)

## Dependencies

- **qrcode** (v1.5.4): Core QR code generation library
- **@types/qrcode** (v1.5.6): TypeScript type definitions

## Migration from QRCodeSVG

If you're currently using `qrcode.react` (`<QRCodeSVG />`), you can migrate to this utility:

**Before:**
```typescript
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG 
  value={`${window.location.origin}/learner/profile/${learnerId}`}
  size={120}
  level="H"
/>
```

**After:**
```typescript
import { generateProfileQRCode } from '@/shared/lib/utils';

const [qrCode, setQrCode] = useState('');

useEffect(() => {
  generateProfileQRCode(learnerId).then(setQrCode);
}, [learnerId]);

<img src={qrCode} alt="QR Code" className="w-[120px] h-[120px]" />
```

**Benefits of Migration:**
- ✅ Centralized URL generation logic
- ✅ Consistent validation across the app
- ✅ Better error handling
- ✅ Easier to test and mock
- ✅ No prop drilling for QR code configuration

## Security Compliance

This utility complies with **Requirement 17.6** from the specification:

> "WHEN generating a QR code, THE System SHALL include only the public profile URL without sensitive data"

**What's Included:** ✅
- Public profile URL path
- Learner ID (non-sensitive identifier)

**What's Excluded:** ❌
- Email addresses
- Phone numbers
- Enrollability scores
- Personal information
- Authentication tokens
- Any other PII

## Support

For issues or questions:
1. Check the examples in `qrCode.example.ts`
2. Review the test suite in `qrCode.test.ts`
3. Consult the design document: `.kiro/specs/college-dashboard-redesign/design.md`

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Async QR code generation
- Sync wrapper function
- Comprehensive validation
- Full test coverage
- Security compliance
