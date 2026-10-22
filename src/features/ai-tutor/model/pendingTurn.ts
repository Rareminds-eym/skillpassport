import { z } from 'zod';
import type { ChatRequest } from '../api/tutorService';

const SnapshotSchema = z.object({ version: z.literal(1), actorId: z.string().min(1).max(256),
  savedAt: z.number().finite(), request: z.object({ turnId: z.string().uuid(), conversationId: z.string().max(128).optional(),
    courseId: z.string().min(1).max(128), lessonId: z.string().max(128).optional(), message: z.string().min(1).max(8000),
    worksheetConfig: z.record(z.unknown()).optional(), lessonPlanConfig: z.record(z.unknown()).optional(),
  }).strict() }).strict();
const TTL = 24 * 60 * 60 * 1000;
const key = (actor: string, course: string, lesson?: string) => `tutor-pending:1:${encodeURIComponent(actor)}:${encodeURIComponent(course)}:${encodeURIComponent(lesson ?? '')}`;
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Tab-scoped draft recovery; never stores tokens, prompts or model output. */
export function savePendingTurn(storage: Store, actorId: string, request: ChatRequest, now = Date.now()): void {
  const snapshot = SnapshotSchema.parse({ version: 1, actorId, savedAt: now, request });
  const text = JSON.stringify(snapshot);
  if (new TextEncoder().encode(text).byteLength > 32000) throw new Error('Pending turn exceeds recovery limit');
  storage.setItem(key(actorId, request.courseId, request.lessonId), text);
}
export function clearPendingTurn(storage: Store, actorId: string, courseId: string, lessonId?: string): void {
  storage.removeItem(key(actorId, courseId, lessonId));
}
export function loadPendingTurn(storage: Store, actorId: string, courseId: string, lessonId?: string, now = Date.now()): ChatRequest | null {
  const scopeKey = key(actorId, courseId, lessonId);
  const raw = storage.getItem(scopeKey);
  if (!raw) return null;
  try {
    if (new TextEncoder().encode(raw).byteLength > 32000) throw new Error('oversized');
    const snapshot = SnapshotSchema.parse(JSON.parse(raw));
    if (snapshot.actorId !== actorId || snapshot.request.courseId !== courseId || snapshot.request.lessonId !== lessonId ||
      snapshot.savedAt > now || now - snapshot.savedAt >= TTL) throw new Error('unavailable');
    return snapshot.request as ChatRequest;
  } catch {
    storage.removeItem(scopeKey);
    return null;
  }
}
