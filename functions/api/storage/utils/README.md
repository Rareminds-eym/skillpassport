# Storage Utilities

## R2Client

`R2Client` is a small binding-only wrapper around Cloudflare R2.

It requires `env.R2_BUCKET` from the `wrangler.toml` R2 bucket binding and does not use S3 credentials or `aws4fetch`.

## Features

- Upload files with `R2_BUCKET.put`
- Delete files with `R2_BUCKET.delete`
- List files by prefix with `R2_BUCKET.list`
- Get objects with `R2_BUCKET.get`
- Build configured public URLs
- Extract object keys from proxy, custom-domain, and R2 URLs

## Usage

```typescript
import { R2Client } from './utils/r2-client';

export const onRequest = async (context) => {
  const r2 = new R2Client(context.env);

  const url = await r2.upload('path/to/file.txt', new ArrayBuffer(100), 'text/plain');
  const response = await r2.getObject('path/to/file.txt');
  const files = await r2.list('path/to/');

  await r2.delete('path/to/file.txt');

  return new Response(JSON.stringify({ url, files, size: response.headers.get('Content-Length') }));
};
```

## Configuration

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "skill-echosystem"
```

Optional:

- `CLOUDFLARE_R2_PUBLIC_URL` - custom public base URL for object URLs

When no public URL is configured, `getPublicUrl(key)` returns the object key.

## Testing

```bash
npm run test -- functions/api/storage/utils/__tests__/r2-client.test.ts --run
```
