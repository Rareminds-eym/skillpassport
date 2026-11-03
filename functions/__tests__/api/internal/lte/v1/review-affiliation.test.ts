import {expect,it,vi} from 'vitest';
import {resolveReviewCollege} from '../../../../../api/internal/lte/v1/review-affiliation';
it('resolves the organization through the active university-college mapping',async()=>{
 const query=vi.fn().mockResolvedValue([{college_id:'organization'}]);
 expect(await resolveReviewCollege({query} as any,{university_college_id:'university-college'})).toBe('organization');
 expect(query).toHaveBeenCalledWith('university_colleges?id=eq.university-college&account_status=eq.active&select=college_id&limit=2');
});
it('does not guess missing or conflicting affiliation mappings',async()=>{
 await expect(resolveReviewCollege({query:async()=>[]} as any,{university_college_id:'unmapped'})).rejects.toThrow('administrator correction');
 await expect(resolveReviewCollege({query:async()=>[{college_id:'one'}]} as any,{college_id:'two',university_college_id:'mapped'})).rejects.toThrow('ambiguous');
});
it('preserves existing college and independent handling',async()=>{
 const query=vi.fn();expect(await resolveReviewCollege({query} as any,{college_id:'college'})).toBe('college');expect(await resolveReviewCollege({query} as any,{})).toBeNull();expect(query).not.toHaveBeenCalled();
});
