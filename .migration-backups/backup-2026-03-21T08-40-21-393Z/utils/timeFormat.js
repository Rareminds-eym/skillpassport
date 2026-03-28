/**
 * Simple time formatting utility to replace timeago.js
 * Converts timestamps to human-readable "time ago" format
 */

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  // Handle different timestamp formats
  let date;
  if (typeof timestamp === 'string') {
    // Handle relative time strings (already formatted)
    if (timestamp.includes('ago') || timestamp.includes('now') || timestamp.includes('minute') || timestamp.includes('hour') || timestamp.includes('day') || timestamp.includes('week')) {
      return timestamp;
    }
    // Try to parse as date
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    // Assume it's a number (timestamp)
    date = new Date(timestamp);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return timestamp; // Return original if can't parse
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Handle future dates
  if (diffInSeconds < 0) {
    return 'just now';
  }
  
  // Define time intervals
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];
  
  // Find the appropriate interval
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  
  // Less than a minute
  return 'just now';
};

// Export as default for easy importing
export default formatTimeAgo;