#!/usr/bin/env node --expose-gc

// ============================================
// INDUSTRIAL GRADE FILE UPLOAD SERVER
// Version: 2.0.0
// Features: Streaming uploads, Rate limiting, Security headers,
//           Request timeouts, Input validation, Request ID tracking
// ============================================

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
import { PassThrough } from 'stream';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ============================================
// CONFIGURATION
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const CONFIG = {
  port: process.env.PORT || 3001,
  maxFileSize: 500 * 1024 * 1024, // 500MB
  maxFileSizeMultiple: 100 * 1024 * 1024, // 100MB per file
  maxFiles: 3,
  presignedUrlExpiry: 604800, // 7 days
  presignedUrlExpiryShort: 3600, // 1 hour
  uploadTimeout: 10 * 60 * 1000, // 10 minutes
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxUploads: 50, // uploads per window
  rateLimitMaxRequests: 100, // general requests per window
};

// ============================================
// LOGGER - Structured logging
// ============================================
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const logger = {
  _format(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    return JSON.stringify(logEntry);
  },

  error(message, meta = {}) {
    console.error(this._format(LOG_LEVELS.ERROR, message, meta));
  },

  warn(message, meta = {}) {
    console.warn(this._format(LOG_LEVELS.WARN, message, meta));
  },

  info(message, meta = {}) {
    console.log(this._format(LOG_LEVELS.INFO, message, meta));
  },

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this._format(LOG_LEVELS.DEBUG, message, meta));
    }
  }
};

// ============================================
// INPUT VALIDATION
// ============================================
const validators = {
  // Validate courseId - alphanumeric, dashes, underscores, 1-100 chars
  courseId(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'courseId is required' };
    }
    if (value.length > 100) {
      return { valid: false, error: 'courseId must be 100 characters or less' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return { valid: false, error: 'courseId contains invalid characters' };
    }
    return { valid: true };
  },

  // Validate lessonId - alphanumeric, dashes, underscores, 1-100 chars
  lessonId(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'lessonId is required' };
    }
    if (value.length > 100) {
      return { valid: false, error: 'lessonId must be 100 characters or less' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return { valid: false, error: 'lessonId contains invalid characters' };
    }
    return { valid: true };
  },

  // Validate filename - prevent path traversal
  filename(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'filename is required' };
    }
    // Remove path components, only keep filename
    const sanitized = value.replace(/^.*[\\\/]/, '');
    // Check for dangerous patterns
    if (sanitized.includes('..') || sanitized.includes('\0')) {
      return { valid: false, error: 'Invalid filename' };
    }
    if (sanitized.length > 255) {
      return { valid: false, error: 'Filename too long' };
    }
    return { valid: true, sanitized };
  },

  // Validate file key for retrieval/deletion
  fileKey(value) {
    if (!value || typeof value !== 'string') {
      return { valid: false, error: 'fileKey is required' };
    }
    // Must start with 'courses/'
    if (!value.startsWith('courses/')) {
      return { valid: false, error: 'Invalid file key format' };
    }
    // No path traversal
    if (value.includes('..') || value.includes('\0')) {
      return { valid: false, error: 'Invalid file key' };
    }
    return { valid: true };
  },

  // Validate content type
  contentType(value) {
    if (!value) return { valid: true }; // Optional
    
    const allowedTypes = [
      'video/', 'audio/', 'image/', 'application/pdf',
      'application/msword', 'application/vnd.', 'text/'
    ];
    
    const isAllowed = allowedTypes.some(type => value.startsWith(type));
    if (!isAllowed) {
      return { valid: false, error: 'File type not allowed' };
    }
    return { valid: true };
  }
};

