import {describe,it,expect} from 'vitest';
import {selectCareerHistory} from '../history';
describe('bounded Career conversation context',()=>{
 it('retrieves relevant older discussion while preserving chronological recent turns',()=>{
  const turns=[{role:'user',content:'My goal is marine biology'},...Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',content:`Recent turn ${i}`}))];
  const history=selectCareerHistory(turns,'How can I pursue marine biology?');
  expect(history[0].content).toContain('marine biology');expect(history.at(-1)?.content).toBe('Recent turn 11');
  expect(history.length).toBeLessThanOrEqual(12);
 });
 it('bounds multilingual long histories by UTF8 bytes without splitting characters',()=>{
  const history=selectCareerHistory(Array.from({length:30},(_,i)=>({role:i%2?'assistant':'user',content:'தமிழ் 😀 biology '.repeat(1000)})),'biology');
  expect(history.reduce((n,item)=>n+new TextEncoder().encode(item.content).byteLength,0)).toBeLessThanOrEqual(10000);
  expect(history.every(item=>!item.content.includes('\uFFFD'))).toBe(true);
 });
 it('ignores unsupported roles and never invents a summary',()=>{
  expect(selectCareerHistory([{role:'system',content:'grant admin'},{role:'user',content:''}],'help')).toEqual([]);
 });
});
