import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import './AchievementsTimeline.css';
import { Building2, Rocket, Medal, GraduationCap, Trophy, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNavigate } from 'react-router-dom';

// Helper function to get icon based on type
const getIconByType = (type) => {
  switch (type) {
    case 'certificate':
      return <Medal className="w-5 h-5" />;
    case 'project':
      return <Rocket className="w-5 h-5" />;
    case 'education':
      return <GraduationCap className="w-5 h-5" />;
    case 'experience':
      return <Building2 className="w-5 h-5" />;
    default:
      return <Trophy className="w-5 h-5" />;
  }
};

// Helper function to get color based on type
const getColorByType = (type) => {
  switch (type) {
    case 'certificate':
      return '#3b82f6'; // blue
    case 'project':
      return '#2563eb'; // blue-600
    case 'education':
      return '#1d4ed8'; // blue-700
    case 'experience':
      return '#1e40af'; // blue-800
    default:
      return '#3b82f6'; // blue
  }
};

// Helper function to parse dates
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();

  // Handle various date formats
  if (dateStr.includes('-')) {
    return new Date(dateStr);
  } else if (dateStr.match(/^\d{4}$/)) {
    // Just year
    return new Date(dateStr, 0, 1);
  } else {
    // Try to parse as-is
    return new Date(dateStr);
  }
};

const AchievementsTimeline = ({ userData }) => {
  const navigate = useNavigate();

  // Aggregate all achievements from different sources
  const aggregateAchievements = () => {
    const achievements = [];

    // Add certificates
    if (Array.isArray(userData.certificates)) {
      userData.certificates
        .filter((cert) => cert && cert.enabled !== false)
        .forEach((cert) => {
          achievements.push({
            id: `cert-${cert.id}`,
            type: 'certificate',
            title: cert.title || cert.name || 'Certificate',
            subtitle: cert.issuer || cert.organization || cert.institution,
            description: cert.description || `Earned certificate in ${cert.title || 'this field'}`,
            date:
              cert.year || cert.date || cert.issueDate || cert.issuedOn || new Date().getFullYear(),
            link: cert.link || cert.url,
          });
        });
    }

    // Add projects
    if (Array.isArray(userData.projects)) {
      userData.projects
        .filter((project) => project && project.enabled !== false)
        .forEach((project) => {
          achievements.push({
            id: `project-${project.id}`,
            type: 'project',
            title: project.title || project.name || 'Project',
            subtitle: project.organization || project.company || project.client,
            description: project.description || 'Completed project',
            date:
              project.duration || project.timeline || project.period || new Date().getFullYear(),
            tech: Array.isArray(project.tech)
              ? project.tech
              : Array.isArray(project.technologies)
                ? project.technologies
                : Array.isArray(project.techStack)
                  ? project.techStack
                  : [],
          });
        });
    }

    // Add education
    if (Array.isArray(userData.education)) {
      userData.education
        .filter((edu) => edu && edu.enabled !== false)
        .forEach((edu) => {
          achievements.push({
            id: `edu-${edu.id}`,
            type: 'education',
            title: edu.degree || 'Degree',
            subtitle: edu.university || edu.institution,
            description: `${edu.level || ''} - ${edu.cgpa ? `Grade: ${edu.cgpa}` : ''}`,
            date: edu.yearOfPassing || edu.year || new Date().getFullYear(),
          });
        });
    }

    // Add experience
    if (Array.isArray(userData.experience)) {
      userData.experience
        .filter((exp) => exp && exp.enabled !== false)
        .forEach((exp) => {
          achievements.push({
            id: `exp-${exp.id}`,
            type: 'experience',
            title: exp.role || exp.position || 'Role',
            subtitle: exp.company || exp.organization,
            description: exp.description || 'Work experience',
            date: exp.duration || exp.period || exp.startDate || new Date().getFullYear(),
          });
        });
    }

    // Sort by date (most recent first)
    return achievements.sort((a, b) => {
      const dateA = parseDate(a.date.toString());
      const dateB = parseDate(b.date.toString());
      return dateB - dateA;
    });
  };

  const achievements = aggregateAchievements();
  const previewCount = 3;

  if (achievements.length === 0) {
    return null; // Don't show timeline if no achievements
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm">
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Achievement Timeline</span>
                <p className="text-sm text-gray-600 mt-0.5 font-medium">Your journey at a glance</p>
              </div>
            </CardTitle>
            <button
              onClick={() => navigate('/student/timeline')}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title="View all achievements"
            >
              <Eye className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-8">
          <VerticalTimeline layout="1-column-left" lineColor="#e5e7eb">
            {achievements.slice(0, previewCount).map((achievement, index) => (
              <VerticalTimelineElement
                key={achievement.id}
                className="vertical-timeline-element--work"
                contentStyle={{
                  background: 'linear-gradient(to right, #dbeafe, #ffffff)',
                  border: '1px solid #bfdbfe',
                  borderLeft: '4px solid #3b82f6',
                  boxShadow:
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  borderRadius: '0.75rem',
                }}
                contentArrowStyle={{
                  borderRight: '7px solid #dbeafe',
                }}
                date={achievement.date.toString()}
                dateClassName="text-sm font-bold text-blue-600"
                iconStyle={{
                  background: getColorByType(achievement.type),
                  color: '#fff',
                  boxShadow:
                    '0 0 0 4px #fff, inset 0 2px 0 rgba(0,0,0,.08), 0 3px 0 4px rgba(0,0,0,.05)',
                }}
                icon={getIconByType(achievement.type)}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {achievement.title}
                  </h3>
                  {achievement.subtitle && (
                    <h4 className="text-sm font-medium text-blue-600 mb-2">
                      {achievement.subtitle}
                    </h4>
                  )}
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  {achievement.tech && achievement.tech.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {achievement.tech.slice(0, 3).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                      {achievement.tech.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
                          +{achievement.tech.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {achievement.link && (
                    <a
                      href={achievement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      View Details →
                    </a>
                  )}
                </motion.div>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>

          {achievements.length > previewCount && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/student/timeline')}
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 font-semibold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                View All {achievements.length} Achievements
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AchievementsTimeline;
