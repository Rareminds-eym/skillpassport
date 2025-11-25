
// // // import React, { useState } from "react";
// // // import { CheckCircle, XCircle, FileText } from "lucide-react";

// // // export default function VerifiedStudentWorkUI() {
// // //   const allData = [
// // //     { id: 1, studentName: "Aarav Sharma", title: "Portfolio Website", description: "A personal portfolio showcasing UI/UX and frontend skills.", status: "verified" },
// // //     { id: 2, studentName: "Sneha Reddy", title: "Resume", description: "Professional resume with updated academic details.", status: "pending" },
// // //     { id: 3, studentName: "Rahul Verma", title: "Python Mini Project", description: "A basic calculator built using Python.", status: "rejected" },
// // //     { id: 4, studentName: "Priya Iyer", title: "React To-Do App", description: "A to-do app using React hooks.", status: "verified" },
// // //     { id: 5, studentName: "Karan Patel", title: "Data Visualization Report", description: "Analysis using charts and graphs.", status: "pending" },
// // //     { id: 6, studentName: "Aditi Rao", title: "Node.js API Project", description: "REST API using Node.js.", status: "verified" },
// // //     { id: 7, studentName: "Manoj Singh", title: "Java Banking App", description: "A simple Java‑based banking system.", status: "rejected" },
// // //     { id: 8, studentName: "Nisha Gupta", title: "Canva Graphic Designs", description: "Poster and banner designs.", status: "pending" },
// // //     { id: 9, studentName: "Rohit Nair", title: "SQL Database Schema", description: "ER diagram and schema creation.", status: "verified" }
// // //   ];

// // //   const statusStyles = {
// // //     verified: "bg-green-100 text-green-700 border-green-300",
// // //     pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
// // //     rejected: "bg-red-100 text-red-700 border-red-300",
// // //   };

// // //   // STATES
// // //   const [search, setSearch] = useState("");
// // //   const [filterStatus, setFilterStatus] = useState("all");
// // //   const [page, setPage] = useState(1);

// // //   const itemsPerPage = 6;

// // //   // FILTER + SEARCH
// // //   const filteredData = allData.filter((item) => {
// // //     const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.studentName.toLowerCase().includes(search.toLowerCase());
// // //     const matchesStatus = filterStatus === "all" || item.status === filterStatus;
// // //     return matchesSearch && matchesStatus;
// // //   });

// // //   // PAGINATION
// // //   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
// // //   const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

// // //   return (
// // //     <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
// // //       <h1 className="text-3xl font-bold mb-6 text-gray-800">Verified Student Work</h1>

// // //       {/* Search & Filter */}
// // //       <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-4 mb-6">
// // //         <input
// // //           type="text"
// // //           placeholder="Search by name or project..."
// // //           className="w-full sm:w-2/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
// // //           value={search}
// // //           onChange={(e) => setSearch(e.target.value)}
// // //         />

// // //         <select
// // //           className="w-full sm:w-1/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
// // //           value={filterStatus}
// // //           onChange={(e) => setFilterStatus(e.target.value)}
// // //         >
// // //           <option value="all">All</option>
// // //           <option value="verified">Verified</option>
// // //           <option value="pending">Pending</option>
// // //           <option value="rejected">Rejected</option>
// // //         </select>
// // //       </div>

// // //       {/* GRID */}
// // //       <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// // //         {paginatedData.map((item) => (
// // //           <div key={item.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex flex-col gap-3">
// // //             <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
// // //               <FileText size={28} />
// // //             </div>

// // //             <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
// // //             <p className="text-sm text-blue-700 font-medium">{item.studentName}</p>
// // //             <p className="text-gray-600 text-sm">{item.description}</p>

// // //             <div className={`mt-2 inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${statusStyles[item.status]}`}>
// // //               {item.status === "verified" && <CheckCircle size={16} className="mr-1" />}
// // //               {item.status === "rejected" && <XCircle size={16} className="mr-1" />}
// // //               {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
// // //             </div>
// // //           </div>
// // //         ))}
// // //       </div>

