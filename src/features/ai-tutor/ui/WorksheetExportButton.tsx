import React from 'react';
import { Download } from 'lucide-react';

interface WorksheetExportButtonProps {
  content: string;
  courseTitle?: string;
  lessonTitle?: string;
  className?: string;
}

const WorksheetExportButton: React.FC<WorksheetExportButtonProps> = ({
  content,
  courseTitle = 'Course',
  lessonTitle = 'Lesson',
  className = '',
}) => {
  const handleExport = () => {
    // Create a formatted document
    const documentContent = `
${courseTitle}
${lessonTitle}
Generated: ${new Date().toLocaleDateString()}

${content}
    `.trim();

    // Create a blob and download
    const blob = new Blob([documentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worksheet-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className={`p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ${className}`}
      title="Export worksheet"
    >
      <Download className="w-3 h-3" />
    </button>
  );
};

export default WorksheetExportButton;
