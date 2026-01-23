/**
 * Utility functions for formatting data for display
 */

/**
 * Formats stream_id from database into user-friendly display text
 * @param streamId - Raw stream_id from personal_assessment_results table
 * @returns Formatted, human-readable stream/program name
 */
export const formatStreamId = (streamId: string | null | undefined): string => {
  if (!streamId) return '—';
  
  // Mapping of database stream_id values to display names
  const streamMap: Record<string, string> = {
    // Grade 11-12 streams
    'science': 'Science',
    'science_pcm': 'Science (PCM)',
    'science_pcb': 'Science (PCB)',
    'commerce': 'Commerce',
    'commerce_maths': 'Commerce with Maths',
    'commerce_general': 'Commerce',
    'arts': 'Arts',
    'arts_economics': 'Arts (Economics)',
    'general': 'General',
    
    // College programs - Engineering
    'btech_ece': 'B.Tech ECE',
    'btech_cse': 'B.Tech CSE',
    'btech_eee': 'B.Tech EEE',
    'btech_me': 'B.Tech Mechanical',
    'btech_ce': 'B.Tech Civil',
    'btech_it': 'B.Tech IT',
    
    // College programs - Other
    'bca': 'BCA',
    'bba': 'BBA',
    'ba': 'BA',
    'bcom': 'B.Com',
    'bsc': 'B.Sc',
    'bpharma': 'B.Pharma',
    'animation': 'Animation',
    'cs': 'Computer Science',
    
    // Grade levels (fallback - shouldn't typically be used as stream)
    'middle_school': 'Middle School',
    'high_school': 'High School',
    'higher_secondary': 'Higher Secondary',
    'college': 'College',
  };
  
  // Return mapped value if exists, otherwise format the raw string
  const normalized = streamId.toLowerCase().trim();
  
  if (streamMap[normalized]) {
    return streamMap[normalized];
  }
  
  // Fallback: Convert underscores to spaces and capitalize each word
  return streamId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
};
