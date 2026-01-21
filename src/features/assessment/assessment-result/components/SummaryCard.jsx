import { ChevronRight } from 'lucide-react';

/**
 * Summary Card Component
 * Displays a clickable summary card for the grid view
 */
const SummaryCard = ({ title, subtitle, icon: Icon, gradient, data, onClick, delay = 0 }) => (
  <div
    onClick={onClick}
    className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${gradient}`}></div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
            {title} - {subtitle}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-lg">
            <span className="text-gray-500 font-medium">{item.label}</span>
            <span className="text-gray-800 font-semibold truncate max-w-[180px]">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center text-indigo-600 font-medium text-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
        View Full Details
      </div>
    </div>
  </div>
);

export default SummaryCard;
