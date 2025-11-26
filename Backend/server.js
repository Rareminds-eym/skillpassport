import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  next();
});

// Configure R2 client (R2 is S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Generate unique file key
const generateFileKey = (originalName, courseId, lessonId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;
};

// Upload file to R2
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== Upload Request Received ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'No file');

    const { courseId, lessonId } = req.body;
    const file = req.file;

    if (!file) {
      console.error('ERROR: No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Generating file key...');
    const fileKey = generateFileKey(file.originalname, courseId, lessonId);
    console.log('File key:', fileKey);

    // Upload to R2
    console.log('Uploading to R2...');
    console.log('Bucket:', BUCKET_NAME);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        courseId: courseId,
        lessonId: lessonId,
      },
    });

    await r2Client.send(command);
    console.log('✓ File uploaded to R2 successfully');

    // Generate a presigned URL for accessing the file (valid for 7 days)
    console.log('Generating presigned URL...');
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
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      },
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('=== Upload Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Upload multiple files
app.post('/api/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = files.map(async (file) => {
      const fileKey = generateFileKey(file.originalname, courseId, lessonId);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          courseId: courseId,
          lessonId: lessonId,
        },
      });

      await r2Client.send(command);

      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });
      const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 604800 });

      return {
        key: fileKey,
        url: url,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Get presigned URL for a file
app.get('/api/file/:key(*)', async (req, res) => {
  try {
    const fileKey = req.params.key;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hour

    res.json({
      success: true,
      url: url,
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file', message: error.message });
  }
});

// Delete file from R2
app.delete('/api/file/:key(*)', async (req, res) => {
  try {
    const fileKey = req.params.key;

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await r2Client.send(command);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', message: error.message });
  }
});

// List files for a lesson
app.get('/api/files/:courseId/:lessonId', async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const prefix = `courses/${courseId}/lessons/${lessonId}/`;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);

    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key,
        });
        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });

        return {
          key: item.Key,
          url: url,
          size: item.Size,
          lastModified: item.LastModified,
        };
      })
    );

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files', message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});