// ============================================
// STARTUP LOGGING
// ============================================
logger.info('Server starting', {
  version: '2.0.0',
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

logger.info('Configuration loaded', {
  port: CONFIG.port,
  maxFileSize: `${CONFIG.maxFileSize / 1024 / 1024}MB`,
  r2AccountId: process.env.R2_ACCOUNT_ID ? `${process.env.R2_ACCOUNT_ID.substring(0, 8)}...` : 'NOT_SET',
  r2Bucket: process.env.R2_BUCKET_NAME || 'NOT_SET'
});

// Log initial memory usage
const initialMemory = process.memoryUsage();
logger.info('Initial memory usage', {
  rss: `${(initialMemory.rss / 1024 / 1024).toFixed(2)}MB`,
  heapTotal: `${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
  heapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
  external: `${(initialMemory.external / 1024 / 1024).toFixed(2)}MB`
});

// ============================================
// PERIODIC TASKS
// ============================================

// Memory monitoring
setInterval(() => {
  const memory = process.memoryUsage();
  const memoryMB = {
    rss: (memory.rss / 1024 / 1024).toFixed(2),
    heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2),
    heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2),
    external: (memory.external / 1024 / 1024).toFixed(2)
  };

  if (memory.rss > 400 * 1024 * 1024) {
    logger.warn('High memory usage detected', { memory: memoryMB });
  } else {
    logger.debug('Memory usage', { memory: memoryMB });
  }
}, 30000);

// Garbage collection
if (global.gc) {
  logger.info('Garbage collection available');
  setInterval(() => {
    try {
      global.gc();
      logger.debug('Manual garbage collection triggered');
    } catch (err) {
      logger.error('Garbage collection failed', { error: err.message });
    }
  }, 60000);
} else {
  logger.warn('Garbage collection not exposed, start with --expose-gc flag');
}

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ============================================
// SECURITY HEADERS (Helmet)
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable CSP for API server
}));

// ============================================
// REQUEST ID MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================
// REQUEST TIMEOUT MIDDLEWARE
// ============================================
const timeoutMiddleware = (timeout) => (req, res, next) => {
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      logger.error('Request timeout', {
        requestId: req.id,
        path: req.path,
        method: req.method,
        timeout
      });
      res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to process'
      });
    }
  });
  next();
};

// ============================================
// RATE LIMITING
// ============================================

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: CONFIG.rateLimitWindow,
  max: CONFIG.rateLimitMaxRequests,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: Math.ceil(CONFIG.rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (handles IPv6 properly)
  // It uses req.ip by default which works with trust proxy
  validate: { xForwardedForHeader: false }, // Disable validation warning for x-forwarded-for
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      requestId: req.id,
      ip: req.ip,
      path: req.path
    });
    res.status(429).json(options.message);
  }
});

// Upload-specific rate limiter (stricter)
const uploadLimiter = rateLimit({
  windowMs: CONFIG.rateLimitWindow,
  max: CONFIG.rateLimitMaxUploads,
  message: {
    error: 'Too many uploads',
    message: 'Please try again later',
    retryAfter: Math.ceil(CONFIG.rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (handles IPv6 properly)
  validate: { xForwardedForHeader: false },
  handler: (req, res, next, options) => {
    logger.warn('Upload rate limit exceeded', {
      requestId: req.id,
      ip: req.ip
    });
    res.status(429).json(options.message);
  }
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// ============================================
// CORS CONFIGURATION
// ============================================
const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Upload-ID', 'X-Request-ID'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'X-Request-ID']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Upload-ID, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Upload-ID, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json({ limit: '1mb' }));

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level]('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// ============================================
// R2 CLIENT SETUP
// ============================================
let r2Client;
try {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
  logger.info('R2 client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize R2 client', { error: error.message });
  process.exit(1);
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Validate required environment variables
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  logger.error('Missing required R2 environment variables');
  process.exit(1);
}

// Test R2 connectivity on startup
setTimeout(async () => {
  try {
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 });
    await r2Client.send(command);
    logger.info('R2 connectivity test successful', { bucket: BUCKET_NAME });
  } catch (error) {
    logger.error('R2 connectivity test failed', { error: error.message });
  }
}, 5000);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate unique file key
const generateFileKey = (originalName, courseId, lessonId) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${randomString}${extension}`;
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/^.*[\\\/]/, '') // Remove path
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .substring(0, 255); // Limit length
};

// ============================================
// PROGRESS TRACKING
// ============================================
const uploadProgressMap = new Map();

// Clean up old progress entries
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, data] of uploadProgressMap.entries()) {
    if (now - data.timestamp > 3600000) {
      uploadProgressMap.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug('Cleaned up progress entries', { count: cleaned });
  }
}, 3600000);

