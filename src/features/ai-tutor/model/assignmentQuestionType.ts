const labels: Record<string,string> = {
  multiple_choice: 'Multiple choice', fill_blank: 'Fill in the blank',
  fill_in_blank: 'Fill in the blank', short_answer: 'Short answer', descriptive: 'Descriptive',
};

export function assignmentQuestionType(questions: Array<{kind?:string}> = [], templateType?:string):string {
  const types = new Set(questions.map(question=>question.kind && labels[question.kind]).filter(Boolean));
  if(types.size>1)return 'Mixed question types';
  if(types.size===1 && questions.every(question=>question.kind && labels[question.kind]))return [...types][0] as string;
  if(questions.some(question=>question.kind))return 'Question type unavailable';
  return templateType==='comprehensive'?'Mixed question types':labels[templateType ?? ''] ?? 'Question type unavailable';
}
