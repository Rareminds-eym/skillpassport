import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';

type Quiz = { id: string; version: string; slideNumber: number; answers: Record<number, number>; questions: { question: string; options: string[] }[] };

export function SlideQuiz({ courseId, lessonId, resourceId, slide, ready }: { courseId?: string; lessonId?: string; resourceId?: string; slide: number; ready: boolean }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [fullscreenTarget, setFullscreenTarget] = useState<Element | null>(() => typeof document === 'undefined' ? null : document.fullscreenElement);
  useEffect(() => {
    const update = () => setFullscreenTarget(document.fullscreenElement);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  useEffect(() => {
    if (!courseId || !lessonId || !resourceId) return;
    let cancelled = false;
    setError(false);
    const params = new URLSearchParams({ courseId, lessonId, resourceId });
    ssoClient.fetch(`/api/storage/course-slide-quizzes?${params}`).then(async response => {
      if (!response.ok) throw new Error('Quiz request failed');
      return response.json() as Promise<{ quizzes: Quiz[] }>;
    }).then(data => { if (!cancelled) setQuizzes(data.quizzes || []); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [courseId, lessonId, resourceId, attempt]);
  const quiz = quizzes.find(item => item.slideNumber === slide);
  useEffect(() => {
    setOpen(false);
    setAnswers(quiz?.answers || {});
    setQuestionIndex(0);
    setSaveError('');
    if (ready && quiz && !shown.includes(slide)) {
      setShown(previous => [...previous, slide]);
      setOpen(true);
    }
  }, [slide, ready, quiz]); // Shown is checked when entering a slide or receiving its quiz.
  const saveAnswers = async () => {
    if (!quiz || !courseId || !lessonId || !resourceId || saving) return;
    const firstUnanswered = quiz.questions.findIndex((_, index) => answers[index] === undefined);
    if (firstUnanswered !== -1) {
      setQuestionIndex(firstUnanswered);
      setSaveError('Please answer every question before saving.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const params = new URLSearchParams({ courseId, lessonId, resourceId });
      const response = await ssoClient.fetch(`/api/storage/course-slide-quizzes?${params}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: quiz.id, version: quiz.version, answers }) });
      if (response.status === 409) throw new Error('These questions changed. Reload the course to answer the latest version.');
      if (!response.ok) throw new Error('Could not save your answers. Please try again.');
      setQuizzes(previous => previous.map(item => item.id === quiz.id ? { ...item, answers } : item));
      setOpen(false);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Could not save your answers. Please try again.'); }
    finally { setSaving(false); }
  };
  if (!ready) return null;
  return <>
    {error && <div role="status" className="absolute left-3 top-3 z-20 rounded bg-white p-2 text-xs text-gray-700 shadow">Questions could not be loaded. <button type="button" className="text-indigo-700 underline" onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
    {quiz && !open && <button type="button" onClick={() => setOpen(true)} aria-label={`Open slide ${slide} quiz, ${quiz.questions.length} ${quiz.questions.length === 1 ? 'question' : 'questions'}`} className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
      <HelpCircle size={16} aria-hidden="true" />
      <span>Quiz</span><span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] tabular-nums">{quiz.questions.length}</span>
    </button>}
    {quiz && open && createPortal(<div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/50 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="slide-quiz-title" onKeyDown={event => { if (event.key === 'Escape' && !saving) setOpen(false); }} className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 text-gray-900 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Slide {slide} · Practice</p><h2 id="slide-quiz-title" className="mt-1 text-xl font-semibold">Check your understanding</h2><p className="mt-1 text-sm text-gray-500">No pass or fail. Your answers are saved when you finish.</p></div><button autoFocus type="button" disabled={saving} onClick={() => setOpen(false)} aria-label="Close slide questions" className="rounded-md px-2 text-xl text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">×</button></div>
        <div className="mt-6 flex items-center justify-between text-xs font-medium text-gray-500"><span>Question {questionIndex + 1} of {quiz.questions.length}</span><span>{Object.keys(answers).length} answered</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((questionIndex + 1) / quiz.questions.length) * 100}%` }} /></div>
        {quiz.questions[questionIndex] && <fieldset disabled={saving} className="mt-6"><legend className="text-base font-semibold leading-relaxed text-gray-900">{quiz.questions[questionIndex].question}</legend><div className="mt-4 space-y-2">{quiz.questions[questionIndex].options.map((option, oi) => <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${answers[questionIndex] === oi ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-gray-50'}`}><input type="radio" name={`slide-${slide}-question-${questionIndex}`} checked={answers[questionIndex] === oi} onChange={() => setAnswers(previous => ({ ...previous, [questionIndex]: oi }))} className="h-4 w-4 accent-indigo-600" /><span>{option}</span></label>)}</div></fieldset>}
        {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p>}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-800">Close without saving</button><div className="flex gap-2"><button type="button" disabled={saving || questionIndex === 0} onClick={() => setQuestionIndex(index => index - 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40">Previous</button>{questionIndex < quiz.questions.length - 1 ? <button type="button" disabled={answers[questionIndex] === undefined} onClick={() => setQuestionIndex(index => index + 1)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button> : <button type="button" disabled={saving || answers[questionIndex] === undefined} onClick={() => void saveAnswers()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Saving...' : 'Save answers'}</button>}</div></div>
      </section>
    </div>, fullscreenTarget || document.body)}
  </>;
}
