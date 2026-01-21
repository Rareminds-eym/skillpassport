import React, { useState } from 'react';
import { XMarkIcon, DocumentTextIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { Download, FileText, CheckCircle } from 'lucide-react';
import type { Transcript } from '../../../../types/college';

interface TranscriptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    data: Partial<Transcript>
  ) => Promise<{ success: boolean; error?: string; data?: Transcript }>;
  students: Array<{ id: string; name: string; roll_number: string }>;
  departments: Array<{ id: string; name: string }>;
}

const TranscriptForm: React.FC<TranscriptFormProps> = ({
  isOpen,
  onClose,
  onGenerate,
  students,
  departments,
}) => {
  const [formData, setFormData] = useState<Partial<Transcript>>({
    student_id: '',
    type: 'provisional',
    semester_from: 1,
    semester_to: 8,
    include_qr: true,
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTranscript, setGeneratedTranscript] = useState<Transcript | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.student_id) {
      setError('Please select a student');
      setLoading(false);
      return;
    }

    const result = await onGenerate(formData);

    if (result.success && result.data) {
      setGeneratedTranscript(result.data);
    } else {
      setError(result.error || 'Failed to generate transcript');
    }

    setLoading(false);
  };

  const handleDownload = () => {
    alert('Transcript PDF will be downloaded');
  };

  const handleReset = () => {
    setGeneratedTranscript(null);
    setFormData({
      student_id: '',
      type: 'provisional',
      semester_from: 1,
      semester_to: 8,
      include_qr: true,
      status: 'draft',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Generate Transcript</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {generatedTranscript ? (
          // Success View
          <div className="p-6 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-900 mb-2">
                Transcript Generated Successfully!
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Verification ID:{' '}
                <code className="bg-green-100 px-2 py-1 rounded">
                  {generatedTranscript.verification_id}
                </code>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Generate Another
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Transcript Details</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Type:</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {generatedTranscript.type}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Semester Range:</dt>
                  <dd className="font-medium text-gray-900">
                    Semester {generatedTranscript.semester_from} - {generatedTranscript.semester_to}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">QR Verification:</dt>
                  <dd className="font-medium text-gray-900">
                    {generatedTranscript.include_qr ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status:</dt>
                  <dd>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      {generatedTranscript.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          // Form View
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a student...</option>
                {Array.isArray(students) &&
                  students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.roll_number} - {student.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transcript Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    name="type"
                    value="provisional"
                    checked={formData.type === 'provisional'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Provisional</p>
                    <p className="text-xs text-gray-600">For current students</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    name="type"
                    value="final"
                    checked={formData.type === 'final'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Final</p>
                    <p className="text-xs text-gray-600">For graduates</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Semester <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.semester_from}
                  onChange={(e) =>
                    setFormData({ ...formData, semester_from: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Semester <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.semester_to}
                  onChange={(e) =>
                    setFormData({ ...formData, semester_to: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.include_qr}
                  onChange={(e) => setFormData({ ...formData, include_qr: e.target.checked })}
                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <QrCodeIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Include QR Verification</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Embed a unique QR code for online verification of the transcript
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">What will be included:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>All semester courses and grades</li>
                    <li>Credits earned per semester</li>
                    <li>SGPA for each semester</li>
                    <li>Cumulative CGPA</li>
                    <li>Institutional seal and signatures</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Transcript'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TranscriptForm;
