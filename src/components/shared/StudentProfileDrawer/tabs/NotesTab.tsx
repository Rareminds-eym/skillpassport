import React from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { AdmissionNote } from '../types';

interface NotesTabProps {
  admissionNotes: AdmissionNote[];
  loading: boolean;
  onAddNote: () => void;
}

const NotesTab: React.FC<NotesTabProps> = ({ admissionNotes, loading, onAddNote }) => {
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Admission Notes</h3>
        <button
          onClick={onAddNote}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PencilSquareIcon className="h-4 w-4 mr-2" />
          Add Note
        </button>
      </div>

      {admissionNotes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">No admission notes found</div>
          <button
            onClick={onAddNote}
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Add the first note
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {admissionNotes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary-600 text-sm font-medium">
                      {note.admin.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{note.admin}</p>
                    <p className="text-xs text-gray-500">{note.date}</p>
                  </div>
                </div>
              </div>
              <div className="ml-11">
                <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesTab;