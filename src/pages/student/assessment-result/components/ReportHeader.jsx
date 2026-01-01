/**
 * Report Header Component - Light Glassmorphism Design
 * Clean, modern glass effect with blue accents
 */

const ReportHeader = ({ studentInfo }) => {
    const infoItems = [
        { label: 'Student Name', value: studentInfo.name },
        { label: 'Register No.', value: studentInfo.regNo },
        { label: 'Programme/Stream', value: studentInfo.stream },
        { label: 'College', value: studentInfo.college, truncate: true },
        { label: 'Assessment Date', value: new Date().toLocaleDateString() },
        { label: 'Assessor', value: 'SkillPassport AI' },
    ];

    return (
        <div className="mb-8">
            {/* Main Card - Light Glass */}
            <div className="relative w-full rounded-xl overflow-hidden bg-white backdrop-blur-xl shadow-lg">
                {/* Subtle gradient overlay */}
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03), transparent 50%, rgba(147, 197, 253, 0.03))'
                    }}
                />

                {/* Header Section */}
                <div className="relative p-6 md:p-8 bg-gradient-to-r from-slate-800 to-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                                Career Profiling & Skill Development Report
                            </h1>
                            {/* Animated Gradient Underline */}
                            <div className="relative h-[2px] w-40 md:w-56 mb-2 rounded-full overflow-hidden">
                                <div 
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: 'linear-gradient(90deg, #1E3A8A, #3B82F6, #60A5FA, #93C5FD, #BFDBFE)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 3s linear infinite'
                                    }}
                                />
                            </div>
                            <p className="text-slate-300 text-sm md:text-base">
                                AI-Powered Career Assessment
                            </p>
                        </div>
                        <img 
                            src="/logo.png" 
                            alt="SkillPassport" 
                            className="h-12 md:h-14 opacity-90 hidden md:block" 
                            onError={(e) => e.target.style.display = 'none'} 
                        />
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="relative px-12 md:px-8 py-6 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 ">
                        {infoItems.map((item, index) => (
                            <div
                                key={index}
                                className="group relative p-4 rounded-lg bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md"
                            >
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                    {item.label}
                                </p>
                                <p className={`font-semibold text-gray-800 text-sm md:text-base ${item.truncate ? 'truncate max-w-[180px]' : ''}`}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Keyframes for animations */}
            <style>{`
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReportHeader;
