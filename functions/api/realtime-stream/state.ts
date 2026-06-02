interface BroadcastEvent {
  channel: string;
  eventType: string;
  payload: Record<string, unknown>;
  from: string;
  timestamp: string;
}

interface PresenceInfo {
  userId: string;
  userName: string;
  userType: string;
  status: string;
  lastSeen: string;
  conversationId?: string;
}

const broadcastBuffer: BroadcastEvent[] = [];
const presenceState = new Map<string, Map<string, PresenceInfo>>();
let presenceVersion = 0;

export function addBroadcast(event: Omit<BroadcastEvent, 'timestamp'>): void {
  broadcastBuffer.push({ ...event, timestamp: new Date().toISOString() });
  if (broadcastBuffer.length > 1000) {
    broadcastBuffer.splice(0, 500);
  }
}

export function drainBroadcasts(channel: string): BroadcastEvent[] {
  const events: BroadcastEvent[] = [];
  for (let i = broadcastBuffer.length - 1; i >= 0; i--) {
    if (broadcastBuffer[i].channel === channel) {
      events.push(broadcastBuffer.splice(i, 1)[0]);
    }
  }
  return events.reverse();
}

export function joinPresence(channelName: string, info: PresenceInfo): void {
  if (!presenceState.has(channelName)) {
    presenceState.set(channelName, new Map());
  }
  presenceState.get(channelName)!.set(info.userId, info);
  presenceVersion++;
}

export function updatePresenceHeartbeat(channelName: string, userId: string, status: string): void {
  const channel = presenceState.get(channelName);
  if (!channel) return;
  const existing = channel.get(userId);
  if (existing) {
    existing.status = status;
    existing.lastSeen = new Date().toISOString();
    presenceVersion++;
  }
}

export function leavePresence(channelName: string, userId: string): void {
  const channel = presenceState.get(channelName);
  if (channel) {
    channel.delete(userId);
    if (channel.size === 0) {
      presenceState.delete(channelName);
    }
    presenceVersion++;
  }
}

export function getPresenceVersion(): number {
  return presenceVersion;
}

export function getPresenceSnapshot(channelName: string): PresenceInfo[] {
  const channel = presenceState.get(channelName);
  if (!channel) return [];

  const staleTimeout = 120_000; // 2 minutes without heartbeat = offline
  const now = Date.now();
  const active: PresenceInfo[] = [];

  for (const [id, info] of channel) {
    const lastSeen = new Date(info.lastSeen).getTime();
    if (now - lastSeen > staleTimeout) {
      channel.delete(id);
    } else {
      active.push(info);
    }
  }

  if (channel.size === 0) {
    presenceState.delete(channelName);
  }

  return active;
}
