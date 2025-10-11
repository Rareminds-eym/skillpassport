import React, { useState } from 'react';
import {
  PlusIcon,
  EllipsisVerticalIcon,
  UserIcon,
  StarIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { candidates, requisitions } from '../../data/sampleData';

const KanbanColumn = ({ title, count, color, candidates, onCandidateMove, onCandidateView, selectedCandidates, onToggleSelect, onSendEmail }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onMove={onCandidateMove}
            onView={onCandidateView}
            isSelected={selectedCandidates.includes(candidate.id)}
            onToggleSelect={onToggleSelect}
            onSendEmail={onSendEmail}
          />
        ))}
        
        {showAddForm && (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Add candidate</span>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <button className="w-full text-left text-sm text-primary-600 hover:text-primary-700">
              + Add from talent pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidateCard = ({ candidate, onMove, onView, isSelected, onToggleSelect, onSendEmail }) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const stages = [
    'sourced',
    'screened',
    'interview_1',
    'interview_2', 
    'offer',
    'hired'
  ];

  const stageLabels = {
    sourced: 'Sourced',
    screened: 'Screened',
    interview_1: 'Interview 1',
    interview_2: 'Interview 2',
    offer: 'Offer',
    hired: 'Hired'
  };

  return (
    <div className={`bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
      isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(candidate.id)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1 mr-2"
          />
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
            <p className="text-xs text-gray-500">{candidate.dept}</p>
            <p className="text-xs text-gray-400">{candidate.college}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-xs font-medium">{candidate.ai_score_overall}</span>
          <div className="relative">
            <button 
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>
            
            {showMoveMenu && (
              <div className="absolute right-0 top-6 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button 
                    onClick={() => onView(candidate)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => onSendEmail(candidate)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Send Email
                  </button>
                  <button 
                    onClick={() => alert(`📞 Scheduling call with ${candidate.name}...\n\nThis would open a calendar interface to schedule a phone/video call.`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Schedule Call
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  {stages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => onMove(candidate.id, stage)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Move to {stageLabels[stage]}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50">
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-2">
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 2).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 2 && (
            <span className="text-xs text-gray-500">+{candidate.skills.length - 2}</span>
          )}
        </div>
      </div>

      {/* Next Action */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {candidate.last_updated && `Updated ${new Date(candidate.last_updated).toLocaleDateString()}`}
        </span>
        <button className="text-primary-600 hover:text-primary-700 font-medium">
          Next Action
        </button>
      </div>
    </div>
  );
};

const Pipelines = ({ onViewProfile }) => {
  const [selectedJob, setSelectedJob] = useState(requisitions[0]?.id || null);
  const [pipelineData, setPipelineData] = useState({
    sourced: [candidates[0], candidates[1]],
    screened: [candidates[2]],
    interview_1: [],
    interview_2: [],
    offer: [],
    hired: []
  });
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const selectedJobDetails = requisitions.find(job => job.id === selectedJob);

  const stages = [
    { key: 'sourced', label: 'Sourced', color: 'bg-gray-400' },
    { key: 'screened', label: 'Screened', color: 'bg-blue-400' },
    { key: 'interview_1', label: 'Interview 1', color: 'bg-yellow-400' },
    { key: 'interview_2', label: 'Interview 2', color: 'bg-orange-400' },
    { key: 'offer', label: 'Offer', color: 'bg-green-400' },
    { key: 'hired', label: 'Hired', color: 'bg-emerald-400' }
  ];

  const handleCandidateMove = (candidateId, newStage) => {
    setPipelineData(prev => {
      const newData = { ...prev };
      
      // Find and remove candidate from current stage
      let candidateToMove = null;
      Object.keys(newData).forEach(stage => {
        newData[stage] = newData[stage].filter(candidate => {
          if (candidate.id === candidateId) {
            candidateToMove = candidate;
            return false;
          }
          return true;
        });
      });

      // Add candidate to new stage
      if (candidateToMove && newData[newStage]) {
        newData[newStage].push(candidateToMove);
      }

      return newData;
    });
  };

  const getTotalCandidates = () => {
    return Object.values(pipelineData).reduce((total, stage) => total + stage.length, 0);
  };

  const getConversionRate = (fromStage, toStage) => {
    const fromCount = pipelineData[fromStage]?.length || 0;
    const toCount = pipelineData[toStage]?.length || 0;
    if (fromCount === 0) return 0;
    return Math.round((toCount / fromCount) * 100);
  };

  const handleBulkEmail = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);
    
    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }
    
    const emailSubject = `Update regarding ${selectedJobDetails?.title || 'Job Application'}`;
    const emailBody = `Dear Candidate,\n\nWe would like to update you on your application status for the position of ${selectedJobDetails?.title || 'the role'}.\n\nBest regards,\nRecruitment Team`;
    
    // Simulate sending emails
    alert(`📧 Bulk Email Sent!\n\nRecipients: ${candidateNames.join(', ')}\nSubject: ${emailSubject}\n\nEmails have been queued for delivery.`);
    
    setSelectedCandidates([]);
    setShowBulkActions(false);
  };

  const handleBulkWhatsApp = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);
    
    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }
    
    const message = `Hi! This is an update regarding your application for ${selectedJobDetails?.title || 'the position'}. We will be in touch soon with next steps.`;
    
    // Simulate sending WhatsApp messages
    alert(`📱 WhatsApp Messages Sent!\n\nRecipients: ${candidateNames.join(', ')}\nMessage: "${message}"\n\nMessages have been delivered.`);
    
    setSelectedCandidates([]);
    setShowBulkActions(false);
  };

  const handleAssignInterviewer = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);
    
    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }
    
    const interviewer = prompt('Enter interviewer name:', 'Sarah Johnson');
    if (interviewer) {
      alert(`👤 Interviewer Assigned!\n\nCandidates: ${candidateNames.join(', ')}\nAssigned to: ${interviewer}\n\nInterview invitations will be sent shortly.`);
      
      setSelectedCandidates([]);
      setShowBulkActions(false);
    }
  };

  const handleBulkReject = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);
    
    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }
    
    const confirmed = confirm(`⚠️ Bulk Reject Confirmation\n\nAre you sure you want to reject ${candidateNames.length} candidate(s)?\n\n${candidateNames.join(', ')}\n\nThis action cannot be undone.`);
    
    if (confirmed) {
      const reason = prompt('Enter rejection reason (optional):', 'Thank you for your interest. We have decided to move forward with other candidates.');
      
      // Remove candidates from pipeline
      setPipelineData(prev => {
        const newData = { ...prev };
        selectedCandidates.forEach(candidateId => {
          Object.keys(newData).forEach(stage => {
            newData[stage] = newData[stage].filter(candidate => candidate.id !== candidateId);
          });
        });
        return newData;
      });
      
      alert(`❌ Candidates Rejected\n\n${candidateNames.join(', ')} have been removed from the pipeline.\n\nRejection notifications will be sent.`);
      
      setSelectedCandidates([]);
      setShowBulkActions(false);
    }
  };

  const handleExportPipeline = () => {
    const allCandidates = Object.entries(pipelineData).flatMap(([stage, candidates]) => 
      candidates.map(candidate => ({ ...candidate, stage }))
    );
    
    if (allCandidates.length === 0) {
      alert('No candidates in pipeline to export');
      return;
    }
    
    const csvContent = [
      // CSV Header
      'Name,Department,College,Location,Stage,AI Score,Skills,Last Updated',
      // CSV Data
      ...allCandidates.map(candidate => 
        `"${candidate.name}","${candidate.dept}","${candidate.college}","${candidate.location}","${candidate.stage}",${candidate.ai_score_overall},"${candidate.skills.join('; ')}","${new Date(candidate.last_updated).toLocaleDateString()}"`
      )
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pipeline_${selectedJobDetails?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`📊 Pipeline Exported!\n\nFile: pipeline_${selectedJobDetails?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv\n\n${allCandidates.length} candidates exported successfully.`);
  };

  const handleAddCandidates = () => {
    alert(`👥 Add Candidates\n\nThis would open a modal to:\n• Search and select from talent pool\n• Import candidates from other jobs\n• Add new candidates directly\n\nFeature coming soon!`);
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => {
      const newSelection = prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleSendEmail = (candidate) => {
    const subject = `Update regarding ${selectedJobDetails?.title || 'your application'}`;
    const message = `Dear ${candidate.name},\n\nWe wanted to provide you with an update on your application for the ${selectedJobDetails?.title || 'position'}.\n\nYour application is currently in the review process and we will be in touch with next steps soon.\n\nBest regards,\nRecruitment Team`;
    
    alert(`📧 Email Sent to ${candidate.name}!\n\nSubject: ${subject}\n\nMessage: "${message}"\n\nEmail has been delivered successfully.`);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Pipeline Management</h1>
              {selectedJobDetails && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedJobDetails.title} • {selectedJobDetails.location} • {selectedJobDetails.openings} openings
                </p>
              )}
            </div>
            <select 
              value={selectedJob || ''}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {requisitions.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.location})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">{getTotalCandidates()}</span> candidates in pipeline
            </div>
            <div>
              <span className="font-medium">{selectedJobDetails?.owner || 'Unassigned'}</span> owner
            </div>
            <div>
              <span className="font-medium">
                {selectedJobDetails?.created_date ? 
                  Math.floor((new Date() - new Date(selectedJobDetails.created_date)) / (1000 * 60 * 60 * 24)) 
                  : 0
                } days
              </span> aging
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <span className="text-gray-600">Conversion:</span>
            <span className="ml-2 font-medium">
              Sourced → Screened ({getConversionRate('sourced', 'screened')}%)
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">
              Interview → Offer ({getConversionRate('interview_1', 'offer')}%)
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">
              Offer → Hired ({getConversionRate('offer', 'hired')}%)
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-6 h-full">
          {stages.map(stage => (
            <KanbanColumn
              key={stage.key}
              title={stage.label}
              count={pipelineData[stage.key]?.length || 0}
              color={stage.color}
              candidates={pipelineData[stage.key] || []}
              onCandidateMove={handleCandidateMove}
              onCandidateView={onViewProfile}
              selectedCandidates={selectedCandidates}
              onToggleSelect={toggleCandidateSelection}
              onSendEmail={handleSendEmail}
            />
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBulkActions ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedCandidates.length} selected - Bulk Actions:
                </span>
                <button 
                  onClick={handleBulkEmail}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Send Email
                </button>
                <button 
                  onClick={handleBulkWhatsApp}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  WhatsApp Message
                </button>
                <button 
                  onClick={handleAssignInterviewer}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Assign Interviewer
                </button>
                <button 
                  onClick={handleBulkReject}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Bulk Reject
                </button>
                <button 
                  onClick={() => {
                    setSelectedCandidates([]);
                    setShowBulkActions(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-600">
                Select candidates to enable bulk actions
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleAddCandidates}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Add Candidates
            </button>
            <button 
              onClick={handleExportPipeline}
              className="inline-flex items-center px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              Export Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pipelines;