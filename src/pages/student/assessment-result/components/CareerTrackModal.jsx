import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Target, Briefcase, BookOpen, TrendingUp, CheckCircle, ExternalLink, Download, Bell, ChevronRight } from 'lucide-react';

/**
 * Career Track Modal Component
 * Multi-step wizard with VERTICAL sidebar navigation
 * Steps: Role Selection → Overview → Roadmap → Courses → Strengths → Get Started
 */
const CareerTrackModal = ({ selectedTrack, onClose, skillGap, roadmap, results }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [currentPage, setCurrentPage] = useState(0); // 0 = role selection, 1-5 = wizard pages

    const accentColor = selectedTrack.index === 0 ? '#2563eb' : 
                       selectedTrack.index === 1 ? '#3b82f6' : '#60a5fa';

    const pages = [
        { id: 1, title: 'Overview', subtitle: 'Why You Fit', icon: Target },
        { id: 2, title: 'Roadmap', subtitle: '6-Month Plan', icon: TrendingUp },
        { id: 3, title: 'Courses', subtitle: 'Learn & Grow', icon: BookOpen },
        { id: 4, title: 'Strengths', subtitle: 'Your Plan', icon: Zap },
        { id: 5, title: 'Get Started', subtitle: 'Take Action', icon: ChevronRight }
    ];

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setCurrentPage(1);
    };

    const goToNextPage = () => {
        if (currentPage < 5) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else if (currentPage === 1) {
            setCurrentPage(0);
            setSelectedRole(null);
        }
    };

    const goToPage = (pageId) => {
        if (pageId <= currentPage || pageId === currentPage + 1) {
            setCurrentPage(pageId);
        }
    };

    const getRoleName = (role) => {
        if (typeof role === 'string') return role;
        return role?.name || '';
    };

    const getSalary = (role) => {
        if (typeof role === 'object' && role?.salary) {
            return `₹${role.salary.min}L - ₹${role.salary.max}L`;
        }
        return null;
    };

    const RIASEC_NAMES = {
        R: 'Realistic',
        I: 'Investigative', 
        A: 'Artistic',
        S: 'Social',
        E: 'Enterprising',
        C: 'Conventional'
    };

    const getPlatformCourses = () => {
        if (!results?.platformCourses) return [];
        return results.platformCourses.slice(0, 4);
    };

    const getRoadmapProjects = () => {
        if (!roadmap?.projects) return [];
        return roadmap.projects.slice(0, 3);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-[95vw] h-[90vh] max-w-7xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden flex"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Left Sidebar - Vertical Steps (only show when in wizard) */}
                {currentPage > 0 && (
                    <div className="w-64 shrink-0 bg-black/20 border-r border-white/10 p-6 flex flex-col">
                        {/* Header in sidebar */}
                        <div className="mb-6 pb-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {selectedTrack.index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span 
                                        className="inline-block px-2 py-0.5 text-white text-[10px] font-semibold rounded-full mb-0.5"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {selectedTrack.fitType}
                                    </span>
                                    <h3 className="text-sm font-semibold text-white truncate">
                                        {getRoleName(selectedRole)}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Steps */}
                        <div className="flex-1 space-y-2">
                            {pages.map((page, idx) => {
                                const Icon = page.icon;
                                const isActive = currentPage === page.id;
                                const isCompleted = currentPage > page.id;
                                const isClickable = page.id <= currentPage || page.id === currentPage + 1;
                                
                                return (
                                    <div key={page.id} className="relative">
                                        <button
                                            onClick={() => isClickable && goToPage(page.id)}
                                            disabled={!isClickable}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                                                isActive 
                                                    ? 'bg-white text-slate-900' 
                                                    : isCompleted
                                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                                        : isClickable
                                                            ? 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            : 'bg-transparent text-white/30 cursor-not-allowed'
                                            }`}
                                        >
                                            <div 
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isActive 
                                                        ? 'bg-slate-900 text-white' 
                                                        : isCompleted
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-white/10'
                                                }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Icon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${isActive ? 'text-slate-900' : ''}`}>
                                                    {page.title}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-slate-600' : 'text-white/40'}`}>
                                                    {page.subtitle}
                                                </p>
                                            </div>
                                        </button>
                                        
                                        {/* Connector line */}
                                        {idx < pages.length - 1 && (
                                            <div className="absolute left-[1.625rem] top-[3.25rem] w-0.5 h-2 bg-white/10" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Back to roles button */}
                        <button
                            onClick={() => { setCurrentPage(0); setSelectedRole(null); }}
                            className="mt-4 w-full py-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            ← Change Role
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Content Header - Only for role selection */}
                    {currentPage === 0 && (
                        <div className="p-6 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {selectedTrack.index + 1}
                                </div>
                                <div>
                                    <span 
                                        className="inline-block px-3 py-1 text-white text-xs font-semibold rounded-full mb-1"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {selectedTrack.fitType}
                                    </span>
                                    <h2 className="text-xl md:text-2xl font-bold text-white">
                                        {selectedTrack.cluster?.title}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {/* Page 0: Role Selection */}
                        {currentPage === 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        Choose Your Career Role
                                    </h3>
                                    <p className="text-gray-400">
                                        Select a role to view the detailed career roadmap and learning path
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                                    {selectedTrack.specificRoles?.map((role, idx) => {
                                        const roleName = getRoleName(role);
                                        const salary = getSalary(role);
                                        return (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ scale: 1.02, y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleRoleSelect(role)}
                                                className="p-5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div 
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                                                        style={{ backgroundColor: accentColor }}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-white font-semibold mb-1">{roleName}</h4>
                                                        {salary && (
                                                            <p className="text-green-400 text-sm">{salary}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-end text-white/60 text-sm">
                                                    <span>Explore Role</span>
                                                    <span className="ml-1">→</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Page 1: Role Overview & Why You Fit */}
                        {currentPage === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Role Title & Salary */}
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        {getRoleName(selectedRole)}
                                    </h3>
                                    {getSalary(selectedRole) && (
                                        <p className="text-green-400 text-lg font-medium">
                                            {getSalary(selectedRole)} per annum
                                        </p>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* What This Role Does */}
                                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                                        <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5" style={{ color: accentColor }} />
                                            What You'll Do
                                        </h4>
                                        <p className="text-gray-300 text-sm leading-relaxed mb-3">
                                            {selectedTrack.cluster?.whatYoullDo || selectedTrack.cluster?.description || 
                                            `As a ${getRoleName(selectedRole)}, you'll work on exciting projects that match your interests and skills.`}
                                        </p>
                                        <ul className="space-y-2 text-sm text-gray-400">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                <span>Design and develop solutions</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                <span>Collaborate with cross-functional teams</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                                <span>Continuously learn and grow</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Why You're a Good Fit */}
                                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                                        <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                            <Target className="w-5 h-5" style={{ color: accentColor }} />
                                            Why You're a Good Fit
                                        </h4>
                                        <p className="text-gray-300 text-sm leading-relaxed mb-3">
                                            {selectedTrack.cluster?.whyItFits || 
                                            `Based on your assessment, your interests and aptitudes align well with this career path.`}
                                        </p>
                                        
                                        {results?.riasec?.topThree && (
                                            <div className="mb-3">
                                                <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Your Interest Profile</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.riasec.topThree.slice(0, 3).map((code, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="px-2 py-1 rounded-full text-xs font-medium"
                                                            style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                                                        >
                                                            {RIASEC_NAMES[code] || code}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {results?.aptitude?.topStrengths && (
                                            <div>
                                                <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Your Aptitude Strengths</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.aptitude.topStrengths.slice(0, 3).map((strength, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400"
                                                        >
                                                            {strength}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Industry Demand & Career Progression */}
                                <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                                        <h4 className="text-base font-semibold text-green-400 mb-2 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            Industry Demand
                                        </h4>
                                        <p className="text-gray-300 text-sm mb-3">
                                            High demand in the job market with growing opportunities.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-400 rounded-full" style={{ width: '85%' }} />
                                            </div>
                                            <span className="text-green-400 text-sm font-medium">High</span>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                                        <h4 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                                            Career Progression
                                        </h4>
                                        <div className="flex items-center justify-between text-sm mt-4">
                                            <div className="text-center">
                                                <div className="w-3 h-3 rounded-full bg-white mx-auto mb-1" />
                                                <span className="text-white text-xs">Junior</span>
                                            </div>
                                            <div className="flex-1 h-0.5 bg-white/20 mx-2" />
                                            <div className="text-center">
                                                <div className="w-3 h-3 rounded-full bg-white/50 mx-auto mb-1" />
                                                <span className="text-white/60 text-xs">Mid</span>
                                            </div>
                                            <div className="flex-1 h-0.5 bg-white/20 mx-2" />
                                            <div className="text-center">
                                                <div className="w-3 h-3 rounded-full bg-white/30 mx-auto mb-1" />
                                                <span className="text-white/40 text-xs">Senior</span>
                                            </div>
                                            <div className="flex-1 h-0.5 bg-white/20 mx-2" />
                                            <div className="text-center">
                                                <div className="w-3 h-3 rounded-full bg-white/20 mx-auto mb-1" />
                                                <span className="text-white/30 text-xs">Lead</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Page 2: 6-Month Learning Roadmap */}
                        {currentPage === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        6-Month Learning Roadmap
                                    </h3>
                                    <p className="text-gray-400">
                                        Your personalized path to becoming a {getRoleName(selectedRole)}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { 
                                            month: 'Month 1-2', 
                                            title: 'Foundation Building', 
                                            desc: 'Learn core concepts and fundamentals',
                                            tasks: ['Complete foundational courses', 'Understand key concepts', 'Set up learning environment', 'Join communities'],
                                            color: '#22c55e'
                                        },
                                        { 
                                            month: 'Month 3-4', 
                                            title: 'Skill Development', 
                                            desc: 'Build practical skills through projects',
                                            tasks: ['Work on guided projects', 'Practice real-world scenarios', 'Build portfolio piece', 'Get mentor feedback'],
                                            color: '#3b82f6'
                                        },
                                        { 
                                            month: 'Month 5-6', 
                                            title: 'Portfolio & Applications', 
                                            desc: 'Create portfolio and apply for positions',
                                            tasks: ['Complete 2-3 portfolio projects', 'Optimize resume & LinkedIn', 'Apply for internships/jobs', 'Prepare for interviews'],
                                            color: '#a855f7'
                                        }
                                    ].map((phase, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div 
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                    style={{ backgroundColor: phase.color }}
                                                >
                                                    {idx + 1}
                                                </div>
                                                {idx < 2 && <div className="w-0.5 flex-1 bg-white/20 mt-2" />}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <span className="text-xs uppercase tracking-wider" style={{ color: phase.color }}>{phase.month}</span>
                                                <h4 className="text-base font-semibold text-white">{phase.title}</h4>
                                                <p className="text-gray-400 text-sm">{phase.desc}</p>
                                                <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <ul className="grid grid-cols-2 gap-2">
                                                        {phase.tasks.map((task, taskIdx) => (
                                                            <li key={taskIdx} className="flex items-start gap-2 text-sm text-gray-300">
                                                                <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: phase.color }} />
                                                                <span>{task}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {getRoadmapProjects().length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-base font-semibold text-white mb-3">Suggested Projects</h4>
                                        <div className="grid md:grid-cols-3 gap-3">
                                            {getRoadmapProjects().map((project, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <h5 className="text-white font-medium text-sm">{project.title}</h5>
                                                    {project.description && (
                                                        <p className="text-gray-400 text-xs mt-1">{project.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Page 3: Recommended Courses & Resources */}
                        {currentPage === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        Recommended Courses & Resources
                                    </h3>
                                    <p className="text-gray-400">
                                        Curated learning resources to help you succeed as a {getRoleName(selectedRole)}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                                        Rareminds Courses
                                    </h4>
                                    
                                    {getPlatformCourses().length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {getPlatformCourses().map((course, idx) => (
                                                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h5 className="text-white font-semibold text-sm">{course.title || course.name}</h5>
                                                            {course.duration && <p className="text-gray-400 text-xs mt-1">{course.duration}</p>}
                                                        </div>
                                                        {course.level && (
                                                            <span className="px-2 py-1 rounded text-xs font-medium shrink-0" style={{ backgroundColor: `${accentColor}30`, color: accentColor }}>
                                                                {course.level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {course.description && <p className="text-gray-400 text-xs mt-2 line-clamp-2">{course.description}</p>}
                                                    {course.skills && course.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {course.skills.slice(0, 3).map((skill, sIdx) => (
                                                                <span key={sIdx} className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-300">{skill}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {[
                                                { title: 'Fundamentals Course', duration: '4 weeks', level: 'Beginner' },
                                                { title: 'Advanced Skills', duration: '6 weeks', level: 'Intermediate' },
                                                { title: 'Project-Based Learning', duration: '8 weeks', level: 'Advanced' },
                                                { title: 'Industry Certification', duration: '4 weeks', level: 'Professional' }
                                            ].map((course, idx) => (
                                                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h5 className="text-white font-semibold text-sm">{course.title}</h5>
                                                            <p className="text-gray-400 text-xs mt-1">{course.duration}</p>
                                                        </div>
                                                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${accentColor}30`, color: accentColor }}>
                                                            {course.level}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                    <ExternalLink className="w-5 h-5" style={{ color: accentColor }} />
                                    Free Resources & Tools
                                </h4>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                        <h5 className="text-white font-medium text-sm mb-1">YouTube Channels</h5>
                                        <p className="text-gray-400 text-xs">Free video tutorials from industry experts</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                        <h5 className="text-white font-medium text-sm mb-1">Documentation</h5>
                                        <p className="text-gray-400 text-xs">Official docs and guides for tools</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                        <h5 className="text-white font-medium text-sm mb-1">Certifications</h5>
                                        <p className="text-gray-400 text-xs">Industry-recognized certifications</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Page 4: Strengths & Growth Plan */}
                        {currentPage === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        Your Strengths & Growth Plan
                                    </h3>
                                    <p className="text-gray-400">
                                        Personalized insights based on your assessment results
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <h4 className="text-base font-semibold text-green-400 mb-3 flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Strengths to Leverage
                                        </h4>
                                        <ul className="space-y-2">
                                            {(skillGap?.strengths || results?.aptitude?.topStrengths || ['Analytical thinking', 'Problem solving', 'Communication']).slice(0, 4).map((strength, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                                    {typeof strength === 'string' ? strength : strength?.skill || 'Strength'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <h4 className="text-base font-semibold text-amber-400 mb-3 flex items-center gap-2">
                                            <Target className="w-5 h-5" />
                                            Skills to Develop
                                        </h4>
                                        <ul className="space-y-2">
                                            {(skillGap?.priorityA || [{ skill: 'Technical skills' }, { skill: 'Industry knowledge' }, { skill: 'Practical experience' }]).slice(0, 4).map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                    {typeof item === 'string' ? item : item?.skill || 'Skill'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-6">
                                    <h4 className="text-base font-semibold text-white mb-4">Immediate Action Items</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[
                                            { num: 1, title: 'Start Learning', desc: 'Enroll in foundational course' },
                                            { num: 2, title: 'Build Daily Habits', desc: 'Dedicate 1-2 hours daily' },
                                            { num: 3, title: 'Join Communities', desc: 'Connect with others in your field' },
                                            { num: 4, title: 'Track Progress', desc: 'Set weekly goals and review' }
                                        ].map((item) => (
                                            <div key={item.num} className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: accentColor }}>{item.num}</div>
                                                <div>
                                                    <h5 className="text-white font-medium text-sm">{item.title}</h5>
                                                    <p className="text-gray-400 text-xs">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="text-base font-semibold text-white mb-3">Development Timeline</h4>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="text-center">
                                            <div className="w-4 h-4 rounded-full bg-green-400 mx-auto mb-1" />
                                            <span className="text-white font-medium text-xs">Now</span>
                                        </div>
                                        <div className="flex-1 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-3 rounded-full" />
                                        <div className="text-center">
                                            <div className="w-4 h-4 rounded-full bg-blue-400 mx-auto mb-1" />
                                            <span className="text-white/80 text-xs">3 Mo</span>
                                        </div>
                                        <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-3 rounded-full" />
                                        <div className="text-center">
                                            <div className="w-4 h-4 rounded-full bg-purple-400 mx-auto mb-1" />
                                            <span className="text-white/60 text-xs">6 Mo</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Page 5: Get Started (CTA) */}
                        {currentPage === 5 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        Ready to Begin Your Journey?
                                    </h3>
                                    <p className="text-gray-400">
                                        Take the first step towards becoming a {getRoleName(selectedRole)}
                                    </p>
                                </div>

                                <div className="max-w-xl">
                                    <div className="p-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 mb-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: accentColor }}>
                                                {selectedTrack.index + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-white">{getRoleName(selectedRole)}</h4>
                                                {getSalary(selectedRole) && <p className="text-green-400 text-sm">{getSalary(selectedRole)} per annum</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-white">6</p>
                                                <p className="text-gray-400 text-xs">Months</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{getPlatformCourses().length || 4}</p>
                                                <p className="text-gray-400 text-xs">Courses</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{getRoadmapProjects().length || 3}</p>
                                                <p className="text-gray-400 text-xs">Projects</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                                            style={{ backgroundColor: accentColor }}
                                            onClick={() => { window.location.href = '/student/courses'; }}
                                        >
                                            <BookOpen className="w-5 h-5" />
                                            Enroll in First Course
                                        </motion.button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="py-2.5 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors text-sm"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Roadmap
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="py-2.5 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors text-sm"
                                            >
                                                <Bell className="w-4 h-4" />
                                                Set Reminders
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Navigation - Only show when in wizard */}
                    {currentPage > 0 && (
                        <div className="p-4 border-t border-white/10 shrink-0">
                            <div className="flex items-center justify-between">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={goToPrevPage}
                                    className="px-5 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <span>←</span>
                                    <span>Previous</span>
                                </motion.button>

                                {currentPage < 5 ? (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={goToNextPage}
                                        className="px-5 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <span>Next</span>
                                        <span>→</span>
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className="px-5 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <span>Complete</span>
                                        <span>✓</span>
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CareerTrackModal;
