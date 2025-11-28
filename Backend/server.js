#!/usr/bin/env node

// ============================================
// PRODUCTION GRADE FILE UPLOAD SERVER
// Version: 3.0.0 - Direct-to-R2 Architecture
// 
// Memory Usage: ~50MB constant (regardless of file size!)
// The server NEVER touches file data - clients upload directly to R2
//
// Features:
// - Single file presigned upload
// - Multiple file presigned upload (batch)
// - Upload confirmation (single & batch)
// - File retrieval (presigned URLs)
// - File deletion (single & batch)
// - File listing (by lesson & course)
// - Health checks (basic & deep)
// - Rate limiting
// - Input validation
// - Structured logging
// - CORS support
// - Security headers (Helmet)
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  maxFileSize: 500 * 1024 * 1024, // 500MB for single file
  maxFileSizeMultiple: 100 * 1024 * 1024, // 100MB per file for multiple uploads
  maxFiles: 10, // Max files in batch upload
  presignedUrlExpiry: 3600, // 1 hour for upload URLs
  downloadUrlExpiry: 604800, // 7 days for download URLs
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100,
  rateLimitMaxUploads: 50,
  allowedMimeTypes: [
    // Video
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ]
};

// ============================================
// LOGGER
// ============================================
const LOG_LEVELS = { ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO', DEBUG: 'DEBUG' };

const logger = {
  _format(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    });
  },
  error(message, meta = {}) { console.error(this._format(LOG_LEVELS.ERROR, message, meta)); },
  warn(message, meta = {}) { console.warn(this._format(LOG_LEVELS.WARN, message, meta)); },
  info(message, meta = {}) { console.log(this._format(LOG_LEVELS.INFO, message, meta)); },
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
  courseId(value) {
    if (!value || typeof value !== 'string') return { valid: false, error: 'courseId is required' };
    if (value.length > 100) return { valid: false, error: 'courseId must be 100 characters or less' };
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return { valid: false, error: 'courseId contains invalid characters' };
    return { valid: true };
  },

  lessonId(value) {
    if (!value || typeof value !== 'string') return { valid: false, error: 'lessonId is required' };
    if (value.length > 100) return { valid: false, error: 'lessonId must be 100 characters or less' };
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return { valid: false, error: 'lessonId contains invalid characters' };
    return { valid: true };
  },

  filename(value) {
    if (!value || typeof value !== 'string') return { valid: false, error: 'filename is required' };
    const sanitized = value.replace(/^.*[\\\/]/, '').replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
    if (sanitized.includes('..') || sanitized.includes('\0')) return { valid: false, error: 'Invalid filename' };
    return { valid: true, sanitized };
  },

  contentType(value) {
    if (!value) return { valid: false, error: 'contentType is required' };
    const allowedPrefixes = ['video/', 'audio/', 'image/', 'text/', 'application/'];
    const isAllowed = CONFIG.allowedMimeTypes.includes(value) ||
      allowedPrefixes.some(prefix => value.startsWith(prefix));
    if (!isAllowed) {
      return { valid: false, error: `File type not allowed: ${value}` };
    }
    return { valid: true };
  },

  fileSize(value, maxSize = CONFIG.maxFileSize) {
    const size = parseInt(value, 10);
    if (isNaN(size) || size <= 0) return { valid: false, error: 'Invalid file size' };
    if (size > maxSize) {
      return { valid: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` };
    }
    return { valid: true };
  },

  fileKey(value) {
    if (!value || typeof value !== 'string') return { valid: false, error: 'fileKey is required' };
    if (!value.startsWith('courses/')) return { valid: false, error: 'Invalid file key format' };
    if (value.includes('..') || value.includes('\0')) return { valid: false, error: 'Invalid file key' };
    return { valid: true };
  },

  filesArray(files) {
    if (!Array.isArray(files)) return { valid: false, error: 'files must be an array' };
    if (files.length === 0) return { valid: false, error: 'At least one file is required' };
    if (files.length > CONFIG.maxFiles) {
      return { valid: false, error: `Maximum ${CONFIG.maxFiles} files allowed per request` };
    }
    return { valid: true };
  }
};

// ============================================
// STARTUP LOGGING
// ============================================
logger.info('Server starting', {
  version: '3.0.0',
  architecture: 'direct-to-r2',
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development'
});

logger.info('Configuration loaded', {
  port: CONFIG.port,
  maxFileSize: `${CONFIG.maxFileSize / 1024 / 1024}MB`,
  maxFileSizeMultiple: `${CONFIG.maxFileSizeMultiple / 1024 / 1024}MB`,
  maxFiles: CONFIG.maxFiles,
  r2AccountId: process.env.R2_ACCOUNT_ID ? `${process.env.R2_ACCOUNT_ID.substring(0, 8)}...` : 'NOT_SET',
  r2Bucket: process.env.R2_BUCKET_NAME || 'NOT_SET'
});

const initialMemory = process.memoryUsage();
logger.info('Initial memory usage', {
  rss: `${(initialMemory.rss / 1024 / 1024).toFixed(2)}MB`,
  heapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
});

// Memory monitoring
setInterval(() => {
  const memory = process.memoryUsage();
  const memoryMB = {
    rss: (memory.rss / 1024 / 1024).toFixed(2),
    heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2)
  };

  if (memory.rss > 150 * 1024 * 1024) {
    logger.warn('Memory usage higher than expected for direct-to-R2', { memory: memoryMB });
  } else {
    logger.debug('Memory usage', { memory: memoryMB });
  }
}, 30000);

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================
// RATE LIMITING
// ============================================
const generalLimiter = rateLimit({
  windowMs: CONFIG.rateLimitWindow,
  max: CONFIG.rateLimitMaxRequests,
  message: { error: 'Too many requests', message: 'Please try again later', retryAfter: Math.ceil(CONFIG.rateLimitWindow / 1000) },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { requestId: req.id, ip: req.ip, path: req.path });
    res.status(429).json(options.message);
  }
});

const uploadLimiter = rateLimit({
  windowMs: CONFIG.rateLimitWindow,
  max: CONFIG.rateLimitMaxUploads,
  message: { error: 'Too many upload requests', message: 'Please try again later', retryAfter: Math.ceil(CONFIG.rateLimitWindow / 1000) },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (req, res, next, options) => {
    logger.warn('Upload rate limit exceeded', { requestId: req.id, ip: req.ip });
    res.status(429).json(options.message);
  }
});

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

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Upload-ID, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Upload-ID, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

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
// R2 CLIENT
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

// Validate env vars
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  logger.error('Missing required R2 environment variables');
  process.exit(1);
}

// Test R2 connection
setTimeout(async () => {
  try {
    await r2Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 }));
    logger.info('R2 connectivity test successful', { bucket: BUCKET_NAME });
  } catch (error) {
    logger.error('R2 connectivity test failed', { error: error.message });
  }
}, 3000);

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateFileKey = (filename, courseId, lessonId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = filename.substring(filename.lastIndexOf('.')) || '';
  return `courses/${courseId}/lessons/${lessonId}/${timestamp}-${random}${ext}`;
};

// ============================================
// API ENDPOINTS
// ============================================

// ------------------------------------------
// SINGLE FILE PRESIGNED URL
// ------------------------------------------
app.post('/api/upload/presigned', uploadLimiter, async (req, res) => {
  try {
    const { filename, contentType, fileSize, courseId, lessonId } = req.body;

    logger.info('Presigned URL requested', {
      requestId: req.id,
      filename,
      contentType,
      fileSize: fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)}MB` : 'unknown',
      courseId,
      lessonId
    });

    // Validate all inputs
    const validations = [
      { name: 'filename', result: validators.filename(filename) },
      { name: 'contentType', result: validators.contentType(contentType) },
      { name: 'fileSize', result: validators.fileSize(fileSize) },
      { name: 'courseId', result: validators.courseId(courseId) },
      { name: 'lessonId', result: validators.lessonId(lessonId) },
    ];

    for (const v of validations) {
      if (!v.result.valid) {
        logger.warn('Validation failed', { requestId: req.id, field: v.name, error: v.result.error });
        return res.status(400).json({ error: v.result.error });
      }
    }

    const sanitizedFilename = validators.filename(filename).sanitized;
    const fileKey = generateFileKey(sanitizedFilename, courseId, lessonId);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ContentLength: parseInt(fileSize, 10),
      Metadata: {
        originalname: sanitizedFilename,
        courseid: courseId,
        lessonid: lessonId,
        uploadedat: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: CONFIG.presignedUrlExpiry
    });

    logger.info('Presigned URL generated', { requestId: req.id, fileKey });

    res.json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        expiresIn: CONFIG.presignedUrlExpiry,
      }
    });
  } catch (error) {
    logger.error('Failed to generate presigned URL', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to generate upload URL', message: error.message });
  }
});

