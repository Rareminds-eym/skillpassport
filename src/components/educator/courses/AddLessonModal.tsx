import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Lesson, Resource } from '../../../types/educator/course';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lesson: Omit<Lesson, 'id' | 'order'>) => void;
  editingLesson?: Lesson | null;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingLesson,
}) => {
  const [lessonData, setLessonData] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    content: '',
    duration: '',
    resources: [],
  });
  const [isFormatting, setIsFormatting] = useState(false);

  // Update state when editingLesson changes
  React.useEffect(() => {
    if (editingLesson) {
      setLessonData({
        title: editingLesson.title || '',
        description: editingLesson.description || '',
        content: editingLesson.content || '',
        duration: editingLesson.duration || '',
        resources: editingLesson.resources || [],
      });
    } else {
      setLessonData({
        title: '',
        description: '',
        content: '',
        duration: '',
        resources: [],
      });
    }
  }, [editingLesson, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!lessonData.title || !lessonData.content) {
      return;
    }

    onSubmit({
      title: lessonData.title,
      description: lessonData.description,
      content: lessonData.content,
      duration: lessonData.duration || '0 mins',
      resources: lessonData.resources || [],
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setLessonData({
      title: '',
      description: '',
      content: '',
      duration: '',
      resources: [],
    });
  };

  // Simple text formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setIsFormatting(!isFormatting); // Trigger re-render
  };

  const getResourceIcon = (type: Resource['type']) => {
    const iconClass = 'h-4 w-4';
    switch (type) {
      case 'pdf':
        return <span className={iconClass}>📄</span>;
      case 'video':
        return <span className={iconClass}>🎥</span>;
      case 'image':
        return <span className={iconClass}>🖼️</span>;
      case 'youtube':
        return <span className={iconClass}>▶️</span>;
      case 'drive':
        return <span className={iconClass}>☁️</span>;
      case 'link':
        return <span className={iconClass}>🔗</span>;
      default:
        return <span className={iconClass}>📎</span>;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h2>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    value={lessonData.title}
                    onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Introduction to HTML"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={lessonData.duration}
                    onChange={(e) => setLessonData({ ...lessonData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 30 mins"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={lessonData.description}
                  onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief overview of the lesson"
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Content *
              </label>

              {/* Toolbar */}
              <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => formatText('bold')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Bold"
                >
                  <span className="font-bold text-sm">B</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('italic')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Italic"
                >
                  <span className="italic text-sm">I</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('underline')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Underline"
                >
                  <span className="underline text-sm">U</span>
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => formatText('insertUnorderedList')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Bullet List"
                >
                  <span className="text-sm">•</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('insertOrderedList')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Numbered List"
                >
                  <span className="text-sm">1.</span>
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => formatText('formatBlock', 'h2')}
                  className="px-2 py-1 hover:bg-gray-200 rounded transition-colors text-sm font-semibold"
                  title="Heading"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => formatText('formatBlock', 'h3')}
                  className="px-2 py-1 hover:bg-gray-200 rounded transition-colors text-sm font-semibold"
                  title="Subheading"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => formatText('formatBlock', 'p')}
                  className="px-2 py-1 hover:bg-gray-200 rounded transition-colors text-sm"
                  title="Paragraph"
                >
                  P
                </button>
              </div>

              {/* Content Editable Area */}
              <div
                contentEditable
                onInput={(e) => {
                  setLessonData({ ...lessonData, content: e.currentTarget.innerHTML });
                }}
                dangerouslySetInnerHTML={{ __html: lessonData.content || '' }}
                className="w-full min-h-[300px] max-h-[400px] overflow-y-auto px-4 py-3 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 prose prose-sm max-w-none"
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the toolbar to format your lesson content
              </p>
            </div>

            {/* Resources - Note about adding after lesson creation */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Lesson Resources</label>
              </div>

              {lessonData.resources && lessonData.resources.length > 0 ? (
                <div className="space-y-2">
                  {lessonData.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {getResourceIcon(resource.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {resource.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {resource.type.toUpperCase()}
                          {resource.size && ` • ${resource.size}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-sm text-gray-500">
                    {editingLesson
                      ? 'No resources added yet. Use the course view to add resources to this lesson.'
                      : 'Resources can be added after creating the lesson from the course modules view.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!lessonData.title || !lessonData.content}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {editingLesson ? 'Update Lesson' : 'Add Lesson'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddLessonModal;
