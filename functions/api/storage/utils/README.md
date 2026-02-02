# Storage API Utilities

## R2Client

The `R2Client` class provides a clean interface for interacting with Cloudflare R2 storage using AWS Signature V4 authentication via the `aws4fetch` library.

### Features

- ✅ File uploads to R2
- ✅ File deletions from R2
- ✅ Listing files with prefix
- ✅ Generating presigned URLs for client-side uploads
- ✅ Getting objects from R2
- ✅ Extracting file keys from various URL formats

### Usage

```typescript
import { R2Client } from './utils/r2-client';
import type { PagesEnv } from '../../../src/functions-lib/types';

export const onRequest: PagesFunction = async (context) => {
  const { env } = context;
  
  // Create R2 client
  const r2 = new R2Client(env);
  
  // Upload a file
  const fileContent = new ArrayBuffer(100);
  const url = await r2.upload(
    'path/to/file.txt',
    fileContent,
    'text/plain'
  );
  
  // Delete a file
  await r2.delete('path/to/file.txt');
  
  // List files with prefix
  const files = await r2.list('path/to/');
  
  // Generate presigned URL
  const { url: presignedUrl, headers } = await r2.generatePresignedUrl(
    'path/to/file.txt',
    'text/plain',
    3600 // expires in 1 hour
  );
  
  // Get an object
  const response = await r2.getObject('path/to/file.txt');
  const content = await response.arrayBuffer();
  
  // Get public URL
  const publicUrl = r2.getPublicUrl('path/to/file.txt');
  
  // Extract key from URL
  const key = R2Client.extractKeyFromUrl('https://pub-xxx.r2.dev/path/to/file.txt');
};
```

### Environment Variables

The R2Client requires the following environment variables:

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_R2_ACCESS_KEY_ID` - R2 access key ID
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` - R2 secret access key
- `CLOUDFLARE_R2_BUCKET_NAME` (optional) - Bucket name (defaults to 'skill-echosystem')
- `CLOUDFLARE_R2_PUBLIC_URL` (optional) - Custom public URL for R2 bucket

### Error Handling

The R2Client throws descriptive errors for all operations:

```typescript
try {
  await r2.upload('file.txt', content, 'text/plain');
} catch (error) {
  console.error('Upload failed:', error.message);
  // Error message will include HTTP status and details
}
```

### Testing

Run the unit tests:

```bash
npm run test -- functions/api/storage/utils/__tests__/r2-client.test.ts --run
```

All tests should pass, verifying:
- Constructor validation
- Upload operations
- Delete operations
- List operations
- Presigned URL generation
- Object retrieval
- Public URL generation
- Key extraction from various URL formats
