import { expect, it } from 'vitest';
import { aiSubmissionFiles } from '../ai-submission-files';

const file = { id: 'submission-id', file_name: 'Answers.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
it('maps the to-one submission object returned for a unique recipient', () => {
  expect(aiSubmissionFiles(file)).toEqual([{ name: file.file_name, type: file.mime_type, url: '/api/ai-tutor/assignment-submission?submissionId=submission-id' }]);
});
it('keeps an unsubmitted allocation readable when its relationship is null', () => {
  expect(aiSubmissionFiles(null)).toEqual([]);
});
it('also accepts a to-many relationship response', () => {
  expect(aiSubmissionFiles([file])).toEqual(aiSubmissionFiles(file));
  expect(aiSubmissionFiles([])).toEqual([]);
});
