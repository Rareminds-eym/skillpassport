/**
 * Info Card Component
 * Displays a small info card with icon, label and value
 */
const InfoCard = ({ icon: Icon, label, value, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${colorClasses[color]}`}>
      <Icon className="w-5 h-5" />
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
};

export default InfoCard;
