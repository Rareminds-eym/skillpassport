import React from "react";
import { ChevronLeft, ChevronRight, Calendar, Settings, Send, Download } from "lucide-react";
import { formatDate } from "../utils";

interface HeaderProps {
  publishStatus: "draft" | "published";
  weekDates: Date[];
  loading: boolean;
  onNavigateWeek: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
  onOpenPeriodsModal: () => void;
  onOpenExportModal: () => void;
  onPublish: () => void;
}

const Header: React.FC<HeaderProps> = ({
  publishStatus,
  weekDates,
  loading,
  onNavigateWeek,
  onGoToToday,
  onOpenPeriodsModal,
  onOpenExportModal,
  onPublish,
}) => {
  const getWeekRange = () => {
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[5]);
    return `${start} - ${end}, ${weekDates[0].getFullYear()}`;
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Timetable Builder</h1>
          <p className="text-sm text-gray-500">Schedule classes by date with break management</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              publishStatus === "published"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {publishStatus === "published" ? "Published" : "Draft"}
          </span>

          <button
            onClick={onOpenPeriodsModal}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <Settings className="h-4 w-4" />
            Periods
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>

          <button
            onClick={onPublish}
            disabled={loading || publishStatus === "published"}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            <Send className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => onNavigateWeek("prev")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <span className="text-lg font-semibold text-gray-900">{getWeekRange()}</span>
        </div>

        <button
          onClick={() => onNavigateWeek("next")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        <button
          onClick={onGoToToday}
          className="px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
        >
          Today
        </button>
      </div>
    </div>
  );
};

export default Header;
