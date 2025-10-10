import React, { useState } from 'react';
import { Edit3, BookOpen, Code, Briefcase, MessageCircle, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from './ProfileEditModals';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../data/mockData';

const ProfileEditSection = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [userData, setUserData] = useState({
    education: educationData,
    training: trainingData,
    experience: experienceData,
    technicalSkills: technicalSkills,
    softSkills: softSkills
  });

  const handleSave = (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const editSections = [
    {
      id: 'education',
      title: 'My Education',
      icon: Award,
      description: 'Manage your academic qualifications - Add multiple degrees, certifications',
      color: 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      data: userData.education,
      count: Array.isArray(userData.education) ? userData.education.length : 0
    },
    {
      id: 'training',
      title: 'My Training',
      icon: BookOpen,
      description: 'Add courses and certifications',
      color: 'bg-gradient-to-br from-purple-50 to-violet-50 text-purple-700 border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      data: userData.training,
      count: Array.isArray(userData.training) ? userData.training.length : 0
    },
    {
      id: 'experience',
      title: 'My Experience',
      icon: Briefcase,
      description: 'Add internships and work experience',
      color: 'bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
      data: userData.experience,
      count: Array.isArray(userData.experience) ? userData.experience.length : 0
    },
    {
      id: 'softSkills',
      title: 'My Soft Skills',
      icon: MessageCircle,
      description: 'Languages and communication skills',
      color: 'bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 border-teal-200',
      buttonColor: 'bg-teal-600 hover:bg-teal-700',
      data: userData.softSkills,
      count: Array.isArray(userData.softSkills) ? userData.softSkills.length : 0
    },
    {
      id: 'technicalSkills',
      title: 'My Skills (Technical)',
      icon: Code,
      description: 'Programming languages and technical skills',
      color: 'bg-gradient-to-br from-slate-50 to-gray-50 text-slate-700 border-slate-200',
      buttonColor: 'bg-slate-600 hover:bg-slate-700',
      data: userData.technicalSkills,
      count: Array.isArray(userData.technicalSkills) ? userData.technicalSkills.length : 0
    }
  ];

  return (
    <div className="bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Your Profile</h2>
          <p className="text-gray-600">Click on any section below to add or update your details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id} className={`hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${section.color.split('text-')[0]} hover:scale-105`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {section.count > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 font-semibold">
                        {section.count} items
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{section.description}</p>
                  <Button
                    onClick={() => setActiveModal(section.id)}
                    className={`w-full ${section.buttonColor} text-white font-medium shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {section.id === 'education' ? 'Manage Education' : 'Edit Details'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modals */}
        <EducationEditModal
          isOpen={activeModal === 'education'}
          onClose={() => setActiveModal(null)}
          data={userData.education}
          onSave={(data) => handleSave('education', data)}
        />

        <TrainingEditModal
          isOpen={activeModal === 'training'}
          onClose={() => setActiveModal(null)}
          data={userData.training}
          onSave={(data) => handleSave('training', data)}
        />

        <ExperienceEditModal
          isOpen={activeModal === 'experience'}
          onClose={() => setActiveModal(null)}
          data={userData.experience}
          onSave={(data) => handleSave('experience', data)}
        />

        <SkillsEditModal
          isOpen={activeModal === 'softSkills'}
          onClose={() => setActiveModal(null)}
          data={userData.softSkills}
          title="Soft Skills"
          type="Skill"
          onSave={(data) => handleSave('softSkills', data)}
        />

        <SkillsEditModal
          isOpen={activeModal === 'technicalSkills'}
          onClose={() => setActiveModal(null)}
          data={userData.technicalSkills}
          title="Technical Skills"
          type="Skill"
          onSave={(data) => handleSave('technicalSkills', data)}
        />
      </div>
    </div>
  );
};

export default ProfileEditSection;