// // //       {/* Pagination */}
// // //       <div className="flex items-center gap-3 mt-8">
// // //         <button
// // //           disabled={page === 1}
// // //           onClick={() => setPage(page - 1)}
// // //           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
// // //         >
// // //           Prev
// // //         </button>

// // //         <span className="font-semibold">Page {page} of {totalPages}</span>

// // //         <button
// // //           disabled={page === totalPages}
// // //           onClick={() => setPage(page + 1)}
// // //           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
// // //         >
// // //           Next
// // //         </button>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // import React, { useState } from "react";
// // // import { CheckCircle, XCircle, FileText } from "lucide-react";

// // // // UPDATED VERSION WITH Sorting, Tabs, Dark Mode, Recruiter View

// // // export default function VerifiedStudentWorkUI() {
// // //   const allData = [
// // //     { id: 1, studentName: "Aarav Sharma", title: "Portfolio Website", description: "A personal portfolio showcasing UI/UX and frontend skills.", status: "verified" },
// // //     { id: 2, studentName: "Sneha Reddy", title: "Resume", description: "Professional resume with updated academic details.", status: "pending" },
// // //     { id: 3, studentName: "Rahul Verma", title: "Python Mini Project", description: "A basic calculator built using Python.", status: "rejected" },
// // //     { id: 4, studentName: "Priya Iyer", title: "React To-Do App", description: "A to-do app using React hooks.", status: "verified" },
// // //     { id: 5, studentName: "Karan Patel", title: "Data Visualization Report", description: "Analysis using charts and graphs.", status: "pending" },
// // //     { id: 6, studentName: "Aditi Rao", title: "Node.js API Project", description: "REST API using Node.js.", status: "verified" },
// // //     { id: 7, studentName: "Manoj Singh", title: "Java Banking App", description: "A simple Java‑based banking system.", status: "rejected" },
// // //     { id: 8, studentName: "Nisha Gupta", title: "Canva Graphic Designs", description: "Poster and banner designs.", status: "pending" },
// // //     { id: 9, studentName: "Rohit Nair", title: "SQL Database Schema", description: "ER diagram and schema creation.", status: "verified" }
// // //   ];

// // //   const statusStyles = {
// // //     verified: "bg-green-100 text-green-700 border-green-300",
// // //     pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
// // //     rejected: "bg-red-100 text-red-700 border-red-300",
// // //   };

// // //   // STATES
// // //   const [search, setSearch] = useState("");
// // //   const [filterStatus, setFilterStatus] = useState("all");
// // //   const [page, setPage] = useState(1);

// // //   const itemsPerPage = 6;

// // //   // FILTER + SEARCH
// // //   const filteredData = allData.filter((item) => {
// // //     const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.studentName.toLowerCase().includes(search.toLowerCase());
// // //     const matchesStatus = filterStatus === "all" || item.status === filterStatus;
// // //     return matchesSearch && matchesStatus;
// // //   });

// // //   // PAGINATION
// // //   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
// // //   const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

// // //   return (
// // //     <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
// // //       <h1 className="text-3xl font-bold mb-6 text-gray-800">Verified Student Work</h1>

// // //       {/* Search & Filter */}
// // //       <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-4 mb-6">
// // //         <input
// // //           type="text"
// // //           placeholder="Search by name or project..."
// // //           className="w-full sm:w-2/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
// // //           value={search}
// // //           onChange={(e) => setSearch(e.target.value)}
// // //         />

// // //         <select
// // //           className="w-full sm:w-1/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
// // //           value={filterStatus}
// // //           onChange={(e) => setFilterStatus(e.target.value)}
// // //         >
// // //           <option value="all">All</option>
// // //           <option value="verified">Verified</option>
// // //           <option value="pending">Pending</option>
// // //           <option value="rejected">Rejected</option>
// // //         </select>
// // //       </div>

// // //       {/* GRID */}
// // //       <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// // //         {paginatedData.map((item) => (
// // //           <div key={item.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex flex-col gap-3">
// // //             <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
// // //               <FileText size={28} />
// // //             </div>

// // //             <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
// // //             <p className="text-sm text-blue-700 font-medium">{item.studentName}</p>
// // //             <p className="text-gray-600 text-sm">{item.description}</p>

