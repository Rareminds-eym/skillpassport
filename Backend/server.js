#!/usr/bin/env node --expose-gc

// Import required modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import { S3Client, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Busboy from 'busboy';

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('=== Server Startup (Streaming Version) ===');
console.log('Environment variables loaded:');
console.log('  PORT:', process.env.PORT || 3001);
console.log('  R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? `${process.env.R2_ACCOUNT_ID.substring(0, 8)}...` : 'NOT_SET');
console.log('  R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT_SET');
console.log('  R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET');
console.log('  R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME || 'NOT_SET');

// Log initial memory usage
const initialMemory = process.memoryUsage();
console.log('Initial memory usage:', {
  rss: `${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`,
  heapTotal: `${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
  heapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  external: `${(initialMemory.external / 1024 / 1024).toFixed(2)} MB`
});

// Add periodic memory logging
setInterval(() => {
  const memory = process.memoryUsage();
  const memoryMB = {
    rss: (memory.rss / 1024 / 1024).toFixed(2),
    heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2),
    heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2),
    external: (memory.external / 1024 / 1024).toFixed(2)
  };

  console.log('Memory usage:', memoryMB);

  // Warn if memory usage is getting high
  if (memory.rss > 400 * 1024 * 1024) {
    console.warn('⚠️  High memory usage detected! RSS:', memoryMB.rss, 'MB');
  }

  if (memory.heapUsed > 300 * 1024 * 1024) {
    console.warn('⚠️  High heap usage detected! Heap used:', memoryMB.heapUsed, 'MB');
  }
}, 30000); // Log every 30 seconds

// Add periodic garbage collection if available
if (global.gc) {
  console.log('Garbage collection available, scheduling periodic cleanup');
  setInterval(() => {
    try {
      global.gc();
      console.log('Manual garbage collection triggered');
    } catch (err) {
      console.error('Error during manual garbage collection:', err);
    }
  }, 60000); // Run GC every minute
} else {
  console.log('Garbage collection not exposed, start with --expose-gc flag for manual GC');
}

const app = express();

// Configure CORS with comprehensive options
const corsOptions = {
  origin: true, // Reflect the request origin
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin']
};

// Apply CORS middleware early
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  console.log('=== Global Preflight Request ===');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.headers['access-control-request-method']);
  console.log('Headers:', req.headers['access-control-request-headers']);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // Cache for 24 hours
  res.sendStatus(204);
});

// Handle preflight for upload endpoint specifically
app.options('/api/upload', (req, res) => {
  console.log('=== Upload Preflight Request ===');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.headers['access-control-request-method']);
  console.log('Headers:', req.headers['access-control-request-headers']);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // Cache for 24 hours
  res.sendStatus(204);
});

// Add a middleware to always set CORS headers
app.use((req, res, next) => {
  console.log('=== Setting CORS Headers ===');
  console.log('Request Origin:', req.headers.origin);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  // For debugging - log all requests
  console.log(`${req.method} ${req.path}`);

  next();
});

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
let r2Client;
try {
  console.log('Initializing R2 client with config:', {
    region: 'auto',
    endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID.substring(0, 8)}...r2.cloudflarestorage.com` : 'NOT_SET',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT_SET'
  });

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });

  console.log('✓ R2 client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize R2 client:', error);
  console.error('Error message:', error.message);
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
console.log('Bucket name:', BUCKET_NAME || 'NOT_SET');

// Validate required environment variables
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  console.error('❌ Missing required R2 environment variables:');
  console.error('  R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'SET' : 'MISSING');
  console.error('  R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'SET' : 'MISSING');
  console.error('  R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING');
  console.error('  R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? 'SET' : 'MISSING');
} else {
  console.log('✓ All required R2 environment variables are set');
}

// Test R2 connectivity on startup
setTimeout(async () => {
  try {
    console.log('Testing R2 connectivity on startup...');
    if (BUCKET_NAME) {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 1
      });

      await r2Client.send(command);
      console.log('✓ R2 connectivity test successful');
    } else {
      console.log('⚠️  Skipping R2 connectivity test - bucket name not set');
    }
  } catch (error) {
    console.error('❌ R2 connectivity test failed:', error.message);
  }
}, 5000);

// Generate unique file key
const generateFileKey = (originalName, courseId, lessonId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;
};

// ============================================
// PROGRESS TRACKING STORE
// ============================================
const uploadProgressMap = new Map();

// Clean up old progress entries periodically (every 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of uploadProgressMap.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour expiration
      uploadProgressMap.delete(id);
    }
  }
}, 3600000);