// ============================================
// SSE PROGRESS ENDPOINT
// ============================================
app.get('/api/upload/progress/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  
  logger.info('SSE connection opened', { requestId: req.id, uploadId });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*'
  });

  res.write(`data: ${JSON.stringify({ status: 'connected', progress: 0, bytesReceived: 0, totalBytes: 0 })}\n\n`);

  if (!uploadProgressMap.has(uploadId)) {
    uploadProgressMap.set(uploadId, {
      clients: [],
      progress: 0,
      bytesReceived: 0,
      totalBytes: 0,
      timestamp: Date.now()
    });
  }

  const progressData = uploadProgressMap.get(uploadId);
  progressData.clients.push(res);

  req.on('close', () => {
    logger.info('SSE connection closed', { requestId: req.id, uploadId });
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
const broadcastProgress = (uploadId, progress, status = 'uploading', extra = {}) => {
  if (uploadProgressMap.has(uploadId)) {
    const data = uploadProgressMap.get(uploadId);
    data.progress = progress;
    data.timestamp = Date.now();
    
    if (extra.bytesReceived !== undefined) data.bytesReceived = extra.bytesReceived;
    if (extra.totalBytes !== undefined) data.totalBytes = extra.totalBytes;

    const message = JSON.stringify({ 
      status, 
      progress,
      bytesReceived: data.bytesReceived,
      totalBytes: data.totalBytes
    });
    
    data.clients.forEach(client => {
      try {
        client.write(`data: ${message}\n\n`);
      } catch (err) {
        // Client disconnected
      }
    });
  }
};

// ============================================
// UPLOAD ENDPOINT - Single File
// ============================================
app.post('/api/upload',
  uploadLimiter,
  timeoutMiddleware(CONFIG.uploadTimeout),
  (req, res) => {
    const requestId = req.id;
    
    logger.info('Upload started', {
      requestId,
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type']
    });

    // Validate content type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      logger.warn('Invalid content type', { requestId, contentType });
      return res.status(400).json({
        error: 'Invalid content type',
        message: 'Content-Type must be multipart/form-data'
      });
    }

    // Check Content-Length early
    const contentLength = parseInt(req.headers['content-length'], 10) || 0;
    if (contentLength > CONFIG.maxFileSize + (1024 * 1024)) { // +1MB for form overhead
      logger.warn('File too large', { requestId, contentLength });
      return res.status(413).json({
        error: 'File too large',
        message: `Maximum file size is ${CONFIG.maxFileSize / 1024 / 1024}MB`
      });
    }

    const uploadId = req.headers['x-upload-id'] || req.query.uploadId;
    
    // Initialize progress tracking with total bytes from Content-Length
    if (uploadId && contentLength > 0) {
      if (!uploadProgressMap.has(uploadId)) {
        uploadProgressMap.set(uploadId, {
          clients: [],
          progress: 0,
          bytesReceived: 0,
          totalBytes: contentLength,
          timestamp: Date.now()
        });
      } else {
        const data = uploadProgressMap.get(uploadId);
        data.totalBytes = contentLength;
      }
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: CONFIG.maxFileSize,
        files: 1
      }
    });

    let courseId = null;
    let lessonId = null;
    let fileInfo = null;
    let fileKey = null;
    let uploadStarted = false;
    let responseHandled = false;
    let passThroughStream = null;
    let fileStreamInfo = null;
    let bytesReceived = 0;
    let lastProgressUpdate = 0;

    // Handle form fields
    busboy.on('field', (fieldname, val) => {
      logger.debug('Field received', { requestId, fieldname, value: val });
      if (fieldname === 'courseId') courseId = val;
      if (fieldname === 'lessonId') lessonId = val;
    });

    // Handle file stream
    busboy.on('file', (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;
      
      // Validate filename
      const filenameValidation = validators.filename(filename);
      if (!filenameValidation.valid) {
        logger.warn('Invalid filename', { requestId, filename, error: filenameValidation.error });
        fileStream.resume(); // Drain the stream
        return;
      }

      // Validate content type
      const contentTypeValidation = validators.contentType(mimeType);
      if (!contentTypeValidation.valid) {
        logger.warn('Invalid file type', { requestId, mimeType, error: contentTypeValidation.error });
        fileStream.resume();
        return;
      }

      const sanitizedFilename = sanitizeFilename(filename);
      
      logger.info('File received', {
        requestId,
        filename: sanitizedFilename,
        mimeType
      });

      fileInfo = {
        originalname: sanitizedFilename,
        mimetype: mimeType,
        size: 0
      };

      fileStreamInfo = { filename: sanitizedFilename, mimeType };
      uploadStarted = true;

      passThroughStream = new PassThrough();

      fileStream.on('data', (chunk) => {
        fileInfo.size += chunk.length;
        bytesReceived += chunk.length;
        passThroughStream.write(chunk);
        
        // Broadcast progress every 1% or every 500KB, whichever comes first
        if (uploadId && contentLength > 0) {
          const currentProgress = Math.round((bytesReceived / contentLength) * 100);
          const bytesSinceLastUpdate = bytesReceived - lastProgressUpdate;
          
          if (currentProgress > lastProgressUpdate || bytesSinceLastUpdate > 512 * 1024) {
            lastProgressUpdate = bytesReceived;
            broadcastProgress(uploadId, Math.min(currentProgress, 99), 'uploading', {
              bytesReceived,
              totalBytes: contentLength
            });
          }
        }
      });

      fileStream.on('end', () => {
        logger.debug('File stream ended', { requestId, size: fileInfo.size });
        passThroughStream.end();
      });

      fileStream.on('error', (err) => {
        logger.error('File stream error', { requestId, error: err.message });
        passThroughStream.destroy(err);
      });

      // Handle file size limit
      fileStream.on('limit', () => {
        logger.warn('File size limit reached', { requestId });
        if (uploadId) broadcastProgress(uploadId, -1, 'error', { bytesReceived, totalBytes: contentLength });
        if (!responseHandled) {
          responseHandled = true;
          res.status(413).json({
            error: 'File too large',
            message: `Maximum file size is ${CONFIG.maxFileSize / 1024 / 1024}MB`
          });
        }
      });
    });

    busboy.on('error', (error) => {
      logger.error('Busboy error', { requestId, error: error.message });
      if (uploadId) broadcastProgress(uploadId, -1, 'error');
      if (!responseHandled) {
        responseHandled = true;
        res.status(500).json({ error: 'Upload parsing failed', message: error.message });
      }
    });

    busboy.on('finish', async () => {
      logger.debug('Busboy finished', { requestId, courseId, lessonId });

      // Validate courseId
      const courseIdValidation = validators.courseId(courseId);
      if (!courseIdValidation.valid) {
        logger.warn('Invalid courseId', { requestId, error: courseIdValidation.error });
        if (uploadId) broadcastProgress(uploadId, -1, 'error');
        if (!responseHandled) {
          responseHandled = true;
          return res.status(400).json({ error: courseIdValidation.error });
        }
        return;
      }

      // Validate lessonId
      const lessonIdValidation = validators.lessonId(lessonId);
      if (!lessonIdValidation.valid) {
        logger.warn('Invalid lessonId', { requestId, error: lessonIdValidation.error });
        if (uploadId) broadcastProgress(uploadId, -1, 'error');
        if (!responseHandled) {
          responseHandled = true;
          return res.status(400).json({ error: lessonIdValidation.error });
        }
        return;
      }

      if (!uploadStarted || !passThroughStream) {
        logger.warn('No file provided', { requestId });
        if (uploadId) broadcastProgress(uploadId, -1, 'error');
        if (!responseHandled) {
          responseHandled = true;
          return res.status(400).json({ error: 'No file provided' });
        }
        return;
      }

      try {
        fileKey = generateFileKey(fileStreamInfo.filename, courseId, lessonId);
        
        logger.info('Starting R2 upload', {
          requestId,
          bucket: BUCKET_NAME,
          fileKey,
          size: fileInfo.size
        });
        
        // Update progress to show we're now uploading to R2
        if (uploadId) {
          broadcastProgress(uploadId, 99, 'processing', {
            bytesReceived: fileInfo.size,
            totalBytes: contentLength
          });
        }

        const uploadInstance = new Upload({
          client: r2Client,
          params: {
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: passThroughStream,
            ContentType: fileStreamInfo.mimeType,
            Metadata: {
              originalName: fileStreamInfo.filename,
              courseId,
              lessonId,
              uploadedAt: new Date().toISOString(),
              requestId
            },
          },
          partSize: 5 * 1024 * 1024,
          queueSize: 4,
          leavePartsOnError: false,
        });

        // R2 upload progress (optional, might not have total)
        uploadInstance.on('httpUploadProgress', (progress) => {
          logger.debug('R2 upload progress', { 
            requestId, 
            loaded: progress.loaded, 
            total: progress.total 
          });
        });

        await uploadInstance.done();
        
        logger.info('R2 upload completed', { requestId, fileKey, size: fileInfo.size });

        // Final progress update
        if (uploadId) {
          broadcastProgress(uploadId, 100, 'completed', {
            bytesReceived: fileInfo.size,
            totalBytes: fileInfo.size
          });
        }

        // Garbage collection for large files
        if (global.gc && fileInfo.size > 100 * 1024 * 1024) {
          try {
            global.gc();
            logger.debug('Garbage collection triggered', { requestId });
          } catch (err) {
            // Ignore GC errors
          }
        }

        // Generate presigned URL
        const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: CONFIG.presignedUrlExpiry });

        const response = {
          success: true,
          data: {
            key: fileKey,
            url,
            name: fileInfo.originalname,
            size: fileInfo.size,
            type: fileInfo.mimetype,
          },
        };

        if (!responseHandled) {
          responseHandled = true;
          res.json(response);
        }
      } catch (error) {
        logger.error('Upload failed', {
          requestId,
          error: error.message,
          stack: error.stack
        });

        if (uploadId) broadcastProgress(uploadId, -1, 'error');

        if (!responseHandled) {
          responseHandled = true;
          res.status(500).json({ error: 'Upload failed', message: error.message });
        }
      }
    });

    req.pipe(busboy);
  }
);

