import { Download, Calendar } from 'lucide-react';
import Button from '../../components/Button';

const Reports = () => {
  const reports = [
    { name: 'User Registration Report', date: '2025-10-01', type: 'CSV' },
    { name: 'Job Applications Summary', date: '2025-10-01', type: 'PDF' },
    { name: 'Recruiter Activity Report', date: '2025-09-28', type: 'CSV' },
    { name: 'Platform Analytics', date: '2025-09-25', type: 'PDF' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download platform reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
          <select className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>User Activity</option>
            <option>Job Analytics</option>
            <option>Application Stats</option>
            <option>Revenue Report</option>
          </select>
          <Button className="w-full">Generate Report</Button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
          <div className="space-y-2 mb-4">
            <label className="flex items-center">
              <input type="radio" name="format" className="mr-2" defaultChecked />
              <span className="text-gray-700">PDF Document</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="format" className="mr-2" />
              <span className="text-gray-700">CSV Spreadsheet</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="format" className="mr-2" />
              <span className="text-gray-700">Excel Workbook</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Reports</h2>
        <div className="space-y-4">
          {reports.map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-600">{report.date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {report.type}
                </span>
                <button className="text-blue-600 hover:text-blue-700">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