// // //             <div className={`mt-2 inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${statusStyles[item.status]}`}>
// // //               {item.status === "verified" && <CheckCircle size={16} className="mr-1" />}
// // //               {item.status === "rejected" && <XCircle size={16} className="mr-1" />}
// // //               {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
// // //             </div>
// // //           </div>
// // //         ))}
// // //       </div>

// // //       {/* Pagination */}
// // //       <div className="flex items-center gap-3 mt-8">
// // //         <button
// // //           disabled={page === 1}
// // //           onClick={() => setPage(page - 1)}
// // //           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
// // //         >
// // //           Prev
// // //         </button>

// // //         <span className="font-semibold">Page {page} of {totalPages}</span>

// // //         <button
// // //           disabled={page === totalPages}
// // //           onClick={() => setPage(page + 1)}
// // //           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
// // //         >
// // //           Next
// // //         </button>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // import React, { useState } from "react";
// // import { CheckCircle, XCircle, FileText } from "lucide-react";

// // export default function VerifiedStudentWorkUI() {
// //   const initialData = [
// //     { id: 1, studentName: "Aarav Sharma", title: "Portfolio Website", description: "A personal portfolio showcasing UI/UX and frontend skills.", status: "verified" },
// //     { id: 2, studentName: "Sneha Reddy", title: "Resume", description: "Professional resume with updated academic details.", status: "pending" },
// //     { id: 3, studentName: "Rahul Verma", title: "Python Mini Project", description: "A basic calculator built using Python.", status: "rejected" },
// //     { id: 4, studentName: "Priya Iyer", title: "React To-Do App", description: "A to-do app using React hooks.", status: "verified" },
// //     { id: 5, studentName: "Karan Patel", title: "Data Visualization Report", description: "Analysis using charts and graphs.", status: "pending" },
// //     { id: 6, studentName: "Aditi Rao", title: "Node.js API Project", description: "REST API using Node.js.", status: "verified" },
// //     { id: 7, studentName: "Manoj Singh", title: "Java Banking App", description: "A simple Java-based banking system.", status: "rejected" },
// //     { id: 8, studentName: "Nisha Gupta", title: "Canva Graphic Designs", description: "Poster and banner designs.", status: "pending" },
// //     { id: 9, studentName: "Rohit Nair", title: "SQL Database Schema", description: "ER diagram and schema creation.", status: "verified" }
// //   ];

// //   const [allData, setAllData] = useState(initialData);

// //   const statusStyles = {
// //     verified: "bg-green-100 text-green-700 border-green-300",
// //     pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
// //     rejected: "bg-red-100 text-red-700 border-red-300",
// //   };

// //   // 🔄 Status cycle function
// //   const cycleStatus = (id) => {
// //     setAllData((prev) =>
// //       prev.map((item) => {
// //         if (item.id === id) {
// //           const next =
// //             item.status === "verified"
// //               ? "pending"
// //               : item.status === "pending"
// //               ? "rejected"
// //               : "verified";
// //           return { ...item, status: next };
// //         }
// //         return item;
// //       })
// //     );
// //   };

// //   // Search & filter states
// //   const [search, setSearch] = useState("");
// //   const [filterStatus, setFilterStatus] = useState("all");
// //   const [page, setPage] = useState(1);

// //   const itemsPerPage = 6;

// //   const filteredData = allData.filter((item) => {
// //     const matchesSearch =
// //       item.title.toLowerCase().includes(search.toLowerCase()) ||
// //       item.studentName.toLowerCase().includes(search.toLowerCase());

// //     const matchesStatus = filterStatus === "all" || item.status === filterStatus;

// //     return matchesSearch && matchesStatus;
// //   });

// //   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
// //   const paginatedData = filteredData.slice(
// //     (page - 1) * itemsPerPage,
// //     page * itemsPerPage
// //   );

// //   return (
// //     <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
// //       <h1 className="text-3xl font-bold mb-6 text-gray-800">Verified Student Work</h1>

// //       {/* Search + Filter */}
// //       <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-4 mb-6">
// //         <input
// //           type="text"
// //           placeholder="Search by name or project..."
// //           className="w-full sm:w-2/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
// //           value={search}
// //           onChange={(e) => setSearch(e.target.value)}
// //         />

