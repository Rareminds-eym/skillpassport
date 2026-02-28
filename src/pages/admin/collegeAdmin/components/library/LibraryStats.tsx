import { BookOpen } from "lucide-react";
import { LibraryStats as LibraryStatsType } from "../../../../services/libraryService";

interface LibraryStatsProps {
  stats: LibraryStatsType | null;
}

export const LibraryStatsCards: React.FC<LibraryStatsProps> = ({ stats }) => {
  const libraryStats = [
    { label: "Total Books", value: stats?.total_books || 0, color: "bg-green-500" },
    { label: "Available", value: stats?.available_copies || 0, color: "bg-blue-500" },
    { label: "Currently Issued", value: stats?.currently_issued || 0, color: "bg-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {libraryStats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
