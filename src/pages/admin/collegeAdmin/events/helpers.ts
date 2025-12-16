import React from "react";
import {
  CalendarIcon,
  AcademicCapIcon,
  UsersIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { EventType, EventStatus } from "./types";

// Date formatting
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export const toDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Event type helpers
export const getEventTypeIcon = (type: EventType): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    seminar: React.createElement(AcademicCapIcon, { className: "h-5 w-5" }),
    workshop: React.createElement(UsersIcon, { className: "h-5 w-5" }),
    cultural: React.createElement(CalendarIcon, { className: "h-5 w-5" }),
    sports: React.createElement(UsersIcon, { className: "h-5 w-5" }),
    placement: React.createElement(DocumentTextIcon, { className: "h-5 w-5" }),
    guest_lecture: React.createElement(AcademicCapIcon, { className: "h-5 w-5" }),
    orientation: React.createElement(UsersIcon, { className: "h-5 w-5" }),
    other: React.createElement(CalendarIcon, { className: "h-5 w-5" }),
  };
  return icons[type] || React.createElement(CalendarIcon, { className: "h-5 w-5" });
};

export const getEventTypeColor = (type: EventType) => {
  const colors: Record<string, string> = {
    seminar: "bg-blue-100 text-blue-700 border-blue-200",
    workshop: "bg-purple-100 text-purple-700 border-purple-200",
    cultural: "bg-pink-100 text-pink-700 border-pink-200",
    sports: "bg-green-100 text-green-700 border-green-200",
    placement: "bg-orange-100 text-orange-700 border-orange-200",
    guest_lecture: "bg-indigo-100 text-indigo-700 border-indigo-200",
    orientation: "bg-teal-100 text-teal-700 border-teal-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
};


export const getEventBarBg = (type: EventType) => {
  const colors: Record<string, string> = {
    seminar: "bg-emerald-500",
    workshop: "bg-purple-500",
    cultural: "bg-rose-400",
    sports: "bg-blue-500",
    placement: "bg-amber-500",
    guest_lecture: "bg-indigo-500",
    orientation: "bg-teal-500",
    other: "bg-gray-500",
  };
  return colors[type] || "bg-emerald-500";
};

// Status-based styling
export const getStatusStyle = (status: EventStatus) => {
  switch (status) {
    case "draft": return "opacity-60 border-2 border-dashed border-gray-400";
    case "cancelled": return "opacity-50 line-through bg-red-300";
    case "completed": return "opacity-80";
    default: return "";
  }
};

export const getStatusBadge = (status: EventStatus) => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
    published: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
    completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Completed" },
  };
  return badges[status] || badges.draft;
};

// Calendar constants
export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const dayNamesShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
