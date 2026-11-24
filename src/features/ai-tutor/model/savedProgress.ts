export function summarizeAssignmentProgress(rows: any[]) {
  let submitted = 0, released = 0, percentage = 0;
  const gaps = new Map<string, { question: string; position: number; skills: string[]; marks: number; maximum: number; responses: number }>();
  for (const row of rows) {
    const submission = row.submissions?.[0], result = submission?.results?.[0];
    if (submission) submitted++;
    if (result?.status !== 'released') continue;
    released++;
    percentage += result.maximum_marks > 0 ? result.total_marks / result.maximum_marks * 100 : 0;
    for (const review of result.question_results?.review || []) {
      const question = row.assignment.content.questions.find((q: any) => q.id === review.questionId);
      if (!question) continue;
      const key = `${row.assignment.id}:${question.id}`;
      const gap = gaps.get(key) || { question: question.prompt, position: question.position ?? row.assignment.content.questions.findIndex((q: any) => q.id === question.id) + 1, skills: question.skills || [], marks: 0, maximum: 0, responses: 0 };
      gap.marks += review.marks; gap.maximum += question.maxMarks; gap.responses++;
      gaps.set(key, gap);
    }
  }
  return { assigned: rows.length, submitted, released, average: released ? Math.round(percentage / released) : null,
    gaps: [...gaps.values()].filter(g => g.marks < g.maximum).sort((a, b) => a.marks / a.maximum - b.marks / b.maximum) };
}
