import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    CalendarIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentArrowUpIcon,
    EllipsisVerticalIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import {
    createAssignment,
    getAssignmentsByEducator,
    updateAssignment,
    deleteAssignment,
    addAssignmentAttachment,
    assignToStudents,
    getAssignmentStatistics
} from '../../services/educator/assignmentsService';
import { supabase } from '../../lib/supabaseClient';
import StudentSelectionModal from '../../components/educator/StudentSelectionModal';

// Configuration
const SKILL_AREAS = ['Creativity', 'Collaboration', 'Critical Thinking', 'Leadership', 'Communication', 'Problem Solving'];
const CLASSES = ['Class 9A', 'Class 9B', 'Class 10A', 'Class 10B', 'Class 11A', 'Class 12A'];

// Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        Active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        Draft: 'bg-gray-100 text-gray-700 border-gray-300',
        Closed: 'bg-rose-100 text-rose-700 border-rose-300'
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || colors.Draft}`}>
            {status}
        </span>
    );
};

// Progress Bar Component
const ProgressBar = ({ current, total, color = 'emerald' }: { current: number; total: number; color?: string }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Submissions</span>
                <span>{current}/{total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
};

// Task Card Component
const TaskCard = ({ task, onView, onEdit, onAssess, onDelete, onAssignStudents }) => {
    const [showActions, setShowActions] = useState(false);
    const completionRate = task.totalStudents > 0 ? ((task.submissions / task.totalStudents) * 100).toFixed(0) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{task.title}</h3>
                        <StatusBadge status={task.status} />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    {showActions && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button onClick={() => { onView(task); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <EyeIcon className="h-4 w-4" /> View Details
                            </button>
                            <button onClick={() => { onEdit(task); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <PencilIcon className="h-4 w-4" /> Edit Task
                            </button>
                            <button onClick={() => { onAssess(task); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <ClipboardDocumentListIcon className="h-4 w-4" /> Assess
                            </button>
                            <button onClick={() => { onAssignStudents(task); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <UsersIcon className="h-4 w-4" /> Assign Students
                            </button>
                            <button onClick={() => { onDelete(task); setShowActions(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
                {task.skillTags.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <UsersIcon className="h-4 w-4" />
                        <span>{task.assignedTo.length} class(es)</span>
                    </div>
                </div>

                <ProgressBar current={task.submissions} total={task.totalStudents} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                        <span>{completionRate}%</span>
                    </div>
                    {task.averageScore > 0 && (
                        <div className="flex items-center gap-1 text-gray-600">
                            <StarSolid className="h-4 w-4 text-yellow-400" />
                            <span>{task.averageScore}</span>
                        </div>
                    )}
                </div>
                {task.pending > 0 && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                        {task.pending} pending
                    </span>
                )}
            </div>
        </div>
    );
};

// Main Component
const Assessments = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [skillFilter, setSkillFilter] = useState('All');
    const [classFilter, setClassFilter] = useState('All');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [currentEducatorId, setCurrentEducatorId] = useState(null);
    const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false);
    const [newlyCreatedAssignmentId, setNewlyCreatedAssignmentId] = useState(null);

    // New Task Form State - Matching database schema
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        instructions: '',
        courseName: '',
        courseCode: '',
        totalPoints: 100,
        assignmentType: 'project',
        status: 'Draft',
        skillTags: [] as string[],
        assignedTo: [] as string[],
        deadline: '',
        availableFrom: '',
        allowLateSubmissions: true,
        attachments: [],
        documentPdf: ''
    });
    const [additionalSkills, setAdditionalSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState('');
    const allSkills = useMemo(() => [...SKILL_AREAS, ...additionalSkills], [additionalSkills]);

    // Fetch current educator and their assignments
    useEffect(() => {
        const fetchEducatorAndTasks = async () => {
            try {
                setLoading(true);
                
                // Try to get current user, but don't fail if not authenticated
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                // If no authenticated user, check for development mode or use fallback
                if (!user || authError) {
                    console.log('No authenticated user, starting with empty assignments');
                    // For development: allow using a test educator ID from localStorage
                    const devEducatorId = localStorage.getItem('dev_educator_id');
                    if (devEducatorId) {
                        console.log('Using development educator ID:', devEducatorId);
                        setCurrentEducatorId(devEducatorId);
                        // Try to fetch assignments with dev ID
                        try {
                            const assignments = await getAssignmentsByEducator(devEducatorId);
                            const transformedTasks = await Promise.all(assignments.map(async (assignment) => {
                                const stats = await getAssignmentStatistics(assignment.assignment_id);
                                return {
                                    id: assignment.assignment_id,
                                    title: assignment.title,
                                    description: assignment.description || '',
                                    skillTags: assignment.skill_outcomes || [],
                                    status: assignment.is_deleted ? 'Closed' : 'Active',
                                    assignedTo: assignment.assign_classes ? [assignment.assign_classes] : [],
                                    deadline: assignment.due_date,
                                    submissions: stats.submitted + stats.graded,
                                    pending: stats.submitted,
                                    averageScore: stats.averageGrade,
                                    totalStudents: stats.total,
                                    attachments: assignment.assignment_attachments?.map(a => a.file_name) || [],
                                    rubric: []
                                };
                            }));
                            setTasks(transformedTasks);
                        } catch (err) {
                            console.log('No assignments found for dev educator');
                            setTasks([]);
                        }
                    } else {
                        setCurrentEducatorId(null);
                        setTasks([]);
                    }
                    setError(null);
                    setLoading(false);
                    return;
                }
                
                setCurrentEducatorId(user.id);
                
                // Fetch assignments for this educator
                const assignments = await getAssignmentsByEducator(user.id);
                
                // Transform assignments to match the component's expected format
                const transformedTasks = await Promise.all(assignments.map(async (assignment) => {
                    // Fetch statistics for each assignment
                    const stats = await getAssignmentStatistics(assignment.assignment_id);
                    
                    return {
                        id: assignment.assignment_id,
                        title: assignment.title,
                        description: assignment.description || '',
                        skillTags: assignment.skill_outcomes || [],
                        status: assignment.is_deleted ? 'Closed' : 'Active', // Map to UI status
                        assignedTo: assignment.assign_classes ? [assignment.assign_classes] : [],
                        deadline: assignment.due_date,
                        submissions: stats.submitted + stats.graded,
                        pending: stats.submitted,
                        averageScore: stats.averageGrade,
                        totalStudents: stats.total,
                        attachments: assignment.assignment_attachments?.map(a => a.file_name) || [],
                        rubric: [] // You can add rubric data if stored
                    };
                }));
                
                setTasks(transformedTasks);
                setError(null);
            } catch (err) {
                console.error('Error fetching assignments:', err);
                setError('Failed to load assignments');
            } finally {
                setLoading(false);
            }
        };
        
        fetchEducatorAndTasks();
    }, []);

    // Filtered Tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
            const matchesSkill = skillFilter === 'All' || task.skillTags.includes(skillFilter);
            const matchesClass = classFilter === 'All' || task.assignedTo.some(c => c === classFilter);

            return matchesSearch && matchesStatus && matchesSkill && matchesClass;
        });
    }, [tasks, searchQuery, statusFilter, skillFilter, classFilter]);

    // Analytics Data
    const analytics = useMemo(() => {
        const activeTasks = tasks.filter(t => t.status === 'Active').length;
        const totalSubmissions = tasks.reduce((sum, t) => sum + t.submissions, 0);
        const totalPending = tasks.reduce((sum, t) => sum + t.pending, 0);
        const avgScore = tasks.filter(t => t.submissions > 0).reduce((sum, t) => sum + t.averageScore, 0) /
            tasks.filter(t => t.submissions > 0).length || 0;

        return { activeTasks, totalSubmissions, totalPending, avgScore: avgScore.toFixed(1) };
    }, [tasks]);

    const handleCreateTask = async () => {
        try {
            // Get current user info or use dev educator ID
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            // Determine educator ID (auth user, current state, or dev mode)
            let educatorId = currentEducatorId;
            let educatorName = 'Educator';
            
            if (user && !authError) {
                // Use authenticated user
                educatorId = user.id;
                educatorName = user.email || 'Educator';
            } else if (!educatorId) {
                // Check for dev educator ID or generate one
                const devEducatorId = localStorage.getItem('dev_educator_id');
                if (devEducatorId) {
                    educatorId = devEducatorId;
                    educatorName = 'Dev Educator';
                } else {
                    // Generate a new dev educator ID
                    const newDevId = crypto.randomUUID();
                    localStorage.setItem('dev_educator_id', newDevId);
                    educatorId = newDevId;
                    educatorName = 'Dev Educator';
                    setCurrentEducatorId(newDevId);
                    console.log('Generated new dev educator ID:', newDevId);
                }
            }
            
            if (!educatorId) {
                alert('Unable to determine educator ID');
                return;
            }
            
            // Create assignment in database
            const assignmentData = {
                title: newTask.title,
                description: newTask.description,
                instructions: newTask.instructions || newTask.description,
                course_name: newTask.courseName || 'General',
                course_code: newTask.courseCode || '',
                educator_id: educatorId,
                educator_name: educatorName,
                total_points: newTask.totalPoints,
                assignment_type: newTask.assignmentType,
                skill_outcomes: newTask.skillTags,
                assign_classes: newTask.assignedTo.join(', '),
                document_pdf: newTask.documentPdf || null,
                due_date: newTask.deadline,
                available_from: newTask.availableFrom || new Date().toISOString(),
                allow_late_submission: newTask.allowLateSubmissions
            };
            
            const createdAssignment = await createAssignment(assignmentData);
            
            // Add attachments if any
            for (const attachment of newTask.attachments) {
                await addAssignmentAttachment(createdAssignment.assignment_id, {
                    file_name: attachment,
                    file_type: 'application/pdf',
                    file_size: 0,
                    file_url: ''
                });
            }
            
            // Transform to UI format
            const uiTask = {
                id: createdAssignment.assignment_id,
                title: createdAssignment.title,
                description: createdAssignment.description || '',
                skillTags: createdAssignment.skill_outcomes || [],
                status: newTask.status,
                assignedTo: newTask.assignedTo,
                deadline: createdAssignment.due_date,
                submissions: 0,
                pending: 0,
                averageScore: 0,
                totalStudents: 0,
                attachments: newTask.attachments,
                rubric: newTask.rubric
            };
            
            setTasks([...tasks, uiTask]);
            setShowTaskModal(false);
            
            // Open student selection modal after creating assignment
            setNewlyCreatedAssignmentId(createdAssignment.assignment_id);
            setShowStudentSelectionModal(true);
        } catch (err) {
            console.error('Error creating assignment:', err);
            alert('Failed to create assignment. Please try again.');
        }
    };

    const resetTaskForm = () => {
        setNewTask({
            title: '',
            description: '',
            instructions: '',
            courseName: '',
            courseCode: '',
            totalPoints: 100,
            assignmentType: 'project',
            status: 'Draft',
            skillTags: [] as string[],
            assignedTo: [] as string[],
            deadline: '',
            availableFrom: '',
            allowLateSubmissions: true,
            attachments: [],
            documentPdf: ''
        });
        setAdditionalSkills([]);
        setCustomSkill('');
    };

    const handleSkillToggle = (skill: string) => {
        setNewTask(prev => ({
            ...prev,
            skillTags: prev.skillTags.includes(skill)
                ? prev.skillTags.filter(s => s !== skill)
                : [...prev.skillTags, skill]
        }));
    };

    const handleAddCustomSkill = () => {
        const trimmedSkill = customSkill.trim();
        if (!trimmedSkill) {
            return;
        }
        if (!allSkills.includes(trimmedSkill)) {
            setAdditionalSkills(prev => [...prev, trimmedSkill]);
        }
        setNewTask(prev => ({
            ...prev,
            skillTags: prev.skillTags.includes(trimmedSkill)
                ? prev.skillTags
                : [...prev.skillTags, trimmedSkill]
        }));
        setCustomSkill('');
    };

    const handleClassToggle = (className: string) => {
        setNewTask(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(className)
                ? prev.assignedTo.filter(c => c !== className)
                : [...prev.assignedTo, className]
        }));
    };

    const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        if (!files.length) {
            return;
        }
        setNewTask(prev => ({
            ...prev,
            attachments: Array.from(new Set([
                ...prev.attachments,
                ...files.map(file => file.name)
            ]))
        }));
        event.target.value = '';
    };

    const handleStudentsAssigned = async (studentIds: string[]) => {
        try {
            if (newlyCreatedAssignmentId && studentIds.length > 0) {
                await assignToStudents(newlyCreatedAssignmentId, studentIds);
                
                // Refresh assignment statistics
                const stats = await getAssignmentStatistics(newlyCreatedAssignmentId);
                
                // Update the task in the list with new student count
                setTasks(prev => prev.map(task => 
                    task.id === newlyCreatedAssignmentId 
                        ? { ...task, totalStudents: stats.total }
                        : task
                ));
                
                console.log(`Assigned ${studentIds.length} students to assignment ${newlyCreatedAssignmentId}`);
            }
            
            setShowStudentSelectionModal(false);
            setNewlyCreatedAssignmentId(null);
            resetTaskForm();
        } catch (err) {
            console.error('Error assigning students:', err);
            alert('Failed to assign students. Please try again.');
        }
    };

    const handleStudentSelectionClose = () => {
        setShowStudentSelectionModal(false);
        setNewlyCreatedAssignmentId(null);
        resetTaskForm();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Skill Tasks</h1>
                        <p className="text-sm text-gray-600 mt-1">Create, manage, and evaluate skill-based challenges</p>
                    </div>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
                    >
                        <PlusIcon className="h-5 w-5" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="All">All Skills</option>
                        {SKILL_AREAS.map((skill: string) => (
                            <option key={skill} value={skill}>{skill}</option>
                        ))}
                    </select>

                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="All">All Classes</option>
                        {CLASSES.map((cls: string) => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setSkillFilter('All');
                            setClassFilter('All');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Tasks</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.activeTasks}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <ClipboardDocumentListIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.totalSubmissions}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.totalPending}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <ClockIcon className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.avgScore}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <StarSolid className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Grid */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ArrowPathIcon className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading assignments...</h3>
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-red-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-900 mb-2">Error loading assignments</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-4">Create your first skill task to start tracking student progress</p>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Create Task
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onView={(task) => {
                                setSelectedTask(task);
                                setShowDetailDrawer(true);
                            }}
                            onEdit={(task) => {
                                setSelectedTask(task);
                                setShowTaskModal(true);
                            }}
                            onAssess={(task) => alert(`Opening assessment for: ${task.title}`)}
                            onAssignStudents={(task) => {
                                setNewlyCreatedAssignmentId(task.id);
                                setShowStudentSelectionModal(true);
                            }}
                            onDelete={async (task) => {
                                if (confirm(`Delete task "${task.title}"?`)) {
                                    try {
                                        await deleteAssignment(task.id);
                                        setTasks(tasks.filter(t => t.id !== task.id));
                                    } catch (err) {
                                        console.error('Error deleting assignment:', err);
                                        alert('Failed to delete assignment');
                                    }
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Task Creation Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedTask ? 'Edit Task' : 'Create New Task'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowTaskModal(false);
                                    setSelectedTask(null);
                                    resetTaskForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="e.g., Creative Problem Solving Challenge"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Brief overview of the assignment"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                        <textarea
                                            value={newTask.instructions}
                                            onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Detailed instructions for students..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Course Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Course Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                                        <input
                                            type="text"
                                            value={newTask.courseName}
                                            onChange={(e) => setNewTask({ ...newTask, courseName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="e.g., Web Development"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                                        <input
                                            type="text"
                                            value={newTask.courseCode}
                                            onChange={(e) => setNewTask({ ...newTask, courseCode: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="e.g., CS301"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Assignment Configuration */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment Configuration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type *</label>
                                        <select
                                            value={newTask.assignmentType}
                                            onChange={(e) => setNewTask({ ...newTask, assignmentType: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="homework">Homework</option>
                                            <option value="project">Project</option>
                                            <option value="quiz">Quiz</option>
                                            <option value="exam">Exam</option>
                                            <option value="lab">Lab</option>
                                            <option value="essay">Essay</option>
                                            <option value="presentation">Presentation</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Points *</label>
                                        <input
                                            type="number"
                                            value={newTask.totalPoints}
                                            onChange={(e) => setNewTask({ ...newTask, totalPoints: parseFloat(e.target.value) || 100 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            min="0"
                                            step="0.01"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Schedule</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                                        <input
                                            type="datetime-local"
                                            value={newTask.availableFrom}
                                            onChange={(e) => setNewTask({ ...newTask, availableFrom: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                        <input
                                            type="datetime-local"
                                            value={newTask.deadline}
                                            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newTask.allowLateSubmissions}
                                            onChange={(e) => setNewTask({ ...newTask, allowLateSubmissions: e.target.checked })}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-700">Allow late submissions</span>
                                    </label>
                                </div>
                            </div>

                            {/* Skill Outcomes */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Skill Outcomes</h3>
                                <div className="flex flex-wrap gap-2">
                                    {allSkills.map((skill: string) => (
                                        <button
                                            key={skill}
                                            onClick={() => handleSkillToggle(skill)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${newTask.skillTags.includes(skill)
                                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                                                }`}
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={customSkill}
                                        onChange={(e) => setCustomSkill(e.target.value)}
                                        placeholder="Add custom skill"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomSkill}
                                        disabled={!customSkill.trim()}
                                        className="p-2 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Assignment */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Assign to Classes</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {CLASSES.map((cls: string) => (
                                        <label key={cls} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newTask.assignedTo.includes(cls)}
                                                onChange={() => handleClassToggle(cls)}
                                                className="rounded text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-gray-700">{cls}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
                                <label className="flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-2xl text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                                    <DocumentArrowUpIcon className="h-6 w-6 text-emerald-500 mb-2" />
                                    <span className="text-sm font-medium text-emerald-700">Upload PDF or Word documents</span>
                                    <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX files supported</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        multiple
                                        onChange={handleAttachmentChange}
                                        className="hidden"
                                    />
                                </label>
                                {newTask.attachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {newTask.attachments.map((file: string, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-sm text-gray-700 truncate">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowTaskModal(false);
                                        setSelectedTask(null);
                                        resetTaskForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    disabled={!newTask.title || !newTask.courseName || !newTask.deadline || newTask.skillTags.length === 0 || newTask.assignedTo.length === 0}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {newTask.status === 'Active' ? 'Publish Assignment' : 'Save as Draft'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            {showDetailDrawer && selectedTask && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailDrawer(false)} />
                    <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                                <StatusBadge status={selectedTask.status} />
                            </div>
                            <button
                                onClick={() => setShowDetailDrawer(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                                    <p className="text-sm text-gray-600">{selectedTask.description}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Skill Outcomes</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTask.skillTags.map((skill: string) => (
                                            <span key={skill} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Assigned Classes</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTask.assignedTo.map((cls: string) => (
                                            <span key={cls} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200">
                                                {cls}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Deadline</p>
                                        <p className="text-sm font-semibold text-gray-900">{new Date(selectedTask.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Total Students</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedTask.totalStudents}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Progress Overview</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600">Submissions</span>
                                                <span className="font-semibold text-gray-900">{selectedTask.submissions}/{selectedTask.totalStudents}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-emerald-500 h-3 rounded-full"
                                                    style={{ width: `${(selectedTask.submissions / selectedTask.totalStudents) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                                <p className="text-2xl font-bold text-green-700">{selectedTask.submissions}</p>
                                                <p className="text-xs text-green-600 mt-1">Submitted</p>
                                            </div>
                                            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                <p className="text-2xl font-bold text-amber-700">{selectedTask.pending}</p>
                                                <p className="text-xs text-amber-600 mt-1">Pending Review</p>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-2xl font-bold text-blue-700">{selectedTask.averageScore}</p>
                                                <p className="text-xs text-blue-600 mt-1">Avg Score</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Rubric Criteria</h3>
                                    <div className="space-y-2">
                                        {selectedTask.rubric.map((r: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">{r.criteria}</span>
                                                <span className="text-sm font-semibold text-gray-900">{r.weight}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
                                    <div className="space-y-2">
                                        {selectedTask.attachments.map((file: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                                <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-sm text-gray-700">{file}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => alert(`Assessing submissions for: ${selectedTask.title}`)}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                >
                                    Assess Submissions
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailDrawer(false);
                                        setShowTaskModal(true);
                                    }}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Edit Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Selection Modal */}
            {showStudentSelectionModal && newlyCreatedAssignmentId && (
                <StudentSelectionModal
                    isOpen={showStudentSelectionModal}
                    onClose={handleStudentSelectionClose}
                    onAssign={handleStudentsAssigned}
                    assignmentId={newlyCreatedAssignmentId}
                />
            )}
        </div>
    );
};

export default Assessments;
