#!/usr/bin/env node --expose-gc

// Import required modules
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('=== Server Startup ===');
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
  
  // Warn if memory usage is getting high (approaching 512MB limit)
  if (memory.rss > 450 * 1024 * 1024) { // 450MB (increased threshold for 500MB files)
    console.warn('⚠️  High memory usage detected! RSS:', memoryMB.rss, 'MB');
  }
  
  if (memory.heapUsed > 350 * 1024 * 1024) { // 350MB (increased threshold for 500MB files)
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
    // Add memory optimization settings
    maxAttempts: 3,
    requestHandler: {
      connectionTimeout: 5000,
      socketTimeout: 10000,
    }
  });
  
  console.log('✓ R2 client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize R2 client:', error);
  console.error('Error message:', error.message);
  // We'll still create the client but it will fail later
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    // Add memory optimization settings
    maxAttempts: 3,
    requestHandler: {
      connectionTimeout: 5000,
      socketTimeout: 10000,
    }
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
}, 5000); // Test after 5 seconds to allow server to start

// Configure multer with streaming to R2 (no memory storage)
const upload = multer({
  storage: multerS3({
    s3: r2Client,
    bucket: BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      // Generate unique file key
      const courseId = req.body.courseId;
      const lessonId = req.body.lessonId;
      
      if (!courseId || !lessonId) {
        cb(new Error('Missing courseId or lessonId'));
        return;
      }
      
      const fileKey = generateFileKey(file.originalname, courseId, lessonId);
      console.log('Generated file key for streaming upload:', fileKey);
      cb(null, fileKey);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
    files: 1, // Limit to 1 file at a time
    fieldSize: 1024 * 1024, // 1MB for non-file fields
  },
  // Add file filter for debugging
  fileFilter: (req, file, cb) => {
    console.log('=== Multer File Filter ===');
    console.log('File:', file);
    cb(null, true); // Accept all files
  }
}).single('file');

// Keep multiple file upload handler with streaming to R2
const uploadMultiple = multer({
  storage: multerS3({
    s3: r2Client,
    bucket: BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      // Generate unique file key
      const courseId = req.body.courseId;
      const lessonId = req.body.lessonId;
      
      if (!courseId || !lessonId) {
        cb(new Error('Missing courseId or lessonId'));
        return;
      }
      
      const fileKey = generateFileKey(file.originalname, courseId, lessonId);
      console.log('Generated file key for streaming upload:', fileKey);
      cb(null, fileKey);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 3, // Max 3 files
    fieldSize: 1024 * 1024, // 1MB for non-file fields
  },
  fileFilter: (req, file, cb) => {
    console.log('=== Multer File Filter (Multiple) ===');
    console.log('File:', file);
    cb(null, true); // Accept all files
  }
}).array('files', 3); // Max 3 files

// Generate unique file key
const generateFileKey = (originalName, courseId, lessonId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;
};

// Add a specific route for the upload endpoint with more debugging
app.post('/api/upload', (req, res, next) => {
  console.log('=== Upload Endpoint Hit ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Origin header:', req.headers.origin);
  console.log('Content-Type header:', req.headers['content-type']);
  
  // Set CORS headers early
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  console.log('=== Starting Multer Upload (Streaming) ===');
  upload(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      // Make sure CORS headers are set even in error cases
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'Upload error', message: err.message });
    }
    console.log('Multer upload completed successfully');
    
    // For streaming uploads, the file is already uploaded to R2
    // req.file will contain the R2 information
    console.log('Uploaded file info:', req.file);
    
    next();
  });
}, async (req, res) => {
  try {
    console.log('=== Processing Upload Response ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('ERROR: No file uploaded');
      // Make sure CORS headers are set even in error cases
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Body:', req.body);
    console.log('Environment variables check:', {
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? 'SET' : 'NOT_SET',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'NOT_SET',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET',
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? 'SET' : 'NOT_SET'
    });

    const { courseId, lessonId } = req.body;
    const file = req.file;

    // Validate required parameters
    if (!courseId) {
      console.error('ERROR: courseId is required');
      // Make sure CORS headers are set even in error cases
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'courseId is required' });
    }

    if (!lessonId) {
      console.error('ERROR: lessonId is required');
      // Make sure CORS headers are set even in error cases
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'lessonId is required' });
    }

    console.log('File uploaded to R2:', file);
    
    // Generate a presigned URL for accessing the file (valid for 7 days)
    console.log('Generating presigned URL...');
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.key, // Key is provided by multer-s3
    });
    const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 604800 });
    console.log('✓ Presigned URL generated');

    const response = {
      success: true,
      data: {
        key: file.key, // Key is provided by multer-s3
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
    
    // Make sure CORS headers are set even in error cases
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Upload multiple files
app.post('/api/upload-multiple', (req, res, next) => {
  console.log('=== Starting Multer Upload (Multiple Streaming) ===');
  uploadMultiple(req, res, (err) => {
    if (err) {
      console.error('Multer error (multiple):', err);
      // Make sure CORS headers are set even in error cases
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(400).json({ error: 'Upload error', message: err.message });
    }
    console.log('Multer upload (multiple) completed successfully');
    console.log('Uploaded files info:', req.files);
    
    next();
  });
}, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process uploaded files and generate presigned URLs
    const results = [];
    for (const file of files) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: file.key, // Key is provided by multer-s3
        });
        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: 604800 });

        results.push({
          key: file.key,
          url: url,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        });
      } catch (fileError) {
        console.error('Error generating URL for file:', file.originalname, fileError);
        // Continue with other files even if one fails
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Make sure CORS headers are set even in error cases
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
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

// Simple echo endpoint for testing connectivity
app.get('/echo', (req, res) => {
  console.log('=== Echo Endpoint Hit ===');
  console.log('Origin:', req.headers.origin);
  
  // Set CORS headers
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
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json({ 
    status: 'OK', 
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
    
    // Try to list objects in the bucket (this will test the R2 connection)
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
  
  // Always set CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Send error response
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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