// //         <select
// //           className="w-full sm:w-1/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
// //           value={filterStatus}
// //           onChange={(e) => setFilterStatus(e.target.value)}
// //         >
// //           <option value="all">All</option>
// //           <option value="verified">Verified</option>
// //           <option value="pending">Pending</option>
// //           <option value="rejected">Rejected</option>
// //         </select>
// //       </div>

// //       {/* Cards Grid */}
// //       <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// //         {paginatedData.map((item) => (
// //           <div
// //             key={item.id}
// //             className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex flex-col gap-3"
// //           >
// //             <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
// //               <FileText size={28} />
// //             </div>

// //             <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
// //             <p className="text-sm text-blue-700 font-medium">{item.studentName}</p>
// //             <p className="text-gray-600 text-sm">{item.description}</p>

// //             {/* 🔥 CLICKABLE STATUS BADGE */}
// //             <div
// //               onClick={() => cycleStatus(item.id)}
// //               className={`mt-2 inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border cursor-pointer transition-all ${statusStyles[item.status]}`}
// //             >
// //               {item.status === "verified" && <CheckCircle size={16} className="mr-1" />}
// //               {item.status === "rejected" && <XCircle size={16} className="mr-1" />}
// //               {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Pagination */}
// //       <div className="flex items-center gap-3 mt-8">
// //         <button
// //           disabled={page === 1}
// //           onClick={() => setPage(page - 1)}
// //           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
// //         >
// //           Prev
// //         </button>

// //         <span className="font-semibold">
// //           Page {page} of {totalPages}
// //         </span>

// //         <button
// //           disabled={page === totalPages}
// //           onClick={() => setPage(page + 1)}
// //           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
// //         >
// //           Next
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// import React, { useState } from "react";
// import { CheckCircle, XCircle, FileText } from "lucide-react";

// export default function VerifiedStudentWorkUI() {
//   const [allData, setAllData] = useState([
//     { id: 1, studentName: "Aarav Sharma", title: "Portfolio Website", description: "A personal portfolio showcasing UI/UX and frontend skills.", status: "verified" },
//     { id: 2, studentName: "Sneha Reddy", title: "Resume", description: "Professional resume with updated academic details.", status: "pending" },
//     { id: 3, studentName: "Rahul Verma", title: "Python Mini Project", description: "A basic calculator built using Python.", status: "rejected" },
//     { id: 4, studentName: "Priya Iyer", title: "React To-Do App", description: "A to-do app using React hooks.", status: "verified" },
//     { id: 5, studentName: "Karan Patel", title: "Data Visualization Report", description: "Analysis using charts and graphs.", status: "pending" },
//     { id: 6, studentName: "Aditi Rao", title: "Node.js API Project", description: "REST API using Node.js.", status: "verified" },
//     { id: 7, studentName: "Manoj Singh", title: "Java Banking App", description: "A simple Java-based banking system.", status: "rejected" },
//     { id: 8, studentName: "Nisha Gupta", title: "Canva Graphic Designs", description: "Poster and banner designs.", status: "pending" },
//     { id: 9, studentName: "Rohit Nair", title: "SQL Database Schema", description: "ER diagram and schema creation.", status: "verified" }
//   ]);

//   const statusStyles = {
//     verified: "bg-green-100 text-green-700 border-green-300",
//     pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
//     rejected: "bg-red-100 text-red-700 border-red-300",
//   };

//   // STATES
//   const [search, setSearch] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [page, setPage] = useState(1);

//   const itemsPerPage = 6;

//   // FILTER + SEARCH
//   const filteredData = allData.filter((item) => {
//     const matchesSearch =
//       item.title.toLowerCase().includes(search.toLowerCase()) ||
//       item.studentName.toLowerCase().includes(search.toLowerCase());

//     const matchesStatus = filterStatus === "all" || item.status === filterStatus;
//     return matchesSearch && matchesStatus;
//   });

//   // PAGINATION
//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//   const paginatedData = filteredData.slice(
//     (page - 1) * itemsPerPage,
//     page * itemsPerPage
//   );

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
//       <h1 className="text-3xl font-bold mb-6 text-gray-800">Verified Student Work</h1>

