import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Award,
  Briefcase,
  Code,
  Medal,
  BookOpen,
  Calendar as CalendarIcon,
  ArrowLeft,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";

// Helper functions (same as AchievementsTimeline)
const getIconByType = (type) => {
  switch (type) {
    case "certificate":
      return <Medal className="w-5 h-5" />;
    case "project":
      return <Code className="w-5 h-5" />;
    case "education":
      return <BookOpen className="w-5 h-5" />;
    case "experience":
      return <Briefcase className="w-5 h-5" />;
    default:
      return <Award className="w-5 h-5" />;
  }
};

const getColorByType = (type) => {
  switch (type) {
    case "certificate":
      return "#10b981";
    case "project":
      return "#3b82f6";
    case "education":
      return "#8b5cf6";
    case "experience":
      return "#f59e0b";
    default:
      return "#6366f1";
  }
};

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  if (dateStr.includes("-")) {
    return new Date(dateStr);
  } else if (dateStr.match(/^\d{4}$/)) {
    return new Date(dateStr, 0, 1);
  } else {
    return new Date(dateStr);
  }
};

const TimelinePage = () => {
  const navigate = useNavigate();
  const { userData, loading } = useStudentDataByEmail();
  const [viewMode, setViewMode] = useState("timeline"); // timeline or calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState("all"); // all, certificate, project, education, experience

  // Aggregate achievements
  const aggregateAchievements = () => {
    if (!userData) return [];
    const achievements = [];

    // Certificates
    if (Array.isArray(userData.certificates)) {
      userData.certificates
        .filter((cert) => cert && cert.enabled !== false)
        .forEach((cert) => {
          achievements.push({
            id: `cert-${cert.id}`,
            type: "certificate",
            title: cert.title || cert.name || "Certificate",
            subtitle: cert.issuer || cert.organization || cert.institution,
            description: cert.description || `Earned certificate in ${cert.title || "this field"}`,
            date: cert.year || cert.date || cert.issueDate || cert.issuedOn || new Date().getFullYear(),
            link: cert.link || cert.url,
          });
        });
    }

    // Projects
    if (Array.isArray(userData.projects)) {
      userData.projects
        .filter((project) => project && project.enabled !== false)
        .forEach((project) => {
          achievements.push({
            id: `project-${project.id}`,
            type: "project",
            title: project.title || project.name || "Project",
            subtitle: project.organization || project.company || project.client,
            description: project.description || "Completed project",
            date: project.duration || project.timeline || project.period || new Date().getFullYear(),
            tech: Array.isArray(project.tech) ? project.tech : 
                  Array.isArray(project.technologies) ? project.technologies : 
                  Array.isArray(project.techStack) ? project.techStack : [],
          });
        });
    }

    // Education
    if (Array.isArray(userData.education)) {
      userData.education
        .filter((edu) => edu && edu.enabled !== false)
        .forEach((edu) => {
          achievements.push({
            id: `edu-${edu.id}`,
            type: "education",
            title: edu.degree || "Degree",
            subtitle: edu.university || edu.institution,
            description: `${edu.level || ""} - ${edu.cgpa ? `Grade: ${edu.cgpa}` : ""}`,
            date: edu.yearOfPassing || edu.year || new Date().getFullYear(),
          });
        });
    }

    // Experience
    if (Array.isArray(userData.experience)) {
      userData.experience
        .filter((exp) => exp && exp.enabled !== false)
        .forEach((exp) => {
          achievements.push({
            id: `exp-${exp.id}`,
            type: "experience",
            title: exp.role || exp.position || "Role",
            subtitle: exp.company || exp.organization,
            description: exp.description || "Work experience",
            date: exp.duration || exp.period || exp.startDate || new Date().getFullYear(),
          });
        });
    }

    return achievements.sort((a, b) => {
      const dateA = parseDate(a.date.toString());
      const dateB = parseDate(b.date.toString());
      return dateB - dateA;
    });
  };

  const allAchievements = aggregateAchievements();
  const filteredAchievements =
    filterType === "all"
      ? allAchievements
      : allAchievements.filter((a) => a.type === filterType);

  // Get dates with achievements for calendar highlighting
  const achievementDates = allAchievements.map((a) => {
    const date = parseDate(a.date.toString());
    return date.toDateString();
  });

  // Custom tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dateStr = date.toDateString();
      const hasAchievement = achievementDates.includes(dateStr);
      
      if (hasAchievement) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          </div>
        );
      }
    }
    return null;
  };

  // Get achievements for selected date
  const getAchievementsForDate = (date) => {
    const selectedDateStr = date.toDateString();
    return allAchievements.filter((a) => {
      const achievementDate = parseDate(a.date.toString());
      return achievementDate.toDateString() === selectedDateStr;
    });
  };

  const selectedDateAchievements = getAchievementsForDate(selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate("/student/dashboard")}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Achievement Timeline
              </h1>
              <p className="text-gray-600">
                A comprehensive view of your journey and milestones
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                    viewMode === "timeline"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                    viewMode === "calendar"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Calendar
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total", count: allAchievements.length, color: "blue" },
            {
              label: "Certificates",
              count: allAchievements.filter((a) => a.type === "certificate").length,
              color: "green",
            },
            {
              label: "Projects",
              count: allAchievements.filter((a) => a.type === "project").length,
              color: "blue",
            },
            {
              label: "Education",
              count: allAchievements.filter((a) => a.type === "education").length,
              color: "purple",
            },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-white">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>
                  {stat.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {["all", "certificate", "project", "education", "experience"].map((type) => (
            <Badge
              key={type}
              onClick={() => setFilterType(type)}
              className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-full transition-all ${
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          ))}
        </motion.div>

        {/* Main Content */}
        {viewMode === "timeline" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white">
              <CardContent className="p-6">
                <VerticalTimeline layout="1-column-left" lineColor="#e5e7eb">
                  {filteredAchievements.map((achievement, index) => (
                    <VerticalTimelineElement
                      key={achievement.id}
                      className="vertical-timeline-element--work"
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        borderRadius: "1rem",
                      }}
                      contentArrowStyle={{
                        borderRight: "7px solid #ffffff",
                      }}
                      date={achievement.date.toString()}
                      dateClassName="text-sm font-semibold text-gray-700"
                      iconStyle={{
                        background: getColorByType(achievement.type),
                        color: "#fff",
                        boxShadow:
                          "0 0 0 4px #fff, inset 0 2px 0 rgba(0,0,0,.08), 0 3px 0 4px rgba(0,0,0,.05)",
                      }}
                      icon={getIconByType(achievement.type)}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {achievement.title}
                            </h3>
                            {achievement.subtitle && (
                              <h4 className="text-sm font-semibold text-blue-600 mb-2">
                                {achievement.subtitle}
                              </h4>
                            )}
                          </div>
                          <Badge
                            className="capitalize"
                            style={{
                              backgroundColor: `${getColorByType(achievement.type)}20`,
                              color: getColorByType(achievement.type),
                            }}
                          >
                            {achievement.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {achievement.description}
                        </p>
                        {achievement.tech && achievement.tech.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {achievement.tech.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 text-xs rounded-md bg-blue-50 text-blue-700 font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {achievement.link && (
                          <a
                            href={achievement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            View Details →
                          </a>
                        )}
                      </motion.div>
                    </VerticalTimelineElement>
                  ))}
                </VerticalTimeline>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-medium">
                      No achievements found for this filter
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Calendar */}
            <Card className="lg:col-span-2 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Achievement Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="calendar-wrapper">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileContent={tileContent}
                    className="w-full border-none shadow-none"
                  />
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    Blue dots indicate days with achievements
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Achievements */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateAchievements.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: getColorByType(achievement.type),
                            }}
                          >
                            {getIconByType(achievement.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">
                              {achievement.title}
                            </h4>
                            {achievement.subtitle && (
                              <p className="text-xs text-blue-600 mb-1">
                                {achievement.subtitle}
                              </p>
                            )}
                            <Badge
                              className="text-xs capitalize"
                              style={{
                                backgroundColor: `${getColorByType(achievement.type)}20`,
                                color: getColorByType(achievement.type),
                              }}
                            >
                              {achievement.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      No achievements on this date
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .calendar-wrapper :global(.react-calendar) {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .calendar-wrapper :global(.react-calendar__tile--active) {
          background: #3b82f6;
          color: white;
        }
        .calendar-wrapper :global(.react-calendar__tile--now) {
          background: #dbeafe;
        }
        .calendar-wrapper :global(.react-calendar__tile:enabled:hover) {
          background-color: #f3f4f6;
        }
        .calendar-wrapper :global(.react-calendar__tile--active:enabled:hover) {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default TimelinePage;
