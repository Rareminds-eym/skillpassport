import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit3, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const EducationEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [educationList, setEducationList] = useState(data || []);

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setEducationList(data || []);
  }, [data]);
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    degree: '',
    department: '',
    university: '',
    yearOfPassing: '',
    cgpa: '',
    level: 'Bachelor\'s',
    status: 'ongoing'
  });
  const { toast } = useToast();

  const levelOptions = [
    'High School',
    'Associate',
    'Bachelor\'s',
    'Master\'s',
    'PhD',
    'Certificate',
    'Diploma'
  ];

  const statusOptions = [
    'ongoing',
    'completed'
  ];

  const resetForm = () => {
    setFormData({
      degree: '',
      department: '',
      university: '',
      yearOfPassing: '',
      cgpa: '',
      level: 'Bachelor\'s',
      status: 'ongoing'
    });
  };

  const startEditing = (education) => {
    setFormData(education);
    setEditingItem(education.id);
    setIsAdding(true);
  };

  const startAdding = () => {
    resetForm();
    setEditingItem(null);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingItem(null);
    resetForm();
  };

  const saveEducation = () => {
    if (!formData.degree.trim() || !formData.university.trim()) {
      toast({
        title: "Error",
        description: "Please fill in at least degree and university fields.",
        variant: "destructive"
      });
      return;
    }

    if (editingItem) {
      // Update existing education
      setEducationList(educationList.map(edu => 
        edu.id === editingItem ? { ...formData, id: editingItem } : edu
      ));
    } else {
      // Add new education
      const newEducation = {
        ...formData,
        id: Date.now(),
        processing: true
      };
      setEducationList([...educationList, newEducation]);
    }

    setIsAdding(false);
    setEditingItem(null);
    resetForm();

    toast({
      title: "Education Updated",
      description: "Your education details are being processed for verification.",
    });
  };

  const deleteEducation = (id) => {
    setEducationList(educationList.filter(edu => edu.id !== id));
    if (editingItem === id) {
      cancelEdit();
    }
  };

  const handleSubmit = () => {
    onSave(educationList);
    onClose();
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Bachelor\'s': return 'bg-emerald-100 text-emerald-700';
      case 'Master\'s': return 'bg-blue-100 text-blue-700';
      case 'PhD': return 'bg-purple-100 text-purple-700';
      case 'Certificate': return 'bg-amber-100 text-amber-700';
      case 'High School': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Manage Education Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Existing Education List */}
          {educationList.map((education) => (
            <div key={education.id} className={`p-4 border-l-4 rounded-lg ${
              education.status === 'ongoing' 
                ? 'border-l-blue-500 bg-blue-50' 
                : education.level === 'Bachelor\'s' 
                  ? 'border-l-emerald-500 bg-emerald-50'
                  : education.level === 'Certificate'
                    ? 'border-l-amber-500 bg-amber-50'
                    : 'border-l-gray-500 bg-gray-50'
            } hover:shadow-md transition-shadow ${education.enabled === false ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold" style={{ color: '#6A0DAD' }}>{education.degree}</h4>
                    <Badge className={getLevelColor(education.level)}>
                      {education.level}
                    </Badge>
                    <Badge className={education.status === 'ongoing' 
                      ? 'bg-blue-500 hover:bg-blue-500 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-500 text-white'}>
                      {education.status}
                    </Badge>
                    {education.processing && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#6A0DAD' }}>{education.university}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div>
                      <span style={{ color: '#6A0DAD' }}>Department:</span>
                      <p className="font-medium" style={{ color: '#6A0DAD' }}>{education.department}</p>
                    </div>
                    <div>
                      <span style={{ color: '#6A0DAD' }}>Year:</span>
                      <p className="font-medium" style={{ color: '#6A0DAD' }}>{education.yearOfPassing}</p>
                    </div>
                    <div>
                      <span style={{ color: '#6A0DAD' }}>Grade:</span>
                      <p className="font-medium" style={{ color: '#6A0DAD' }}>{education.cgpa}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(education)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={education.enabled === false ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setEducationList(educationList.map(edu => edu.id === education.id ? { ...edu, enabled: edu.enabled === false ? true : false } : edu))}
                    className={education.enabled === false ? 'text-gray-500 border-gray-400' : 'bg-emerald-500 text-white'}
                  >
                    {(education.enabled === undefined || education.enabled) ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Add/Edit Form */}
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-semibold text-blue-700">
                {editingItem ? 'Edit Education' : 'Add New Education'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="degree">Degree/Qualification *</Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    placeholder="e.g., B.Tech Computer Science"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="university">Institution *</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="e.g., Stanford University"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department/Field</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Computer Science"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {levelOptions.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="year">Year of Passing</Label>
                  <Input
                    id="year"
                    value={formData.yearOfPassing}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearOfPassing: e.target.value }))}
                    placeholder="2025"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cgpa">Grade/CGPA</Label>
                  <Input
                    id="cgpa"
                    value={formData.cgpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, cgpa: e.target.value }))}
                    placeholder="8.9/10.0 or A+"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveEducation} 
                  className="bg-blue-400 hover:bg-blue-500 text-white"
                >
                  {editingItem ? 'Update' : 'Add'} Education
                </Button>
                <Button onClick={cancelEdit} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={startAdding}
              variant="outline"
              className="w-full border-dashed bg-blue-400 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Education
            </Button>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-blue-400 hover:bg-blue-500 text-white"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const TrainingEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [courses, setCourses] = useState(data || []);
  const [newCourse, setNewCourse] = useState({ course: '', progress: 0, status: 'ongoing' });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setCourses(data || []);
  }, [data]);

  const addCourse = () => {
    if (newCourse.course.trim()) {
      setCourses([...courses, { ...newCourse, id: Date.now(), verified: false, processing: true }]);
      setNewCourse({ course: '', progress: 0, status: 'ongoing' });
      setIsAdding(false);
    }
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(course => course.id !== id));
  };

  const handleSubmit = () => {
    onSave(courses);
    toast({
      title: "Training Updated",
      description: "Your training details are being processed for verification.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Training & Courses
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={course.id || index} className={`p-4 border rounded-lg space-y-2 ${course.enabled === false ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: '#6A0DAD' }}>{course.course}</h4>
                  <p className="text-sm" style={{ color: '#6A0DAD' }}>Progress: {course.progress}%</p>
                  <Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                  {course.processing && (
                    <Badge className="ml-2 bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Processing
                    </Badge>
                  )}
                </div>
                <Button
                  variant={course.enabled === false ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setCourses(courses.map((c, i) => ((c.id !== undefined ? c.id : i) === (course.id !== undefined ? course.id : index) ? { ...c, enabled: c.enabled === false ? true : false } : c)))}
                  className={course.enabled === false ? 'text-gray-500 border-gray-400' : 'bg-emerald-500 text-white'}
                >
                  {(course.enabled === undefined || course.enabled) ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
          
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
              <Input
                placeholder="Course name"
                value={newCourse.course}
                onChange={(e) => setNewCourse(prev => ({ ...prev, course: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button onClick={addCourse} size="sm" className="bg-blue-400 hover:bg-blue-600">
                  Add Course
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Course
            </Button>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-400 hover:bg-blue-600">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ExperienceEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [experiences, setExperiences] = useState(data || []);
  const [newExp, setNewExp] = useState({ role: '', organization: '', duration: '' });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setExperiences(data || []);
  }, [data]);

  const addExperience = () => {
    if (newExp.role.trim() && newExp.organization.trim()) {
      setExperiences([...experiences, { ...newExp, id: Date.now(), verified: false, processing: true }]);
      setNewExp({ role: '', organization: '', duration: '' });
      setIsAdding(false);
    }
  };

  const deleteExperience = (id) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleSubmit = () => {
    onSave(experiences);
    toast({
      title: "Experience Updated",
      description: "Your experience details are being processed for verification.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Experience
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <div key={exp.id || index} className={`p-4 border rounded-lg ${exp.enabled === false ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: '#6A0DAD' }}>{exp.role}</h4>
                  <p className="text-sm" style={{ color: '#6A0DAD' }}>{exp.organization}</p>
                  <p className="text-xs" style={{ color: '#6A0DAD' }}>{exp.duration}</p>
                  {exp.processing ? (
                    <Badge className="mt-2 bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Processing
                    </Badge>
                  ) : exp.verified && (
                    <Badge className="mt-2 bg-[#28A745] hover:bg-[#28A745]">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <Button
                  variant={exp.enabled === false ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setExperiences(experiences.map((e, i) => ((e.id !== undefined ? e.id : i) === (exp.id !== undefined ? exp.id : index) ? { ...e, enabled: e.enabled === false ? true : false } : e)))}
                  className={exp.enabled === false ? 'text-gray-500 border-gray-400' : 'bg-emerald-500 text-white'}
                >
                  {(exp.enabled === undefined || exp.enabled) ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
          
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
              <Input
                placeholder="Role/Position"
                value={newExp.role}
                onChange={(e) => setNewExp(prev => ({ ...prev, role: e.target.value }))}
              />
              <Input
                placeholder="Organization"
                value={newExp.organization}
                onChange={(e) => setNewExp(prev => ({ ...prev, organization: e.target.value }))}
              />
              <Input
                placeholder="Duration (e.g., Jun 2024 - Aug 2024)"
                value={newExp.duration}
                onChange={(e) => setNewExp(prev => ({ ...prev, duration: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button onClick={addExperience} size="sm" className="bg-blue-400 hover:bg-blue-500">
                  Add Experience
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Experience
            </Button>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-400 hover:bg-blue-500">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SkillsEditModal = ({ isOpen, onClose, data, onSave, title, type }) => {
  const [skills, setSkills] = useState(data || []);
  const [newSkill, setNewSkill] = useState({ name: '', level: 1 });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setSkills(data || []);
  }, [data]);

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, { ...newSkill, id: Date.now(), verified: false, processing: true }]);
      setNewSkill({ name: '', level: 1 });
      setIsAdding(false);
    }
  };

  const deleteSkill = (id) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const updateSkillLevel = (id, level) => {
    setSkills(skills.map(skill => skill.id === id ? { ...skill, level } : skill));
  };

  const handleSubmit = () => {
    onSave(skills);
    toast({
      title: `${title} Updated`,
      description: "Your skills are being processed for verification.",
    });
    onClose();
  };

  const renderStars = (level, skillId, editable = false) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        disabled={!editable}
        onClick={() => editable && updateSkillLevel(skillId, i + 1)}
        className={`w-4 h-4 ${i < level ? 'text-[#FFD700]' : 'text-gray-300'} ${editable ? 'hover:text-[#FFD700] cursor-pointer' : ''}`}
      >
        ★
      </button>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <div key={skill.id || index} className={`p-4 border rounded-lg ${skill.enabled === false ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium" style={{ color: '#6A0DAD' }}>{skill.name}</span>
                    {skill.processing ? (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    ) : skill.verified && (
                      <Badge className="bg-[#28A745] hover:bg-[#28A745]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(skill.level, skill.id || index, true)}
                  </div>
                </div>
                <Button
                  variant={skill.enabled === false ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setSkills(skills.map((s, i) => ((s.id !== undefined ? s.id : i) === (skill.id !== undefined ? skill.id : index) ? { ...s, enabled: s.enabled === false ? true : false } : s)))}
                  className={skill.enabled === false ? 'text-gray-500 border-gray-400' : 'bg-emerald-500 text-white'}
                >
                  {(skill.enabled === undefined || skill.enabled) ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
          
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
              <Input
                placeholder={`${type} name`}
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
              />
              <div className="flex items-center gap-2">
                <Label>Level:</Label>
                <div className="flex gap-1">
                  {renderStars(newSkill.level, 'new', true)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addSkill} size="sm" className="bg-blue-400 hover:bg-blue-500">
                  Add {type}
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New {type}
            </Button>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-400 hover:bg-blue-500">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};