//       {/* Search & Filter */}
//       <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Search by name or project..."
//           className="w-full sm:w-2/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         <select
//           className="w-full sm:w-1/3 px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//         >
//           <option value="all">All</option>
//           <option value="verified">Verified</option>
//           <option value="pending">Pending</option>
//           <option value="rejected">Rejected</option>
//         </select>
//       </div>

//       {/* GRID */}
//       <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {paginatedData.map((item) => (
//           <div
//             key={item.id}
//             className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex flex-col gap-3"
//           >
//             <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
//               <FileText size={28} />
//             </div>

//             <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
//             <p className="text-sm text-blue-700 font-medium">{item.studentName}</p>
//             <p className="text-gray-600 text-sm">{item.description}</p>

//             {/* 🔻 STATUS DROPDOWN */}
//             <select
//               value={item.status}
//               onChange={(e) =>
//                 setAllData((prev) =>
//                   prev.map((row) =>
//                     row.id === item.id
//                       ? { ...row, status: e.target.value }
//                       : row
//                   )
//                 )
//               }
//               className={`mt-2 px-3 py-1 text-sm font-medium rounded-lg border cursor-pointer ${statusStyles[item.status]}`}
//             >
//               <option value="verified">Verified</option>
//               <option value="pending">Pending</option>
//               <option value="rejected">Rejected</option>
//             </select>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center gap-3 mt-8">
//         <button
//           disabled={page === 1}
//           onClick={() => setPage(page - 1)}
//           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
//         >
//           Prev
//         </button>

//         <span className="font-semibold">
//           Page {page} of {totalPages}
//         </span>

//         <button
//           disabled={page === totalPages}
//           onClick={() => setPage(page + 1)}
//           className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }
// import React, { useMemo, useState } from "react";
// import { CheckCircle, XCircle, FileText } from "lucide-react";

// export default function VerifiedStudentWorkUI() {
//   const initialData = [
//     {
//       id: 1,
//       studentName: "Aarav Sharma",
//       title: "Portfolio Website",
//       description: "A personal portfolio showcasing UI/UX and frontend skills.",
//       status: "verified",
//       createdAt: "2025-10-18T09:30:00Z",
//     },
//     {
//       id: 2,
//       studentName: "Sneha Reddy",
//       title: "Resume",
//       description: "Professional resume with updated academic details.",
//       status: "pending",
//       createdAt: "2025-11-05T14:20:00Z",
//     },
//     {
//       id: 3,
//       studentName: "Rahul Verma",
//       title: "Python Mini Project",
//       description: "A basic calculator built using Python.",
//       status: "rejected",
//       createdAt: "2025-09-02T12:10:00Z",
//     },
//     {
//       id: 4,
//       studentName: "Priya Iyer",
//       title: "React To-Do App",
//       description: "A to-do app using React hooks.",
//       status: "verified",
//       createdAt: "2025-08-29T08:45:00Z",
//     },
//     {
//       id: 5,
//       studentName: "Karan Patel",
//       title: "Data Visualization Report",
//       description: "Analysis using charts and graphs.",
//       status: "pending",
//       createdAt: "2025-11-10T11:00:00Z",
//     },
//     {
//       id: 6,
//       studentName: "Aditi Rao",
//       title: "Node.js API Project",
//       description: "REST API using Node.js.",
//       status: "verified",
//       createdAt: "2025-07-14T16:30:00Z",
//     },
//     {
//       id: 7,
//       studentName: "Manoj Singh",
//       title: "Java Banking App",
//       description: "A simple Java-based banking system.",
//       status: "rejected",
//       createdAt: "2025-06-21T10:15:00Z",
//     },
//     {
//       id: 8,
//       studentName: "Nisha Gupta",
//       title: "Canva Graphic Designs",
//       description: "Poster and banner designs.",
//       status: "pending",
//       createdAt: "2025-11-12T09:40:00Z",
//     },
//     {
//       id: 9,
//       studentName: "Rohit Nair",
//       title: "SQL Database Schema",
//       description: "ER diagram and schema creation.",
//       status: "verified",
//       createdAt: "2025-05-03T07:50:00Z",
//     },
//   ];

