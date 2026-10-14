import {it,expect,vi} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const subscription=vi.hoisted(()=>vi.fn().mockReturnValue({subscriptionData:null}));
vi.mock('@/features/subscription/model/useSubscriptionQuery',()=>({useSubscriptionQuery:subscription}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>({id:'trainer'})}));
import CourseDetailModal from '../CourseDetailModal';
it('reuses existing course details without a personal subscription lookup or learner enrollment',()=>{
  render(<MemoryRouter><CourseDetailModal isOpen readOnly course={{course_id:'course',title:'Analytics',description:'Mapped course',status:'Active',modules:[]}} onClose={vi.fn()} onStartCourse={vi.fn()}/></MemoryRouter>);
  expect(subscription).toHaveBeenCalledWith({enabled:false});
  expect(screen.getByRole('button',{name:'Assigned teaching course'})).toBeDisabled();
});
