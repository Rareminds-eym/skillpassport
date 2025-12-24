import { motion } from 'framer-motion';
import {
    Award,
    ChevronDown,
    ChevronUp,
    Code,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const SkillTrackerExpanded = ({ studentId, email }) => {
  const [techSkills, setTechSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['all']));
  const [sortBy, setSortBy] = useState('level'); // 'level', 'name', 'category'

  useEffect(() => {
    fetchSkills();
  }, [studentId, email]);

  const fetchSkills = async () => {
    try {
      setLoading(true);

      // Get student ID if only email is provided
      let actualStudentId = studentId;
      if (!actualStudentId && email) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', email)
          .single();
        actualStudentId = studentData?.id;
      }

      if (!actualStudentId) return;

      // Fetch technical and soft skills from skills table with type filtering
      const [techRes, softRes] = await Promise.all([
        supabase.from('skills').select('*').eq('student_id', actualStudentId).eq('type', 'technical'),
        supabase.from('skills').select('*').eq('student_id', actualStudentId).eq('type', 'soft')
      ]);

      setTechSkills(techRes.data || []);
      setSoftSkills(softRes.data || []);
    } catch (err) {
      console.error('Error fetching skills:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group technical skills by category
  const groupedTechSkills = useMemo(() => {
    const grouped = {};
    techSkills.forEach(skill => {
      const category = skill.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skill);
    });
    return grouped;
  }, [techSkills]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSkills = techSkills.length + softSkills.length;
    const expertSkills = [...techSkills, ...softSkills].filter(s => s.level >= 5).length;
    const advancedSkills = [...techSkills, ...softSkills].filter(s => s.level >= 4).length;
    const avgLevel = totalSkills > 0 
      ? ([...techSkills, ...softSkills].reduce((sum, s) => sum + s.level, 0) / totalSkills).toFixed(1)
      : 0;

    return { totalSkills, expertSkills, advancedSkills, avgLevel };
  }, [techSkills, softSkills]);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getSkillLevelText = (level) => {
    if (level >= 5) return 'Expert';
    if (level >= 4) return 'Advanced';
    if (level >= 3) return 'Intermediate';
    if (level >= 2) return 'Beginner';
    return 'Novice';
  };

  const getSkillLevelColor = (level) => {
    if (level >= 5) return 'from-purple-500 to-pink-500';
    if (level >= 4) return 'from-blue-500 to-indigo-500';
    if (level >= 3) return 'from-green-500 to-emerald-500';
    if (level >= 2) return 'from-yellow-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const getProgressPercentage = (level) => (level / 5) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="skill-tracker-expanded">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Skills</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSkills}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expert Level</p>
                <p className="text-3xl font-bold text-gray-900">{stats.expertSkills}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Advanced+</p>
                <p className="text-3xl font-bold text-gray-900">{stats.advancedSkills}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Level</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgLevel}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Skills by Category */}
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">Technical Skills</span>
                <p className="text-sm text-gray-500 font-normal mt-0.5">
                  {techSkills.length} skills from skills table
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-base px-3 py-1">
              {techSkills.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {Object.entries(groupedTechSkills).length === 0 ? (
            <div className="text-center py-12">
              <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No technical skills found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTechSkills).map(([category, skills]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{category}</span>
                      <Badge variant="outline" className="text-xs">{skills.length}</Badge>
                    </div>
                    {expandedCategories.has(category) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedCategories.has(category) && (
                    <div className="p-4 space-y-3 bg-white">
                      {skills.map((skill, index) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-base mb-1">{skill.name}</h4>
                              {skill.icon && <span className="text-2xl">{skill.icon}</span>}
                            </div>
                            <Badge className={`bg-gradient-to-r ${getSkillLevelColor(skill.level)} text-white px-3 py-1`}>
                              {getSkillLevelText(skill.level)}
                            </Badge>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Proficiency</span>
                              <span>{skill.level}/5</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercentage(skill.level)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className={`h-full bg-gradient-to-r ${getSkillLevelColor(skill.level)} rounded-full`}
                              />
                            </div>
                          </div>

                          {/* Stars */}
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < skill.level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                            {skill.verified && (
                              <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Verified</Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Soft Skills */}
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">Soft Skills</span>
                <p className="text-sm text-gray-500 font-normal mt-0.5">
                  {softSkills.length} skills from skills table
                </p>
              </div>
            </div>
            <Badge className="bg-pink-100 text-pink-700 text-base px-3 py-1">
              {softSkills.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {softSkills.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No soft skills found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {softSkills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-base mb-1">{skill.name}</h4>
                      {skill.type && (
                        <p className="text-xs text-gray-600 capitalize">{skill.type}</p>
                      )}
                    </div>
                    <Badge className={`bg-gradient-to-r ${getSkillLevelColor(skill.level)} text-white px-2 py-1 text-xs`}>
                      {getSkillLevelText(skill.level)}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(skill.level)}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-full bg-gradient-to-r ${getSkillLevelColor(skill.level)} rounded-full`}
                      />
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < skill.level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillTrackerExpanded;
