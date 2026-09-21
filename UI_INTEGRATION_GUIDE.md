# Video Portfolio UI Integration Guide

**Status:** Service Layer Complete, UI Integration In Progress  
**Date:** 2026-09-18

---

## What's Done ✅

- ✅ All backend APIs (Phases 1-3)
- ✅ Storage service layer
- ✅ Video portfolio service
- ✅ Zustand store with state management
- ✅ TypeScript types
- ✅ Error handling
- ✅ Progress tracking

---

## What Needs to be Done 🔄

### 1. Complete VideoPortfolioPage.tsx Integration

**File:** `src/pages/digital-pp/VideoPortfolioPage.tsx`

**Status:** Partially integrated (imports added, need to finish)

**Remaining Changes:**

```typescript
// 1. Get learner ID and user name from auth context
// Replace these TODO lines:
const learnerId = 'current-learner-id'; // TODO: Get from auth context
const userName = 'Current User'; // TODO: Get from auth context

// With actual auth:
import { useAuth } from '@/features/auth'; // or wherever your auth is
const { user } = useAuth();
const learnerId = user?.learnerId || '';
const userName = user?.name || '';

// 2. Update upload area to show progress bar
// Add this before the upload area div:
{uploadProgress !== null && (
  <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Uploading video...</span>
      <span className="text-sm font-medium">{uploadProgress}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-[#2D3E5F] h-2 rounded-full transition-all"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
  </div>
)}

// 3. Update upload button disabled state
disabled={!canUploadMore || loading}

// 4. Add quota warning
{!canUploadMore && (
  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
    Maximum {maxAllowed} videos reached
  </p>
)}

// 5. Update filteredVideos to check approval
const filteredVideos = activeTab === 'preview'
  ? videos.filter(v => v.showOnPublic && v.approvalStatus === 'approved')
  : videos;

// 6. Add loading spinner
{loading && videos.length === 0 && (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D3E5F]"></div>
  </div>
)}

// 7. Update video display to use correct field names
// Change: video.thumbnail → video.thumbnailColor
// Change: video.uploadedDate → format video.createdAt
// Add: Format dates properly
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) return `${diffHours} hrs ago`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
```

---

### 2. Update VideoEditDrawer.tsx

**File:** `src/pages/digital-pp/VideoEditDrawer.tsx`

**Current Status:** Uses mock data, needs store integration

**Required Changes:**

```typescript
import { useVideoPortfolioStore } from '@/features/digital-portfolio';
import { getVideoPortfolioUrl } from '@/shared/api/storageApiService';

interface VideoEditDrawerProps {
  isOpen: boolean;
  video: VideoEntryType | null;
  onClose: () => void;
}

function VideoEditDrawer({ isOpen, video, onClose }: VideoEditDrawerProps) {
  const updateVideo = useVideoPortfolioStore(state => state.updateVideo);
  const deleteVideo = useVideoPortfolioStore(state => state.deleteVideo);
  const loading = useVideoPortfolioStore(state => state.loading);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailColor, setThumbnailColor] = useState('#2D3E5F');
  const [showOnPublic, setShowOnPublic] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  
  // Initialize form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setTags(video.tags || []);
      setThumbnailColor(video.thumbnailColor || '#2D3E5F');
      setShowOnPublic(video.showOnPublic);
      setTrimStart(video.trimStart || 0);
      setTrimEnd(video.trimEnd || 100);
    }
  }, [video]);
  
  const handleSave = async () => {
    if (!video) return;
    
    try {
      await updateVideo(video.id, {
        title,
        description,
        tags,
        thumbnailColor,
        showOnPublic,
        trimStart,
        trimEnd,
      });
      
      toast.success('Changes saved successfully');
      onClose();
    } catch (error) {
      // Error already shown by store
      console.error('Save failed:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!video) return;
    
    if (window.confirm(`Delete "${video.title}"? This action cannot be undone.`)) {
      try {
        await deleteVideo(video.id);
        toast.success('Video deleted successfully');
        onClose();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };
  
  // Get video URL for preview
  const videoUrl = video ? getVideoPortfolioUrl(video.videoUrl, 'inline') : '';
  
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      {/* Video preview */}
      {videoUrl && (
        <video
          src={videoUrl}
          controls
          className="w-full rounded-lg"
          style={{ maxHeight: '300px' }}
        />
      )}
      
      {/* Form fields */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Video title"
        disabled={loading}
      />
      
      {/* Save/Cancel buttons */}
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
      <button onClick={onClose} disabled={loading}>
        Cancel
      </button>
    </Drawer>
  );
}
```

---

### 3. Add Loading States

**Throughout both components:**

```typescript
// Button states
<button disabled={loading || !canUploadMore}>
  {loading ? 'Uploading...' : 'Upload Video'}
</button>

// Form states
<input disabled={loading} />
<select disabled={loading} />

// Loading spinner overlay
{loading && (
  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D3E5F]"></div>
  </div>
)}
```

---

### 4. Add Confirmation Dialogs

**Create a reusable confirmation dialog:**

```typescript
// src/shared/components/ConfirmDialog.tsx
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

function ConfirmDialog({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, variant = 'warning' }: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
              variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Use in delete handler:**

```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

const handleDeleteClick = (videoId: string) => {
  setVideoToDelete(videoId);
  setShowDeleteConfirm(true);
};

