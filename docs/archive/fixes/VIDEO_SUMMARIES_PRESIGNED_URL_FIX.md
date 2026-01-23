# Video Summaries Presigned URL Fix - COMPLETE

## Issue Fixed

### ✅ **406 Not Acceptable Error on Video Summaries Query**

**Problem**: The application was getting a 406 error when querying the `video_summaries` table:
```
GET .../video_summaries?select=*&video_url=eq.https%3A%2F%2F...X-Amz-Signature%3D... 406 (Not Acceptable)
```

**Root Cause**: The code was trying to query the database using full presigned URLs (which contain authentication parameters and are very long) as the `video_url` field. Presigned URLs:
- Are temporary and contain authentication parameters
- Are very long (>500 characters)
- Contain special characters that cause URL encoding issues
- Change every time a new presigned URL is generated

## Solution Implemented

### 1. **Prefer Lesson ID Queries**
Updated components to use `getVideoSummaryByLesson(lessonId)` instead of `getVideoSummaryByUrl(videoUrl)` when `lessonId` is available:

**Components Updated**:
- `src/components/ai-tutor/VideoLearningPanel.tsx`
- `src/components/ai-tutor/VideoSummarizer.tsx`

**Logic**:
```typescript
// Before (problematic)
const existing = await getVideoSummaryByUrl(videoUrl);

// After (improved)
let existing: VideoSummary | null = null;
if (lessonId) {
  existing = await getVideoSummaryByLesson(lessonId);  // More reliable
} else if (videoUrl) {
  existing = await getVideoSummaryByUrl(videoUrl);     // Fallback
}
```

### 2. **Enhanced URL Matching for Fallback Cases**
Added utility functions to handle presigned URL matching when lesson ID is not available:

**New Functions in `videoSummarizerService.ts`**:
```typescript
// Extract file key from any R2 URL format
function extractFileKey(url: string): string

// Compare if two URLs refer to the same file
function isSameFile(url1: string, url2: string): boolean
```

**Enhanced `getVideoSummaryByUrl`**:
```typescript
// 1. Try exact URL match first (backward compatibility)
// 2. If not found and URL is presigned, extract file key and compare
// 3. Find matching video summary by file key comparison
```

## Database Relationship

### Video Summaries Table Structure
```sql
video_summaries:
- id (uuid, primary key)
- lesson_id (uuid, nullable) -- Most reliable identifier
- video_url (text) -- Can be presigned or direct URL
- processing_status (varchar)
- ... other fields
```

### Query Priority
1. **Primary**: Query by `lesson_id` (most reliable, indexed)
2. **Fallback**: Query by `video_url` with smart matching

## Benefits

✅ **Eliminates 406 errors**: No more problematic presigned URL queries  
✅ **More reliable**: Uses lesson_id as primary identifier  
✅ **Backward compatible**: Still works with direct URL queries  
✅ **Smart matching**: Can match presigned URLs to stored file keys  
✅ **Better performance**: lesson_id queries are faster and more reliable  

## Files Updated

- `src/services/videoSummarizerService.ts` - Enhanced URL matching logic
- `src/components/ai-tutor/VideoLearningPanel.tsx` - Prefer lessonId queries
- `src/components/ai-tutor/VideoSummarizer.tsx` - Prefer lessonId queries
- `src/hooks/useVideoSummarizer.ts` - Already had correct logic

## Testing

After this fix:

1. **Video summaries should load without 406 errors**
2. **Existing summaries should be found by lesson ID**
3. **Fallback URL matching should work for edge cases**
4. **No impact on video processing functionality**

## Future Improvements

Consider adding a `file_key` column to the `video_summaries` table for even more reliable matching:

```sql
ALTER TABLE video_summaries ADD COLUMN file_key TEXT;
CREATE INDEX idx_video_summaries_file_key ON video_summaries(file_key);
```

This would eliminate the need for URL parsing and provide the most reliable file identification.

## Root Cause Analysis

The issue occurred because:
1. Video files are stored in R2 with presigned URLs for security
2. The video summarizer was storing these temporary presigned URLs in the database
3. Later queries tried to match new presigned URLs (with different signatures) to stored ones
4. The URL encoding and length caused the 406 error

The fix addresses this by using stable identifiers (lesson_id) and smart file key extraction for URL matching.