// ============================================
// UPLOAD ENDPOINT - Multiple Files
// ============================================
app.post('/api/upload-multiple',
  uploadLimiter,
  timeoutMiddleware(CONFIG.uploadTimeout),
  (req, res) => {
    const requestId = req.id;
    
    logger.info('Multiple upload started', { requestId });

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: CONFIG.maxFileSizeMultiple,
        files: CONFIG.maxFiles
      }
    });

    let courseId = null;
    let lessonId = null;
    let responseHandled = false;
    const pendingFiles = [];

    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'courseId') courseId = val;
      if (fieldname === 'lessonId') lessonId = val;
    });

    busboy.on('file', (fieldname, fileStream, info) => {
      const { filename, mimeType } = info;
      
      const filenameValidation = validators.filename(filename);
      if (!filenameValidation.valid) {
        fileStream.resume();
        return;
      }

      const sanitizedFilename = sanitizeFilename(filename);

      const fileData = {
        filename: sanitizedFilename,
        mimeType,
        size: 0,
        passThroughStream: new PassThrough(),
        key: null
      };
      pendingFiles.push(fileData);

      fileStream.on('data', (chunk) => {
        fileData.size += chunk.length;
        fileData.passThroughStream.write(chunk);
      });

      fileStream.on('end', () => {
        fileData.passThroughStream.end();
      });

      fileStream.on('error', (err) => {
        fileData.passThroughStream.destroy(err);
      });
    });

    busboy.on('error', (error) => {
      logger.error('Busboy error (multiple)', { requestId, error: error.message });
      if (!responseHandled) {
        responseHandled = true;
        res.status(500).json({ error: 'Upload parsing failed', message: error.message });
      }
    });

    busboy.on('finish', async () => {
      // Validate inputs
      const courseIdValidation = validators.courseId(courseId);
      const lessonIdValidation = validators.lessonId(lessonId);

      if (!courseIdValidation.valid || !lessonIdValidation.valid) {
        if (!responseHandled) {
          responseHandled = true;
          return res.status(400).json({
            error: courseIdValidation.error || lessonIdValidation.error
          });
        }
        return;
      }

      if (pendingFiles.length === 0) {
        if (!responseHandled) {
          responseHandled = true;
          return res.status(400).json({ error: 'No files provided' });
        }
        return;
      }

      try {
        const uploadPromises = pendingFiles.map(async (fileData) => {
          const fileKey = generateFileKey(fileData.filename, courseId, lessonId);
          fileData.key = fileKey;

          const upload = new Upload({
            client: r2Client,
            params: {
              Bucket: BUCKET_NAME,
              Key: fileKey,
              Body: fileData.passThroughStream,
              ContentType: fileData.mimeType,
              Metadata: {
                originalName: fileData.filename,
                courseId,
                lessonId,
                uploadedAt: new Date().toISOString(),
                requestId
              },
            },
            partSize: 5 * 1024 * 1024,
            queueSize: 4,
            leavePartsOnError: false,
          });

          try {
            await upload.done();
            return { success: true, fileData };
          } catch (err) {
            logger.error('File upload failed', { requestId, filename: fileData.filename, error: err.message });
            return { success: false, fileData, error: err.message };
          }
        });

        const results = await Promise.all(uploadPromises);

        const data = await Promise.all(
          results
            .filter(r => r.success)
            .map(async (r) => {
              const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: r.fileData.key });
              const url = await getSignedUrl(r2Client, getCommand, { expiresIn: CONFIG.presignedUrlExpiry });
              return {
                key: r.fileData.key,
                url,
                name: r.fileData.filename,
                size: r.fileData.size,
                type: r.fileData.mimeType,
              };
            })
        );

        if (global.gc) {
          try { global.gc(); } catch (err) { }
        }

        logger.info('Multiple upload completed', {
          requestId,
          totalFiles: pendingFiles.length,
          successfulFiles: data.length
        });

        if (!responseHandled) {
          responseHandled = true;
          res.json({ success: true, data });
        }
      } catch (error) {
        logger.error('Multiple upload failed', { requestId, error: error.message });
        if (!responseHandled) {
          responseHandled = true;
          res.status(500).json({ error: 'Upload failed', message: error.message });
        }
      }
    });

    req.pipe(busboy);
  }
);