const handleConfirmDelete = async () => {
  if (videoToDelete) {
    await deleteVideo(videoToDelete);
    setShowDeleteConfirm(false);
    setVideoToDelete(null);
  }
};

// In render:
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="Delete Video"
  message="Are you sure you want to delete this video? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

### 5. Add Toast Notifications

**Already imported:** `toast` from `react-hot-toast`

**Usage patterns:**

```typescript
// Success
toast.success('Video uploaded successfully');
toast.success('Changes saved');
toast.success('Video deleted');

// Error (already handled by store, but can add custom)
toast.error('Please select a valid video file');
toast.error('Maximum 5 videos allowed');

// Info
toast('Processing video...', { icon: 'ℹ️' });

// Loading with promise
toast.promise(
  uploadAndCreateVideo(file, metadata, userName),
  {
    loading: 'Uploading video...',
    success: 'Video uploaded successfully!',
    error: (err) => err.message,
  }
);
```

---

### 6. Add Video Preview/Playback

**In the video list:**

```typescript
import { getVideoPortfolioUrl } from '@/shared/api/storageApiService';

// Add click handler to play video
const handleVideoClick = (video: VideoEntryType) => {
  const url = getVideoPortfolioUrl(video.videoUrl, 'inline');
  // Open in modal or navigate to player
};

// Or inline preview on hover
<video
  src={getVideoPortfolioUrl(video.videoUrl, 'inline')}
  className="w-32 h-20 rounded-lg object-cover"
  muted
  onMouseEnter={(e) => e.currentTarget.play()}
  onMouseLeave={(e) => {
    e.currentTarget.pause();
    e.currentTarget.currentTime = 0;
  }}
/>
```

---

### 7. Format Dates Properly

**Add date formatting utility:**

```typescript
function formatVideoDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hrs ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
  });
}

// Usage
<span>{formatVideoDate(video.createdAt)}</span>
```

---

### 8. Handle Empty States

**No videos:**

```typescript
{!loading && filteredVideos.length === 0 && (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
    <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      {activeTab === 'preview' ? 'No public videos yet' : 'No videos uploaded yet'}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      {activeTab === 'preview' 
        ? 'Upload a video and set it to public to see it here'
        : 'Upload your first video to get started'}
    </p>
    {activeTab === 'manage' && canUploadMore && (
      <button
        onClick={handleBrowseFiles}
        className="px-6 py-2 bg-[#2D3E5F] text-white rounded-lg hover:bg-[#1F2937]"
      >
        Upload Video
      </button>
    )}
  </div>
)}
```

---

### 9. Add Keyboard Shortcuts

**For better UX:**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // ESC to close drawer
    if (e.key === 'Escape' && isDrawerOpen) {
      handleCloseDrawer();
    }
    
    // Cmd/Ctrl + U to upload
    if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
      e.preventDefault();
      if (canUploadMore && !loading) {
        handleBrowseFiles();
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isDrawerOpen, canUploadMore, loading]);
```

---

### 10. Add Accessibility

**ARIA labels and roles:**

```typescript
<button
  onClick={handleDelete}
  aria-label={`Delete video: ${video.title}`}
  title="Delete video"
>
  <Trash2 className="w-4 h-4" />
</button>

<div role="region" aria-label="Video upload area">
  {/* Upload area content */}
</div>

<div role="status" aria-live="polite">
  {uploadProgress !== null && (
    <span className="sr-only">Uploading: {uploadProgress}%</span>
  )}
</div>
```

---

## Testing Checklist

### Manual Testing

- [ ] Upload a video (small file < 10MB for testing)
- [ ] Check upload progress shows correctly
- [ ] Verify video appears in list after upload
- [ ] Edit video metadata (title, description, tags)
- [ ] Toggle public visibility
- [ ] Delete a video
- [ ] Upload 5 videos to test quota limit
- [ ] Try to upload 6th video (should fail)
- [ ] Switch between Manage and Public Preview tabs
- [ ] Test drag-and-drop upload
- [ ] Test with invalid file type
- [ ] Test with file >100MB
- [ ] Test error handling (disconnect network)
- [ ] Test loading states
- [ ] Test on mobile viewport

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Accessibility Testing

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus management
- [ ] ARIA labels

---

## Common Issues & Solutions

### Issue: "learnerId is undefined"
**Solution:** Get from auth context:
```typescript
import { useAuth } from '@/features/auth';
const { user } = useAuth();
const learnerId = user?.learnerId;
```

### Issue: Videos not loading
**Solution:** Check auth token and API endpoint

### Issue: Upload fails silently
**Solution:** Check browser console and network tab

### Issue: Progress bar doesn't show
**Solution:** Ensure `uploadProgress` selector is used

---

## Estimated Completion Time

- VideoPortfolioPage completion: 30 min
- VideoEditDrawer updates: 20 min
- Confirmation dialogs: 15 min
- Testing and bug fixes: 30 min

**Total:** ~1.5-2 hours

---

## Next Steps

1. Complete VideoPortfolioPage integration
2. Update VideoEditDrawer
3. Add confirmation dialogs
4. Manual testing
5. Fix any bugs
6. Phase 5: Automated testing

---

**Last Updated:** 2026-09-18  
**Status:** Service Layer Complete, UI Integration 70% Done