// ------------------------------------------
// MULTIPLE FILES PRESIGNED URLs
// ------------------------------------------
app.post('/api/upload/presigned-multiple', uploadLimiter, async (req, res) => {
  try {
    const { files, courseId, lessonId } = req.body;

    logger.info('Multiple presigned URLs requested', {
      requestId: req.id,
      fileCount: files?.length,
      courseId,
      lessonId
    });

    // Validate courseId and lessonId
    const courseIdValidation = validators.courseId(courseId);
    if (!courseIdValidation.valid) {
      return res.status(400).json({ error: courseIdValidation.error });
    }

    const lessonIdValidation = validators.lessonId(lessonId);
    if (!lessonIdValidation.valid) {
      return res.status(400).json({ error: lessonIdValidation.error });
    }

    // Validate files array
    const filesValidation = validators.filesArray(files);
    if (!filesValidation.valid) {
      return res.status(400).json({ error: filesValidation.error });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { filename, contentType, fileSize } = file;

      // Validate each file
      const filenameValidation = validators.filename(filename);
      if (!filenameValidation.valid) {
        errors.push({ index: i, filename, error: filenameValidation.error });
        continue;
      }

      const contentTypeValidation = validators.contentType(contentType);
      if (!contentTypeValidation.valid) {
        errors.push({ index: i, filename, error: contentTypeValidation.error });
        continue;
      }

      const fileSizeValidation = validators.fileSize(fileSize, CONFIG.maxFileSizeMultiple);
      if (!fileSizeValidation.valid) {
        errors.push({ index: i, filename, error: fileSizeValidation.error });
        continue;
      }

      try {
        const sanitizedFilename = filenameValidation.sanitized;
        const fileKey = generateFileKey(sanitizedFilename, courseId, lessonId);

        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          ContentType: contentType,
          ContentLength: parseInt(fileSize, 10),
          Metadata: {
            originalname: sanitizedFilename,
            courseid: courseId,
            lessonid: lessonId,
            uploadedat: new Date().toISOString(),
          },
        });

        const uploadUrl = await getSignedUrl(r2Client, command, {
          expiresIn: CONFIG.presignedUrlExpiry
        });

        results.push({
          index: i,
          filename: sanitizedFilename,
          originalFilename: filename,
          uploadUrl,
          fileKey,
          fileSize: parseInt(fileSize, 10),
          contentType,
          expiresIn: CONFIG.presignedUrlExpiry,
        });
      } catch (err) {
        errors.push({ index: i, filename, error: err.message });
      }
    }

    logger.info('Multiple presigned URLs generated', {
      requestId: req.id,
      requested: files.length,
      successful: results.length,
      failed: errors.length
    });

    res.json({
      success: true,
      data: {
        files: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          requested: files.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to generate multiple presigned URLs', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to generate upload URLs', message: error.message });
  }
});

