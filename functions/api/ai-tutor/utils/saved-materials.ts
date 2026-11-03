import type { SupabaseClient } from '@supabase/supabase-js';
import { textHash } from './course-index';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
export async function materialRequestFingerprint(message: string, config: unknown, lessonId: string | null) {
  return textHash(JSON.stringify(canonical({ request: message.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(), config, lessonId })));
}
export async function materialContextFingerprint(db: SupabaseClient, courseId: string) {
  const modules = await db.from('course_modules').select('module_id,title,order_index').eq('course_id', courseId).order('module_id');
  if (modules.error) throw new Error('Course context unavailable');
  if (!modules.data?.length) return textHash(JSON.stringify({ courseId, modules: [] }));
  const lessons = await db.from('lessons').select('lesson_id,title,content,order_index').in('module_id', modules.data.map(row => row.module_id)).order('lesson_id');
  if (lessons.error) throw new Error('Course lessons unavailable');
  const resources = lessons.data?.length ? await db.from('lesson_resources').select('resource_id,lesson_id,name,type,url,content').in('lesson_id', lessons.data.map(row => row.lesson_id)).order('resource_id') : { data: [], error: null };
  const index = await db.from('course_resource_analysis').select('source_key,content_hash,version,is_current,status').eq('course_id', courseId).order('source_key').order('version');
  if (resources.error || index.error) throw new Error('Course resources unavailable');
  return textHash(JSON.stringify(canonical({ courseId, modules: modules.data, lessons: lessons.data, resources: resources.data, index: index.data })));
}
export function savedAssignmentMarkdown(content: { questions: Array<{position: number; prompt: string; options: string[]; difficulty: string}> }, rules: Array<{questionId: string; acceptedAnswers: string[]; rubric: string}>) {
  const questions = content.questions.map(q => `${q.position}. ${q.prompt}\n${q.options.map((option, i) => `   ${String.fromCharCode(65 + i)}) ${option}`).join('\n')}`).join('\n\n');
  const solutions = rules.map((rule, i) => `${i + 1}. ${rule.acceptedAnswers.join('; ')} ${rule.rubric}`).join('\n\n');
  return `<!-- STUDENT_WORKSHEET -->\n## Questions\n${questions}\n<!-- PRIVATE_SOLUTIONS -->\n## Answer key\n${solutions}\n<!-- END_WORKSHEET -->`;
}
