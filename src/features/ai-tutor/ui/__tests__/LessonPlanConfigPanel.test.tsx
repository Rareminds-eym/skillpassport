import {useState} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import LessonPlanConfigPanel from '../LessonPlanConfigPanel';
import {DEFAULT_LESSON_PLAN_CONFIG} from '../../types/lesson-plan';
afterEach(cleanup);
it('uses a selectable grade for lesson plans and requires a choice',()=>{
 function Settings(){const [config,setConfig]=useState({...DEFAULT_LESSON_PLAN_CONFIG,gradeLevel:''});return <LessonPlanConfigPanel config={config} onChange={setConfig} onGenerate={vi.fn()} isGenerating={false}/>;}
 render(<Settings/>);
 const select=screen.getByRole('combobox',{name:'Grade / Level'});
 for(let i=1;i<=12;i++)expect(screen.getByRole('option',{name:`Grade ${i}`,exact:true})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:/Generate Lesson Plan/i})).toBeDisabled();
 fireEvent.change(select,{target:{value:'Grade 4'}});
 expect(select).toHaveValue('Grade 4');
 expect(screen.getByRole('button',{name:/Generate Lesson Plan/i})).toBeEnabled();
});
