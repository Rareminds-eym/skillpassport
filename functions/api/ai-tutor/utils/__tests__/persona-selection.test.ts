// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { selectAutomaticPersona } from '../persona-selection';

afterEach(() => vi.unstubAllGlobals());
const input = {message:'The numbers look right, but I cannot tell why my approach fails.',history:[],educator:false,courseTitle:'Fluid Mechanics',apiKey:'test-key',signal:new AbortController().signal};
const response = (facilitator: string) => new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({facilitator})}}]}));

it.each(['organizer','facilitator-of-learning','individualized-support','resource-provider','problem-solver','mentor-and-guide'])('accepts model-selected %s without keyword classification', async facilitator => {
  const fetcher=vi.fn().mockResolvedValue(response(facilitator));vi.stubGlobal('fetch',fetcher);
  expect(await selectAutomaticPersona(input)).toBe(facilitator);
  const payload=JSON.parse(fetcher.mock.calls[0][1].body);
  expect(payload.stream).toBe(false);
  expect(JSON.parse(payload.messages[1].content)).toMatchObject({audience:'learner',request:input.message});
});

it('includes recent learner and AI responses, audience and previous selection as bounded data', async () => {
  const fetcher=vi.fn().mockResolvedValue(response('mentor-and-guide'));vi.stubGlobal('fetch',fetcher);
  await selectAutomaticPersona({...input,educator:true,history:Array.from({length:10},(_,i)=>({id:String(i),role:i%2?'assistant':'user',content:'x'.repeat(3000),facilitator:'problem-solver' as const}))});
  const data=JSON.parse(JSON.parse(fetcher.mock.calls[0][1].body).messages[1].content);
  expect(data.audience).toBe('educator');expect(data.history).toHaveLength(6);
  expect(data.history[0].content).toHaveLength(1500);expect(data.previousFacilitator).toBe('problem-solver');
});

it.each(['__proto__','auto','educator-admin'])('rejects invalid selection %s and retains the previous persona', async facilitator => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response(facilitator)));
  expect(await selectAutomaticPersona({...input,history:[{id:'old',facilitator:'organizer'}]})).toBe('organizer');
});

it.each([new Response('unavailable',{status:503}),new Response('invalid json'),new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'{}'}}]}))])('falls back safely on provider failure', async failed => {
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(failed));
  expect(await selectAutomaticPersona(input)).toBe('facilitator-of-learning');
});

it('falls back on timeout without blocking the answer', async () => {
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('Timed out','TimeoutError')));
  expect(await selectAutomaticPersona(input)).toBe('facilitator-of-learning');
});
