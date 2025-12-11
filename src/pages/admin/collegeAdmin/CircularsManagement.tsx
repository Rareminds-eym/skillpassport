// import React, { useState } from "react";
// import {
//   BellIcon,
//   PlusCircleIcon,
//   EyeIcon,
//   PencilSquareIcon,
//   TrashIcon,
//   MagnifyingGlassIcon,
// } from "@heroicons/react/24/outline";

// interface Circular {
//   id: number;
//   title: string;
//   audience: string;
//   priority: "normal" | "high";
//   publishDate: string;
//   expiryDate: string;
//   status: "published" | "draft";
// }

// const CircularsManagement: React.FC = () => {
//   const [circulars] = useState<Circular[]>([
//     {
//       id: 1,
//       title: "Academic Calendar Update",
//       audience: "All Students",
//       priority: "high",
//       publishDate: "2025-12-01",
//       expiryDate: "2025-12-31",
//       status: "published",
//     },
//   ]);

//   return (
//     <div className="space-y-6 p-4 sm:p-6 lg:p-8">
//       <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
//         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
//           Notifications & Circulars
//         </h1>
//         <p className="text-gray-600 text-sm sm:text-base">
//           Manage institutional communication
//         </p>
//       </div>

//       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-900">Circulars</h2>
//           <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
//             <PlusCircleIcon className="h-5 w-5" />
//             Create Circular
//           </button>
//         </div>

//         <div className="mb-4">
//           <div className="relative">
//             <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search circulars..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>

//         <div className="space-y-3">
//           {circulars.map((circular) => (
//             <div
//               key={circular.id}
//               className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
//             >
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <h3 className="font-semibold text-gray-900">{circular.title}</h3>
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         circular.priority === "high"
//                           ? "bg-red-100 text-red-700"
//                           : "bg-gray-100 text-gray-700"
//                       }`}
//                     >
//                       {circular.priority}
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-600 mb-1">
//                     Audience: {circular.audience}
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     Published: {circular.publishDate} • Expires: {circular.expiryDate}
//                   </p>
//                 </div>
//                 <div className="flex gap-2">
//                   <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
//                     <EyeIcon className="h-5 w-5" />
//                   </button>
//                   <button className="p-2 text-green-600 hover:bg-green-50 rounded">
//                     <PencilSquareIcon className="h-5 w-5" />
//                   </button>
//                   <button className="p-2 text-red-600 hover:bg-red-50 rounded">
//                     <TrashIcon className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CircularsManagement;
import React, { useState } from "react";

export default function CommunicationModuleUI() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="w-full p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Communication Module</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "add", label: "Add Log" },
          { id: "calendar", label: "Calendar" },
          { id: "history", label: "History" },
          { id: "pending", label: "Pending" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl shadow ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stat Cards */}
            <div className="bg-white p-6 rounded-2xl shadow text-center">
              <p className="text-gray-500">Today’s Communications</p>
              <h2 className="text-3xl font-bold text-blue-600">6</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow text-center">
              <p className="text-gray-500">Pending Follow-ups</p>
              <h2 className="text-3xl font-bold text-yellow-500">4</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow text-center">
              <p className="text-gray-500">Overdue</p>
              <h2 className="text-3xl font-bold text-red-500">2</h2>
            </div>
          </div>

          {/* Today Table */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-xl mb-4">Today’s Tasks</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Person</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Purpose</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Student A</td>
                  <td className="p-2">Call</td>
                  <td className="p-2">Attendance</td>
                  <td className="p-2">10:00 AM</td>
                  <td className="p-2 text-blue-600 font-semibold">Pending</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Company HR</td>
                  <td className="p-2">Email</td>
                  <td className="p-2">Placement</td>
                  <td className="p-2">12:30 PM</td>
                  <td className="p-2 text-green-600 font-semibold">Completed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Communication Log */}
      {activeTab === "add" && (
        <div className="bg-white p-6 rounded-2xl shadow max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Add Communication Log</h2>

          <div className="space-y-4">
            <div>
              <label className="font-medium">Communicated With</label>
              <select className="w-full p-2 rounded-xl border mt-1">
                <option>Student</option>
                <option>Parent</option>
                <option>Company</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Communication Type</label>
              <select className="w-full p-2 rounded-xl border mt-1">
                <option>Call</option>
                <option>Email</option>
                <option>WhatsApp</option>
                <option>SMS</option>
                <option>Meeting</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Purpose</label>
              <input className="w-full p-2 rounded-xl border mt-1" placeholder="Enter purpose" />
            </div>

            <div>
              <label className="font-medium">Notes</label>
              <textarea className="w-full p-2 rounded-xl border mt-1 h-28" placeholder="Enter summary" />
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow w-full font-semibold mt-4">
              Save Communication Log
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      {activeTab === "calendar" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">Follow-up Calendar</h2>
          <p className="text-gray-500">(Calendar UI placeholder — integrate any calendar library)</p>

          <div className="grid grid-cols-7 gap-2 mt-4">
            {[...Array(30).keys()].map((day) => (
              <div
                key={day}
                className="h-20 rounded-xl flex items-center justify-center shadow bg-gray-50"
              >
                {day + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="bg-white p-6 rounded-2xl shadow max-w-3xl">
          <h2 className="text-xl font-bold mb-4">Communication History</h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl shadow">
              <p className="font-semibold">02 Jan 2026 • Call</p>
              <p className="text-gray-600">Discussed attendance issue with parent.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl shadow">
              <p className="font-semibold">28 Dec 2025 • Email</p>
              <p className="text-gray-600">Shared progress update and report.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending */}
      {activeTab === "pending" && (
        <div className="bg-white p-6 rounded-2xl shadow max-w-3xl">
          <h2 className="text-xl font-bold mb-4">Pending & Overdue Follow-ups</h2>

          <ul className="space-y-3">
            <li className="p-4 bg-yellow-100 rounded-xl shadow flex justify-between">
              <span>Student A - Call (Today)</span>
              <button className="px-3 py-1 bg-green-600 text-white rounded-xl">Mark Done</button>
            </li>
            <li className="p-4 bg-red-100 rounded-xl shadow flex justify-between">
              <span>Student B - WhatsApp (Overdue)</span>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-xl">Reschedule</button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}