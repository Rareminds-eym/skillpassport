/**
 * Report Header Component - Light Glassmorphism Design
 * Clean, modern glass effect with blue accents
 */

const ReportHeader = ({ studentInfo, gradeLevel }) => {
    // Debug
    console.log('ReportHeader gradeLevel:', gradeLevel);
    console.log('ReportHeader studentInfo:', studentInfo);
    
    // Format stream display name
    const formatStreamDisplay = (stream) => {
        if (!stream || stream === '—') return '—';
        
        // Convert stream IDs to friendly labels
        const streamMap = {
            'middle_school': 'Middle School (Grades 6-8)',
            'high_school': 'High School (Grades 9-10)',
            'highschool': 'High School (Grades 9-10)',
            'higher_secondary': 'Higher Secondary (Grades 11-12)',
            'after10': 'After 10th',
            'after12': 'After 12th',
            'college': 'College',
            'university': 'University'
        };
        
        // Check if it's a stream ID that needs conversion
        const lowerStream = stream.toLowerCase();
        if (streamMap[lowerStream]) {
            return streamMap[lowerStream];
        }
        
        // If it's already formatted (contains parentheses), return as is
        if (stream.includes('(') && stream.includes(')')) {
            return stream;
        }
        
        // Otherwise, convert to title case (SCIENCE → Science, COMMERCE → Commerce)
        return stream.charAt(0).toUpperCase() + stream.slice(1).toLowerCase();
    };
    
    // Determine the label and value for the grade/course field based on grade level
    const getGradeCourseField = () => {
        const level = gradeLevel?.toLowerCase();
        
        // For college/university students, show course name instead of grade
        if (level === 'college' || level === 'university') {
            return { label: 'Course', value: studentInfo.courseName || '—' };
        }
        
        // For after12 students, check if they have a course name (college) or grade (12th)
        if (level === 'after12' || level === 'after12th' || level === '12th') {
            // If they have a course name, they're in college - show course
            if (studentInfo.courseName && studentInfo.courseName !== '—') {
                return { label: 'Course', value: studentInfo.courseName };
            }
            // Otherwise show grade (12th or whatever is in the field)
            return { label: 'Grade', value: studentInfo.grade || '12th' };
        }
        
        // For school students (middle, high school), show grade
        if (level === 'middle' || level === 'high' || level === 'middleschool' || level === 'highschool' || level === 'higher_secondary') {
            return { label: 'Grade', value: studentInfo.grade || '—' };
        }
        
        // Default fallback - check if course name exists
        if (studentInfo.courseName && studentInfo.courseName !== '—') {
            return { label: 'Course', value: studentInfo.courseName };
        }
        return { label: 'Grade', value: studentInfo.grade || '—' };
    };

    // Determine the institution label based on grade level
    const getInstitutionLabel = () => {
        const level = gradeLevel?.toLowerCase();
        if (level === 'middle' || level === 'high' || level === 'middleschool' || level === 'highschool' || level === 'higher_secondary') {
            return 'School';
        } else if (level === 'after12' || level === 'after12th' || level === '12th' || level === 'college' || level === 'university') {
            return 'College';
        }
        return 'School'; // Default to School instead of Institution
    };

    // Determine the roll number label based on student type
    const getRollNumberLabel = () => {
        if (studentInfo.rollNumberType === 'university') {
            return 'University Roll No';
        } else if (studentInfo.rollNumberType === 'institute') {
            return 'Institute Roll No';
        } else {
            return 'School Roll No';
        }
    };

    const gradeCourseField = getGradeCourseField();
    const institutionLabel = getInstitutionLabel();
    const rollNumberLabel = getRollNumberLabel();

    const infoItems = [
        { label: 'Student Name', value: studentInfo.name },
        { label: rollNumberLabel, value: studentInfo.regNo },
        { label: 'Programme/Stream', value: formatStreamDisplay(studentInfo.stream || studentInfo.branchField || '—') },
        { label: gradeCourseField.label, value: gradeCourseField.value },
        { label: institutionLabel, value: studentInfo.college || studentInfo.school, truncate: true },
        { label: 'Assessment Date', value: new Date().toLocaleDateString() },
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
                <div className="relative px-6 md:px-8 py-6 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                        {infoItems.map((item, index) => (
                            <div
                                key={index}
                                className="group relative p-4 rounded-lg bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md space-y-0.5"
                            >
                                <p className="text-sm text-blue-600 font-medium mb-1.5">
                                    {item.label}
                                </p>
                                <p className={`font-medium text-slate-900 text-base md:text-lg ${item.truncate ? 'line-clamp-2' : ''}`}>
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