import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multipart from 'lambda-multipart-parser';
import crypto from 'crypto';

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Generate unique file key
const generateFileKey = (originalName, courseId, lessonId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const sanitizedName = originalName
    .substring(0, originalName.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();

  return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;
};

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('=== Upload Function Called ===');

    // Parse multipart form data
    const result = await multipart.parse(event);
    const file = result.files[0];
    const courseId = result.courseId;
    const lessonId = result.lessonId;

    console.log('File:', file.filename, 'Size:', file.content.length);
    console.log('CourseId:', courseId, 'LessonId:', lessonId);

    if (!file) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    // Generate file key
    const fileKey = generateFileKey(file.filename, courseId, lessonId);
    console.log('File key:', fileKey);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.content,
      ContentType: file.contentType,
      Metadata: {
        originalName: file.filename,
        courseId: courseId,
        lessonId: lessonId,
        uploadedAt: new Date().toISOString()
      }
    });

    await r2Client.send(command);
    console.log('✓ File uploaded to R2');

    // Generate presigned URL (7 days)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 604800 });
    console.log('✓ Presigned URL generated');

    const response = {
      success: true,
      data: {
        key: fileKey,
        url: url,
        name: file.filename,
        size: file.content.length,
        type: file.contentType
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Upload failed', message: error.message })
    };
  }
}
