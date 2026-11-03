// @vitest-environment node
import {it,expect,vi,beforeEach} from 'vitest';
import {onRequest} from '../team-analytics';
const mocks=vi.hoisted(()=>({scope:vi.fn(),query:vi.fn(),from:vi.fn()}));
vi.mock('../../../lib/auth',()=>({withAuth:(handler:unknown)=>handler,getContextUser:()=>({id:'admin'})}));
vi.mock('../../../lib/supabase',()=>({getServiceClient:()=>({from:mocks.from})}));
vi.mock('../../../lib/recruitment-scope',()=>({recruitmentScope:mocks.scope,scopedRecruitmentQuery:mocks.query,RecruitmentAccessError:class extends Error{}}));
const request=()=>onRequest({request:new Request('http://localhost/api/recruiter/team-analytics'),env:{}});
beforeEach(()=>{vi.clearAllMocks();mocks.scope.mockResolvedValue({orgId:'org-a',memberIds:['admin']});const chain:any={select:vi.fn(),in:vi.fn()};chain.select.mockReturnValue(chain);chain.in.mockResolvedValue({data:[{id:'admin',firstName:'Team',lastName:'Admin',email:'fixture@example.test'}],error:null});mocks.from.mockReturnValue(chain);mocks.query.mockResolvedValue({data:[],error:null})});
it('requires team-management access and calculates metrics from scoped pipeline records',async()=>{
 mocks.query.mockResolvedValue({data:[{added_by_uuid:'admin',stage:'hired',status:'active',added_at:'2026-10-01',stage_changed_at:'2026-10-11'},{added_by:'admin',stage:'sourced',status:'active',added_at:'2026-10-02'},{added_by:'former-member',stage:'sourced'}],error:null});
 const response=await request(),body=await response.json();expect(response.status).toBe(200);expect(mocks.scope).toHaveBeenCalledWith(expect.anything(),{id:'admin'},'manage_team');expect(body.data.members[0]).toMatchObject({sourced:2,hired:1,averageDays:10});expect(body.data.unattributedCandidates).toBe(1);
});
it('uses null when there is no measured hire duration',async()=>{const body=await(await request()).json();expect(body.data.members[0]).toMatchObject({sourced:0,hired:0,averageDays:null})});
it('does not turn a database outage into zero performance metrics',async()=>{mocks.query.mockResolvedValue({data:null,error:{code:'08006',message:'Database unavailable'}});const response=await request();expect(response.status).toBeGreaterThanOrEqual(500);expect((await response.json()).success).toBe(false)});