// ============================================
// FILE RETRIEVAL ENDPOINT
// ============================================
app.get('/api/file/:key(*)', async (req, res) => {
  try {
    const fileKey = req.params.key;
    
    const validation = validators.fileKey(fileKey);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    const url = await getSignedUrl(r2Client, command, { expiresIn: CONFIG.presignedUrlExpiryShort });

    res.json({ success: true, url });
  } catch (error) {
    logger.error('Get file error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to get file', message: error.message });
  }
});

// ============================================
// FILE DELETION ENDPOINT
// ============================================
app.delete('/api/file/:key(*)', async (req, res) => {
  try {
    const fileKey = req.params.key;
    
    const validation = validators.fileKey(fileKey);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    await r2Client.send(command);

    logger.info('File deleted', { requestId: req.id, fileKey });
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Delete error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Delete failed', message: error.message });
  }
});

// ============================================
// LIST FILES ENDPOINT
// ============================================
app.get('/api/files/:courseId/:lessonId', async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const courseIdValidation = validators.courseId(courseId);
    const lessonIdValidation = validators.lessonId(lessonId);

    if (!courseIdValidation.valid) {
      return res.status(400).json({ error: courseIdValidation.error });
    }
    if (!lessonIdValidation.valid) {
      return res.status(400).json({ error: lessonIdValidation.error });
    }

    const prefix = `courses/${courseId}/lessons/${lessonId}/`;
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix });
    const response = await r2Client.send(command);

    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: item.Key });
        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: CONFIG.presignedUrlExpiryShort });
        return {
          key: item.Key,
          url,
          size: item.Size,
          lastModified: item.LastModified,
        };
      })
    );

    res.json({ success: true, data: files });
  } catch (error) {
    logger.error('List files error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to list files', message: error.message });
  }
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/deep', async (req, res) => {
  const health = {
    status: 'OK',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Memory check
  const memory = process.memoryUsage();
  health.checks.memory = {
    status: memory.rss < 450 * 1024 * 1024 ? 'OK' : 'WARNING',
    rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
    heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`
  };

  // R2 check
  try {
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 });
    await r2Client.send(command);
    health.checks.r2 = { status: 'OK', bucket: BUCKET_NAME };
  } catch (error) {
    health.checks.r2 = { status: 'ERROR', error: error.message };
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================
// UTILITY ENDPOINTS
// ============================================
app.get('/echo', (req, res) => {
  res.json({
    message: 'Echo endpoint working',
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
});

app.get('/test-r2', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 });
    const response = await r2Client.send(command);
    res.json({
      success: true,
      message: 'R2 connection successful',
      bucket: BUCKET_NAME,
      objectCount: response.Contents ? response.Contents.length : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  logger.warn('Route not found', { requestId: req.id, path: req.path });
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    requestId: req.id,
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    requestId: req.id
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const server = app.listen(CONFIG.port, () => {
  logger.info('Server started', {
    port: CONFIG.port,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = (signal) => {
  logger.info('Shutdown signal received', { signal });
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close R2 client
    r2Client.destroy();
    logger.info('R2 client closed');
    
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason: reason?.message || reason });
});