// ============================================
// SSE PROGRESS ENDPOINT
// ============================================
app.get('/api/upload/progress/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  console.log(`=== SSE Connection Request for ${uploadId} ===`);

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ status: 'connected', progress: 0 })}\n\n`);

  // Store the response object to send updates later
  if (!uploadProgressMap.has(uploadId)) {
    uploadProgressMap.set(uploadId, {
      clients: [],
      progress: 0,
      timestamp: Date.now()
    });
  }

  const progressData = uploadProgressMap.get(uploadId);
  progressData.clients.push(res);

  // Remove client on close
  req.on('close', () => {
    console.log(`=== SSE Connection Closed for ${uploadId} ===`);
    if (uploadProgressMap.has(uploadId)) {
      const data = uploadProgressMap.get(uploadId);
      data.clients = data.clients.filter(client => client !== res);
      if (data.clients.length === 0 && data.progress >= 100) {
        uploadProgressMap.delete(uploadId);
      }
    }
  });
});

// Helper to broadcast progress
const broadcastProgress = (uploadId, progress) => {
  if (uploadProgressMap.has(uploadId)) {
    const data = uploadProgressMap.get(uploadId);
    data.progress = progress;
    data.timestamp = Date.now();

    const message = JSON.stringify({ status: 'uploading', progress });
    data.clients.forEach(client => {
      client.write(`data: ${message}\n\n`);
    });
  }
};

// ============================================
// STREAMING SINGLE FILE UPLOAD ENDPOINT
// ============================================
app.post('/api/upload', (req, res) => {
  console.log('=== Streaming Upload Started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Origin header:', req.headers.origin);
  console.log('Content-Type header:', req.headers['content-type']);

  // Set CORS headers early
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Upload-ID');
  res.header('Access-Control-Allow-Credentials', 'true');

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
  }

  // Get uploadId from headers or query
  const uploadId = req.headers['x-upload-id'] || req.query.uploadId;
  console.log('Upload ID:', uploadId);

  // Create busboy instance for parsing multipart data
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit
      files: 1
    }
  });

  let courseId = null;
  let lessonId = null;
  let fileInfo = null;
  let uploadPromise = null;
  let fileKey = null;
  let uploadStarted = false;

  // Handle form fields (courseId, lessonId)
  busboy.on('field', (fieldname, val) => {
    console.log(`Field: ${fieldname} = ${val}`);
    if (fieldname === 'courseId') courseId = val;
    if (fieldname === 'lessonId') lessonId = val;
  });

  // Handle file stream - streams directly to R2 without buffering
  busboy.on('file', (fieldname, fileStream, info) => {
    const { filename, encoding, mimeType } = info;
    console.log('=== Multer File Filter ===');
    console.log('File:', { fieldname, filename, encoding, mimeType });

    fileInfo = {
      originalname: filename,
      mimetype: mimeType,
      size: 0
    };

    // Use temp values if courseId/lessonId not yet received
    const tempCourseId = courseId || 'temp';
    const tempLessonId = lessonId || 'temp';
    fileKey = generateFileKey(filename, tempCourseId, tempLessonId);

    // Track file size as it streams
    fileStream.on('data', (chunk) => {
      fileInfo.size += chunk.length;
    });

    uploadStarted = true;

    // Use @aws-sdk/lib-storage for multipart streaming upload
    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileStream,
        ContentType: mimeType,
        Metadata: {
          originalName: filename,
          courseId: tempCourseId,
          lessonId: tempLessonId,
        },
      },
      partSize: 5 * 1024 * 1024, // 5MB chunks
      queueSize: 4,
      leavePartsOnError: false,
    });

    // Log upload progress
    upload.on('httpUploadProgress', (progress) => {
      const mb = ((progress.loaded || 0) / 1024 / 1024).toFixed(2);
      // console.log(`Upload progress: ${mb} MB uploaded`);

      if (uploadId && progress.total) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        broadcastProgress(uploadId, percentage);
      }
    });

    uploadPromise = upload.done();
  });

  // Handle busboy errors
  busboy.on('error', (error) => {
    console.error('Busboy error:', error);
    if (uploadId) {
      broadcastProgress(uploadId, -1); // Error state
    }
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.status(500).json({ error: 'Upload parsing failed', message: error.message });
  });

  // When all data has been parsed
  busboy.on('finish', async () => {
    console.log('=== Busboy Finished Parsing ===');
    console.log('Body:', { courseId, lessonId });
    console.log('File:', fileInfo ? {
      name: fileInfo.originalname,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype
    } : 'No file');

    // Validate required fields
    if (!courseId) {
      console.error('ERROR: courseId is required');
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'courseId is required' });
    }
    if (!lessonId) {
      console.error('ERROR: lessonId is required');
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'lessonId is required' });
    }
    if (!uploadPromise || !uploadStarted) {
      console.error('ERROR: No file provided');
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      console.log('Uploading to R2...');
      console.log('Bucket:', BUCKET_NAME);
      console.log('File key:', fileKey);

      // Wait for the upload to complete
      await uploadPromise;
      console.log('✓ File uploaded to R2 successfully');

      if (uploadId) {
        broadcastProgress(uploadId, 100);
      }

      // Force garbage collection after large file upload
      if (global.gc && fileInfo.size > 100 * 1024 * 1024) {
        console.log('Triggering garbage collection after large file upload');
        try {
          global.gc();
        } catch (err) {
          console.error('Error during manual garbage collection:', err);
        }
      }

      // Generate presigned URL (valid for 7 days)
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
          name: fileInfo.originalname,
          size: fileInfo.size,
          type: fileInfo.mimetype,
        },
      };

      console.log('Sending response:', response);
      res.json(response);
    } catch (error) {
      console.error('=== Upload Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (uploadId) {
        broadcastProgress(uploadId, -1); // Error state
      }

      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.status(500).json({ error: 'Upload failed', message: error.message });
    }
  });

  // Pipe the request to busboy
  req.pipe(busboy);
});

// ============================================
// STREAMING MULTIPLE FILES UPLOAD ENDPOINT
// ============================================
app.post('/api/upload-multiple', (req, res) => {
  console.log('=== Streaming Multiple Upload Started ===');

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB per file for multiple uploads
      files: 3 // Max 3 files
    }
  });

  let courseId = null;
  let lessonId = null;
  const uploadPromises = [];
  const fileInfos = [];

  busboy.on('field', (fieldname, val) => {
    console.log(`Field: ${fieldname} = ${val}`);
    if (fieldname === 'courseId') courseId = val;
    if (fieldname === 'lessonId') lessonId = val;
  });

  busboy.on('file', (fieldname, fileStream, info) => {
    const { filename, encoding, mimeType } = info;
    console.log('=== Multer File Filter (Multiple) ===');
    console.log('File:', { fieldname, filename, mimeType });

    const fileInfo = {
      originalname: filename,
      mimetype: mimeType,
      size: 0,
      key: null
    };
    fileInfos.push(fileInfo);

    const tempCourseId = courseId || 'temp';
    const tempLessonId = lessonId || 'temp';
    const fileKey = generateFileKey(filename, tempCourseId, tempLessonId);
    fileInfo.key = fileKey;

    fileStream.on('data', (chunk) => {
      fileInfo.size += chunk.length;
    });

    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileStream,
        ContentType: mimeType,
        Metadata: {
          originalName: filename,
          courseId: tempCourseId,
          lessonId: tempLessonId,
        },
      },
      partSize: 5 * 1024 * 1024,
      queueSize: 4,
      leavePartsOnError: false,
    });

    upload.on('httpUploadProgress', (progress) => {
      const mb = ((progress.loaded || 0) / 1024 / 1024).toFixed(2);
      console.log(`Upload progress (${filename}): ${mb} MB uploaded`);
    });

    uploadPromises.push(
      upload.done()
        .then(() => ({ success: true, fileInfo }))
        .catch((err) => {
          console.error('Error uploading file:', filename, err);
          return { success: false, fileInfo, error: err.message };
        })
    );
  });

  busboy.on('error', (error) => {
    console.error('Busboy error:', error);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.status(500).json({ error: 'Upload parsing failed', message: error.message });
  });

  busboy.on('finish', async () => {
    console.log('=== Busboy Finished Parsing (Multiple) ===');

    if (!courseId || !lessonId) {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'courseId and lessonId are required' });
    }

    if (uploadPromises.length === 0) {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'No files provided' });
    }

    try {
      const results = await Promise.all(uploadPromises);

      // Generate presigned URLs for successful uploads
      const data = await Promise.all(
        results
          .filter(r => r.success)
          .map(async (r) => {
            const getCommand = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: r.fileInfo.key,
            });
            const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 604800 });
            return {
              key: r.fileInfo.key,
              url: url,
              name: r.fileInfo.originalname,
              size: r.fileInfo.size,
              type: r.fileInfo.mimetype,
            };
          })
      );

      // Force garbage collection after batch upload
      if (global.gc) {
        console.log('Triggering garbage collection after batch upload');
        try {
          global.gc();
        } catch (err) {
          console.error('Error during manual garbage collection:', err);
        }
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error('Upload error:', error);
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.status(500).json({ error: 'Upload failed', message: error.message });
    }
  });

  req.pipe(busboy);
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

// Simple echo endpoint for testing connectivity
app.get('/echo', (req, res) => {
  console.log('=== Echo Endpoint Hit ===');
  console.log('Origin:', req.headers.origin);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.json({
    message: 'Echo endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('=== Health Check Endpoint Hit ===');
  console.log('Origin:', req.headers.origin);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.json({
    status: 'OK',
    version: 'streaming',
    timestamp: new Date().toISOString(),
    bucketName: BUCKET_NAME || 'NOT_SET',
    r2Configured: !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_SECRET_ACCESS_KEY
  });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  console.log('=== CORS Test Endpoint ===');
  console.log('Origin:', req.headers.origin);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Test R2 connectivity endpoint
app.get('/test-r2', async (req, res) => {
  try {
    console.log('Testing R2 connectivity...');
    console.log('Bucket name:', BUCKET_NAME);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });

    const response = await r2Client.send(command);
    console.log('R2 connection test successful');

    res.json({
      success: true,
      message: 'R2 connection successful',
      bucket: BUCKET_NAME,
      objectCount: response.Contents ? response.Contents.length : 0
    });
  } catch (error) {
    console.error('R2 connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      bucket: BUCKET_NAME
    });
  }
});

// Add a global error handler to ensure CORS headers are always set
app.use((err, req, res, next) => {
  console.error('=== Global Error Handler ===');
  console.error('Error:', err);

  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Streaming server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('=== Uncaught Exception ===');
  console.error(err);
  console.error(err.stack);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('=== Unhandled Rejection ===');
  console.error(err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});