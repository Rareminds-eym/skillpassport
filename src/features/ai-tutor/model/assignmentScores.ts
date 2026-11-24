type Result = {
  status: string; total_marks: number; maximum_marks: number; reviewed_by?: string | null;
  question_results?: { ai?: unknown; educator_override?: { marks: number } };
};

export function assignmentScores(result: Result) {
  if (result.status !== 'released') return null;
  let original: unknown = result.question_results?.ai;
  // Older manual releases wrapped the previous evaluation in another `ai` object.
  for (let depth = 0; depth < 5 && original && !Array.isArray(original); depth++) {
    original = (original as { ai?: unknown }).ai;
  }
  const questions = Array.isArray(original) ? original : [];
  const reviewed = !!result.reviewed_by || !!result.question_results?.educator_override;
  const ai = questions.length && questions.every(q => typeof q.marks === 'number' && Number.isFinite(q.marks))
    ? questions.reduce((sum, q) => sum + q.marks, 0)
    : reviewed ? null : result.total_marks;
  return { ai, educator: reviewed ? result.total_marks : null, final: result.total_marks, maximum: result.maximum_marks };
}
