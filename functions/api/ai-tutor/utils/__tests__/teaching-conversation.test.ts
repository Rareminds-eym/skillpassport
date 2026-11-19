import { describe, expect, it } from 'vitest';
import { isPersona, routeTeachingMessage, routeLearnerMessage } from '../teaching-conversation';
import { DEFAULT_WORKSHEET_CONFIG } from '../../types/worksheet';
import { DEFAULT_LESSON_PLAN_CONFIG } from '../../types/lesson-plan';

describe('continuous teaching conversation', () => {
  it('routes differentiated worksheet production to CREATE even when ADAPT is pinned', () => {
    expect(routeTeachingMessage('Generate a scaffolded worksheet with 5 questions', [], 'individualized-support')).toMatchObject({facilitator:'resource-provider',mode:'individualized-support',worksheetConfig:{questionCount:5}});
  });
  it('keeps support specifications and explanations out of the worksheet generator', () => {
    const history = [{id:'worksheet',worksheetConfig:DEFAULT_WORKSHEET_CONFIG}];
    expect(routeTeachingMessage('Recommend scaffolding requirements for these questions', history)).toMatchObject({worksheetConfig:undefined});
    expect(routeTeachingMessage('Simplify the explanation for this learner', history, 'individualized-support').worksheetConfig).toBeUndefined();
  });
  it('keeps feedback requests out of generation while allowing practice about feedback', () => {
    expect(routeTeachingMessage('Give me feedback on these 5 questions', []).worksheetConfig).toBeUndefined();
    expect(routeTeachingMessage('Give me 5 questions about feedback', []).facilitator).toBe('resource-provider');
  });
  it('keeps diagnostic and inquiry discussion out of artifact generation', () => {
    expect(routeTeachingMessage('Give me 2 diagnostic questions for this misconception', [])).toMatchObject({worksheetConfig:undefined});
    expect(routeTeachingMessage('Create an inquiry activity with 3 guided questions', [])).toMatchObject({facilitator:'facilitator-of-learning',worksheetConfig:undefined});
    expect(routeTeachingMessage('Create a worksheet with diagnostic questions', []).facilitator).toBe('resource-provider');
  });
  const history = [{ id: 'worksheet', worksheetConfig: DEFAULT_WORKSHEET_CONFIG, worksheetVariants: [{}] }];
  it.each(['I need a worksheet with 5 multiple-choice questions for beginner and intermediate levels', 'Give me 5 MCQs for beginner and intermediate levels', 'I want 5 questions for beginner and intermediate levels'])('routes conversational resource requests: %s', request => {
    const result = routeTeachingMessage(request, []);
    expect(result.facilitator).toBe('resource-provider');
    expect(result.worksheetConfig).toMatchObject({ questionCount: 5, difficultyLevels: ['low', 'medium'] });
  });
  it('resumes generation from the screenshot clarification reply', () => {
    const result = routeTeachingMessage('it can general', [
      { id: 'request', role: 'user', content: 'I need a worksheet with 5 multiple-choice questions for beginner and intermediate levels' },
      { id: 'clarification', role: 'assistant', content: 'I need to clarify a couple of things first. Do you want specific topics?', facilitator: 'facilitator-of-learning' },
    ]);
    expect(result.facilitator).toBe('resource-provider');
    expect(result.worksheetConfig).toMatchObject({ questionCount: 5, templateType: 'multiple_choice', difficultyLevels: ['low', 'medium'] });
  });
  it('does not generate for cancellation or ordinary follow-up discussion', () => {
    const history = [
      { id: 'request', role: 'user', content: 'Create a worksheet' },
      { id: 'clarification', role: 'assistant', content: 'Which topic? Please specify.' },
    ];
    expect(routeTeachingMessage('No, cancel that', history).worksheetConfig).toBeUndefined();
    expect(routeTeachingMessage('Explain the general concept first', history).worksheetConfig).toBeUndefined();
  });
  it('recognizes question generation without requiring the word worksheet', () => {
    expect(routeTeachingMessage('Generate 5 questions about time management', []).worksheetConfig?.questionCount).toBe(5);
    expect(routeTeachingMessage('Explain these questions', []).worksheetConfig).toBeUndefined();
  });
  it('creates a worksheet directly from conversation', () => {
    const result = routeTeachingMessage('Create a worksheet with 15 questions', []);
    expect(result.worksheetConfig?.questionCount).toBe(15);
    expect(result.facilitator).toBe('resource-provider');
  });
  it('revises the latest material with retained settings', () => {
    expect(routeTeachingMessage('Make it harder', history).worksheetConfig).toMatchObject({ difficulty: 'high', questionCount: 10 });
    expect(routeTeachingMessage('Change it to 30 minutes', [{ id: 'plan', lessonPlanConfig: DEFAULT_LESSON_PLAN_CONFIG }]).lessonPlanConfig?.duration).toBe(30);
  });
  it.each(['Explain this worksheet', 'Is that assigned to all learners?', 'How can I create a worksheet?', 'Do not generate a worksheet'])('does not regenerate for %s', message => {
    expect(routeTeachingMessage(message, history).worksheetConfig).toBeUndefined();
  });
  it('routes a deadline follow-up into real assignment review', () => {
    const result = routeTeachingMessage('03/10/2026 time 16.00', [
      ...history,
      { id: 'reply', role: 'assistant', content: 'What is the due date for this assignment?' },
    ]);
    expect(result.assignmentReviewRequested).toBe(true);
    expect(result.assignmentSourceId).toBe('worksheet');
    expect(result.worksheetConfig).toBeUndefined();
  });
  it('offers an existing worksheet for assignment without publishing', () => {
    expect(routeTeachingMessage('Assign this to my learners', history)).toMatchObject({ assignmentSourceId: 'worksheet', worksheetConfig: undefined });
    expect(routeTeachingMessage('Assign this', []).assignmentSourceId).toBeUndefined();
  });
  it('retains a manually chosen persona until automatic is selected', () => {
    const pinned = [{ id: 'reply', facilitatorMode: 'problem-solver' as const }];
    expect(routeTeachingMessage('Plan a lesson', pinned).facilitator).toBe('problem-solver');
    expect(routeTeachingMessage('Plan a lesson', pinned, 'auto').mode).toBe('auto');
  });
  it('does not infer a chat persona from keywords before semantic selection', () => {
    expect(routeTeachingMessage('I am confused and need feedback', []).facilitator).toBe('facilitator-of-learning');
  });
  it('pins personas requested in conversation and returns to automatic on request', () => {
    expect(routeTeachingMessage('Act as a problem solver', []).mode).toBe('problem-solver');
    expect(routeTeachingMessage('Switch to automatic selection', [{ id: 'old', facilitatorMode: 'organizer' }]).mode).toBe('auto');
  });
  it('retains the current automatic persona for a brief follow-up', () => {
    expect(routeTeachingMessage('Can you explain more?', [{ id: 'old', facilitator: 'problem-solver', facilitatorMode: 'auto' }]).facilitator).toBe('problem-solver');
  });
  it('accepts only known persona identifiers', () => {
    expect(isPersona('problem-solver')).toBe(true);
    expect(isPersona('__proto__')).toBe(false);
  });
});


describe('learner automatic personas', () => {
  it('leaves automatic chat selection to AI and strips educator actions', () => {
    expect(routeLearnerMessage('Plan my study schedule', [])).toEqual({facilitator:'facilitator-of-learning',mode:'auto',worksheetConfig:undefined,lessonPlanConfig:undefined,assignmentReviewRequested:false,assignmentSourceId:undefined});
  });
  it('preserves manual selection, conversation continuity and explicit auto reset', () => {
    expect(routeLearnerMessage('Generate a worksheet', [], 'mentor-and-guide').facilitator).toBe('mentor-and-guide');
    const history = [{id:'one',facilitator:'problem-solver' as const,facilitatorMode:'auto' as const}];
    expect(routeLearnerMessage('Explain more',history).facilitator).toBe('problem-solver');
    expect(routeLearnerMessage('Plan my study', [{id:'one',facilitatorMode:'problem-solver'}], 'auto').mode).toBe('auto');
    expect(routeLearnerMessage('Hello', []).facilitator).toBe('facilitator-of-learning');
  });
  it('never routes learner assignment commands to publishing actions', () => {
    expect(routeLearnerMessage('Assign this worksheet', [])).toMatchObject({assignmentReviewRequested:false,worksheetConfig:undefined});
  });
});
