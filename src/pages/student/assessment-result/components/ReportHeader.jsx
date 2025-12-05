import {
    Users,
    FileCheck,
    GraduationCap,
    Briefcase,
    Calendar,
    Brain,
    Sparkles
} from 'lucide-react';
import InfoCard from './InfoCard';

/**
 * Report Header Component
 * Displays the main header section with student info
 */
const ReportHeader = ({ studentInfo }) => (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 border border-white/30 rounded-full"></div>
                <div className="absolute top-12 right-12 w-32 h-32 border border-white/20 rounded-full"></div>
                <div className="absolute bottom-4 left-1/3 w-16 h-16 border border-white/25 rounded-full"></div>
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-indigo-200 text-sm font-medium">AI-Powered Assessment</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-1">Career Profiling & Skill</h1>
                        <h1 className="text-3xl md:text-4xl font-bold">Development Report</h1>
                        <p className="text-indigo-200 mt-2 text-lg">4th Semester Analysis</p>
                    </div>
                    <img src="/logo.png" alt="SkillPassport" className="h-14 opacity-90 hidden md:block" onError={(e) => e.target.style.display = 'none'} />
                </div>
            </div>
        </div>

        <div className="p-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoCard icon={Users} label="Student Name" value={studentInfo.name} color="indigo" />
                <InfoCard icon={FileCheck} label="Register No." value={studentInfo.regNo} color="purple" />
                <InfoCard icon={GraduationCap} label="Programme/Stream" value={studentInfo.stream} color="emerald" />
                <InfoCard icon={Briefcase} label="College" value={studentInfo.college} color="amber" />
                <InfoCard icon={Calendar} label="Assessment Date" value={new Date().toLocaleDateString()} color="rose" />
                <InfoCard icon={Brain} label="Assessor" value="SkillPassport AI" color="indigo" />
            </div>
        </div>
    </div>
);

export default ReportHeader;