//   const [data, setData] = useState(initialData);
//   const [search, setSearch] = useState("");
//   const [tab, setTab] = useState("all");
//   const [sort, setSort] = useState("latest");
//   const [page, setPage] = useState(1);

//   const itemsPerPage = 6;

//   const statusStyles = {
//     verified: "bg-green-100 text-green-700 border-green-300",
//     pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
//     rejected: "bg-red-100 text-red-700 border-red-300",
//   };

//   const updateStatus = (id, newStatus) => {
//     setData((prev) => prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
//   };

//   const filtered = useMemo(() => {
//     let arr = data;

//     if (tab !== "all") arr = arr.filter((x) => x.status === tab);

//     if (search.trim()) {
//       const q = search.toLowerCase();
//       arr = arr.filter(
//         (x) => x.title.toLowerCase().includes(q) || x.studentName.toLowerCase().includes(q)
//       );
//     }

//     if (sort === "az") arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
//     if (sort === "za") arr = [...arr].sort((a, b) => b.title.localeCompare(a.title));
//     if (sort === "latest") arr = [...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     if (sort === "oldest") arr = [...arr].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

//     return arr;
//   }, [data, tab, search, sort]);

//   const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
//   const showData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-6xl mx-auto">
//         <h1 className="text-3xl font-bold mb-2 text-gray-800">Verified Student Work</h1>
//         <p className="text-lg text-gray-500 mb-6">Showcase of student submissions — verified by recruiters.</p>

//         {/* Tabs + Search + Sort */}
//         <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
//           {/* Tabs */}
//           <div className="flex gap-2 flex-wrap">
//             {["all", "verified", "pending", "rejected"].map((t) => (
//               <button
//                 key={t}
//                 onClick={() => {
//                   setTab(t);
//                   setPage(1);
//                 }}
//                 className={`px-3 py-2 rounded-lg text-sm font-medium ${
//                   tab === t
//                     ? "bg-blue-600 text-white"
//                     : "bg-transparent border border-gray-300"
//                 }`}
//               >
//                 {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
//               </button>
//             ))}
//           </div>

//           {/* Search */}
//           <input
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//             placeholder="Search by student name or project..."
//             className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
//           />

//           {/* Sort */}
//           <select
//             value={sort}
//             onChange={(e) => {
//               setSort(e.target.value);
//               setPage(1);
//             }}
//             className="px-4 py-2 rounded-xl border border-gray-300"
//           >
//             <option value="latest">Sort: Latest</option>
//             <option value="oldest">Sort: Oldest</option>
//             <option value="az">Sort: A - Z</option>
//             <option value="za">Sort: Z - A</option>
//           </select>
//         </div>

//         {/* Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {showData.map((item) => (
//             <div key={item.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
//               <div className="flex items-start justify-between gap-2 flex-wrap">
//                 <div className="flex items-center gap-3">
//                   <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
//                     <FileText size={22} />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
//                     <p className="text-sm text-blue-600 font-medium">{item.studentName}</p>
//                     <p className="text-xs text-gray-500 mt-1">
//                       Submitted {new Date(item.createdAt).toLocaleDateString()}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Responsive Dropdown */}
//                 <select
//                   value={item.status}
//                   onChange={(e) => updateStatus(item.id, e.target.value)}
//                   className={`rounded-lg border ${statusStyles[item.status]}
//                     text-[10px] sm:text-xs md:text-sm
//                     px-1.5 py-0.5 sm:px-2 sm:py-1
//                     max-w-[85px] sm:max-w-[110px] md:max-w-[130px]
//                     truncate
//                   `}
//                 >
//                   <option value="verified">Verified</option>
//                   <option value="pending">Pending</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
//               </div>

//               <p className="text-gray-600 text-sm mt-3">{item.description}</p>
//             </div>
//           ))}
//         </div>

//         {/* No Results */}
//         {filtered.length === 0 && (
//           <div className="text-center text-gray-500 mt-10">No results found.</div>
//         )}

//         {/* Pagination */}
//         <div className="flex items-center justify-center gap-3 mt-8">
//           <button
//             disabled={page === 1}
//             onClick={() => setPage(page - 1)}
//             className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
//           >
//             Prev
//           </button>

