import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createJobIndexTransport} from '../lib/job-index-transport.mjs';

test('index transport requires exactly one explicit transport mode',async()=>{
  await assert.rejects(createJobIndexTransport({}),/Choose exactly one/);
  await assert.rejects(createJobIndexTransport({binding:true,embeddingUrl:'http://localhost:9004'}),/Choose exactly one/);
});
test('binding mode uses document embeddings without an HTTP key and disposes RPC resources',async()=>{
  const calls=[],closed=[];
  const worker={async embedText(...args){calls.push(args);return {model:'model',embedding:[1,2], [Symbol.dispose](){closed.push('result');}};},[Symbol.dispose](){closed.push('worker');}};
  const transport=await createJobIndexTransport({binding:true,env:{},createProxy:async()=>({env:{EMBEDDING_SERVICE:worker},async dispose(){closed.push('runtime');}}),fetcher:()=>{throw Error('HTTP must not run');}});
  assert.deepEqual(await transport.embed('job input'),{model:'model',embedding:[1,2]});
  assert.deepEqual(calls,[['job input','RETRIEVAL_DOCUMENT']]);
  await transport.dispose();assert.deepEqual(closed,['result','worker','runtime']);
});
test('binding setup releases its runtime when the service is missing',async()=>{
  let closed=false;
  await assert.rejects(createJobIndexTransport({binding:true,createProxy:async()=>({env:{},async dispose(){closed=true;}})}),/not configured/);
  assert.equal(closed,true);
});
test('binding failures expose rate-limit retry metadata without provider details',async()=>{
  let message='RATE_LIMIT_EXCEEDED: wait';
  const transport=await createJobIndexTransport({binding:true,createProxy:async()=>({env:{EMBEDDING_SERVICE:{async embedText(){throw Error(message);}}},async dispose(){}})});
  await assert.rejects(transport.embed('input'),error=>error.code==='RATE_LIMIT_EXCEEDED'&&error.retryAfterSeconds===60);
  message='PROVIDER_ERROR: private upstream details';
  await assert.rejects(transport.embed('input'),error=>error.message==='Embedding service binding failed');
  await transport.dispose();
});
test('HTTP mode preserves authenticated embedding requests and requires HTTPS remotely',async()=>{
  await assert.rejects(createJobIndexTransport({embeddingUrl:'https://example.invalid',env:{}}),/EMBEDDING_API_KEY/);
  await assert.rejects(createJobIndexTransport({embeddingUrl:'http://example.invalid',env:{EMBEDDING_API_KEY:'test-key'}}),/HTTPS/);
  await assert.rejects(createJobIndexTransport({embeddingUrl:'ftp://localhost',env:{EMBEDDING_API_KEY:'test-key'}}),/HTTPS/);
  const transport=await createJobIndexTransport({embeddingUrl:'http://127.0.0.1:9004',env:{EMBEDDING_API_KEY:'test-key'},fetcher:async(url,options)=>{
    assert.equal(url.href,'http://127.0.0.1:9004/embeddings/text');assert.equal(options.headers.Authorization,'Bearer test-key');assert.deepEqual(JSON.parse(options.body),{input:'job input'});
    return Response.json({model:'model',embedding:[1]});
  }});
  assert.deepEqual(await transport.embed('job input'),{model:'model',embedding:[1]});await transport.dispose();
});
test('HTTP throttling retains the provider retry delay',async()=>{
  const transport=await createJobIndexTransport({embeddingUrl:'http://localhost:9004',env:{EMBEDDING_API_KEY:'test-key'},fetcher:async()=>new Response('',{status:429,headers:{'Retry-After':'17'}})});
  await assert.rejects(transport.embed('input'),error=>error.code==='RATE_LIMIT_EXCEEDED'&&error.retryAfterSeconds===17);await transport.dispose();
});
