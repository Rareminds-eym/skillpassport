// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { chunkCourseText, validateCourseEmbedding, COURSE_EMBEDDING_MODEL, retrieveCourseEvidence, processCourseIndexBatch, textHash } from '../course-index';

describe('course index contracts', () => {
  it.each([true,false])('uses extracted local text only with a local database (%s)',async(local)=>{
    const resource={resource_id:'resource',lesson_id:'lesson',name:'Manual.docx',type:'document',url:'http://localhost:3000/api/storage/document-access?key=manual',content:'Locally extracted course text.'};
    const source_fingerprint=await textHash(JSON.stringify({url:resource.url,name:resource.name,type:resource.type,content:resource.content}));
    const row={id:'analysis',resource_id:'resource',lesson_id:'lesson',lease_token:'lease',source_fingerprint,attempt_count:1};
    const rpc=vi.fn().mockResolvedValueOnce({data:[row]}).mockResolvedValue({data:true});
    const query:any={select:()=>query,eq:()=>query,single:async()=>({data:resource}),update:vi.fn(()=>query),then:(resolve:any)=>resolve({error:null})};
    const embedText=vi.fn().mockResolvedValue({embedding:Array(1536).fill(.1),dimensions:1536,model:COURSE_EMBEDDING_MODEL});
    const result=await processCourseIndexBatch({rpc,from:()=>query} as never,{SUPABASE_URL:local?'http://127.0.0.1:54321':'https://example.supabase.co',EMBEDDING_SERVICE:{embedText}},1,'course',true);
    expect(result.processed).toBe(local?1:0);
    if(local){expect(embedText).toHaveBeenCalledWith(resource.content,'RETRIEVAL_DOCUMENT');expect(rpc).toHaveBeenLastCalledWith('finish_course_source',expect.objectContaining({p_text:resource.content,p_metadata:expect.objectContaining({limitations:expect.stringContaining('text-only')})}));}
    else expect(embedText).not.toHaveBeenCalled();
  });
  it('covers all source characters even when a paragraph exceeds chunk size', () => {
    const text = 'a'.repeat(15000) + '\nEnd';
    const chunks = chunkCourseText(text);
    expect(chunks.length).toBeGreaterThan(1);
    const covered = new Set<number>();
    for (const chunk of chunks) {
      const start = chunk.source_location.extracted_start as number;
      const end = chunk.source_location.extracted_end as number;
      expect(chunk.content).toBe(text.slice(start, end));
      for (let i = start; i < end; i++) covered.add(i);
    }
    expect(covered.size).toBe(text.length);
    expect(() => chunkCourseText(text, 100, 100)).toThrow();
  });
  it('rejects mixed models, wrong dimensions, nonfinite and zero vectors', () => {
    const valid = { embedding: Array(1536).fill(0.1), dimensions: 1536, model: COURSE_EMBEDDING_MODEL };
    expect(validateCourseEmbedding(valid)).toHaveLength(1536);
    for (const result of [{ ...valid, model: 'different-model' }, { ...valid, dimensions: 1024 }, { ...valid, embedding: [NaN] }, { ...valid, embedding: Array(1536).fill(0) }]) expect(() => validateCourseEmbedding(result)).toThrow();
  });
  it('denies access before invoking a provider or vector search', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false });
    const embedText = vi.fn();
    await expect(retrieveCourseEvidence({ rpc } as never, { EMBEDDING_SERVICE: { embedText } }, 'user', 'course', 'question')).rejects.toThrow('access denied');
    expect(embedText).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('uses query task type and server-scoped search', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: true }).mockResolvedValueOnce({ data: [] });
    const embedText = vi.fn().mockResolvedValue({ embedding: Array(1536).fill(.1), dimensions: 1536, model: COURSE_EMBEDDING_MODEL });
    await retrieveCourseEvidence({ rpc } as never, { EMBEDDING_SERVICE: { embedText } }, 'user', 'course', 'question', ['lesson']);
    expect(embedText).toHaveBeenCalledWith('question', 'RETRIEVAL_QUERY');
    expect(rpc).toHaveBeenLastCalledWith('search_course_chunks', expect.objectContaining({ p_user_id: 'user', p_course_id: 'course', p_lessons: ['lesson'] }));
  });
  it('embeds each chunk separately and commits under the claimed lease', async () => {
    const content = 'Lesson '.repeat(1200);
    const row = { id: 'analysis', lesson_id: 'lesson', resource_id: null, lease_token: 'lease', source_fingerprint: await textHash(content) };
    const rpc = vi.fn().mockResolvedValueOnce({ data: [row] }).mockResolvedValueOnce({ data: true });
    const query: any = { select: () => query, eq: () => query, single: async () => ({ data: { title: 'Title', content } }), update: () => query, then: (resolve: (v: unknown) => void) => resolve({ error: null }) };
    const embedText = vi.fn().mockResolvedValue({ embedding: Array(1536).fill(.1), dimensions: 1536, model: COURSE_EMBEDDING_MODEL });
    await processCourseIndexBatch({ rpc, from: () => query } as never, { EMBEDDING_SERVICE: { embedText } }, 1);
    expect(embedText.mock.calls.length).toBe(chunkCourseText(content).length);
    expect(embedText.mock.calls.every(([text, task]) => typeof text === 'string' && task === 'RETRIEVAL_DOCUMENT')).toBe(true);
    expect(rpc).toHaveBeenLastCalledWith('finish_course_source', expect.objectContaining({ p_id: 'analysis', p_lease: 'lease' }));
  });
});
