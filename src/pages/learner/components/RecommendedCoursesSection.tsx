/**
 * RecommendedCoursesSection Component
 * 
 * Displays top recommended courses based on skills and assessment
 */

import { useState, useEffect } from 'react';
import { BookOpenIcon, ClockIcon, ChevronRightIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/shared/ui';
import { useAuthStore } from '@/shared/model/authStore';
import { apiGet } from '@/shared/api/apiClient';

interface Course {
    course_id: string;
    title: string;
    description?: string;
    duration?: string;
    relevance_score?: number;
    skill_type?: string;
    category?: string;
}

const RecommendedCoursesSection = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendedCourses = async () => {
            if (!authUser?.id) {
                setLoading(false);
                return;
            }

            try {
                const result = await apiGet(`/courses/recommendations/saved?learnerId=${authUser.id}&status=active`);

                if (result?.data?.length > 0) {
                    const formattedCourses = result.data
                        .map((r: any) => ({
                            course_id: r.course_id,
                            title: r.course?.title || r.course?.name || 'Untitled Course',
                            description: r.course?.description || '',
                            duration: r.course?.duration || '',
                            relevance_score: r.relevance_score || 0,
                            skill_type: r.course?.category || '',
                            category: r.course?.category || '',
                        }))
                        .sort((a: Course, b: Course) => (b.relevance_score || 0) - (a.relevance_score || 0))
                        .slice(0, 5); // Top 5 courses

                    setCourses(formattedCourses);
                } else {
                    setCourses([]);
                }
            } catch (err) {
                console.warn('[RecommendedCourses] Failed to fetch courses:', err);
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendedCourses();
    }, [authUser?.id]);

    const handleCourseClick = (courseId: string) => {
        navigate(`/learner/my-learning`);
    };

    if (loading) {
        return (
            <Card className="h-full bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                    <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="p-2 rounded-lg bg-blue-600">
                            <BookOpenIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-800">
                            Recommended Courses
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                            <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                <CardTitle className="flex items-center gap-3 m-0 p-0">
                    <div className="p-2 rounded-lg bg-blue-600">
                        <BookOpenIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Recommended Courses
                            <SparklesIcon className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">Based on your skills</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {courses.length === 0 ? (
                    <div className="text-center py-8">
                        <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-2">No course recommendations yet</p>
                        <p className="text-xs text-gray-500">
                            Complete your assessment to get personalized recommendations
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {courses.map((course, index) => (
                            <button
                                key={course.course_id}
                                onClick={() => handleCourseClick(course.course_id)}
                                className="w-full text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                {course.title}
                                            </h4>
                                            {index === 0 && (
                                                <Badge className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                                                    Top Pick
                                                </Badge>
                                            )}
                                        </div>

                                        {course.description && (
                                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                {course.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs">
                                            {course.duration && (
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <ClockIcon className="w-3 h-3 text-blue-500" />
                                                    <span>{course.duration}</span>
                                                </div>
                                            )}
                                            {course.category && (
                                                <Badge className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-medium">
                                                    {course.category}
                                                </Badge>
                                            )}
                                            {course.relevance_score && course.relevance_score > 0 && (
                                                <Badge className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-medium">
                                                    {Math.round(course.relevance_score)}% Match
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRightIcon className="w-5 h-5 text-blue-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}

                        {courses.length >= 5 && (
                            <button
                                onClick={() => navigate('/learner/my-learning')}
                                className="w-full text-center py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                View All Courses →
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecommendedCoursesSection;
