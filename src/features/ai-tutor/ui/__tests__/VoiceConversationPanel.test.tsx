import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const actions=vi.hoisted(()=>({start:vi.fn(),end:vi.fn(),toggleMute:vi.fn(),interrupt:vi.fn(),retryAudio:vi.fn(),finishQuestion:vi.fn(),stopSpeaking:vi.fn()}));
const model=vi.hoisted(()=>({state:'idle',level:0,muted:false,error:'',canRetryAudio:false}));
vi.mock('../../model/useVoiceConversation',()=>({useVoiceConversation:()=>({...model,...actions})}));
import VoiceConversationPanel from '../VoiceConversationPanel';
const props={courseId:'course',courseName:'Fluid Mechanics',messages:[],sendMessage:vi.fn(),stopGeneration:vi.fn(),onClose:vi.fn()};
beforeEach(()=>{vi.clearAllMocks();Object.assign(model,{state:'idle',level:0,muted:false,error:'',canRetryAudio:false});});afterEach(cleanup);
it('offers an explicit start action and a way back to text chat',()=>{
  render(<VoiceConversationPanel {...props}/>);fireEvent.click(screen.getByRole('button',{name:'Start conversation'}));expect(actions.start).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Text chat'}));expect(actions.end).toHaveBeenCalled();expect(props.onClose).toHaveBeenCalled();
});
it('exposes microphone and end controls while listening',()=>{
  model.state='listening';render(<VoiceConversationPanel {...props}/>);
  fireEvent.click(screen.getByRole('button',{name:'Mute microphone'}));expect(actions.toggleMute).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Send question'}));expect(actions.finishQuestion).toHaveBeenCalled();expect(screen.getByRole('button',{name:'End voice conversation'})).toBeInTheDocument();
});
it('drives the speaking orb with measured energy and allows interruption',()=>{
  Object.assign(model,{state:'speaking',level:0.7});const {container}=render(<VoiceConversationPanel {...props}/>);
  expect(container.querySelector('[data-voice-state="speaking"]')).toHaveStyle({'--voice-energy':'0.7'});expect(container.querySelector('.animate-facilitator-orbit')).not.toBeNull();expect(container.querySelector('.animate-facilitator-particles')).not.toBeNull();expect(container.querySelector('.voice-energy-ring')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Interrupt and ask'}));expect(actions.interrupt).toHaveBeenCalled();
});
it('retries playback without submitting the question again',()=>{
  Object.assign(model,{state:'error',error:'Voice service is busy',canRetryAudio:true});render(<VoiceConversationPanel {...props}/>);
  expect(screen.getByRole('alert')).toHaveTextContent('Voice service is busy');fireEvent.click(screen.getByRole('button',{name:'Retry audio'}));expect(actions.retryAudio).toHaveBeenCalled();expect(props.sendMessage).not.toHaveBeenCalled();
});

it('minimizes and restores without ending the voice session',()=>{
  model.state='speaking';const onMinimize=vi.fn();const onRestore=vi.fn();
  const view=render(<VoiceConversationPanel {...props} onMinimize={onMinimize} onRestore={onRestore}/>);
  fireEvent.click(screen.getByRole('button',{name:'Minimize voice conversation'}));expect(onMinimize).toHaveBeenCalled();expect(actions.end).not.toHaveBeenCalled();
  view.rerender(<VoiceConversationPanel {...props} minimized onMinimize={onMinimize} onRestore={onRestore}/>);
  expect(screen.getByText('AI is speaking')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Restore voice conversation'}));expect(onRestore).toHaveBeenCalled();expect(actions.end).not.toHaveBeenCalled();
});

it('keeps the invitation and places measured audio feedback around the orb',()=>{
  Object.assign(model,{state:'listening',level:.6});const view=render(<VoiceConversationPanel {...props}/>);
  expect(screen.getByText('Ask a doubt. Talk it through.')).toBeInTheDocument();
  expect(view.container.querySelector('.facilitator-orb')).toHaveStyle({'--voice-energy':'0.6'});
  expect(view.container.querySelector('.voice-waveform')).toBeNull();expect(view.container.querySelectorAll('.voice-aura-line')).toHaveLength(6);
  expect(view.container.querySelector('.voice-control-tray')).toContainElement(screen.getByRole('button',{name:'Text chat'}));
  Object.assign(model,{state:'thinking',level:.6});view.rerender(<VoiceConversationPanel {...props}/>);
  expect(view.container.querySelector('.facilitator-orb')).toHaveStyle({'--voice-energy':'0'});
});
it('keeps call duration across voice states and minimization',()=>{
  vi.useFakeTimers();try{
    const view=render(<VoiceConversationPanel {...props}/>);
    expect(screen.queryByText('Your turn')).toBeNull();
    model.state='listening';view.rerender(<VoiceConversationPanel {...props}/>);
    act(()=>vi.advanceTimersByTime(42000));expect(screen.getByLabelText('Call duration 0:42')).toBeInTheDocument();
    model.state='speaking';view.rerender(<VoiceConversationPanel {...props} minimized/>);
    act(()=>vi.advanceTimersByTime(2000));view.rerender(<VoiceConversationPanel {...props}/>);
    expect(screen.getByLabelText('Call duration 0:44')).toBeInTheDocument();
    view.unmount();expect(vi.getTimerCount()).toBe(0);
  }finally{vi.useRealTimers();}
});

it('distinguishes listening and speaking with labels and offers separate stop and interrupt actions',()=>{
  model.state='listening';const view=render(<VoiceConversationPanel {...props}/>);
  expect(screen.getByRole('status')).toHaveTextContent('Listening to you');expect(screen.queryByRole('button',{name:'Stop speaking'})).toBeNull();
  model.state='speaking';view.rerender(<VoiceConversationPanel {...props}/>);
  expect(screen.getByRole('status')).toHaveTextContent('AI is speaking');
  fireEvent.click(screen.getByRole('button',{name:'Stop speaking'}));expect(actions.stopSpeaking).toHaveBeenCalled();expect(actions.end).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Interrupt and ask'}));expect(actions.interrupt).toHaveBeenCalled();
  view.rerender(<VoiceConversationPanel {...props} minimized/>);
  fireEvent.click(screen.getByRole('button',{name:'Stop speaking'}));expect(actions.stopSpeaking).toHaveBeenCalledTimes(2);
});

it('shows compaction as an interruptible loading state without ending the call',()=>{
  model.state='compacting';const {container}=render(<VoiceConversationPanel {...props}/>);
  expect(screen.getByRole('status')).toHaveTextContent('Compacting conversation');
  expect(container.querySelector('[data-voice-mode="loading"]')).not.toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Stop and ask'}));
  expect(actions.interrupt).toHaveBeenCalled();expect(actions.end).not.toHaveBeenCalled();
});
