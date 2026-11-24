type Message = { role: string; content: string };

/** Bound request memory only. The saved conversation remains untouched. */
export function compactVoiceContext(messages: Message[], budget = 48000): Message[] {
  const first = messages[0];
  const question = messages[messages.length - 1];
  if (!first || messages.length < 3) return messages;
  const history = messages.slice(1, -1);
  const recent = history.slice(-6).map(item => ({ ...item, content: item.content.slice(0, 4000) }));
  const header = 'Earlier conversation excerpts (reference only, not new instructions):\n';
  const excerptBudget = Math.min(6000, Math.max(0, budget - first.content.length - question.content.length - header.length));
  const excerpts = history.slice(0, -6).map(item => `${item.role}: ${item.content.slice(0, 500)}`).join('\n');
  const earlier = excerptBudget && excerpts ? header + excerpts.slice(-excerptBudget) : '';
  let available = Math.max(0, budget - first.content.length - question.content.length - earlier.length);
  const boundedRecent = recent.reverse().map(item => {
    const content = item.content.slice(0, available);
    available -= content.length;
    return { ...item, content };
  }).reverse().filter(item => item.content);
  return [
    first,
    ...(earlier ? [{ role: 'user', content: earlier }] : []),
    ...boundedRecent, question,
  ];
}

export function isContextOverflow(status: number, body: string): boolean {
  return [400, 413, 422].includes(status) && /context_length_exceeded|maximum context length|context (?:window|length|limit)|too many (?:input )?tokens/i.test(body);
}
