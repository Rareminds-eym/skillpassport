# Cloudflare Pages Functions API Documentation

## Overview

This document provides comprehensive documentation for all 62 implemented API endpoints across 7 APIs in the Cloudflare Pages Functions architecture.

**Base URL**: `https://yourdomain.com` (production) or `http://localhost:8788` (development)

**Total APIs**: 7
**Total Endpoints**: 62

---

## Table of Contents

1. [User API](#user-api) - 27 endpoints
2. [Storage API](#storage-api) - 14 endpoints
3. [Role Overview API](#role-overview-api) - 2 endpoints
4. [Question Generation API](#question-generation-api) - 3 endpoints
5. [Course API](#course-api) - 6 endpoints
6. [Career API](#career-api) - 1 endpoint
7. [Adaptive Session API](#adaptive-session-api) - 9 endpoints

---

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

**Authentication Flow**:
1. User signs up or logs in via Supabase Auth
2. Receives JWT token
3. Includes token in subsequent API requests
4. Token is validated using dual method (JWT decode + Supabase fallback)

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

---

## API Documentation

For detailed endpoint documentation, see:
- [User API Documentation](./docs/api/USER_API.md)
- [Storage API Documentation](./docs/api/STORAGE_API.md)
- [Role Overview API Documentation](./docs/api/ROLE_OVERVIEW_API.md)
- [Question Generation API Documentation](./docs/api/QUESTION_GENERATION_API.md)
- [Course API Documentation](./docs/api/COURSE_API.md)
- [Career API Documentation](./docs/api/CAREER_API.md)
- [Adaptive Session API Documentation](./docs/api/ADAPTIVE_SESSION_API.md)

---

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run pages:dev

# Server will be available at http://localhost:8788
```

### Testing APIs

```bash
# Test User API
curl http://localhost:8788/api/user/schools

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:8788/api/course/ai-tutor/chat
```

---

## Rate Limiting

Currently not implemented. Recommended limits:
- Signup endpoints: 5 requests/minute
- Upload endpoints: 10 requests/minute
- AI endpoints: 20 requests/minute
- Default: 100 requests/minute

---

## CORS Configuration

**Allowed Origins**:
- `http://localhost:5173` (Vite dev)
- `http://localhost:3000` (Alternative dev)
- `http://localhost:8788` (Pages dev)
- Production domains (to be configured)

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers**: authorization, x-client-info, apikey, content-type

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Security

- All endpoints use HTTPS in production
- JWT-based authentication
- Origin validation for CORS
- Input sanitization and validation
- SQL injection prevention via Supabase
- File upload validation (size, type)

See [Security Review](./TASK_80_SECURITY_REVIEW.md) for details.

---

## Performance

- Average response time: 97ms
- p50: 24ms
- p95: 277ms
- Caching enabled for institution lists (1-hour TTL)

See [Performance Report](./TASK_79_FINAL_PERFORMANCE_REPORT.md) for details.

---

## Support

For issues or questions:
1. Check the API documentation
2. Review error messages
3. Check server logs
4. Contact development team

---

**Last Updated**: 2026-02-02
**Version**: 1.0.0
