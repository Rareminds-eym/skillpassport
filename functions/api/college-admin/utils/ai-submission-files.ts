type SubmissionFile = { id: string; file_name: string; mime_type: string };

// A unique recipient foreign key makes this a to-one PostgREST relationship.
// Accept array responses too for compatibility with older schema caches.
export function aiSubmissionFiles(value: SubmissionFile | SubmissionFile[] | null) {
  const files = Array.isArray(value) ? value : value ? [value] : [];
  return files.map(file => ({
    name: file.file_name,
    type: file.mime_type,
    url: `/api/ai-tutor/assignment-submission?submissionId=${encodeURIComponent(file.id)}`,
  }));
}
