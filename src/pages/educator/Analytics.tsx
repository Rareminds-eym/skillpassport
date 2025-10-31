const Analytics = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics & Insights</h1>

      {/* Skill Distribution Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Skill Distribution</h2>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">[Pie Chart Placeholder]</div>
      </div>

      {/* Growth Over Time */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth Over Time</h2>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">[Line Chart Placeholder]</div>
      </div>

      {/* Top Performers List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
        <ul className="space-y-2">
          <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">1. John Doe</span>
            <span className="text-sm font-semibold text-gray-900">25 activities</span>
          </li>
          <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">2. Priya S.</span>
            <span className="text-sm font-semibold text-gray-900">22 activities</span>
          </li>
        </ul>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap</h2>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">[Calendar Heatmap Placeholder]</div>
      </div>

      {/* Export Analytics */}
      <div className="flex gap-4">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Export as PDF</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save as Image</button>
      </div>
    </div>
  );
};

export default Analytics;
