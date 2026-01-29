import React from "react";
import { Heart, Plus, Edit, Star } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const SoftSkillsTab = ({ 
  softSkillsData, 
  setShowSoftSkillsModal 
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-blue-600" />
          Soft Skills
        </h3>
        <Button
          onClick={() => setShowSoftSkillsModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Soft Skill
        </Button>
      </div>

      {softSkillsData?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">
            No soft skills added yet
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add your interpersonal and communication skills to showcase your personality
          </p>
        </div>
      ) : (softSkillsData && softSkillsData.length > 0) ? (
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {softSkillsData
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((skill, idx) => (
              <div
                key={skill.id || `soft-skill-${idx}`}
                className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-bold text-gray-900">
                        {skill.name || skill.skillName || skill.skill_name || "Soft Skill"}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSoftSkillsModal(true)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`px-3 py-1 text-xs font-medium border ${getLevelColor(skill.level)}`}>
                        {skill.level || "Not specified"}
                      </Badge>
                      {renderStars(skill.level)}
                    </div>

                    {skill.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {skill.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
};

export default SoftSkillsTab;