// ------------------------------------------
// CONFIRM SINGLE UPLOAD
// ------------------------------------------
app.post('/api/upload/confirm', async (req, res) => {
  try {
    const { fileKey, fileName, fileSize, fileType } = req.body;

    logger.info('Upload confirmation requested', { requestId: req.id, fileKey });

    const validation = validators.fileKey(fileKey);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Verify file exists in R2
    let metadata;
    try {
      metadata = await r2Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      }));
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        logger.warn('File not found during confirmation', { requestId: req.id, fileKey });
        return res.status(404).json({
          error: 'File not found',
          message: 'Upload may have failed. Please try again.'
        });
      }
      throw err;
    }

    // Generate download URL
    const downloadUrl = await getSignedUrl(r2Client, new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }), { expiresIn: CONFIG.downloadUrlExpiry });

    logger.info('Upload confirmed', { requestId: req.id, fileKey, size: metadata.ContentLength });

    res.json({
      success: true,
      data: {
        key: fileKey,
        url: downloadUrl,
        size: metadata.ContentLength || fileSize,
        type: metadata.ContentType || fileType,
        name: fileName || metadata.Metadata?.originalname || fileKey.split('/').pop(),
      }
    });
  } catch (error) {
    logger.error('Failed to confirm upload', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to confirm upload', message: error.message });
  }
});

// ------------------------------------------
// CONFIRM MULTIPLE UPLOADS
// ------------------------------------------
app.post('/api/upload/confirm-multiple', async (req, res) => {
  try {
    const { files } = req.body;

    logger.info('Multiple upload confirmation requested', { requestId: req.id, fileCount: files?.length });

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files array is required' });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      const { fileKey, fileName, fileSize, fileType } = file;

      const validation = validators.fileKey(fileKey);
      if (!validation.valid) {
        errors.push({ fileKey, error: validation.error });
        continue;
      }

      try {
        const metadata = await r2Client.send(new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
        }));

        const downloadUrl = await getSignedUrl(r2Client, new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
        }), { expiresIn: CONFIG.downloadUrlExpiry });

        results.push({
          key: fileKey,
          url: downloadUrl,
          size: metadata.ContentLength || fileSize,
          type: metadata.ContentType || fileType,
          name: fileName || metadata.Metadata?.originalname || fileKey.split('/').pop(),
        });
      } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          errors.push({ fileKey, error: 'File not found - upload may have failed' });
        } else {
          errors.push({ fileKey, error: err.message });
        }
      }
    }

    logger.info('Multiple uploads confirmed', {
      requestId: req.id,
      requested: files.length,
      successful: results.length,
      failed: errors.length
    });

    res.json({
      success: true,
      data: {
        files: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          requested: files.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to confirm multiple uploads', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to confirm uploads', message: error.message });
  }
});

// ------------------------------------------
// GET FILE URL
// ------------------------------------------
app.get('/api/file/:key(*)', async (req, res) => {
  try {
    const fileKey = req.params.key;

    const validation = validators.fileKey(fileKey);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const url = await getSignedUrl(r2Client, new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }), { expiresIn: CONFIG.downloadUrlExpiry });

    res.json({ success: true, url });
  } catch (error) {
    logger.error('Get file error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to get file', message: error.message });
  }
});

// ------------------------------------------
// DELETE SINGLE FILE
// ------------------------------------------
app.delete('/api/file/:key(*)', async (req, res) => {
  try {
    const fileKey = req.params.key;

    const validation = validators.fileKey(fileKey);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    await r2Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }));

    logger.info('File deleted', { requestId: req.id, fileKey });
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Delete error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to delete file', message: error.message });
  }
});

