import { useState, useEffect, useMemo } from 'react';

/**
 * Calculate employability score based on student's actual data
 * Formula considers: Education, Skills, Training, Experience, Projects, Certificates
 */
export const useEmployabilityScore = ({
  education = [],
  technicalSkills = [],
  softSkills = [],
  training = [],
  experience = [],
  projects = [],
  certificates = []
}) => {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState({});
  const [label, setLabel] = useState('Beginner');

  const calculateScore = useMemo(() => {
    let totalScore = 0;
    let maxScore = 100;
    const scoreBreakdown = {};

    // 1. Education Score (20 points max)
    let educationScore = 0;
    if (education.length > 0) {
      education.forEach(edu => {
        if (edu.level) {
          switch (edu.level.toLowerCase()) {
            case 'phd':
              educationScore += 20;
              break;
            case "master's":
            case 'masters':
              educationScore += 16;
              break;
            case "bachelor's":
            case 'bachelors':
              educationScore += 12;
              break;
            case 'associate':
            case 'diploma':
              educationScore += 8;
              break;
            case 'high school':
            case 'certificate':
              educationScore += 4;
              break;
            default:
              educationScore += 6;
          }
        }
        // Bonus for good CGPA
        if (edu.cgpa && !isNaN(parseFloat(edu.cgpa))) {
          const cgpa = parseFloat(edu.cgpa);
          if (cgpa >= 9.0) educationScore += 3;
          else if (cgpa >= 8.0) educationScore += 2;
          else if (cgpa >= 7.0) educationScore += 1;
        }
      });
    }
    educationScore = Math.min(educationScore, 20); // Cap at 20
    scoreBreakdown.education = educationScore;
    totalScore += educationScore;

    // 2. Technical Skills Score (25 points max)
    let techSkillsScore = 0;
    if (technicalSkills.length > 0) {
      const avgSkillLevel = technicalSkills.reduce((sum, skill) => sum + (skill.level || 0), 0) / technicalSkills.length;
      techSkillsScore = (avgSkillLevel / 5) * 15; // Base score from skill levels
      
      // Bonus for number of skills
      const skillCount = technicalSkills.length;
      if (skillCount >= 10) techSkillsScore += 10;
      else if (skillCount >= 5) techSkillsScore += 6;
      else if (skillCount >= 3) techSkillsScore += 3;
      
      // Bonus for verified skills
      const verifiedSkills = technicalSkills.filter(skill => skill.verified).length;
      techSkillsScore += Math.min(verifiedSkills * 2, 8);
    }
    techSkillsScore = Math.min(techSkillsScore, 25);
    scoreBreakdown.technicalSkills = Math.round(techSkillsScore);
    totalScore += techSkillsScore;

    // 3. Soft Skills Score (10 points max)
    let softSkillsScore = 0;
    if (softSkills.length > 0) {
      const avgSoftSkillLevel = softSkills.reduce((sum, skill) => sum + (skill.level || 0), 0) / softSkills.length;
      softSkillsScore = (avgSoftSkillLevel / 5) * 8;
      
      // Bonus for having diverse soft skills
      if (softSkills.length >= 5) softSkillsScore += 2;
    }
    softSkillsScore = Math.min(softSkillsScore, 10);
    scoreBreakdown.softSkills = Math.round(softSkillsScore);
    totalScore += softSkillsScore;

    // 4. Training/Courses Score (15 points max)
    let trainingScore = 0;
    if (training.length > 0) {
      training.forEach(course => {
        if (course.status === 'completed') {
          trainingScore += 3;
        } else if (course.status === 'ongoing') {
          trainingScore += 1.5;
        }
        
        // Bonus for certified courses
        if (course.certificateUrl || course.verified) {
          trainingScore += 1;
        }
      });
    }
    trainingScore = Math.min(trainingScore, 15);
    scoreBreakdown.training = Math.round(trainingScore);
    totalScore += trainingScore;

    // 5. Experience Score (15 points max)
    let experienceScore = 0;
    if (experience.length > 0) {
      experience.forEach(exp => {
        // Points based on duration (rough estimation)
        if (exp.duration) {
          const duration = exp.duration.toLowerCase();
          if (duration.includes('year')) {
            const years = parseInt(duration.match(/\d+/)?.[0] || '0');
            experienceScore += Math.min(years * 3, 8);
          } else if (duration.includes('month')) {
            const months = parseInt(duration.match(/\d+/)?.[0] || '0');
            experienceScore += Math.min(months * 0.5, 6);
          } else {
            experienceScore += 2; // Default for any experience
          }
        } else {
          experienceScore += 2; // Default for any experience
        }
        
        // Bonus for verified experience
        if (exp.verified) {
          experienceScore += 2;
        }
      });
    }
    experienceScore = Math.min(experienceScore, 15);
    scoreBreakdown.experience = Math.round(experienceScore);
    totalScore += experienceScore;

    // 6. Projects Score (10 points max)
    let projectsScore = 0;
    if (projects.length > 0) {
      projects.forEach(project => {
        if (project.enabled !== false) {
          projectsScore += 2;
          
          // Bonus for projects with demo/github links
          if (project.demoLink || project.demo_link || project.link) {
            projectsScore += 1;
          }
          if (project.githubLink || project.github_link || project.github) {
            projectsScore += 1;
          }
          
          // Bonus for verified/approved projects
          if (project.verified || project.approval_status === 'approved') {
            projectsScore += 1;
          }
        }
      });
    }
    projectsScore = Math.min(projectsScore, 10);
    scoreBreakdown.projects = Math.round(projectsScore);
    totalScore += projectsScore;

    // 7. Certificates Score (5 points max)
    let certificatesScore = 0;
    if (certificates.length > 0) {
      certificates.forEach(cert => {
        if (cert.enabled !== false) {
          certificatesScore += 1;
          
          // Bonus for verified certificates
          if (cert.verified || cert.approval_status === 'approved') {
            certificatesScore += 0.5;
          }
        }
      });
    }
    certificatesScore = Math.min(certificatesScore, 5);
    scoreBreakdown.certificates = Math.round(certificatesScore);
    totalScore += certificatesScore;

    // Calculate final percentage
    const finalScore = Math.min(Math.round((totalScore / maxScore) * 100), 100);
    
    // Determine label
    let scoreLabel = 'Beginner';
    if (finalScore >= 90) scoreLabel = 'Expert';
    else if (finalScore >= 80) scoreLabel = 'Advanced';
    else if (finalScore >= 70) scoreLabel = 'Proficient';
    else if (finalScore >= 60) scoreLabel = 'Intermediate';
    else if (finalScore >= 40) scoreLabel = 'Developing';

    return {
      score: finalScore,
      breakdown: scoreBreakdown,
      label: scoreLabel,
      maxScore: maxScore,
      totalRawScore: Math.round(totalScore)
    };
  }, [education, technicalSkills, softSkills, training, experience, projects, certificates]);

  useEffect(() => {
    const result = calculateScore;
    setScore(result.score);
    setBreakdown(result.breakdown);
    setLabel(result.label);
  }, [calculateScore]);

  return {
    employabilityScore: score,
    scoreBreakdown: breakdown,
    employabilityLabel: label,
    maxScore: 100,
    // Helper function to get score color
    getScoreColor: () => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-blue-600';
      if (score >= 40) return 'text-yellow-600';
      return 'text-red-600';
    },
    // Helper function to get score background color
    getScoreBgColor: () => {
      if (score >= 80) return 'bg-green-100';
      if (score >= 60) return 'bg-blue-100';
      if (score >= 40) return 'bg-yellow-100';
      return 'bg-red-100';
    }
  };
};