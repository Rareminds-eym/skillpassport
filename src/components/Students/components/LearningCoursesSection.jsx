import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { BookOpen, Award, Clock, TrendingUp, Plus, ExternalLink } from 'lucide-react';
import SelectCourseModal from './SelectCourseModal';

export default function LearningCoursesSection({ studentId }) {
  const [learning, setLearning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchLearning();
    }
  }, [studentId]);

  const fetchLearning = async () => {
    try {
      setLoading(true);
      
      // Fetch learning records with associated certificates
      const { data: learningData, error: learningError } = await supabase
        .from('trainings')
        .select(`
          *,
          certificates (
            id,
            title,
            level,
            link,
            issued_on
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (learningError) throw learningError;

      setLearning(learningData || []);
    } catch (error) {
      console.error('Error fetching learning:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadge = (level) => {
    if (!level) return null;
    
    const colors = {
      'Beginner': 'bg-yellow-100 text-yellow-800',
      'Intermediate': 'bg-blue-100 text-blue-800',
      'Advanced': 'bg-purple-100 text-purple-800',
      'Expert': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-800'}`}>
        <Award size={12} className="mr-1" />
        {level}
      </span>
    );
  };

  const calculateProgress = (record) => {
    if (record.total_modules === 0) return 0;
    return Math.round((record.completed_modules / record.total_modules) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={24} className="text-indigo-600" />
                Learning Courses
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Track your learning journey and certifications
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Add Learning
            </button>
          </div>
        </div>

        <div className="p-6">
          {learning.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No learning courses yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start adding your learning courses and certifications to showcase your skills
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
                Add Your First Learning
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {learning.map((record) => {
                const progress = calculateProgress(record);
                const certificate = record.certificates?.[0];

                return (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {record.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.organization}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status === 'completed' ? 'Completed' : 'Ongoing'}
                        </span>
                        {certificate && getLevelBadge(certificate.level)}
                      </div>
                    </div>

                    {record.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        {record.description}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      {record.total_modules > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrendingUp size={16} className="text-indigo-600" />
                          <span>
                            {record.completed_modules}/{record.total_modules} modules
                          </span>
                        </div>
                      )}
                      {record.hours_spent > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={16} className="text-indigo-600" />
                          <span>{record.hours_spent} hours</span>
                        </div>
                      )}
                      {record.start_date && (
                        <div className="text-sm text-gray-600">
                          {new Date(record.start_date).toLocaleDateString()} - 
                          {record.end_date ? new Date(record.end_date).toLocaleDateString() : ' Present'}
                        </div>
                      )}
                    </div>

                    {record.total_modules > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {certificate && certificate.link && (
                      <div className="pt-3 border-t border-gray-200">
                        <a
                          href={certificate.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <Award size={16} />
                          View Certificate
                          <ExternalLink size={14} />
                        </a>
                        {certificate.issued_on && (
                          <span className="text-sm text-gray-500 ml-3">
                            Issued: {new Date(certificate.issued_on).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddLearningCourseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        studentId={studentId}
        onSuccess={fetchLearning}
      />
    </>
  );
}
