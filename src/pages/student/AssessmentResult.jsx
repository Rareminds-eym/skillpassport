import React from 'react';
import {
    Briefcase,
    Target,
    TrendingUp,
    Award,
    BookOpen,
    Code,
    Layers,
    CheckCircle,
    Star,
    Compass,
    Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Students/components/ui/card';
import { Badge } from '../../components/Students/components/ui/badge';
import { Progress } from '../../components/Students/components/ui/progress';

const AssessmentResult = () => {
    // Mock Data based on B.Tech CS/IT Profile from PDF
    const reportData = {
        studentInfo: {
            name: "Alex Johnson",
            course: "B.Tech Computer Science",
            semester: "6th Semester",
            assessmentDate: "May 15, 2025"
        },
        clusters: [
            {
                id: 'A',
                title: "Software Engineering",
                description: "Core Development & Engineering",
                fit: "High",
                criteria: [
                    "Investigative/Realistic interests",
                    "High Logical/Numerical aptitude",
                    "High Conscientiousness"
                ],
                roles: {
                    entry: ["SDE-1", "Junior Developer", "Graduate Engineer Trainee"],
                    mid: ["Senior Software Engineer", "Tech Lead", "Architect"]
                },
                color: "blue"
            },
            {
                id: 'B',
                title: "Data Science & AI",
                description: "Analytics, ML & Data Engineering",
                fit: "Medium",
                criteria: [
                    "Investigative interests",
                    "High Numerical/Abstract aptitude",
                    "Openness to experience"
                ],
                roles: {
                    entry: ["Data Analyst Intern", "BI Associate", "ML Trainee"],
                    mid: ["Data Scientist", "ML Engineer", "Analytics Manager"]
                },
                color: "purple"
            },
            {
                id: 'C',
                title: "Cybersecurity / Cloud / DevOps",
                description: "Infrastructure & Security",
                fit: "Explore",
                criteria: [
                    "Realistic/Investigative interests",
                    "Abstract + Speed/Accuracy",
                    "Emotional stability"
                ],
                roles: {
                    entry: ["Security Analyst Intern", "Cloud Support", "DevOps Trainee"],
                    mid: ["Security Engineer", "Cloud Architect", "SRE"]
                },
                color: "indigo"
            },
            {
                id: 'D',
                title: "Product / Tech Consulting",
                description: "Business & Technology Intersection",
                fit: "Low",
                criteria: [
                    "Enterprising + Investigative",
                    "Verbal + Abstract aptitude",
                    "Higher Extraversion"
                ],
                roles: {
                    entry: ["Business Analyst (Tech)", "Product Ops Intern"],
                    mid: ["Product Manager", "Tech Consultant", "Strategy Lead"]
                },
                color: "orange"
            }
        ],
        specificRoles: {
            high: ["Full Stack Developer", "Backend Engineer", "System Programmer"],
            medium: ["Data Analyst", "QA Automation Engineer"],
            explore: ["Product Manager", "DevOps Engineer"]
        },
        skillGap: {
            priorityA: {
                timeline: "Next 6 Months",
                skills: [
                    "Data Structures & Algorithms (DSA)",
                    "OOP & Clean Coding Practices",
                    "Git + Collaborative Workflows",
                    "SQL + Data Handling",
                    "Full Stack Web Development (MERN)"
                ]
            },
            priorityB: {
                timeline: "6-12 Months",
                skills: [
                    "System Design Basics",
                    "Deployment (Docker, CI/CD)",
                    "Testing/QA Automation"
                ]
            },
            employabilityFocus: [
                { label: "Problem-solving", checked: true },
                { label: "Communication of technical work", checked: false },
                { label: "Team collaboration", checked: true }
            ]
        },
        roadmap: {
            projects: [
                {
                    title: "Deployable Full-Stack App",
                    desc: "Solve a college problem or build for a local business."
                },
                {
                    title: "Data Dashboard",
                    desc: "Visualize complex datasets with insights."
                },
                {
                    title: "Cloud/Security Mini Project",
                    desc: "Log analysis or cloud-hosted service."
                }
            ],
            internships: [
                "Product Companies",
                "IT Services",
                "Startups aligned to Top Cluster"
            ],
            certifications: [
                "Web Development Bootcamp",
                "SQL Fundamentals",
                "Cloud Practitioner (AWS/Azure)",
                "Python-DSA Track"
            ]
        }
    };

    const getFitColor = (fit) => {
        switch (fit) {
            case 'High': return 'bg-green-100 text-green-800 border-green-200';
            case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Explore': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in-up">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Career Profiling & Skill Report</h1>
                            <p className="text-blue-100 text-lg">Comprehensive assessment to guide your career journey.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                            <div className="text-sm text-blue-100">Assessment Date</div>
                            <div className="font-semibold">{reportData.studentInfo.assessmentDate}</div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-blue-200 uppercase tracking-wider">Course</div>
                                <div className="font-medium">{reportData.studentInfo.course}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-blue-200 uppercase tracking-wider">Semester</div>
                                <div className="font-medium">{reportData.studentInfo.semester}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-blue-200 uppercase tracking-wider">Top Cluster</div>
                                <div className="font-medium">{reportData.clusters.find(c => c.fit === 'High')?.title}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Career Clusters Section */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <Compass className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Best-Fit Career Clusters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {reportData.clusters.map((cluster) => (
                        <Card key={cluster.id} className={`border-t-4 transition-all duration-300 hover:shadow-lg ${cluster.fit === 'High' ? 'border-t-green-500 ring-2 ring-green-500/20' :
                            cluster.fit === 'Medium' ? 'border-t-blue-500' :
                                cluster.fit === 'Explore' ? 'border-t-yellow-500' : 'border-t-gray-300'
                            }`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className={`${getFitColor(cluster.fit)}`}>
                                        {cluster.fit === 'High' ? 'Top Match' : cluster.fit}
                                    </Badge>
                                    <span className="text-xs font-bold text-gray-400">Cluster {cluster.id}</span>
                                </div>
                                <CardTitle className="text-lg leading-tight mb-1">{cluster.title}</CardTitle>
                                <CardDescription className="text-xs">{cluster.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">High-fit When</h4>
                                        <ul className="space-y-1">
                                            {cluster.criteria.map((crit, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                                    <span className="mt-0.5 w-1 h-1 rounded-full bg-gray-400 shrink-0"></span>
                                                    {crit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Roles</h4>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-xs text-gray-400 block">Entry Level</span>
                                                <p className="text-xs font-medium text-gray-700">{cluster.roles.entry.join(", ")}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 block">Mid Level</span>
                                                <p className="text-xs font-medium text-gray-700">{cluster.roles.mid.join(", ")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Specific Roles & Employability */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Specific Roles */}
                <Card className="lg:col-span-2 border-none shadow-md bg-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-600" />
                            <CardTitle>Role Fit Analysis</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <h3 className="font-semibold text-green-800">High Fit</h3>
                                </div>
                                <ul className="space-y-2">
                                    {reportData.specificRoles.high.map((role, idx) => (
                                        <li key={idx} className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-sm border border-green-100">
                                            {role}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <h3 className="font-semibold text-blue-800">Medium Fit</h3>
                                </div>
                                <ul className="space-y-2">
                                    {reportData.specificRoles.medium.map((role, idx) => (
                                        <li key={idx} className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-sm border border-blue-100">
                                            {role}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <h3 className="font-semibold text-yellow-800">Explore</h3>
                                </div>
                                <ul className="space-y-2">
                                    {reportData.specificRoles.explore.map((role, idx) => (
                                        <li key={idx} className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-sm border border-yellow-100">
                                            {role}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Employability Focus */}
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-white">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-600" />
                            <CardTitle>Employability Focus</CardTitle>
                        </div>
                        <CardDescription>Key areas to improve for job readiness</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reportData.skillGap.employabilityFocus.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.checked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {item.checked ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}
                                    </div>
                                    <span className={`font-medium ${item.checked ? 'text-gray-800' : 'text-gray-500'}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-indigo-100/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-indigo-800 mb-2">Why this matters?</h4>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                These soft skills are cited by recruiters as the top differentiators for entry-level candidates in your target clusters.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Skill Gap & Upgrade Plan */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Skill Gap & Upgrade Plan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Priority A */}
                    <Card className="border-l-4 border-l-orange-500 shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-orange-700">Priority A</CardTitle>
                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                    {reportData.skillGap.priorityA.timeline}
                                </Badge>
                            </div>
                            <CardDescription>Critical skills to master immediately</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reportData.skillGap.priorityA.skills.map((skill, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg hover:bg-orange-50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-800">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Priority B */}
                    <Card className="border-l-4 border-l-blue-500 shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-blue-700">Priority B</CardTitle>
                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                    {reportData.skillGap.priorityB.timeline}
                                </Badge>
                            </div>
                            <CardDescription>Advanced skills for career growth</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reportData.skillGap.priorityB.skills.map((skill, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg hover:bg-blue-50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-800">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Portfolio & Roadmap */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Portfolio & Internship Roadmap</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Projects */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                            <div className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-purple-600" />
                                <CardTitle className="text-lg">Project Ideas</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {reportData.roadmap.projects.map((project, idx) => (
                                    <li key={idx} className="relative pl-4 border-l-2 border-purple-200">
                                        <h4 className="font-semibold text-gray-800 text-sm">{project.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{project.desc}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Internships */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-teal-600" />
                                <CardTitle className="text-lg">Internship Targets</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-3">
                                {reportData.roadmap.internships.map((target, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                        <span className="text-sm font-medium text-gray-700">{target}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 p-3 bg-teal-50 rounded-lg border border-teal-100">
                                <p className="text-xs text-teal-700 italic">
                                    "Focus on companies that align with your top cluster for better conversion."
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Certifications */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-rose-50 to-white border-b border-rose-100">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-rose-600" />
                                <CardTitle className="text-lg">Recommended Certs</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-2">
                                {reportData.roadmap.certifications.map((cert, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200">
                                        {cert}
                                    </Badge>
                                ))}
                            </div>
                            <div className="mt-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Progress</h4>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>0 of {reportData.roadmap.certifications.length} completed</span>
                                        <span>0%</span>
                                    </div>
                                    <Progress value={0} className="h-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default AssessmentResult;
