// Synthetic text only. Load credentials through the environment; never print keys or provider bodies.
const key=process.env.OPENROUTER_API_KEY;
if(!key) { console.error('OPENROUTER_API_KEY is required for this explicitly live smoke test.'); process.exit(2); }
const model='google/gemini-embedding-2-preview';
for(const [input,input_type] of [[['Time management involves planning tasks and setting priorities.','Plants use light to produce food.'],'search_document'],['How should I prioritize tasks?','search_query']]) {
  const response=await fetch('https://openrouter.ai/api/v1/embeddings',{method:'POST',signal:AbortSignal.timeout(60000),headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':'http://localhost:8788','X-Title':'Course indexing synthetic smoke test'},body:JSON.stringify({model,input,input_type,dimensions:1536})});
  if(!response.ok){console.error(`Embedding provider returned HTTP ${response.status}; no response body logged.`);process.exit(1);}
  const result=await response.json();const expected=Array.isArray(input)?input.length:1;
  if(result.model!==model||result.data?.length!==expected||result.data.some(item=>item.embedding?.length!==1536||!item.embedding.every(Number.isFinite)))throw new Error('Embedding model/dimension contract failed');
  console.log(`PASS: ${input_type}, model ${result.model}, ${result.data.length} vector(s), 1536 dimensions.`);
}
