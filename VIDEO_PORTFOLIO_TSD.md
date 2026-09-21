# Technical Solution Design (TSD)
# Video Portfolio Feature for Digital Passport

---

## 1. Task Information

| Field | Value |
|-------|-------|
| **Task ID** | VP-2026-001 |
| **Title** | Video Portfolio Feature - Complete Backend & Storage Implementation |
| **Task Type** | Feature Development |
| **Priority** | High |
| **Estimated Effort** | 40-50 hours (1-2 weeks) |
| **Version** | v1.0 MVP |

---

## 2. Problem Statement

### Business Requirement
Learners need the ability to showcase their practical skills through video demonstrations in their Digital Passport. This feature should allow learners to:
- Upload up to 5 video demonstrations (e.g., panel wiring, circuit troubleshooting)
- Add metadata (title, description, skill tags)
- Control visibility on public portfolios
- Have videos reviewed/approved by administrators

### Current Behaviour
- ❌ No video portfolio feature exists
- ❌ Learners can only showcase skills through text-based projects
- ❌ No video storage or streaming infrastructure
- ❌ Projects table has `video_url` field but no dedicated video management

### Expected Behaviour
- ✅ Learners can upload video files (MP4, MOV, AVI, WebM)
- ✅ Videos stored securely in Cloudflare R2
- ✅ Maximum 5 videos per learner
- ✅ Videos require admin approval before showing publicly
- ✅ Learners can edit video metadata (title, description, tags, thumbnail)
- ✅ Videos stream efficiently with proper authentication
- ✅ Public/private visibility toggle

---

## 3. Scope

### In Scope
✅ **Database Schema**
- Create `video_portfolio` table with full metadata support
- API-level authorization for learner/admin access control
- Helper functions for querying

✅ **Storage Layer**
- Cloudflare R2 video storage implementation
- Upload handler with base64 decoding
- Download/streaming handler with range request support
- Delete handler with cascade to R2

✅ **API Endpoints**
- POST `/api/storage/upload-video-portfolio` - Upload video
- GET `/api/storage/video-portfolio` - Stream/download video
- GET `/api/storage/video-portfolio/presigned` - Get authenticated URL
- DELETE `/api/storage/video-portfolio` - Delete video
- POST `/api/college-admin/video-portfolio` - CRUD operations

✅ **Security**
- Authentication for all operations
- Ownership validation via file key structure and API checks
- Database constraints for data integrity
- Rate limiting on uploads

✅ **Frontend Service Layer**
- API service wrapper functions
- Zustand store for state management
- TypeScript types/interfaces

✅ **UI Components** (Already completed)
- Main video portfolio page
- Side drawer for editing
- Upload area with drag-and-drop

### Out of Scope
❌ Video transcoding/processing (Phase 2)
❌ Automatic thumbnail generation (Phase 2)
❌ Video analytics (views, watch time) (Phase 2)
❌ In-browser video trimming (Phase 2)
❌ Comments and reactions (Phase 2)
❌ CDN integration for faster delivery (Phase 2)
❌ Mobile app support (separate task)

---

## 4. Current Analysis

### Files/Modules Reviewed

**Storage Infrastructure:**
- ✅ `functions/api/storage/handlers/payment-receipt.ts` - Reference for R2 upload/download patterns
- ✅ `functions/api/storage/README.md` - Storage architecture documentation
- ✅ `functions/api/storage/utils/r2-client.ts` - R2 client wrapper

**Database:**
- ✅ `supabase/migrations/20260526000000_schema.sql` - Projects table (has `video_url` field)
- ✅ `supabase/migrations/20260627000000_add_receipt_url_to_subscription_cache.sql` - Receipt storage pattern

**API Patterns:**
- ✅ `functions/api/college-admin/academic.ts` - Projects CRUD operations
- ✅ `functions/api/college-admin/digital-portfolio.ts` - Digital portfolio actions
- ✅ `functions/api/receipts/actions.ts` - Receipt data retrieval

**Frontend:**
- ✅ `src/shared/api/storageApiService.ts` - Storage upload/download methods
- ✅ `src/features/digital-portfolio/api/portfolioService.ts` - Portfolio data fetching
- ✅ `src/pages/digital-pp/VideoPortfolioPage.tsx` - UI (completed)

### Existing Flow

**Similar Pattern: Payment Receipt Storage**
```
1. Frontend generates PDF → Base64 encode
2. POST /api/storage/upload-payment-receipt
3. Backend decodes base64 → Upload to R2
4. Store R2 key in database (subscription_cache.receipt_url)
5. Return authenticated proxy URL
6. Download via /api/storage/payment-receipt?key={fileKey}
```

**Existing Video Reference: Projects Table**
```sql
CREATE TABLE projects (
  ...
  video_url text,  -- Currently stores external URLs (YouTube, etc.)
  ...
);
```
**Problem:** No storage, no upload mechanism, no access control

---

## 5. Proposed Solution

### Solution Overview

**Implement a dedicated video portfolio system with:**

1. **Database Layer**
   - New `video_portfolio` table with rich metadata
   - Separate from `projects` table for better organization
   - API-level authorization for fine-grained access control
   - Enforced 5-video limit via API validation

2. **Storage Layer**
   - Cloudflare R2 for video storage
   - Structured path: `video_portfolio/{user_folder}/{video_id}_{timestamp}.{ext}`
   - Maximum 100MB per video
   - Authenticated streaming with range request support

3. **API Layer**
   - Storage handlers for upload/download/delete
   - CRUD API for metadata management
   - Admin approval workflow
   - Ownership validation at multiple levels

4. **Frontend Layer**
   - Service abstraction for API calls
   - Zustand store for state management
   - UI components (already completed)

### Why this approach?

✅ **Consistency:** Follows existing payment receipt storage pattern
✅ **Security:** Multi-layer ownership validation (file key + database + API checks)
✅ **Scalability:** R2 provides cost-effective storage ($0.015/GB/month)
✅ **Performance:** Range request support enables efficient video streaming
✅ **Maintainability:** Separate table keeps concerns isolated
✅ **Flexibility:** Easy to add features like transcoding, analytics later

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **1. Extend Projects Table** | No new table needed | Mixing concerns, harder to manage video-specific features | ❌ Rejected |
| **2. Use Supabase Storage** | Built-in access control | Less flexible, harder to integrate with existing R2 infrastructure | ❌ Rejected |
| **3. External Video Service (YouTube, Vimeo)** | No storage costs | No control, privacy concerns, external dependencies | ❌ Rejected |
| **4. Dedicated R2 + Separate Table** | Clean separation, full control, consistent with receipts | Slightly more code | ✅ **Selected** |

---