//           <span className="font-medium">Page {page} of {totalPages}</span>

//           <button
//             disabled={page === totalPages}
//             onClick={() => setPage(page + 1)}
//             className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useMemo, useState } from "react";
import { FileText } from "lucide-react";

export default function VerifiedStudentWorkUI() {
  const initialData = [
    {
      id: 1,
      studentName: "Aarav Sharma",
      title: "Portfolio Website",
      description: "A personal portfolio showcasing UI/UX and frontend skills.",
      status: "verified",
      createdAt: "2025-10-18T09:30:00Z",
    },
    {
      id: 2,
      studentName: "Sneha Reddy",
      title: "Resume",
      description: "Professional resume with updated academic details.",
      status: "pending",
      createdAt: "2025-11-05T14:20:00Z",
    },
    {
      id: 3,
      studentName: "Rahul Verma",
      title: "Python Mini Project",
      description: "A basic calculator built using Python.",
      status: "rejected",
      createdAt: "2025-09-02T12:10:00Z",
    },
    {
      id: 4,
      studentName: "Priya Iyer",
      title: "React To-Do App",
      description: "A to-do app using React hooks.",
      status: "verified",
      createdAt: "2025-08-29T08:45:00Z",
    },
    {
      id: 5,
      studentName: "Karan Patel",
      title: "Data Visualization Report",
      description: "Analysis using charts and graphs.",
      status: "pending",
      createdAt: "2025-11-10T11:00:00Z",
    },
    {
      id: 6,
      studentName: "Aditi Rao",
      title: "Node.js API Project",
      description: "REST API using Node.js.",
      status: "verified",
      createdAt: "2025-07-14T16:30:00Z",
    },
    {
      id: 7,
      studentName: "Manoj Singh",
      title: "Java Banking App",
      description: "A simple Java-based banking system.",
      status: "rejected",
      createdAt: "2025-06-21T10:15:00Z",
    },
    {
      id: 8,
      studentName: "Nisha Gupta",
      title: "Canva Graphic Designs",
      description: "Poster and banner designs.",
      status: "pending",
      createdAt: "2025-11-12T09:40:00Z",
    },
    {
      id: 9,
      studentName: "Rohit Nair",
      title: "SQL Database Schema",
      description: "ER diagram and schema creation.",
      status: "verified",
      createdAt: "2025-05-03T07:50:00Z",
    },
  ];

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

  const itemsPerPage = 6;

  const statusStyles = {
    verified: "bg-green-100 text-green-700 border-green-300",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    rejected: "bg-red-100 text-red-700 border-red-300",
  };

  const updateStatus = (id, newStatus) => {
    setData((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
    );
  };

  const filtered = useMemo(() => {
    let arr = data;

    if (tab !== "all") arr = arr.filter((x) => x.status === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.studentName.toLowerCase().includes(q)
      );
    }

    if (sort === "az") arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "za") arr = [...arr].sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "latest")
      arr = [...arr].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    if (sort === "oldest")
      arr = [...arr].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

    return arr;
  }, [data, tab, search, sort]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const showData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Verified Student Work
        </h1>
        <p className="text-lg text-gray-500 mb-6">
          Showcase of student submissions — verified by recruiters.
        </p>

        {/* Tabs + Search + Sort */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {["all", "verified", "pending", "rejected"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "bg-transparent border border-gray-300"
                }`}
              >
                {t === "all"
                  ? "All"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name or project..."
            className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm"
          />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl border border-gray-300"
          >
            <option value="latest">Sort: Latest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="az">Sort: A - Z</option>
            <option value="za">Sort: Z - A</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showData.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex flex-col justify-between"
            >
              {/* TOP (fixed alignment) */}
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl">
                    <FileText size={22} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.title}
                    </h3>
                    <p className="text-sm text-blue-600 font-medium">
                      {item.studentName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* STATUS DROPDOWN — always aligned top */}
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className={`rounded-lg border ${statusStyles[item.status]}
                    text-xs px-2 py-1 min-w-[110px]
                  `}
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* BOTTOM */}
              <p className="text-gray-600 text-sm mt-4">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No results found.
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>

          <span className="font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
