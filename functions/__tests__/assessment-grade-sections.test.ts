// @vitest-environment node
import {expect, it} from 'vitest';
import {loadSectionsWithQuestions} from '../api/assessment/utils/question-loader';
const client={from(table:string){
  const query={
    select:()=>query,eq:()=>query,in:()=>query,not:()=>query,
    order:async()=>({data:table==='personal_assessment_sections'?[{id:'riasec',name:'riasec',title:'Interests',response_scale:[]}]:[],error:null}),
    maybeSingle:async()=>({data:{id:'adaptive',name:'adaptive',description:'Adaptive section'},error:null}),
  };
  return query;
}};
it.each([
  ['after10','science_pcm_after10',['aptitude']],
  ['after12','cs',['aptitude','knowledge']],
  ['higher_secondary','science_pcm',['aptitude','knowledge']],
])('loads only supported generated sections for %s',async(grade,stream,expected)=>{
  const sections=await loadSectionsWithQuestions(client,grade as string,stream as string,{});
  expect(sections.filter(s=>s.name==='aptitude'||s.name==='knowledge').map(s=>s.name)).toEqual(expected);
});
