import {
    Users,
    FileCheck,
    GraduationCap,
    Briefcase,
    Calendar,
    Brain,
    Sparkles
} from 'lucide-react';

/**
 * Report Header Component
 * Displays the main header section with student info
 */
const ReportHeader = ({ studentInfo }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-slate-800 p-6 text-white">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-gray-400 text-base font-medium">AI-Powered Assessment</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-1">Career Profiling & Skill Development Report</h1>
                    <p className="text-gray-400 mt-1 text-lg">4th Semester Analysis</p>
                </div>
                <img src="/logo.png" alt="SkillPassport" className="h-14 opacity-90 hidden md:block" onError={(e) => e.target.style.display = 'none'} />
            </div>
        </div>

        <div className="p-5 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Student Name</p>
                        <p className="font-semibold text-gray-800 text-base">{studentInfo.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Register No.</p>
                        <p className="font-semibold text-gray-800 text-base">{studentInfo.regNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Programme/Stream</p>
                        <p className="font-semibold text-gray-800 text-base">{studentInfo.stream}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">College</p>
                        <p className="font-semibold text-gray-800 text-base truncate max-w-[180px]">{studentInfo.college}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Assessment Date</p>
                        <p className="font-semibold text-gray-800 text-base">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
                    <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Assessor</p>
                        <p className="font-semibold text-gray-800 text-base">SkillPassport AI</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default ReportHeader;
