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
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                </div>
            </div>

            <div className="space-y-3">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">{item.label}</span>
                        <span className="text-gray-800 font-semibold truncate max-w-[150px]">{item.value}</span>
                    </div>
                ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                View Full Details
            </div>
        </div>
    </div>
);

export default SummaryCard;
