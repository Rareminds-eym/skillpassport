import {
    BookOpen,
    ChevronRight,
    Clock,
    GraduationCap,
    UserPlus,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import KPIDashboard from "../../../components/admin/KPIDashboard";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

interface CourseStats {
  category: string;
  studentCount: number;
}

interface RecentActivity {
  id: number;
  title: string;
  description: string;
  time: string;
  timestamp: string; // Original timestamp for sorting
  type: "success" | "info" | "warning" | "error";
  icon: any;
}

interface ProgramOverviewItem {
  program: string;
  enrollments: number;
  students: number;
  duration: string;
}

const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [programOverview, setProgramOverview] = useState<ProgramOverviewItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Utility function to format dates consistently and handle future dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If the date is in the future (like 2026), treat it as today's activity
    if (date > now) {
      return "Today";
    }
    
    // Calculate days difference
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };


  useEffect(() => {
    const getSchoolId = async () => {
      if (!user) return;

      // Try to get school_id from user object first
      if (user.school_id) {
        console.log('School ID from user:', user.school_id);
        setSchoolId(user.school_id);
        return;
      }

      // Fetch school_id from school_educators table using user_id
      try {
        const { data, error } = await supabase
          .from('school_educators')
          .select('school_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching school_id from educators:', error);
        } else if (data?.school_id) {
          console.log('School ID from school_educators:', data.school_id);
          setSchoolId(data.school_id);
          return;
        }

        // Try to get school_id from organizations table using admin_id or email
        const userEmail = user.email || localStorage.getItem('userEmail');
        if (userEmail) {
          const { data: schoolData, error: schoolError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', 'school')
            .or(`admin_id.eq.${user.id},email.eq.${userEmail}`)
            .maybeSingle();

          if (schoolError) {
            console.error('Error fetching school_id from organizations:', schoolError);
          } else if (schoolData?.id) {
            console.log('School ID from organizations table:', schoolData.id);
            setSchoolId(schoolData.id);
            return;
          }
        }

        console.warn('No school_id found for user - dashboard will show empty data');
        // Keep schoolId as undefined - KPIDashboard will show 0s
        setSchoolId(undefined);
      } catch (err) {
        console.error('Failed to fetch school_id:', err);
        setSchoolId(undefined);
      }
    };

    getSchoolId();
  }, [user]);

  // Fetch dashboard data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch courses for this school with enrollment counts
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select(
            `
            course_id,
            title,
            category,
            duration,
            status,
            created_at,
            enrollment_count
          `
          )
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false });

        if (coursesError) {
          console.warn("Error fetching courses:", coursesError);
        }

        // Fetch enrollments for this school's courses
        const courseIds = (coursesData || []).map(c => c.course_id).filter(Boolean);
        
        let enrollmentsData: any[] = [];
        if (courseIds.length > 0) {
          const { data, error: enrollmentsError } = await supabase
            .from("course_enrollments")
            .select("course_id, student_id, student_name, status, progress, enrolled_at, last_accessed")
            .in("course_id", courseIds)
            .order("enrolled_at", { ascending: false });

          if (enrollmentsError) {
            console.warn("Error fetching enrollments:", enrollmentsError);
          } else {
            enrollmentsData = data || [];
          }
        }

        // Fetch recent attendance records for activities
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("student_id, status, date, created_at")
          .eq("school_id", schoolId)
          .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order("created_at", { ascending: false })
          .limit(10);

        if (attendanceError) {
          console.warn("Error fetching attendance:", attendanceError);
        }

        // Fetch recent student registrations
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, name, created_at, grade, section")
          .eq("school_id", schoolId)
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        if (studentsError) {
          console.warn("Error fetching students:", studentsError);
        }

        // Group by category for chart with better data
        const categoryMap = new Map<string, number>();
        const categoryEnrollmentMap = new Map<string, number>();
        
        if (coursesData) {
          coursesData.forEach((course) => {
            const category = course.category || "Other";
            const enrollmentCount = enrollmentsData.filter(
              (e) => e.course_id === course.course_id
            ).length;
            
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
            categoryEnrollmentMap.set(
              category,
              (categoryEnrollmentMap.get(category) || 0) + enrollmentCount
            );
          });
        }

        const stats: CourseStats[] = Array.from(categoryEnrollmentMap.entries()).map(
          ([category, count]) => ({
            category,
            studentCount: count,
          })
        );
        setCourseStats(stats);

        // Build enhanced program overview from courses
        const programs: ProgramOverviewItem[] = (coursesData || [])
          .map((course) => {
            const enrollmentCount = enrollmentsData.filter(
              (e) => e.course_id === course.course_id
            ).length;
            const activeStudents = enrollmentsData.filter(
              (e) => e.course_id === course.course_id && 
              (e.status === "active" || e.status === "in_progress")
            ).length;
            
            return {
              program: course.title,
              enrollments: enrollmentCount,
              students: activeStudents,
              duration: course.duration || "N/A",
            };
          })
          .sort((a, b) => b.enrollments - a.enrollments)
          .slice(0, 8); // Show more courses
        setProgramOverview(programs);

        // Build diverse recent activities from multiple sources
        const activities: RecentActivity[] = [];

        // Add recent enrollments
        const recentEnrollments = enrollmentsData.slice(0, 3);
        recentEnrollments.forEach((enrollment, index) => {
          const course = coursesData?.find(c => c.course_id === enrollment.course_id);
          activities.push({
            id: activities.length + 1,
            title: `New Enrollment: ${course?.title || "Course"}`,
            description: `${enrollment.student_name || "Student"} enrolled in ${course?.category || "course"}`,
            time: formatDate(enrollment.enrolled_at),
            timestamp: enrollment.enrolled_at,
            type: "info",
            icon: UserPlus,
          });
        });

        // Add recent attendance activities
        if (attendanceData && attendanceData.length > 0) {
          const recentAttendance = attendanceData.slice(0, 2);
          recentAttendance.forEach((attendance) => {
            activities.push({
              id: activities.length + 1,
              title: `Attendance Marked`,
              description: `Student marked ${attendance.status} on ${new Date(attendance.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}`,
              time: formatDate(attendance.created_at),
              timestamp: attendance.created_at,
              type: attendance.status === "present" ? "success" : "warning",
              icon: attendance.status === "present" ? GraduationCap : Clock,
            });
          });
        }

        // Add recent student registrations
        if (studentsData && studentsData.length > 0) {
          const recentStudents = studentsData.slice(0, 2);
          recentStudents.forEach((student) => {
            activities.push({
              id: activities.length + 1,
              title: `New Student Registration`,
              description: `${student.name} joined ${student.grade ? `Grade ${student.grade}` : "the school"}${student.section ? ` Section ${student.section}` : ""}`,
              time: formatDate(student.created_at),
              timestamp: student.created_at,
              type: "success",
              icon: UserPlus,
            });
          });
        }

        // Sort activities by most recent using original timestamps
        activities.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });
        setRecentActivities(activities.slice(0, 6));

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [schoolId]);

  // ===== Chart Data - Enhanced Dynamic from Database =====
  const programDistribution = {
    series: [
      {
        name: "Students Enrolled",
        data:
          courseStats.length > 0
            ? courseStats.map((s) => s.studentCount)
            : [0],
      },
    ],
    options: {
      chart: {
        type: "bar" as const,
        toolbar: { show: false },
        height: 250,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          dataLabels: { position: "center" },
        },
      },
      colors: ["#3b82f6"],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toLocaleString(),
        style: { fontSize: "11px", colors: ["#fff"] },
      },
      xaxis: {
        categories:
          courseStats.length > 0
            ? courseStats.map((s) => s.category)
            : ["No Data"],
        labels: { style: { colors: "#6b7280" } },
        title: { text: "Number of Students", style: { color: "#6b7280" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#6b7280", fontSize: "11px" },
        },
      },
      tooltip: { 
        theme: "light",
        y: { formatter: (val: number) => `${val} Students` },
      },
      grid: { borderColor: "#f1f5f9" },
      noData: {
        text: "No course enrollment data available",
        style: { color: "#6b7280" },
      },
    },
  };

  const enrollmentTrends = {
    series: [
      {
        name: "Total Enrollments",
        data:
          courseStats.length > 0
            ? courseStats.map((s) => s.studentCount)
            : [0],
      },
    ],
    options: {
      chart: {
        type: "area" as const,
        toolbar: { show: false },
        height: 250,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      stroke: { curve: "smooth" as const, width: 3 },
      fill: {
        type: "gradient",
        gradient: { 
          shadeIntensity: 1, 
          opacityFrom: 0.4, 
          opacityTo: 0.1,
          stops: [0, 90, 100]
        },
      },
      colors: ["#8b5cf6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories:
          courseStats.length > 0
            ? courseStats.map((s) => s.category)
            : ["No Data"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        title: { text: "Student Enrollments", style: { color: "#6b7280" } },
        labels: { 
          style: { colors: "#6b7280" },
          formatter: (val: number) => val.toFixed(0),
        },
      },
      tooltip: {
        theme: "light",
        y: { formatter: (val: number) => `${val} Students` },
      },
      grid: { 
        borderColor: "#f1f5f9",
        strokeDashArray: 4,
      },
      markers: {
        size: 4,
        colors: ["#8b5cf6"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        }
      },
      noData: {
        text: "No enrollment trend data available",
        style: { color: "#6b7280" },
      },
    },
  };

  // ===== Activity Type Colors =====
  const typeColors: Record<string, string> = {
    success: "bg-green-100 text-green-600",
    info: "bg-blue-100 text-blue-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600",
  };

  // ===== Render =====
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header with gradient background - Enhanced */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              School Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Overview of school activities and academic performance
            </p>
          </div>
        </div>
      </div>

      {/* Pending Trainings moved to Verifications page */}

      {/* KPI Cards - Real-time Data from Database */}
      <KPIDashboard schoolId={schoolId} />

      {/* Quick Stats Cards - Commented out (hardcoded data)
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-100 text-sm mb-1">Agri & Food Processing</p>
        <p className="text-3xl font-bold">4,410</p>
      </div>
      <TrendingUp className="h-7 w-7 opacity-90" />
    </div>
    <p className="text-sm mt-3">Students trained across 233 schools</p>
  </div>

  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-green-100 text-sm mb-1">Cloud Kitchen</p>
        <p className="text-3xl font-bold">260</p>
      </div>
      <BanknotesIcon className="h-7 w-7 opacity-90" />
    </div>
    <p className="text-sm mt-3">Students trained across 7 schools</p>
  </div>

  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-purple-100 text-sm mb-1">District Coverage</p>
        <p className="text-3xl font-bold">66</p>
      </div>
      <MapPinIcon className="h-7 w-7 opacity-90" />
    </div>
    <p className="text-sm mt-3">Programs delivered across Tamil Nadu</p>
  </div>

</div>
      */}


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Course Enrollments by Category
          </h2>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : (
            <ReactApexChart
              options={programDistribution.options}
              series={programDistribution.series}
              type="bar"
              height={300}
            />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Enrollment Trends
          </h2>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Loading...
            </div>
          ) : (
            <ReactApexChart
              options={enrollmentTrends.options}
              series={enrollmentTrends.series}
              type="area"
              height={300}
            />
          )}
        </div>
      </div>

      {/* Activities + Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities - Enhanced */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
                View All <ChevronRight className="h-4 w-4" />
              </button>
          </div>

          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/40 transition-all duration-200"
                  >
                    <div
                      className={`p-3 rounded-xl shadow-sm border border-transparent hover:border-indigo-200 ${typeColors[activity.type]} transition`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-800">
                          {activity.title}
                        </p>
                        <span className="flex items-center text-xs text-gray-400 whitespace-nowrap ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Activities will appear here as they happen</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Overview - Enhanced */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Course Overview
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {programOverview.length} courses
              </span>
              <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
                View Details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {programOverview.length > 0 ? (
              programOverview.map((prog, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 rounded-xl p-4 transition-all duration-200 border border-gray-100 hover:border-indigo-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 truncate max-w-[200px]" title={prog.program}>
                        {prog.program}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{prog.students} active students</span>
                        <span>•</span>
                        <span>{prog.enrollments} total enrollments</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold px-3 py-1 rounded-full text-green-600 bg-green-100">
                      {prog.duration}
                    </span>
                    {prog.enrollments > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((prog.students / prog.enrollments) * 100)}% active
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No courses available</p>
                <p className="text-sm">Add courses to see them here</p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default SchoolDashboard;