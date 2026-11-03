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
  const course = await db.from('courses').select('course_id,title,description,code').eq('course_id', courseId).single();
  if (course.error || !course.data) throw new Error('Course context unavailable');
  const modules = await db.from('course_modules').select('module_id,title,description,order_index').eq('course_id', courseId).order('module_id');
  if (modules.error) throw new Error('Course context unavailable');
  if (!modules.data?.length) return textHash(JSON.stringify({ course: course.data, modules: [] }));
  const lessons = await db.from('lessons').select('lesson_id,module_id,title,description,content,duration,order_index').in('module_id', modules.data.map(row => row.module_id)).order('lesson_id');
  if (lessons.error) throw new Error('Course lessons unavailable');
  const resources = lessons.data?.length ? await db.from('lesson_resources').select('resource_id,lesson_id,name,type,url,content').in('lesson_id', lessons.data.map(row => row.lesson_id)).order('resource_id') : { data: [], error: null };
  const index = await db.from('course_resource_analysis').select('source_key,content_hash,version,is_current,status').eq('course_id', courseId).order('source_key').order('version');
  const videos = lessons.data?.length ? await db.from('video_summaries').select('lesson_id,transcript,summary,key_points,topics,processing_status').in('lesson_id', lessons.data.map(row => row.lesson_id)).order('lesson_id') : { data: [], error: null };
  if (resources.error || index.error || videos.error) throw new Error('Course resources unavailable');
  const stableResources = resources.data?.map(resource => {
    if (!resource.content?.startsWith('[COURSE_RESOURCE_ANALYSIS_')) return resource;
    try {
      const cache = JSON.parse(resource.content.slice(resource.content.indexOf('\n') + 1));
      return { ...resource, content: { model: cache.model, url: cache.url, text: cache.text } };
    } catch { return resource; }
  });
  return textHash(JSON.stringify(canonical({ course: course.data, modules: modules.data, lessons: lessons.data, resources: stableResources, videos: videos.data, index: index.data })));
}
export function savedAssignmentMarkdown(content: { questions: Array<{position: number; prompt: string; options: string[]; difficulty: string}> }, rules: Array<{questionId: string; acceptedAnswers: string[]; rubric: string}>) {
  const questions = content.questions.map(q => `${q.position}. ${q.prompt}\n${q.options.map((option, i) => `   ${String.fromCharCode(65 + i)}) ${option}`).join('\n')}`).join('\n\n');
  const solutions = rules.map((rule, i) => `${i + 1}. ${rule.acceptedAnswers.join('; ')} ${rule.rubric}`).join('\n\n');
  return `<!-- STUDENT_WORKSHEET -->\n## Questions\n${questions}\n<!-- PRIVATE_SOLUTIONS -->\n## Answer key\n${solutions}\n<!-- END_WORKSHEET -->`;
}