## 6. Technical Design

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ VideoPortfolio │  │ VideoEditDrawer│  │ storageApiService│  │
│  │     Page       │──│  (Side Panel)  │──│ videoPortfolio   │  │
│  └────────────────┘  └────────────────┘  │     Service      │  │
│                                           └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTP/Auth
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Cloudflare Pages)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Storage API (/api/storage/*)                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ upload-video-portfolio  (POST)                     │  │  │
│  │  │ - Validate auth (JWT), quota, file size, MIME      │  │  │
│  │  │ - Parse multipart form → Upload to R2              │  │  │
│  │  │ - Return authenticated proxy URL                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ video-portfolio  (GET)                             │  │  │
│  │  │ - Validate ownership                               │  │  │
│  │  │ - Stream from R2 with range support                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ video-portfolio  (DELETE)                          │  │  │
│  │  │ - Validate ownership                               │  │  │
│  │  │ - Delete from R2                                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │    CRUD API (/api/college-admin/video-portfolio)         │  │
│  │  - get-videos, create-video, update-video, delete-video  │  │
│  │  - approve-video, reject-video (admin only)              │  │
│  │  - get-pending-videos (admin only)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────┬───────────────────────┘
                  │                       │
                  ▼                       ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  Cloudflare R2 Storage    │   │   Supabase (PostgreSQL)     │
│  ┌─────────────────────┐  │   │  ┌────────────────────────┐ │
│  │ video_portfolio/    │  │   │  │  video_portfolio table │ │
│  │  john_doe_9a754938/ │  │   │  │  - id, learner_id     │ │
│  │    video_xxx.mp4    │  │   │  │  - title, description │ │
│  │    video_yyy.mp4    │  │   │  │  - video_url (R2 key) │ │
│  └─────────────────────┘  │   │  │  - status, approval   │ │
│                           │   │  │  - API authorization  │ │
│  Max 100MB per file       │   │  └────────────────────────┘ │
│  Max 5 files per user     │   │                             │
└───────────────────────────┘   └─────────────────────────────┘
```

### Sequence Diagram

**Upload Video Flow:**
```
Learner          VideoPortfolioPage    storageApiService    API (upload)      R2 Storage    Database
  │                      │                     │                 │                │              │
  │ Select Video File    │                     │                 │                │              │
  │─────────────────────>│                     │                 │                │              │
  │                      │                     │                 │                │              │
  │                      │ Check quota (< 5)   │                 │                │              │
  │                      │────────────────────────────────────────────────────────>│              │
  │                      │<────────────────────────────────────────────────────────│              │
  │                      │                     │                 │                │              │
  │                      │ Create FormData     │                 │                │              │
  │                      │ with File object    │                 │                │              │
  │                      │──────────────────>│                 │                │              │
  │                      │                     │                 │                │              │
  │                      │                     │ POST /upload    │                │              │
  │                      │                     │ (multipart)     │                │              │
  │                      │                     │────────────────>│                │              │
  │                      │                     │                 │                │              │
  │                      │                     │                 │ Validate JWT   │              │
  │                      │                     │                 │ Extract userId │              │
  │                      │                     │                 │ Check quota    │              │
  │                      │                     │                 │ Validate file  │              │
  │                      │                     │                 │                │              │
  │                      │                     │                 │ PUT video      │              │
  │                      │                     │                 │───────────────>│              │
  │                      │                     │                 │<───────────────│              │
  │                      │                     │                 │    Success     │              │
  │                      │                     │                 │                │              │
  │                      │                     │<────────────────│                │              │
  │                      │                     │ {url, fileKey}  │                │              │
  │                      │<──────────────────│                 │                │              │
  │                      │                     │                 │                │              │
  │ Open Edit Drawer     │                     │                 │                │              │
  │<─────────────────────│                     │                 │                │              │
  │                      │                     │                 │                │              │
  │ Fill metadata        │                     │                 │                │              │
  │ (title, desc, tags)  │                     │                 │                │              │
  │─────────────────────>│                     │                 │                │              │
  │                      │                     │                 │                │              │
  │ Click Save           │                     │                 │                │              │
  │─────────────────────>│                     │                 │                │              │
  │                      │ POST create-video   │                 │                │              │
  │                      │────────────────────────────────────────────────────────────────────>│
  │                      │                     │                 │                │    INSERT    │
  │                      │<────────────────────────────────────────────────────────────────────│
  │                      │                     │                 │                │    Success   │
  │                      │                     │                 │                │              │
  │ Toast: Success       │                     │                 │                │              │
  │<─────────────────────│                     │                 │                │              │
```

**Stream Video Flow:**
```
Learner          VideoPortfolioPage    storageApiService    API (video)       R2 Storage    Database
  │                      │                     │                 │                │              │
  │ Click video          │                     │                 │                │              │
  │─────────────────────>│                     │                 │                │              │
  │                      │                     │                 │                │              │
  │                      │ Get video URL       │                 │                │              │
  │                      │──────────────────>│                 │                │              │
  │                      │                     │                 │                │              │
  │                      │                     │ GET /video-portfolio?key=...     │              │
  │                      │                     │────────────────>│                │              │
  │                      │                     │                 │                │              │
  │                      │                     │                 │ Validate auth  │              │
  │                      │                     │                 │ Check ownership│              │
  │                      │                     │                 │ (file key)     │              │
  │                      │                     │                 │                │              │
  │                      │                     │                 │ GET object     │              │
  │                      │                     │                 │───────────────>│              │
  │                      │                     │                 │<───────────────│              │
  │                      │                     │                 │  Video stream  │              │
  │                      │                     │                 │                │              │
  │                      │                     │<────────────────│                │              │
  │                      │<──────────────────│  Video stream  │                │              │
  │                      │   (Range support)   │                 │                │              │
  │                      │                     │                 │                │              │
  │ Video plays          │                     │                 │                │              │
  │<─────────────────────│                     │                 │                │              │
```

### Database Changes

**New Table: `video_portfolio`**

```sql
CREATE TABLE public.video_portfolio (
  -- Primary
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  
  -- Metadata
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  
  -- Storage
  video_url text NOT NULL,  -- R2 key
  thumbnail_color text DEFAULT '#2D3E5F',
  
  -- Properties
  duration text,
  file_size_bytes bigint,
  mime_type text DEFAULT 'video/mp4',
  
  -- Editing
  trim_start integer DEFAULT 0,
  trim_end integer DEFAULT 100,
  
  -- Status
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROCESSING', 'VERIFIED', 'REJECTED')),
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  show_on_public boolean DEFAULT false,
  
  -- Admin review
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT video_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT video_url_not_empty CHECK (char_length(trim(video_url)) > 0),
  CONSTRAINT trim_range_valid CHECK (trim_start >= 0 AND trim_end <= 100 AND trim_end >= trim_start),
  CONSTRAINT max_tags_limit CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5)
);
```

**Indexes:**
```sql
CREATE INDEX idx_video_portfolio_learner_id ON video_portfolio(learner_id);
CREATE INDEX idx_video_portfolio_status ON video_portfolio(status);
CREATE INDEX idx_video_portfolio_approval_status ON video_portfolio(approval_status);
CREATE INDEX idx_video_portfolio_public ON video_portfolio(learner_id, show_on_public) WHERE show_on_public = true;
CREATE INDEX idx_video_portfolio_pending_review ON video_portfolio(approval_status, created_at) WHERE approval_status = 'pending';
```

**Authorization Notes:**
- Access control is handled at the API level, not database level
- Quota enforcement (max 5 videos) is performed in API before insert
- All authorization checks happen in API handlers before database queries
- Enforce 5-video limit via INSERT policy

### ER Diagram

```
┌─────────────────┐         ┌──────────────────┐
│     users       │         │    learners      │
│─────────────────│         │──────────────────│
│ id (PK)         │────────<│ user_id (FK)     │
│ email           │    1:1  │ id (PK)          │
│ created_at      │         │ name             │
└─────────────────┘         │ email            │
                            └──────────────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌──────────────────────┐
                            │  video_portfolio     │
                            │──────────────────────│
                            │ id (PK)              │
                            │ learner_id (FK)      │
                            │ title                │
                            │ description          │
                            │ tags[]               │
                            │ video_url            │───> R2: video_portfolio/{user}/{video}.mp4
                            │ thumbnail_color      │
                            │ duration             │
                            │ file_size_bytes      │
                            │ mime_type            │
                            │ trim_start           │
                            │ trim_end             │
                            │ status               │
                            │ approval_status      │
                            │ show_on_public       │
                            │ reviewed_by (FK)     │───> users.id
                            │ reviewed_at          │
                            │ rejection_reason     │
                            │ created_at           │
                            │ updated_at           │
                            └──────────────────────┘

Constraints:
- max 5 videos per learner (enforced in API before insert)
- max 5 tags per video (via CHECK constraint)
- trim_start < trim_end (via CHECK constraint)
- CASCADE delete when learner is deleted
```

### API Contract

#### 1. Upload Video

**Endpoint:** `POST /api/storage/upload-video-portfolio`

**Request Format:** `multipart/form-data`

**Request (Form Data):**
```typescript
FormData fields:
- file: File                  // Video file (max 100MB)
- videoId: string             // Unique identifier (UUID recommended)
- userName?: string           // Optional: User name for folder naming
```

**Authentication:** JWT token in Authorization header (userId extracted from token)

**Implementation Notes:**
- Uses multipart/form-data instead of base64 for better performance with large files
- No base64 encoding overhead (saves ~33% bandwidth)
- userId is extracted from authenticated JWT token (more secure than client-provided value)
- Maximum file size: 100MB (enforced in handler)
- Supported formats: MP4, MOV, AVI, WebM

**Response (200):**
```typescript
{
  url: string;                // Proxy URL: /api/storage/video-portfolio?key=...
  fileKey: string;            // R2 key: video_portfolio/user_xxx/video_yyy.mp4
  filename: string;           // Generated filename with timestamp
  fileSize: number;           // File size in bytes
}
```

**Errors:**
- 400: Validation error, file too large
- 401: Not authenticated
- 403: Quota exceeded (max 5 videos)
- 413: Payload too large
- 500: Storage error

#### 2. Stream/Download Video

**Endpoint:** `GET /api/storage/video-portfolio?key={fileKey}&mode={inline|download}`

**Request:**
```typescript
Query Parameters:
- key: string (required)      // R2 file key
- mode: "inline" | "download" // Default: "inline"

Headers:
- Authorization: Bearer {token}
- Range: bytes=0-1023         // Optional for streaming
```

**Response (200):**
```
Headers:
- Content-Type: video/mp4
- Content-Disposition: inline; filename="video.mp4"
- Content-Length: 1024576
- Accept-Ranges: bytes
- Content-Range: bytes 0-1023/1024576  // If range request

Body: Video binary data
```

**Response (206 Partial Content):**
```
// For range requests
Headers:
- Content-Range: bytes 1024-2047/1024576
Body: Partial video data
```

**Errors:**
- 401: Not authenticated
- 403: Not authorized (not owner)
- 404: Video not found
- 416: Range not satisfiable

#### 3. Create Video Entry

**Endpoint:** `POST /api/college-admin/video-portfolio`

**Request:**
```typescript
{
  action: "create-video";
  learnerId: string;          // UUID
  title: string;              // Max 200 chars
  description?: string;
  tags?: string[];            // Max 5 tags
  videoUrl: string;           // R2 key from upload
  thumbnailColor?: string;    // Hex color
  duration?: string;          // "4:02"
  fileSizeBytes?: number;
  mimeType?: string;
  trimStart?: number;         // 0-100
  trimEnd?: number;           // 0-100
  showOnPublic?: boolean;
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: string;               // Video entry UUID
    message: string;
  }
}
```

**Errors:**
- 400: Validation error (missing title, invalid data)
- 403: Quota exceeded
- 409: Video URL already exists
- 500: Database error

#### 4. Update Video Entry

**Endpoint:** `POST /api/college-admin/video-portfolio`

**Request:**
```typescript
{
  action: "update-video";
  videoId: string;
  title?: string;
  description?: string;
  tags?: string[];
  thumbnailColor?: string;
  trimStart?: number;
  trimEnd?: number;
  showOnPublic?: boolean;
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Video updated successfully"
}
```

#### 5. Delete Video

**Endpoint:** `POST /api/college-admin/video-portfolio`

**Request:**
```typescript
{
  action: "delete-video";
  videoId: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Video deleted successfully"
}
```

**Note:** This also deletes the video file from R2 storage

#### 6. Get User Videos

**Endpoint:** `POST /api/college-admin/video-portfolio`

**Request:**
```typescript
{
  action: "get-videos";
  learnerId?: string;         // Optional, defaults to current user
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    videos: Array<{
      id: string;
      title: string;
      description: string;
      tags: string[];
      videoUrl: string;       // R2 key
      thumbnailColor: string;
      duration: string;
      fileSizeBytes: number;
      mimeType: string;
      trimStart: number;
      trimEnd: number;
      status: "DRAFT" | "PROCESSING" | "VERIFIED" | "REJECTED";
      approvalStatus: "pending" | "approved" | "rejected";
      showOnPublic: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    totalCount: number;
    maxAllowed: number;       // Always 5
  }
}
```

### Implementation Notes (Phase 1 & 2 Complete)

**✅ Completed Components:**
- Database schema (Phase 1)
- TypeScript types and interfaces (Phase 1)  
- Storage handlers for upload/download/delete (Phase 2)
- Routing integration (Phase 2)

**🔄 Implementation Decisions:**

1. **Upload Format: Multipart vs Base64**
   - **Decision**: Use multipart/form-data instead of base64
   - **Rationale**: 
     - ~33% more efficient (no base64 encoding overhead)
     - Better performance for 100MB files
     - Standard HTTP file upload pattern
   - **Impact**: Frontend sends File directly, not base64 string

2. **User ID Source: Token vs Request Body**
   - **Decision**: Extract userId from JWT token, not request body
   - **Rationale**:
     - More secure (cannot be spoofed)
     - Eliminates redundant parameter
     - Consistent with auth best practices
   - **Impact**: No userId in upload request body

3. **File Key Structure**
   - **As Specified**: `video_portfolio/{name}_{userIdPrefix}/{videoId}_{timestamp}.{ext}`
   - **Example**: `video_portfolio/john_doe_9a754938/vid_abc123_1726675200000.mp4`
   - **Ownership Validation**: User ID prefix (first 8 chars) embedded in folder name

**🔜 Pending Implementation (Phase 3-5):**
- CRUD API endpoints (Phase 3)
- Frontend service layer (Phase 4)
- Frontend integration (Phase 4)
- Testing (Phase 5)

---

## 7. Impact Analysis

### Affected Components

| Component | Change Type | Impact Level | Description |
|-----------|-------------|--------------|-------------|
| **Database** | New | High | New `video_portfolio` table with API-level authorization |
| **R2 Storage** | New | High | New `video_portfolio/` folder structure |
| **Storage API** | New | High | New upload/download/delete handlers |
| **College Admin API** | Extend | Medium | New video-portfolio endpoint |
| **Frontend - storageApiService** | Extend | Medium | Add video upload/download methods |
| **Frontend - portfolioService** | Extend | Low | Add video fetching to portfolio data |
| **Frontend - VideoPortfolioPage** | Modify | Medium | Connect to real API (currently mock data) |
| **Digital Portfolio Routes** | Unchanged | None | Already configured |
| **Feature Gate** | Unchanged | None | Already using `video_portfolio` addon |
| **Authentication** | Unchanged | None | Uses existing SSO auth |
| **Admin Dashboard** | New (Future) | Low | Admin review UI (Phase 2) |

### Data Flow Changes

**Before (Projects with external video links):**
```
User → Paste YouTube URL → Save to projects.video_url → Display iframe
```

**After (Video Portfolio):**
```
User → Upload video file → Multipart upload → API → R2 Storage
                                                 ↓
                                           Save R2 key to DB
                                                 ↓
User → Click video → Get authenticated URL → Stream from R2 with Range support
```

**Implementation Note:**
- Uses multipart/form-data for efficiency (no base64 encoding overhead)
- JWT token provides userId (more secure than client-provided value)
- Range requests enable efficient video streaming and seeking

### Performance Impact

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Storage | 0 GB | ~0.5 GB per 1000 users | Assuming avg 2.5 videos × 100MB each |
| API Latency | N/A | Upload: 5-30s, Stream: <2s | Depends on file size |
| Database Size | N/A | +50 KB per 1000 videos | Minimal impact |
| R2 Costs | $0 | ~$0.0075/month per user | Based on R2 pricing |

---

## 8. Business Logic

### Execution Flow

#### Upload Video Flow

```
1. User Selection
   └─> User selects video file (drag-drop or browse)
   └─> Validate: file type (MP4/MOV/AVI/WebM), size (< 100MB)
   └─> Check: User quota (< 5 videos)

2. File Preparation
   └─> Read file as File object
   └─> Create FormData with file
   └─> Generate unique video ID (UUID)

3. Upload Request
   └─> POST /api/storage/upload-video-portfolio (multipart/form-data)
   │   └─> Authenticate user (check JWT token, extract userId)
   │   └─> Parse multipart form data (file, videoId, userName)
   │   └─> Validate file (size, MIME type, extension)
   │   └─> Check quota via database query
   │   └─> Read file as ArrayBuffer
   │   └─> Generate file key: video_portfolio/{user_folder}/{videoId}_{timestamp}.mp4
   │   └─> Upload to R2 using R2Client.upload()
   │   └─> Return proxy URL and file key

4. Open Edit Drawer
   └─> Pre-fill title from filename
   └─> User enters: description, tags
   └─> User selects: thumbnail color
   └─> User adjusts: trim positions (optional)
   └─> User toggles: show on public portfolio

5. Save Metadata
   └─> POST /api/college-admin/video-portfolio (action: create-video)
   │   └─> Authenticate user
   │   └─> Validate ownership (learnerId matches user)
   │   └─> Check quota (count existing videos < 5)
   │   └─> Insert into video_portfolio table
   │   │   └─> API validates ownership
   │   │   └─> CHECK constraint validates data
   │   └─> Return success with video ID

6. Display in List
   └─> Refresh video list
   └─> Show success toast
   └─> Video appears with "DRAFT" status
```

#### Stream Video Flow

```
1. User Click
   └─> User clicks video thumbnail

2. Get Authenticated URL
   └─> Call: getVideoPortfolioUrl(fileKey, 'inline')
   └─> Returns: /api/storage/video-portfolio?key={fileKey}&mode=inline

3. Video Player Request
   └─> Browser: GET /api/storage/video-portfolio?key={fileKey}
   │   └─> Headers: Authorization, Range (for streaming)
   │   
   └─> API Handler:
       └─> Authenticate user
       └─> Extract fileKey from query param
       └─> Validate ownership:
           └─> Extract user ID prefix from file key folder
           └─> Compare with authenticated user ID
       └─> R2Client.getObject(fileKey)
       └─> Stream response with:
           └─> Content-Type: video/mp4
           └─> Accept-Ranges: bytes
           └─> Content-Disposition: inline

4. Video Playback
   └─> Browser HTML5 video player handles streaming
   └─> Range requests for seeking/buffering
```

#### Admin Approval Flow

```
1. Admin Access
   └─> Navigate to admin review dashboard
   └─> GET /api/college-admin/video-portfolio (action: get-pending-videos)
   └─> Returns list of videos with approval_status = 'pending'

2. Review Video
   └─> Admin watches video
   └─> Checks: appropriate content, quality, relevance

3. Approve/Reject Decision
   └─> If APPROVE:
       └─> POST /api/college-admin/video-portfolio (action: approve-video)
       └─> Update: approval_status = 'approved', status = 'VERIFIED'
       └─> Update: reviewed_by = admin_user_id, reviewed_at = now()
       
   └─> If REJECT:
       └─> POST /api/college-admin/video-portfolio (action: reject-video)
       └─> Update: approval_status = 'rejected', status = 'REJECTED'
       └─> Update: rejection_reason = "Inappropriate content"

4. Notification (Future)
   └─> Send email/notification to learner
   └─> Include reason if rejected
```

#### Delete Video Flow

```
1. User Initiates Delete
   └─> Click delete button
   └─> Confirm deletion dialog

2. Delete Request
   └─> POST /api/college-admin/video-portfolio (action: delete-video)
   │   └─> Authenticate user
   │   └─> Fetch video record from database
   │   └─> Verify ownership (learnerId matches user OR user is admin)
   │   └─> Extract video_url (R2 key) from record
   │   └─> Delete from R2:
   │   │   └─> R2Client.delete(fileKey)
   │   └─> Delete from database:
   │       └─> DELETE FROM video_portfolio WHERE id = videoId
   │       └─> API validates ownership before delete
   │   └─> Return success

3. Update UI
   └─> Remove video from list
   └─> Show success toast
   └─> Update quota count
```

---

## 9. Edge Cases

### Validation Edge Cases

| Scenario | Validation | Handling |
|----------|------------|----------|
| **Empty title** | CHECK constraint: `char_length(trim(title)) > 0` | Return 400 error: "Title is required" |
| **Title too long** | Frontend validation: max 200 chars | Show error before API call |
| **Invalid tags** | CHECK constraint: max 5 tags | Return 400 error: "Maximum 5 tags allowed" |
| **Empty tag in array** | Frontend validation | Remove empty tags before save |
| **Duplicate tags** | Frontend validation | Remove duplicates before save |
| **Invalid trim range** | CHECK: `trim_start < trim_end`, both 0-100 | Return 400 error: "Invalid trim range" |
| **Negative trim values** | CHECK constraint | Return 400 error |
| **Invalid color hex** | Frontend validation: /^#[0-9A-F]{6}$/i | Show error, use default color |
| **File too large** | Frontend: check before upload, Backend: verify | Error: "Max 100MB" |
| **Unsupported format** | Frontend: check MIME type | Error: "Use MP4, MOV, AVI, or WebM" |
| **Corrupted base64** | Backend: try-catch on decode | Return 400: "Invalid video data" |
| **Empty video_url** | CHECK constraint | Return 400: "Video URL required" |

### Concurrency Edge Cases

| Scenario | Problem | Solution |
|----------|---------|----------|
| **Simultaneous uploads** | User uploads 4 videos at once, total > 5 | API checks COUNT before each insert, last one fails with quota error |
| **Race condition on quota** | User opens 5 tabs, uploads in parallel | Database transaction + API-level atomic check prevents exceeding quota |
| **Delete during upload** | Video being uploaded, user deletes old video | No issue - separate transactions |
| **Multiple edits** | User edits same video in two tabs | Last write wins, updated_at shows latest |
| **Admin approval during edit** | Learner editing while admin approves | Admin approval takes precedence, learner sees updated status |
| **Concurrent delete** | Two requests to delete same video | First succeeds, second returns 404 (idempotent) |

### Retry Edge Cases

| Scenario | Retry Strategy | Implementation |
|----------|----------------|----------------|
| **Upload fails mid-way** | Retry entire upload (no partial upload support) | Frontend shows retry button |
| **R2 temporary unavailable** | Exponential backoff: 1s, 2s, 4s (max 3 retries) | Backend automatic retry in handler |
| **Database deadlock** | Automatic retry by Supabase client | No action needed |
| **Network timeout** | Frontend timeout: 60s, show retry option | User can retry upload |
| **Partial upload (R2 success, DB fail)** | Orphaned file in R2 | Cleanup job (Phase 2): delete files not in DB |

### Permission Edge Cases

| Scenario | Permission Check | Result |
|----------|------------------|--------|
| **View own video** | API checks learner_id matches user | ✅ Allowed |
| **View other's private video** | API returns 403 if learner_id mismatch | ❌ Access denied |
| **View other's public video** | API checks show_on_public flag | ✅ Allowed if approved |
| **Admin view all** | API checks admin role | ✅ Allowed |
| **Edit own video** | API checks learner_id matches user | ✅ Allowed |
| **Edit other's video (learner)** | API returns 403 if learner_id mismatch | ❌ Update denied |
| **Admin edit any video** | API checks admin role | ✅ Allowed |
| **Delete own video** | API checks learner_id matches user | ✅ Allowed |
| **Delete other's video (learner)** | API returns 403 if learner_id mismatch | ❌ Delete denied |
| **Upload when quota full** | API checks video count before insert | ❌ Insert fails: "Quota exceeded" |
| **Service-level operations** | Helper functions use service role | ✅ Allowed (for admin endpoints) |

### Payload Edge Cases

| Scenario | Validation | Handling |
|----------|------------|----------|
| **Malformed JSON** | API try-catch parse | Return 400: "Invalid JSON body" |
| **Missing required fields** | Validate in API handler | Return 400: "Field X required" |
| **Extra unknown fields** | Ignore extra fields | Log warning, proceed |
| **SQL injection in title** | Parameterized queries in Supabase | Safe by default |
| **XSS in description** | Frontend: sanitize on display | Use React's built-in escaping |
| **Invalid video_url path** | Validate pattern in API | Return 400: "Invalid file key" |
| **Video_url points to other user's file** | Ownership validation in API | Return 403: "Access denied" |
| **Base64 not valid** | try-catch atob() | Return 400: "Invalid base64" |
| **MIME type mismatch** | Check magic bytes (Phase 2) | Currently trust client-provided |

### Storage Edge Cases

| Scenario | Impact | Handling |
|----------|--------|----------|
| **R2 bucket full** | Upload fails | Return 507: "Storage quota exceeded" |
| **R2 service down** | Uploads/downloads fail | Return 503, retry after delay |
| **File already exists (same key)** | R2 overwrites | Not an issue (timestamp makes unique) |
| **Orphaned files (upload succeeded, DB insert failed)** | Wasted storage | Cleanup job scans R2 vs DB (Phase 2) |
| **Deleted video still in R2** | Wasted storage | API deletes both DB + R2 in transaction |
| **Invalid file key format** | Download fails | Validate key pattern, return 400 |
| **File key contains path traversal** | Security risk | Sanitize: remove `..`, absolute paths |

---

## 10. Security

### Authentication

| Component | Mechanism | Implementation |
|-----------|-----------|----------------|
| **API Access** | JWT Bearer Token | `withAuth` middleware checks token validity |
| **Token Source** | SSO Worker | Token issued by auth-core SSO system |
| **Token Validation** | JWT verify | Validates signature, expiry, issuer |
| **User Identity** | `user.id` from token claims | Extracted by `getContextUser(context)` |
| **Session Management** | Handled by SSO | API doesn't manage sessions |
| **Token Expiry** | Configurable (default: 1 hour) | Frontend refreshes token automatically |

**Code Example:**
```typescript
// functions/api/storage/handlers/video-portfolio.ts
import { withAuth } from '../../../lib/auth';

export const handleUploadVideoPortfolio: PagesFunction = withAuth(async (context) => {
  const user = getContextUser(context);
  // user.id is guaranteed to be valid here
});
```

### Authorization

| Resource | Learner | Admin | Public |
|----------|---------|-------|--------|
| **Upload video** | ✅ Own only | ✅ Any | ❌ |
| **View video metadata** | ✅ Own only | ✅ Any | ✅ If public + approved |
| **Stream video** | ✅ Own only | ✅ Any | ✅ If public + approved |
| **Update metadata** | ✅ Own only | ✅ Any | ❌ |
| **Delete video** | ✅ Own only | ✅ Any | ❌ |
| **Approve/reject** | ❌ | ✅ Only | ❌ |
| **View pending queue** | ❌ | ✅ Only | ❌ |

**Multi-Layer Authorization:**

1. **File Key Validation (Storage API):**
   ```typescript
   // Extract user ID prefix from file key
   const keyParts = fileKey.split('/'); // ["video_portfolio", "john_doe_9a754938", "video.mp4"]
   const folderName = keyParts[1];
   const userIdPrefix = user.id.substring(0, 8);
   
   if (!folderName.includes(userIdPrefix)) {
     throw new AuthorizationError('Access denied');
   }
   ```

2. **API-Level Checks:**
   ```typescript
   // Additional check in CRUD API
   const { data: learner } = await supabase
     .from('learners')
     .select('id')
     .eq('user_id', user.id)
     .single();
   
   if (video.learner_id !== learner.id && !isAdmin) {
     return apiError(403, 'AUTHORIZATION_ERROR', 'Access denied');
   }
   ```

### Validation

**Input Validation:**

| Field | Rules | Implementation |
|-------|-------|----------------|
| **videoBase64** | Required, valid base64, < 100MB | try-catch atob(), check length |
| **videoId** | Required, alphanumeric only | Regex: `/^[a-zA-Z0-9_-]+$/` |
| **userId** | Required, valid UUID | Regex: UUID format |
| **title** | Required, 1-200 chars, not empty after trim | String length check |
| **description** | Optional, max 2000 chars | String length check |
| **tags** | Optional, max 5, each 1-50 chars | Array length, string length |
| **thumbnailColor** | Optional, valid hex color | Regex: `/^#[0-9A-F]{6}$/i` |
| **duration** | Optional, format M:SS or MM:SS | Regex: `/^\d{1,2}:\d{2}$/` |
| **trimStart/trimEnd** | Optional, integer 0-100, start < end | Number range check |
| **fileKey** | Required for download, valid path | Pattern check, no `..` |
| **mimeType** | Must be allowed type | Whitelist check |

**Validation Libraries:**
```typescript
// Use Zod for API request validation
import { z } from 'zod';

const CreateVideoSchema = z.object({
  action: z.literal('create-video'),
  learnerId: z.string().uuid(),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(50)).max(5).optional(),
  videoUrl: z.string().min(1),
  thumbnailColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  duration: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  fileSizeBytes: z.number().positive().max(100 * 1024 * 1024).optional(),
  mimeType: z.enum(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']).optional(),
  trimStart: z.number().int().min(0).max(100).optional(),
  trimEnd: z.number().int().min(0).max(100).optional(),
  showOnPublic: z.boolean().optional(),
}).refine(data => 
  !data.trimStart || !data.trimEnd || data.trimStart < data.trimEnd,
  { message: "trimStart must be less than trimEnd" }
);
```

### Data Protection

**At Rest:**
- ✅ Videos stored in Cloudflare R2 (encrypted by default)
- ✅ Database encrypted at rest (Supabase)
- ✅ No sensitive PII in video metadata
- ✅ File keys don't expose learner names (only short ID)

**In Transit:**
- ✅ HTTPS/TLS 1.3 for all API calls
- ✅ Videos streamed over HTTPS
- ✅ JWT tokens transmitted in Authorization header (not URL)
- ✅ Base64 video data in POST body (not query params)

**Access Logging:**
```typescript
// Log all video access
logger.info('Video access', {
  userId: user.id,
  videoId: videoId,
  action: 'stream',
  fileKey: fileKey,
  timestamp: new Date().toISOString(),
  ipAddress: request.headers.get('cf-connecting-ip'),
});
```

**Data Sanitization:**
```typescript
// Sanitize user inputs
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 20);
}

function sanitizeFileKey(key: string): string {
  // Remove path traversal attempts
  key = key.replace(/\.\./g, '');
  // Remove absolute paths
  key = key.replace(/^\/+/, '');
  // Only allow expected pattern
  if (!/^video_portfolio\/[a-z0-9_]+\/[a-z0-9_-]+\.\w+$/.test(key)) {
    throw new Error('Invalid file key');
  }
  return key;
}
```

**Rate Limiting:**
```typescript
// Configuration
const RATE_LIMITS = {
  UPLOAD_HOURLY: 3,
  UPLOAD_DAILY: 10,
  DOWNLOAD_HOURLY: 100,
  DOWNLOAD_DAILY: 500,
};

// Check rate limit (use Redis or Cloudflare KV)
async function checkRateLimit(userId: string, action: string): Promise<boolean> {
  const key = `ratelimit:${action}:${userId}:${getCurrentHour()}`;
  const count = await kv.incr(key);
  await kv.expire(key, 3600); // 1 hour
  
  return count <= RATE_LIMITS[`${action.toUpperCase()}_HOURLY`];
}
```

**Content Security:**
- ❌ No virus scanning (Phase 2: integrate with ClamAV API)
- ❌ No magic byte validation (Phase 2: verify file type matches MIME)
- ❌ No transcoding (Phase 2: re-encode to standardize format)
- ⚠️ Trust client-provided MIME type (risk: user uploads .exe as .mp4)
- ✅ File extension validation
- ✅ Size limits enforced

---

## 11. Testing Plan

### Unit Tests

**Storage Handlers (`video-portfolio.test.ts`):**

```typescript
describe('handleUploadVideoPortfolio', () => {
  it('should upload video successfully', async () => {
    // Mock authenticated user, valid payload
    // Assert: R2 upload called, correct file key returned
  });
  
  it('should reject unauthenticated requests', async () => {
    // Mock no auth token
    // Assert: 401 error
  });
  
  it('should reject invalid base64', async () => {
    // Mock malformed base64
    // Assert: 400 error "Invalid video data"
  });
  
  it('should reject file too large', async () => {
    // Mock 150MB file (> 100MB limit)
    // Assert: 400 error "File too large"
  });
  
  it('should enforce quota limit', async () => {
    // Mock user with 5 existing videos
    // Assert: 403 error "Quota exceeded"
  });
  
  it('should generate correct file key', async () => {
    // Mock user ID, video ID
    // Assert: file key matches pattern video_portfolio/{user_folder}/{video}_{timestamp}.mp4
  });
});

describe('handleGetVideoPortfolio', () => {
  it('should stream video for owner', async () => {
    // Mock owner requesting own video
    // Assert: 200, video stream returned
  });
  
  it('should reject non-owner', async () => {
    // Mock user requesting another user's video
    // Assert: 403 error
  });
  
  it('should allow admin to view any video', async () => {
    // Mock admin requesting any video
    // Assert: 200, video stream returned
  });
  
  it('should handle range requests', async () => {
    // Mock Range: bytes=0-1023
    // Assert: 206 Partial Content, correct range
  });
  
  it('should return 404 for non-existent video', async () => {
    // Mock invalid file key
    // Assert: 404 error
  });
});

describe('handleDeleteVideoPortfolio', () => {
  it('should delete video and R2 file', async () => {
    // Mock owner deleting own video
    // Assert: R2 delete called, 200 success
  });
  
  it('should reject non-owner delete', async () => {
    // Mock user deleting another user's video
    // Assert: 403 error
  });
});
```

**CRUD API (`video-portfolio.test.ts`):**

```typescript
describe('create-video action', () => {
  it('should create video entry successfully', async () => {
    // Mock valid request
    // Assert: database insert, return video ID
  });
  
  it('should validate required fields', async () => {
    // Mock missing title
    // Assert: 400 error "Title required"
  });
  
  it('should enforce 5-tag limit', async () => {
    // Mock 6 tags
    // Assert: 400 error
  });
  
  it('should enforce quota via API check', async () => {
    // Mock user with 5 videos, attempt 6th
    // Assert: API returns 403 "Quota exceeded"
  });
});

describe('update-video action', () => {
  it('should update video metadata', async () => {
    // Mock owner updating own video
    // Assert: database update succeeds
  });
  
  it('should reject non-owner update', async () => {
    // Mock user updating another's video
    // Assert: API returns 403 error
  });
});

describe('delete-video action', () => {
  it('should delete video and cascade to R2', async () => {
    // Mock delete request
    // Assert: DB delete, R2 delete called
  });
});

describe('approve-video action (admin)', () => {
  it('should approve video', async () => {
    // Mock admin approving video
    // Assert: approval_status = 'approved', status = 'VERIFIED'
  });
  
  it('should reject non-admin approval', async () => {
    // Mock learner attempting approval
    // Assert: 403 error
  });
});
```

**Database Functions:**

```sql
-- Test get_learner_video_portfolio function
SELECT * FROM get_learner_video_portfolio('test-learner-uuid');
-- Assert: Returns videos, total_count correct

-- Test API authorization
-- Call API endpoint and verify only own videos are returned
-- Test admin can access all videos
-- Test public can only access approved videos
```

### Integration Tests

**End-to-End Upload Flow:**

```typescript
it('should complete full upload and create flow', async () => {
  // 1. Authenticate user
  const token = await authenticateTestUser();
  
  // 2. Upload video
  const uploadRes = await fetch('/api/storage/upload-video-portfolio', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      videoBase64: testVideoBase64,
      videoId: 'test-video-123',
      userId: testUserId,
      fileName: 'test.mp4',
      mimeType: 'video/mp4',
    }),
  });
  expect(uploadRes.status).toBe(200);
  const { fileKey } = await uploadRes.json();
  
  // 3. Create video entry
  const createRes = await fetch('/api/college-admin/video-portfolio', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: 'create-video',
      learnerId: testLearnerId,
      title: 'Test Video',
      videoUrl: fileKey,
    }),
  });
  expect(createRes.status).toBe(200);
  const { id: videoId } = await createRes.json();
  
  // 4. Verify video can be streamed
  const streamRes = await fetch(`/api/storage/video-portfolio?key=${fileKey}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(streamRes.status).toBe(200);
  expect(streamRes.headers.get('content-type')).toBe('video/mp4');
  
  // 5. Cleanup
  await deleteTestVideo(videoId);
});
```

**Access Control Integration:**

```typescript
it('should enforce access control across layers', async () => {
  const owner = await authenticateTestUser('owner@test.com');
  const other = await authenticateTestUser('other@test.com');
  
  // Owner uploads video
  const { fileKey, videoId } = await uploadAndCreateVideo(owner);
  
  // Owner can stream
  const ownerStream = await fetch(`/api/storage/video-portfolio?key=${fileKey}`, {
    headers: { Authorization: `Bearer ${owner.token}` },
  });
  expect(ownerStream.status).toBe(200);
  
  // Other user cannot stream
  const otherStream = await fetch(`/api/storage/video-portfolio?key=${fileKey}`, {
    headers: { Authorization: `Bearer ${other.token}` },
  });
  expect(otherStream.status).toBe(403);
  
  // Admin can stream
  const admin = await authenticateTestUser('admin@test.com', ['admin']);
  const adminStream = await fetch(`/api/storage/video-portfolio?key=${fileKey}`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  expect(adminStream.status).toBe(200);
});
```

### Manual Testing Checklist

**Functional Testing:**
- [ ] Upload video (MP4, MOV, AVI, WebM)
- [ ] Upload fails for unsupported format (e.g., .txt)
- [ ] Upload fails for file > 100MB
- [ ] Quota enforced (6th upload fails)
- [ ] Edit video metadata (title, description, tags)
- [ ] Change thumbnail color
- [ ] Adjust trim positions
- [ ] Toggle public visibility
- [ ] Delete video (both DB and R2)
- [ ] Video streams in browser
- [ ] Video seeking works (range requests)
- [ ] Drag-and-drop upload
- [ ] Multiple file select (only first used)

**Access Control Testing:**
- [ ] Unauthenticated user cannot upload
- [ ] Unauthenticated user cannot view private videos
- [ ] User cannot view another user's private videos
- [ ] User can view own videos
- [ ] Admin can view all videos
- [ ] User cannot edit another user's videos
- [ ] Admin can edit any video
- [ ] Public approved videos visible to all

**Admin Testing:**
- [ ] Admin can see pending review queue
- [ ] Admin can approve video
- [ ] Admin can reject video with reason
- [ ] Learner sees updated status after approval

**Edge Case Testing:**
- [ ] Simultaneous uploads (quota enforcement)
- [ ] Delete during edit (graceful handling)
- [ ] Network disconnect during upload (retry)
- [ ] Very long title/description (truncation)
- [ ] Special characters in title (sanitization)
- [ ] XSS attempt in description (escaped)

### Regression Tests

**Ensure Existing Features Still Work:**
- [ ] Projects with external video_url still display
- [ ] Digital portfolio export includes videos
- [ ] Passport mode shows approved videos
- [ ] Portfolio mode shows all own videos
- [ ] Public preview tab filters correctly
- [ ] Feature gate blocks non-subscribers

---

## 12. Risks

### Technical Risks

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| **R2 storage quota exceeded** | High | Low | Monitor usage, implement alerts at 80%, add storage cleanup job |
| **Large file uploads timeout** | Medium | Medium | Increase timeout to 120s, show progress indicator, enable chunked uploads (Phase 2) |
| **Video streaming performance issues** | Medium | Low | Use range requests, implement CDN (Phase 2), optimize file formats |
| **Orphaned files in R2** | Low | Medium | Implement cleanup job to delete files not in DB |
| **API authorization bugs** | High | Low | Thorough testing, code review, test with multiple roles |
| **Rate limiting bypass** | Medium | Low | Implement server-side rate limiting, not just client-side |
| **Video transcoding needed** | Medium | Medium | Document limitation, add transcoding in Phase 2 |

### Breaking Changes

| Change | Impact | Affected Users | Migration |
|--------|--------|----------------|-----------|
| **New video_portfolio table** | None | None | Clean migration, no existing data |
| **New R2 folder structure** | None | None | New folders, no conflicts |
| **New API endpoints** | None | None | Additive changes only |
| **Feature gate enforcement** | Medium | Non-subscribers | Already implemented, no change |
| **Projects.video_url still works** | None | None | Backwards compatible |

**No Breaking Changes** - This is a new feature, all changes are additive.

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **High storage costs** | Budget overrun | Monitor costs, implement alerts, set quotas |
| **User uploads inappropriate content** | Brand damage | Admin approval workflow, content moderation (Phase 2) |
| **Slow admin approval** | User frustration | Set SLA (24 hours), send notifications, batch approval UI |
| **R2 service outage** | Users cannot upload/view | Graceful error handling, retry logic, status page |
| **Large sudden influx of uploads** | Performance degradation | Rate limiting, queue system, auto-scaling |

### Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Malicious file upload** | High | Validate MIME type, scan for viruses (Phase 2), limit file types |
| **Unauthorized access to videos** | High | Multi-layer ownership validation, API authorization checks, regular audits |
| **Storage injection attack** | Medium | Sanitize file keys, validate paths, no path traversal |
| **Quota bypass** | Medium | API-level validation, server-side checks |
| **Token theft** | High | HTTPS only, short token expiry, refresh mechanism |

---

## 13. Open Questions

### Technical Clarifications

1. **Video Transcoding:**
   - Q: Should we transcode uploaded videos to a standard format/quality?
   - A: Phase 2 - Start with original files, add transcoding later
   - Impact: Users may upload large files, playback may vary

2. **Thumbnail Generation:**
   - Q: Auto-generate thumbnails from video frames?
   - A: Phase 2 - Use color placeholders for MVP
   - Impact: Less visual appeal initially

3. **CDN Integration:**
   - Q: Use Cloudflare CDN for faster video delivery?
   - A: Phase 2 - R2 has decent performance, optimize later
   - Impact: May be slower for users far from R2 region

4. **Chunked Uploads:**
   - Q: Support chunked uploads for large files?
   - A: Phase 2 - Base64 upload works for < 100MB
   - Impact: 100MB upload may timeout on slow connections

5. **Video Analytics:**
   - Q: Track view counts, watch time?
   - A: Phase 2 - Focus on core functionality first
   - Impact: No usage metrics initially

### Business Clarifications

1. **Admin Review SLA:**
   - Q: Maximum time for admin to review videos?
   - A: **Decision needed** - Suggest 24 hours
   - Impact: User expectations

2. **Rejection Appeals:**
   - Q: Can learners appeal rejections?
   - A: **Decision needed** - Suggest Phase 2
   - Impact: Support workload

3. **Public Visibility Default:**
   - Q: Should videos be public by default?
   - A: **Decision needed** - Suggest private by default for safety
   - Impact: User behavior

4. **Storage Quota Increase:**
   - Q: Can users request more than 5 videos?
   - A: **Decision needed** - Suggest hard limit for MVP
   - Impact: Premium feature potential

5. **Mobile Upload:**
   - Q: Support mobile app uploads?
   - A: **Decision needed** - Separate task, not in scope
   - Impact: Mobile users can't upload

### Process Clarifications

1. **Deployment Strategy:**
   - Q: Feature flag or direct deploy?
   - A: **Decision needed** - Suggest feature flag for gradual rollout
   - Impact: Rollback strategy

2. **Database Migration:**
   - Q: Run migration in maintenance window?
   - A: **Decision needed** - Non-breaking, can run anytime
   - Impact: Minimal

3. **Documentation:**
   - Q: Update user documentation/help center?
   - A: **Decision needed** - Suggest yes, create video upload guide
   - Impact: User support tickets

---

## 14. Developer Self Review

### Pre-Implementation Checklist

- [ ] TSD reviewed and approved by team lead
- [ ] Database schema reviewed by DBA
- [ ] Security review completed
- [ ] API contract reviewed by frontend team
- [ ] Storage costs estimated and approved
- [ ] All open questions resolved
- [ ] Test plan approved by QA

### Implementation Checklist

**Phase 1: Database Setup**
- [ ] Create migration file
- [ ] Test migration on local database
- [ ] Verify API authorization works correctly
- [ ] Test helper functions
- [ ] Run migration on staging
- [ ] Verify no breaking changes

**Phase 2: Storage Layer**
- [ ] Create `video-portfolio.ts` handler file
- [ ] Implement upload handler with validation
- [ ] Implement download/stream handler with range support
- [ ] Implement delete handler
- [ ] Update `[[path]].ts` routing
- [ ] Write unit tests for handlers
- [ ] Test with actual video files (MP4, MOV, AVI)
- [ ] Test with large files (near 100MB limit)
- [ ] Test ownership validation

**Phase 3: CRUD API**
- [ ] Create `video-portfolio.ts` endpoint
- [ ] Implement `get-videos` action
- [ ] Implement `create-video` action
- [ ] Implement `update-video` action
- [ ] Implement `delete-video` action (with R2 cleanup)
- [ ] Implement `approve-video` action (admin only)
- [ ] Implement `reject-video` action (admin only)
- [ ] Implement `get-pending-videos` action (admin only)
- [ ] Add authentication middleware
- [ ] Add authorization checks
- [ ] Write unit tests for all actions
- [ ] Test with Postman/Insomnia

**Phase 4: Frontend Integration**
- [ ] Create `videoPortfolioService.ts`
- [ ] Create `videoPortfolioStore.ts` (Zustand)
- [ ] Update `storageApiService.ts`
- [ ] Create TypeScript types
- [ ] Update `VideoPortfolioPage.tsx` to use real API
- [ ] Update `VideoEditDrawer.tsx` to use real API
- [ ] Test upload flow end-to-end
- [ ] Test edit flow
- [ ] Test delete flow
- [ ] Test public/private toggle

**Phase 5: Testing**
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Perform manual testing checklist
- [ ] Test on staging environment
- [ ] Test with different user roles (learner, admin)
- [ ] Test access control scenarios
- [ ] Test error scenarios
- [ ] Load test video streaming

**Phase 6: Deployment**
- [ ] Code review completed
- [ ] PR approved by 2+ reviewers
- [ ] All tests passing
- [ ] Staging deployment successful
- [ ] Run database migration on production
- [ ] Deploy to production
- [ ] Verify feature works on production
- [ ] Monitor logs for errors
- [ ] Monitor R2 storage usage
- [ ] Create rollback plan (if needed)

### Post-Deployment Checklist

- [ ] Monitor error rates (first 24 hours)
- [ ] Monitor upload success rate
- [ ] Monitor storage costs
- [ ] Monitor API latency
- [ ] Check user feedback
- [ ] Document any issues found
- [ ] Plan Phase 2 enhancements

### Code Quality Checklist

- [ ] Code follows project style guide
- [ ] All functions have TypeScript types
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate (not too verbose)
- [ ] No console.log in production code
- [ ] Secrets not hardcoded
- [ ] SQL queries are parameterized
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] File size limits enforced
- [ ] Quota limits enforced

---

## Versioning

### v1.0 MVP (Current)

**New Components:**
- ✅ Database: `video_portfolio` table
- ✅ Storage: R2 video storage infrastructure
- ✅ API: Upload, download, delete handlers
- ✅ API: CRUD operations (create, read, update, delete)
- ✅ API: Admin approval workflow
- ✅ Frontend: `videoPortfolioService.ts`
- ✅ Frontend: `videoPortfolioStore.ts`
- ✅ UI: Video portfolio page (already completed)
- ✅ UI: Video edit drawer (already completed)

**Limitations:**
- Max 5 videos per user
- Max 100MB per video
- No video transcoding
- No automatic thumbnail generation
- Manual admin approval
- Basic color placeholder thumbnails

### v1.1 Planned Enhancements

**Modified:**
- Storage: Add cleanup job for orphaned files
- API: Add batch approval endpoint
- UI: Add admin review dashboard

**New:**
- Notification system for approval/rejection
- Email notifications to learners
- Upload progress indicator

### v2.0 Major Features (Future)

**New:**
- Video transcoding (multiple resolutions)
- Automatic thumbnail generation
- CDN integration for faster delivery
- Chunked uploads for large files
- Video analytics (views, watch time)
- In-browser video trimming
- Comments and reactions
- Video search and filtering
- Virus scanning for uploads
- Magic byte validation for security

**Modified:**
- Increase video limit based on subscription tier
- Support larger file sizes (up to 500MB)
- Mobile app support

---

## Appendix

### Related Documentation

- [VIDEO_PORTFOLIO_IMPLEMENTATION_PLAN.md](./VIDEO_PORTFOLIO_IMPLEMENTATION_PLAN.md) - Detailed implementation guide
- [functions/api/storage/README.md](./functions/api/storage/README.md) - Storage API documentation
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [API Authorization Patterns](./functions/api/README.md) - Authorization implementation guide

### Team Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Backend Lead** | TBD | API implementation, database schema |
| **Frontend Lead** | TBD | UI integration, state management |
| **DevOps** | TBD | Deployment, monitoring, R2 configuration |
| **QA Lead** | TBD | Test plan execution, regression testing |
| **Product Manager** | TBD | Requirements, priority, UAT |

### Approval Signatures

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Developer** | _______________ | ____/____/____ | _______________ |
| **Tech Lead** | _______________ | ____/____/____ | _______________ |
| **QA Lead** | _______________ | ____/____/____ | _______________ |
| **Product Manager** | _______________ | ____/____/____ | _______________ |

---

**Document Version:** v1.0  
**Created:** September 18, 2026  
**Last Updated:** September 18, 2026  
**Status:** Ready for Review  
**Next Review:** After Phase 1 Completion
