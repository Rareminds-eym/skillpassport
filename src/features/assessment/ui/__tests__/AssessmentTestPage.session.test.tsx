import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:{id:'owner',email:'owner@example.test'},start:vi.fn(),check:vi.fn(),resume:vi.fn(),ai:vi.fn()}));
vi.mock('@/shared/model/authStore',()=>({useUser:()=>mocks.user}));
vi.mock('react-router-dom',()=>({useNavigate:()=>vi.fn()}));
vi.mock('../../api/assessmentApiService',()=>({startAssessment:mocks.start,checkInProgress:mocks.check,abandonAttempt:vi.fn(),saveResponse:vi.fn(),submitAssessment:vi.fn(),analyzeAssessment:vi.fn()}));
vi.mock('../../api/adaptiveAptitudeApiService',()=>({default:{resumeTest:mocks.resume},linkSessionToAttempt:vi.fn()}));
vi.mock('../../api/careerAssessmentAIService',()=>({normalizeStreamId:()=> 'bca'}));
vi.mock('../../model/useLearnerGrade',()=>({useLearnerGrade:()=>({learnerId:'learner',learnerProgram:'BCA',loading:false})}));
vi.mock('../../model',()=>({useAdaptiveAptitude:()=>({startTest:vi.fn(),loading:false}),useAssessmentSubmission:()=>({submit:vi.fn()})}));
vi.mock('../../model/useAIQuestions',()=>({useAIQuestions:(options:any)=>{mocks.ai(options);return {loading:false,aiQuestions:{aptitude:null,knowledge:null},reload:vi.fn()};}}));
vi.mock('../../hooks/useAnswerSync',()=>({useAnswerSync:()=>({getElapsedSecondsForSection:()=>0,canProceedToNextQuestion:true})}));
vi.mock('../GradeSelectionScreen',()=>({GradeSelectionScreen:({onGradeSelect}:any)=><button onClick={()=>onGradeSelect('college')}>Choose college</button>}));
vi.mock('../ResumePromptScreen',()=>({default:({onResume}:any)=><button onClick={onResume}>Resume saved</button>}));
vi.mock('../screens/SectionIntroScreen',()=>({SectionIntroScreen:({gradeLevel,onStart}:any)=><button onClick={onStart}>Start {gradeLevel}</button>}));
vi.mock('../layout/QuestionLayout',()=>({QuestionLayout:({children,elapsedTime,perQuestionTimer,onNext}:any)=><div><output data-testid="elapsed">{elapsedTime}</output><output data-testid="timer">{perQuestionTimer}</output><button onClick={onNext}>Next</button>{children}</div>}));
vi.mock('../layout/ProgressHeader',()=>({ProgressHeader:()=>null}));
vi.mock('../questions/QuestionRenderer',()=>({QuestionRenderer:({question,answer}:any)=><div>{question.id}:{answer}</div>}));
vi.mock('../screens/ErrorScreen',()=>({ErrorScreen:()=> <div>Assessment error</div>}));
import AssessmentTestPage from '../AssessmentTestPage';
import {useAssessmentStore as store} from '../../model/assessmentStore';
const sections=(name='interest')=>[{id:name,name,title:name,questions:[{id:'q1'},{id:'q2'},{id:'q3'}]}];
const snapshot=(name='interest')=>({success:true,hasInProgress:true,attemptId:'owned',gradeLevel:'after12',streamId:null,sections:sections(name),answers:{q2:'B'},currentSectionIndex:0,currentQuestionIndex:1,elapsedTime:91,timerRemaining:0,sectionTimings:{interest:20}});
beforeEach(()=>{sessionStorage.clear();vi.clearAllMocks();mocks.user={id:'owner',email:'owner@example.test'};store.getState().reset();store.getState().bindOwner('owner');mocks.check.mockResolvedValue({success:true,hasInProgress:false});});
afterEach(cleanup);
describe('active assessment page session integration',()=>{
 it('starts fresh from canonical grade and clears old answers and results',async()=>{
  sessionStorage.setItem('pending_specialization','Data Science');
  render(<AssessmentTestPage/>);await screen.findByText('Choose college');
  act(()=>{store.getState().initializeAssessment(sections() as any,'old','college','bca');store.getState().saveAnswer('old','A');store.setState({adaptiveSessionId:'old-session',resultId:'old-result'});});
  mocks.start.mockResolvedValue({success:true,isResumed:false,attemptId:'new',attempt:{id:'new',grade_level:'after12',stream_id:null},sections:sections()});
  fireEvent.click(screen.getByText('Choose college'));await screen.findByText('Start after12');
  expect(store.getState()).toMatchObject({attemptId:'new',gradeLevel:'after12',streamId:null,answers:{},adaptiveSessionId:null,resultId:null});
  expect(mocks.start).toHaveBeenCalledWith({gradeLevel:'college',streamId:'bca',specialization:'Data Science'});
  expect(sessionStorage.getItem('pending_specialization')).toBeNull();
  expect(mocks.ai).toHaveBeenLastCalledWith(expect.objectContaining({gradeLevel:'after12',attemptId:'new'}));
 });
 it('routes reused starts through resume and restores answers, position and elapsed time',async()=>{
  mocks.start.mockResolvedValue({success:true,isResumed:true,attemptId:'owned',attempt:{id:'owned',grade_level:'after12',stream_id:null},sections:sections(),resume:snapshot()});
  render(<AssessmentTestPage/>);fireEvent.click(await screen.findByText('Choose college'));
  fireEvent.click(await screen.findByText('Resume saved'));await screen.findByText('q2:B');
  expect(store.getState()).toMatchObject({attemptId:'owned',gradeLevel:'after12',answers:{q2:'B'},currentQuestionIndex:1,timerRemaining:0});
  expect(screen.getByTestId('elapsed')).toHaveTextContent('91');
 });
 it('applies the zero saved AI timer only to the resumed question',async()=>{
  mocks.check.mockResolvedValue(snapshot('knowledge'));
  render(<AssessmentTestPage/>);fireEvent.click(await screen.findByText('Resume saved'));await screen.findByText('q2:B');
  expect(screen.getByTestId('timer')).toHaveTextContent('0');
  act(()=>store.getState().setCurrentQuestion(0,2));await screen.findByText('q3:');
  expect(screen.getByTestId('timer')).toHaveTextContent('59');
 });
 it('ignores a start response after switching users',async()=>{
  sessionStorage.setItem('pending_specialization','Data Science');
  let resolve:any;mocks.start.mockReturnValue(new Promise(yes=>resolve=yes));
  const page=render(<AssessmentTestPage/>);fireEvent.click(await screen.findByText('Choose college'));
  mocks.user={id:'other',email:'other@example.test'};page.rerender(<AssessmentTestPage/>);
  await screen.findByText('Choose college');
  await act(async()=>resolve({success:true,isResumed:false,attempt:{id:'late',grade_level:'after12',stream_id:null},sections:sections()}));
  expect(store.getState()).toMatchObject({ownerId:'other',attemptId:null,answers:{}});
  expect(sessionStorage.getItem('pending_specialization')).toBe('Data Science');
 });
 it('retains specialization when start fails',async()=>{
  sessionStorage.setItem('pending_specialization','Data Science');
  mocks.start.mockResolvedValue({success:false,error:'Unavailable'});
  render(<AssessmentTestPage/>);fireEvent.click(await screen.findByText('Choose college'));
  await screen.findByText('Assessment error');
  expect(sessionStorage.getItem('pending_specialization')).toBe('Data Science');
 });
 it('ignores an adaptive resume response after replacing the attempt',async()=>{
  let resolve:any;mocks.resume.mockReturnValue(new Promise(yes=>resolve=yes));
  mocks.check.mockResolvedValue({...snapshot('adaptive_aptitude'),isAdaptiveInProgress:true,adaptiveSession:{sessionId:'adaptive',status:'in_progress'}});
  render(<AssessmentTestPage/>);fireEvent.click(await screen.findByText('Resume saved'));
  await waitFor(()=>expect(mocks.resume).toHaveBeenCalled());
  act(()=>store.getState().initializeAssessment(sections() as any,'replacement','after12',null));
  await act(async()=>resolve({session:{id:'adaptive'},currentQuestion:{id:'late'}}));
  expect(store.getState()).toMatchObject({attemptId:'replacement',adaptiveSessionId:null,answers:{}});
 });
});
