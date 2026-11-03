import {describe,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({post:vi.fn()}));
vi.mock('@/shared/api/apiClient',()=>({apiPost:f.post}));
import {teaching} from '../teachingApi';
describe('authenticated teaching transport',()=>{
 it('sends structured operations through the existing authenticated client',async()=>{f.post.mockResolvedValue({data:[{id:'x'}]});expect(await teaching('sessions')).toEqual([{id:'x'}]);expect(f.post).toHaveBeenCalledWith('/teaching/actions',{action:'sessions',payload:{}});});
});
