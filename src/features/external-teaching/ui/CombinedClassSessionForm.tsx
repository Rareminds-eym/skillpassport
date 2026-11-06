/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { createCombinedSession, listApprovedCombinedGroups, type ApprovedCombinedGroup, type CombinedSessionsResult } from '../api/teachingApi';
import { approvedClassLabel, groupTimeSlots } from '../model/combinedClass';

interface Props {
  onClose: () => void;
  collegeId: string | null;
  onCreated: (result: CombinedSessionsResult) => void;
}

const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const keyOf = (g: ApprovedCombinedGroup) => `${g.groupId}|${g.courseId}`;

/**
 * Schedules one combined session for a combined group that SP Admin has approved (trainer, course and classes are fixed by SP Admin).
 * It is shown inside the shared Create Attendance Session modal when the session type is "Combined Class", and is mounted only then.
 */
const CombinedClassSessionForm = ({ onClose, collegeId, onCreated }: Props) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [remarks, setRemarks] = useState('');
  const [groups, setGroups] = useState<ApprovedCombinedGroup[]>([]);
  const [groupKey, setGroupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(crypto.randomUUID());

  // The approved groups whose classes are all mapped, for the chosen date.
  useEffect(() => {
    let alive = true;
    setGroups([]); setGroupKey('');
    if (collegeId && date) {
      setLoading(true); setError('');
      listApprovedCombinedGroups({ collegeId, date })
        .then(rows => { if (alive) setGroups(rows || []); })
        .catch(e => { if (alive) setError(e.message); })
        .finally(() => { if (alive) setLoading(false); });
    }
    return () => { alive = false; };
  }, [collegeId, date]);

  const group = groups.find(g => keyOf(g) === groupKey);
  const slots = group ? groupTimeSlots(group) : [];
  // Same rule as the single-class session form: with assigned slots the time is chosen from them, not typed.
  useEffect(() => {
    if (!group) return;
    const assigned = groupTimeSlots(group);
    if (assigned.length === 1) { setStartTime(assigned[0].start_time); setEndTime(assigned[0].end_time); }
    else if (assigned.length > 1) { setStartTime(''); setEndTime(''); }
  }, [groupKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const timesOk = Boolean(startTime && endTime && endTime > startTime);
  const canCreate = Boolean(group && date && timesOk && !saving);

  const create = async () => {
    if (!group) return;
    setSaving(true); setError('');
    try {
      const result = await createCombinedSession({
        approvedGroupId: group.groupId,
        mappings: group.classes.map(c => ({ mappingId: c.mappingId, mappingVersion: c.mappingVersion })),
        courseId: group.courseId, date, startTime, endTime, requestId: requestId.current,
        room: room.trim() || undefined, remarks: remarks.trim() || undefined,
      });
      requestId.current = crypto.randomUUID();
      onCreated(result);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not create the combined session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="combined-class-form">
      <div className="max-h-[70vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Schedule a combined group approved by SP Admin. Each class keeps its own students and attendance.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700">Session date
              <input aria-label="Session date" type="date" className={field} value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-gray-700">Start Time
                <input aria-label="Start Time" type="time" className={field} value={startTime} disabled={slots.length > 0} onChange={e => setStartTime(e.target.value)} />
              </label>
              <label className="text-sm font-medium text-gray-700">End Time
                <input aria-label="End Time" type="time" className={field} value={endTime} disabled={slots.length > 0} onChange={e => setEndTime(e.target.value)} />
              </label>
            </div>
          </div>
          {slots.length > 1 && (
            <label className="block text-sm font-medium text-gray-700">Assigned time slot
              <select aria-label="Assigned time slot" className={field}
                value={slots.findIndex(s => s.start_time === startTime && s.end_time === endTime)}
                onChange={e => { const slot = slots[Number(e.target.value)]; if (slot) { setStartTime(slot.start_time); setEndTime(slot.end_time); } }}>
                <option value={-1}>Select assigned time slot</option>
                {slots.map((s, i) => <option key={i} value={i}>{s.start_time} - {s.end_time}</option>)}
              </select>
            </label>
          )}
          {slots.length > 0 && <p className="text-xs text-gray-500">The time comes from the slots SP Admin assigned to this group.</p>}
          {startTime && endTime && !timesOk && <p className="text-sm text-red-600">End time must be after start time</p>}

          <label className="block text-sm font-medium text-gray-700">Approved combined group
            <select aria-label="Approved combined group" className={field} value={groupKey} onChange={e => setGroupKey(e.target.value)}
              disabled={!date || loading || !groups.length}>
              <option value="">{!date ? 'Choose a session date first' : loading ? 'Loading approved groups...' : 'Select an approved group'}</option>
              {groups.map(g => <option key={keyOf(g)} value={keyOf(g)}>{g.courseTitle} - {g.staffName} ({g.classes.length} classes)</option>)}
            </select>
          </label>
          {date && !loading && !groups.length && !error && (
            <p className="text-sm text-amber-700">No approved combined group is available on this date. SP Admin defines combined groups in the educator mapping screen.</p>
          )}
          {group && (
            <div className="rounded-lg border bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-800">Classes in this group</p>
              <ul className="list-disc pl-5 text-gray-700">
                {group.classes.map(c => <li key={c.mappingId}>{approvedClassLabel(c)}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700">Room (optional)
              <input aria-label="Room" className={field} maxLength={50} value={room} onChange={e => setRoom(e.target.value)} />
            </label>
            <label className="text-sm font-medium text-gray-700">Remarks (optional)
              <input aria-label="Remarks" className={field} maxLength={2000} value={remarks} onChange={e => setRemarks(e.target.value)} />
            </label>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex gap-3 justify-end">
          <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={onClose}>Cancel</button>
          <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50" disabled={!canCreate} onClick={create}>
            {saving ? 'Creating...' : 'Create combined session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombinedClassSessionForm;
