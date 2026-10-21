import {it,expect,vi} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const subscription=vi.hoisted(()=>vi.fn().mockReturnValue({subscriptionData:null}));
vi.mock('@/features/subscription/model/useSubscriptionQuery',()=>({useSubscriptionQuery:subscription}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>({id:'trainer'})}));
import CourseDetailModal from '../CourseDetailModal';
it('lets assigned teaching educators start learning without a personal subscription lookup or learner enrollment',()=>{
  const onStartCourse=vi.fn();
  render(<MemoryRouter><CourseDetailModal isOpen readOnly course={{course_id:'course',title:'Analytics',description:'Mapped course',status:'Active',modules:[]}} onClose={vi.fn()} onStartCourse={onStartCourse}/></MemoryRouter>);
  expect(subscription).toHaveBeenCalledWith({enabled:false});
  const start=screen.getByRole('button',{name:'Start Learning'});
  expect(start).toBeEnabled();
  fireEvent.click(start);
  expect(onStartCourse).toHaveBeenCalled();
});