// ------------------------------------------
// DELETE MULTIPLE FILES
// ------------------------------------------
app.post('/api/files/delete', async (req, res) => {
  try {
    const { fileKeys } = req.body;

    if (!Array.isArray(fileKeys) || fileKeys.length === 0) {
      return res.status(400).json({ error: 'fileKeys array is required' });
    }

    const deleted = [];
    const errors = [];

    for (const fileKey of fileKeys) {
      const validation = validators.fileKey(fileKey);
      if (!validation.valid) {
        errors.push({ fileKey, error: validation.error });
        continue;
      }

      try {
        await r2Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
        }));
        deleted.push(fileKey);
      } catch (err) {
        errors.push({ fileKey, error: err.message });
      }
    }

    logger.info('Multiple files deleted', {
      requestId: req.id,
      requested: fileKeys.length,
      deleted: deleted.length,
      failed: errors.length
    });

    res.json({
      success: true,
      data: {
        deleted,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          requested: fileKeys.length,
          deleted: deleted.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    logger.error('Multiple delete error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to delete files', message: error.message });
  }
});

// ------------------------------------------
// LIST FILES FOR LESSON
// ------------------------------------------
app.get('/api/files/:courseId/:lessonId', async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const courseValidation = validators.courseId(courseId);
    const lessonValidation = validators.lessonId(lessonId);

    if (!courseValidation.valid) return res.status(400).json({ error: courseValidation.error });
    if (!lessonValidation.valid) return res.status(400).json({ error: lessonValidation.error });

    const prefix = `courses/${courseId}/lessons/${lessonId}/`;
    const response = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }));

    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        const url = await getSignedUrl(r2Client, new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key
        }), { expiresIn: CONFIG.downloadUrlExpiry });
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

// ------------------------------------------
// LIST ALL FILES FOR COURSE
// ------------------------------------------
app.get('/api/files/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const courseValidation = validators.courseId(courseId);
    if (!courseValidation.valid) return res.status(400).json({ error: courseValidation.error });

    const prefix = `courses/${courseId}/`;
    const response = await r2Client.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    }));

    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        const url = await getSignedUrl(r2Client, new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key
        }), { expiresIn: CONFIG.downloadUrlExpiry });
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
    logger.error('List course files error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Failed to list files', message: error.message });
  }
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Skill Passport File Upload Server',
    version: '3.0.0',
    architecture: 'direct-to-r2',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '3.0.0',
    architecture: 'direct-to-r2',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/deep', async (req, res) => {
  const health = {
    status: 'OK',
    version: '3.0.0',
    architecture: 'direct-to-r2',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Memory check
  const memory = process.memoryUsage();
  health.checks.memory = {
    status: memory.rss < 150 * 1024 * 1024 ? 'OK' : 'WARNING',
    rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
    heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    note: 'Direct-to-R2 architecture - memory should stay constant'
  };

  // R2 check
  try {
    await r2Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 }));
    health.checks.r2 = { status: 'OK', bucket: BUCKET_NAME };
  } catch (error) {
    health.checks.r2 = { status: 'ERROR', error: error.message };
    health.status = 'DEGRADED';
  }

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

// Utility endpoints
app.get('/echo', (req, res) => {
  res.json({ message: 'Echo endpoint working', requestId: req.id, timestamp: new Date().toISOString() });
});

app.get('/cors-test', (req, res) => {
  res.json({ message: 'CORS test successful', origin: req.headers.origin, timestamp: new Date().toISOString() });
});

app.get('/test-r2', async (req, res) => {
  try {
    const response = await r2Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 1 }));
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
// ERROR HANDLING
// ============================================
app.use((req, res) => {
  logger.warn('Route not found', { requestId: req.id, path: req.path });
  res.status(404).json({ error: 'Not found', message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { requestId: req.id, error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    requestId: req.id
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const server = app.listen(CONFIG.port, () => {
  logger.info('Server started', {
    port: CONFIG.port,
    architecture: 'direct-to-r2',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info('Shutdown signal received', { signal });
  server.close(() => {
    logger.info('HTTP server closed');
    r2Client.destroy();
    logger.info('R2 client closed');
    process.exit(0);
  });
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
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: reason?.message || reason });
});