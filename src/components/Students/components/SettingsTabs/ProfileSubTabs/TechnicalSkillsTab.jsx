import React from "react";
import { Code, Plus, Edit, Star, Zap } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const TechnicalSkillsTab = ({ 
  technicalSkillsData, 
  setShowTechnicalSkillsModal 
}) => {

  const getLevelColor = (level) => {
    // Ensure level is a string and handle null/undefined cases
    const levelStr = level && typeof level === 'string' ? level.toLowerCase() : '';
    
    switch (levelStr) {
      case 'beginner':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'advanced':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'expert':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    // Ensure category is a string and handle null/undefined cases
    const categoryStr = category && typeof category === 'string' ? category.toLowerCase() : '';
    
    switch (categoryStr) {
      case 'programming':
        return <Code className="w-4 h-4" />;
      case 'framework':
        return <Zap className="w-4 h-4" />;
      case 'database':
        return <Code className="w-4 h-4" />;
      case 'tools':
        return <Zap className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const renderStars = (level) => {
    // Ensure level is a string and handle null/undefined cases
    const levelStr = level && typeof level === 'string' ? level.toLowerCase() : '';
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const stars = levels[levelStr] || 0;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= stars 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const groupedSkills = (technicalSkillsData || []).reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Technical Skills
        </h3>
        <Button
          onClick={() => setShowTechnicalSkillsModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Technical Skill
        </Button>
      </div>

      {technicalSkillsData?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">
            No technical skills added yet
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add your programming languages, frameworks, and technical expertise
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-6 pr-2">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div key={category} className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b border-gray-200 pb-2">
                {getCategoryIcon(category)}
                {category}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {skills.length}
                </Badge>
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skills
                  .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                  .map((skill, idx) => (
                    <div
                      key={skill.id || `tech-skill-${idx}`}
                      className="p-4 rounded-lg bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-gray-900 flex-1">
                          {skill.name || skill.skillName || skill.skill_name || skill.technology || "Technical Skill"}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTechnicalSkillsModal(true)}
                          className="p-1 h-5 w-5 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={`px-2 py-1 text-xs font-medium border ${getLevelColor(skill.level)}`}>
                          {skill.level || "Not specified"}
                        </Badge>
                        {renderStars(skill.level)}
                      </div>

                      {skill.description && (
                        <p className="text-xs text-gray-600 mt-2">
                          {skill.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicalSkillsTab;