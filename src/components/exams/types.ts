/* eslint-disable @typescript-eslint/no-explicit-any */
export type ExamStatus = "draft" | "scheduled" | "ongoing" | "marks_pending" | "moderation" | "published";
export type WorkflowStage = "creation" | "timetable" | "invigilation" | "marks" | "moderation" | "publishing" | "results";

// Status mapping for database values
export const mapDatabaseStatus = (dbStatus: string): ExamStatus => {
  switch (dbStatus) {
    case "draft": return "draft";
    case "scheduled": return "scheduled";
    case "ongoing": return "ongoing";
    case "marks_pending": return "marks_pending";
    case "moderation": return "moderation";
    case "published": return "published";
    default: return "draft";
  }
};

export const EXAM_STATUSES = [
  { value: "draft" as const, label: "Draft", color: "gray" },
  { value: "scheduled" as const, label: "Scheduled", color: "blue" },
  { value: "ongoing" as const, label: "Ongoing", color: "amber" },
  { value: "marks_pending" as const, label: "Marks Pending", color: "orange" },
  { value: "moderation" as const, label: "Under Moderation", color: "purple" },
  { value: "published" as const, label: "Published", color: "green" },
];

export const MODERATION_TYPES = [
  { value: "correction", label: "Correction", description: "Correcting calculation or entry errors", icon: "🔧" },
  { value: "revaluation", label: "Revaluation", description: "Re-evaluating answer scripts", icon: "📝" },
  { value: "grace_marks", label: "Grace Marks", description: "Awarding additional marks for specific reasons", icon: "⭐" },
  { value: "normalization", label: "Normalization", description: "Statistical adjustment of marks", icon: "📊" },
  { value: "appeal", label: "Appeal", description: "Result of student appeal or review", icon: "⚖️" },
];