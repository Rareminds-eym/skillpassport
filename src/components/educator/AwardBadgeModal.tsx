import { useState, useEffect } from 'react';
import { X, Award, Search } from 'lucide-react';
import { fetchStudents, awardBadge, createBadge } from '../../services/badgeService';
import toast from 'react-hot-toast';

interface AwardBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const iconOptions = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💎', '👑', 
  '🎖️', '🏅', '🎯', '🔥', '📚', '🎓', '✨', '💪',
  '🚀', '🎨', '🎵', '⚽', '🏀', '🎭', '🔬', '💻'
];

const AwardBadgeModal = ({ isOpen, onClose, onSuccess }: AwardBadgeModalProps) => {
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState('');
  const [notes, setNotes] = useState('');
  
  // Badge fields
  const [newBadge, setNewBadge] = useState({
    name: '',
    icon: '🏆',
    description: '',
    color: '#3B82F6'
  });
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await fetchStudents();
      console.log('📚 Loaded students:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAward = async () => {
    if (!selectedStudent || !newBadge.name || !newBadge.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const createdBadge = await createBadge(newBadge);
      await awardBadge(createdBadge.id, selectedStudent, notes);
      toast.success('Badge created and awarded successfully!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating and awarding badge:', error);
      toast.error('Failed to create and award badge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent('');
    setNotes('');
    setNewBadge({ name: '', icon: '🏆', description: '', color: '#3B82F6' });
    setSearchTerm('');
    onClose();
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Award Badge to Student</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Select Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student <span className="text-red-500">*</span>
            </label>
            {loading && students.length === 0 ? (
              <div className="text-sm text-gray-500 py-2">Loading students...</div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Choose a student...</option>
                  {filteredStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
                {students.length === 0 && !loading && (
                  <p className="mt-2 text-sm text-gray-500">No students found in your institution</p>
                )}
              </>
            )}
          </div>

          {/* Create Badge Section */}
          <div className="space-y-4 border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  placeholder="Enter badge name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Icon
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{newBadge.icon}</span>
                      <span className="text-gray-700">Select icon</span>
                    </div>
                    <span className="text-sm text-gray-500">Click to change</span>
                  </button>
                  
                  {showIconPicker && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-2">
                        {iconOptions.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => {
                              setNewBadge({ ...newBadge, icon });
                              setShowIconPicker(false);
                            }}
                            className={`text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors ${
                              newBadge.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  rows={3}
                  placeholder="Describe what this badge represents..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add any notes about this award..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateAndAward}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create & Award Badge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwardBadgeModal;
