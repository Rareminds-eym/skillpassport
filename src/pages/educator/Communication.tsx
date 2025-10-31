import { useState } from 'react';

const Communication = () => {
  const [announcement, setAnnouncement] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSendAnnouncement = () => {
    if (announcement.trim()) {
      alert(`Announcement sent: ${announcement}`);
      setAnnouncement('');
    }
  };

  const handleSendFeedback = () => {
    if (feedback.trim()) {
      alert(`Feedback sent: ${feedback}`);
      setFeedback('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Communication & Collaboration</h1>

      {/* Announcements */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Announcements</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Type announcement..."
          />
          <button onClick={handleSendAnnouncement} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
            Send
          </button>
        </div>
        <ul className="space-y-2">
          <li className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">Submit project by Friday</li>
          <li className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">School event on Monday</li>
        </ul>
      </div>

      {/* Direct Feedback */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Feedback on Activity</h2>
        <div className="flex gap-3 mb-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Provide feedback to student..."
          />
        </div>
        <button onClick={handleSendFeedback} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Send Feedback
        </button>
      </div>

      {/* Student Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Notifications</h2>
        <ul className="space-y-2">
          <li className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 border border-green-200">
            ✓ Activity verified for John Doe
          </li>
          <li className="text-sm text-gray-700 bg-red-50 rounded-lg p-3 border border-red-200">
            ✗ Activity rejected for Priya S.
          </li>
        </ul>
      </div>

      {/* Internal Chat (Future) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Chat (Coming Soon)</h2>
        <p className="text-sm text-gray-600">Optional discussion board for each class.</p>
      </div>
    </div>
  );
};

export default Communication;
