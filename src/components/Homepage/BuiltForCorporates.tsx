"use client";

import { Eye, CheckCircle, BarChart3, Link2 } from "lucide-react";
import RadialOrbitalTimeline from "./ui/orbit-timeline/radial-orbital-timeline";

const corporateFeatures = [
  {
    id: 1,
    title: "Talent Visibility",
    date: "Feature 1",
    content: "Gain complete visibility into your organization's talent pool with comprehensive skill mapping and real-time insights.",
    category: "Visibility",
    icon: Eye,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Verified Capability",
    date: "Feature 2",
    content: "Ensure skill authenticity through verified credentials and validated competencies across your workforce.",
    category: "Verification",
    icon: CheckCircle,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "Data-Driven Decisions",
    date: "Feature 3",
    content: "Make informed strategic decisions with powerful analytics and actionable insights from your talent data.",
    category: "Analytics",
    icon: BarChart3,
    relatedIds: [2, 4],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 4,
    title: "Integration Ready",
    date: "Feature 4",
    content: "Seamlessly connect with your existing HR systems and enterprise tools for unified talent management.",
    category: "Integration",
    icon: Link2,
    relatedIds: [3],
    status: "completed" as const,
    energy: 85,
  },
];

const BuiltForCorporates = () => {
  return (
    <section className="relative w-full bg-white py-8">
      {/* Header Section */}
      <div className="container mx-auto px-4 text-center mb-2">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
          Built for Corporates
        </h2>
        <p className="text-lg md:text-xl text-black/70 max-w-2xl mx-auto">
          Enterprise-grade capabilities that scale with your organization
        </p>
      </div>

      {/* Orbital Timeline */}
      <div className="w-full h-[500px] md:h-[550px]">
        <RadialOrbitalTimeline timelineData={corporateFeatures} theme="light" />
      </div>
    </section>
  );
};

export default BuiltForCorporates;
