// // // import React, { useEffect, useState, useRef } from "react";
// // // import { supabase } from "../../lib/supabaseClient";
// // // import { User, Calendar, Edit3, MessageCircle } from "lucide-react";
// // // import {
// // //   getLoggedInMentor,
// // //   getStudents,
// // //   getMentorNotes,
// // //   saveMentorNote,
// // // } from "../../services/educator/mentorNotes";

// // // const MentorNotes = () => {
// // //   const [students, setStudents] = useState([]);
// // //   const [notes, setNotes] = useState([]);

// // //   const [selectedStudent, setSelectedStudent] = useState("");
// // //   const [selectedQuickNotes, setSelectedQuickNotes] = useState([]);
// // //   const [feedback, setFeedback] = useState("");
// // //   const [actionPoints, setActionPoints] = useState("");
// // //   const [otherNote, setOtherNote] = useState("");
// // //   const [isOtherSelected, setIsOtherSelected] = useState(false);

// // //   const quickNoteOptions = [
// // //     "Excellent Progress",
// // //     "Needs Improvement",
// // //     "Strong Communication Skills",
// // //     "Great Technical Knowledge",
// // //     "Consistent Performance",
// // //     "Slow but Improving",
// // //     "Good Leadership Quality",
// // //     "Teamwork is Improving",
// // //     "Needs Extra Practice",
// // //     "Outstanding Creativity",
// // //     "Others",
// // //   ];

// // //   const [mentorInfo, setMentorInfo] = useState(null);

// // //   const [dropdownOpen, setDropdownOpen] = useState(false);
// // //   const [searchTerm, setSearchTerm] = useState("");
// // //   const dropdownRef = useRef();

// // //   useEffect(() => {
// // //     const handleClickOutside = (event) => {
// // //       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
// // //         setDropdownOpen(false);
// // //       }
// // //     };

// // //     document.addEventListener("mousedown", handleClickOutside);
// // //     return () => document.removeEventListener("mousedown", handleClickOutside);
// // //   }, []);

// // //   const filteredStudents = students.filter((s) =>
// // //     s.name.toLowerCase().includes(searchTerm.toLowerCase())
// // //   );

// // //   const displayStudents =
// // //     searchTerm.trim() === ""
// // //       ? filteredStudents.slice(0, 8)
// // //       : filteredStudents;

// // //   useEffect(() => {
// // //     const loadMentor = async () => {
// // //       const {
// // //         data: { user },
// // //       } = await supabase.auth.getUser();

// // //       const info = await getLoggedInMentor(user.id);
// // //       setMentorInfo(info);
// // //     };

// // //     loadMentor();
// // //   }, []);

// // //   useEffect(() => {
// // //     const loadData = async () => {
// // //       const s = await getStudents();
// // //       const n = await getMentorNotes();
// // //       setStudents(s);
// // //       setNotes(n);
// // //     };
// // //     loadData();
// // //   }, []);

// // //   // --------------------------
// // //   // Quick Notes Handle
// // //   // --------------------------
// // //   const handleQuickNoteSelect = (e) => {
// // //     const value = e.target.value;

// // //     if (value === "Others") {
// // //       setIsOtherSelected(true);
// // //       return;
// // //     }

// // //     setIsOtherSelected(false);

// // //     if (!selectedQuickNotes.includes(value)) {
// // //       setSelectedQuickNotes((prev) => [...prev, value]);
// // //     }
// // //   };

// // //   const handleOtherNoteChange = (e) => {
// // //     const value = e.target.value;
// // //     setOtherNote(value);

// // //     if (value.trim() !== "") {
// // //       const filtered = selectedQuickNotes.filter((n) => n !== otherNote);
// // //       setSelectedQuickNotes([...filtered, value]);
// // //     }
// // //   };

// // //   // --------------------------
// // //   // Save Note
// // //   // --------------------------
// // //   const handleSave = async () => {
// // //     if (!selectedStudent) {
// // //       alert("Please select a student");
// // //       return;
// // //     }

// // //     if (!mentorInfo) {
// // //       alert("Mentor profile not found!");
// // //       return;
// // //     }

// // //     const payload = {
// // //       student_id: selectedStudent,
// // //       mentor_type: mentorInfo.mentor_type,
// // //       school_educator_id:
// // //         mentorInfo.mentor_type === "school" ? mentorInfo.mentor_id : null,
// // //       college_lecturer_id:
// // //         mentorInfo.mentor_type === "college" ? mentorInfo.mentor_id : null,
// // //       quick_notes: selectedQuickNotes,
// // //       feedback,
// // //       action_points: actionPoints,
// // //     };

// // //     await saveMentorNote(payload);
// // //     alert("Saved successfully!");

// // //     const n = await getMentorNotes();
// // //     setNotes(n);

// // //     setSelectedQuickNotes([]);
// // //     setFeedback("");
// // //     setActionPoints("");
// // //     setOtherNote("");
// // //     setIsOtherSelected(false);
// // //   };

// // //   return (
// // //     <div className="p-6 bg-gray-50 min-h-screen">
// // //       {/* Header */}
// // //       <div className="max-w-7xl mx-auto mb-6">
// // //         <h1 className="text-2xl font-bold text-gray-800">📝 Mentor Notes</h1>
// // //         <p className="text-gray-600 mt-1">
// // //           Track and record qualitative feedback for your students.
// // //         </p>
// // //       </div>

// // //       {/* Add New Note */}
// // //       <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-8 mb-10 border border-gray-100">
// // //         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
// // //           <Edit3 className="text-blue-600" size={20} />
// // //           Add New Note
// // //         </h2>

// // //         {/* Student Dropdown */}
// // //         <div className="relative" ref={dropdownRef}>
// // //           <label className="text-sm text-gray-600">Select Student</label>

// // //           <div
// // //             onClick={() => setDropdownOpen(!dropdownOpen)}
// // //             className="w-full border border-gray-300 bg-white rounded-lg p-3 mt-1 cursor-pointer flex justify-between items-center hover:border-gray-400"
// // //           >
// // //             <span className="text-gray-700">
// // //               {selectedStudent
// // //                 ? students.find((s) => s.id === selectedStudent)?.name
// // //                 : "Select Student"}
// // //             </span>

// // //             <svg
// // //               className={`w-5 h-5 text-gray-500 transition-transform ${
// // //                 dropdownOpen ? "rotate-180" : ""
// // //               }`}
// // //               fill="none"
// // //               stroke="currentColor"
// // //               strokeWidth="2"
// // //               viewBox="0 0 24 24"
// // //             >
// // //               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
// // //             </svg>
// // //           </div>

// // //           {dropdownOpen && (
// // //             <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
// // //               <input
// // //                 type="text"
// // //                 placeholder="Search student..."
// // //                 value={searchTerm}
// // //                 onChange={(e) => setSearchTerm(e.target.value)}
// // //                 className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3"
// // //               />

// // //               <div className="max-h-60 overflow-y-auto">
// // //                 {displayStudents.length > 0 ? (
// // //                   displayStudents.map((s) => (
// // //                     <div
// // //                       key={s.id}
// // //                       onClick={() => {
// // //                         setSelectedStudent(s.id);
// // //                         setDropdownOpen(false);
// // //                       }}
// // //                       className="p-2 rounded-lg cursor-pointer hover:bg-blue-50 text-gray-800 text-sm"
// // //                     >
// // //                       {s.name}
// // //                     </div>
// // //                   ))
// // //                 ) : (
// // //                   <p className="text-sm text-gray-500 p-2 text-center">No matching students</p>
// // //                 )}
// // //               </div>
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* Quick Notes */}
// // //         <div className="mt-4">
// // //           <label className="text-sm text-gray-600">Quick Add Notes</label>

// // //           <select
// // //             onChange={handleQuickNoteSelect}
// // //             defaultValue=""
// // //             className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// // //           >
// // //             <option value="" disabled>
// // //               Select a note
// // //             </option>
// // //             {quickNoteOptions.map((note, index) => (
// // //               <option key={index} value={note}>
// // //                 {note}
// // //               </option>
// // //             ))}
// // //           </select>
// // //         </div>

// // //         {/* ✔ Display Selected Notes as Chips */}
// // //         {selectedQuickNotes.length > 0 && (
// // //           <div className="flex flex-wrap gap-2 mt-3">
// // //             {selectedQuickNotes.map((note, idx) => (
// // //               <span
// // //                 key={idx}
// // //                 className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full border border-blue-300"
// // //               >
// // //                 {note}
// // //               </span>
// // //             ))}
// // //           </div>
// // //         )}

// // //         {isOtherSelected && (
// // //           <div className="mt-3">
// // //             <label className="text-sm text-gray-600">Enter Custom Note</label>
// // //             <input
// // //               type="text"
// // //               value={otherNote}
// // //               onChange={handleOtherNoteChange}
// // //               className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// // //             />
// // //           </div>
// // //         )}

// // //         {/* Feedback */}
// // //         <div className="mt-4">
// // //           <label className="text-sm text-gray-600">Feedback</label>
// // //           <textarea
// // //             className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// // //             rows="3"
// // //             value={feedback}
// // //             onChange={(e) => setFeedback(e.target.value)}
// // //           ></textarea>
// // //         </div>

// // //         {/* Action Points */}
// // //         <div className="mt-4">
// // //           <label className="text-sm text-gray-600">Action Points</label>
// // //           <textarea
// // //             className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// // //             rows="2"
// // //             value={actionPoints}
// // //             onChange={(e) => setActionPoints(e.target.value)}
// // //           ></textarea>
// // //         </div>

// // //         <div className="mt-6 flex justify-end">
// // //           <button
// // //             onClick={handleSave}
// // //             className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md"
// // //           >
// // //             Save Note
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {/* Previous Notes */}
// // //       <div className="max-w-7xl mx-auto">
// // //         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
// // //           <MessageCircle className="text-green-600" size={20} />
// // //           Previous Notes
// // //         </h2>

// // //         <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
// // //           {notes.map((note) => (
// // //             <div
// // //               key={note.id}
// // //               className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
// // //             >
// // //               <div className="flex justify-between mb-3">
// // //                 <div className="flex items-center gap-2">
// // //                   <User size={18} className="text-blue-600" />
// // //                   <p className="font-medium text-gray-800">{note.students?.name}</p>
// // //                 </div>
// // //                 <div className="flex items-center gap-1 text-gray-500 text-sm">
// // //                   <Calendar size={16} />
// // //                   <span>{new Date(note.note_date).toLocaleDateString()}</span>
// // //                 </div>
// // //               </div>

// // //               <p className="text-gray-700">{note.feedback}</p>

// // //               <p className="text-sm text-gray-600 mt-3">
// // //                 <strong>Action Points:</strong> {note.action_points}
// // //               </p>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default MentorNotes;
// // import React, { useEffect, useState, useRef } from "react";
// // import { supabase } from "../../lib/supabaseClient";
// // import { User, Calendar, Edit3, MessageCircle } from "lucide-react";
// // import {
// //   getLoggedInMentor,
// //   getStudents,
// //   getMentorNotes,
// //   saveMentorNote,
// // } from "../../services/educator/mentorNotes";

// // const MentorNotes = () => {
// //   const [students, setStudents] = useState([]);
// //   const [notes, setNotes] = useState([]);

// //   const [selectedStudent, setSelectedStudent] = useState("");
// //   const [selectedQuickNotes, setSelectedQuickNotes] = useState([]);
// //   const [feedback, setFeedback] = useState("");
// //   const [actionPoints, setActionPoints] = useState("");
// //   const [otherNote, setOtherNote] = useState("");
// //   const [isOtherSelected, setIsOtherSelected] = useState(false);

// //   const quickNoteOptions = [
// //     "Excellent Progress",
// //     "Needs Improvement",
// //     "Strong Communication Skills",
// //     "Great Technical Knowledge",
// //     "Consistent Performance",
// //     "Slow but Improving",
// //     "Good Leadership Quality",
// //     "Teamwork is Improving",
// //     "Needs Extra Practice",
// //     "Outstanding Creativity",
// //     "Others",
// //   ];

// //   // Chip color cycle (pastel-ish)
// //   const chipColors = [
// //     "bg-blue-100 text-blue-700 border-blue-300",
// //     "bg-green-100 text-green-700 border-green-300",
// //     "bg-purple-100 text-purple-700 border-purple-300",
// //     "bg-pink-100 text-pink-700 border-pink-300",
// //     "bg-yellow-100 text-yellow-700 border-yellow-300",
// //     "bg-indigo-100 text-indigo-700 border-indigo-300",
// //   ];

// //   const [mentorInfo, setMentorInfo] = useState(null);

// //   // Student dropdown state
// //   const [dropdownOpen, setDropdownOpen] = useState(false);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const dropdownRef = useRef();

// //   // Quick Notes dropdown state
// //   const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
// //   const quickDropdownRef = useRef();

// //   useEffect(() => {
// //     const handleClickOutside = (event) => {
// //       if (
// //         dropdownRef.current &&
// //         !dropdownRef.current.contains(event.target)
// //       ) {
// //         setDropdownOpen(false);
// //       }
// //       if (
// //         quickDropdownRef.current &&
// //         !quickDropdownRef.current.contains(event.target)
// //       ) {
// //         setQuickDropdownOpen(false);
// //       }
// //     };

// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   const filteredStudents = students.filter((s) =>
// //     s.name.toLowerCase().includes(searchTerm.toLowerCase())
// //   );

// //   const displayStudents =
// //     searchTerm.trim() === ""
// //       ? filteredStudents.slice(0, 8)
// //       : filteredStudents;

// //   useEffect(() => {
// //     const loadMentor = async () => {
// //       const {
// //         data: { user },
// //       } = await supabase.auth.getUser();

// //       const info = await getLoggedInMentor(user.id);
// //       setMentorInfo(info);
// //     };

// //     loadMentor();
// //   }, []);

// //   useEffect(() => {
// //     const loadData = async () => {
// //       const s = await getStudents();
// //       const n = await getMentorNotes();
// //       setStudents(s);
// //       setNotes(n);
// //     };
// //     loadData();
// //   }, []);

// //   // --------------------------
// //   // Quick Notes handlers
// //   // --------------------------
// //   const toggleQuickNote = (note) => {
// //     if (note === "Others") {
// //       // Open custom input (don't auto-add "Others" as a chip)
// //       setIsOtherSelected(true);
// //       setQuickDropdownOpen(true);
// //       return;
// //     } else {
// //       setIsOtherSelected(false);
// //     }

// //     setSelectedQuickNotes((prev) => {
// //       if (prev.includes(note)) {
// //         return prev.filter((n) => n !== note);
// //       } else {
// //         return [...prev, note];
// //       }
// //     });
// //   };

// //   const handleOtherNoteChange = (e) => {
// //     const value = e.target.value;
// //     setOtherNote(value);

// //     // If user types, ensure the typed value exists in selectedQuickNotes (replace previous custom)
// //     if (value.trim() === "") {
// //       // remove any previous custom text that isn't one of the predefined ones
// //       setSelectedQuickNotes((prev) =>
// //         prev.filter((n) => quickNoteOptions.includes(n))
// //       );
// //       return;
// //     }

// //     setSelectedQuickNotes((prev) => {
// //       // remove old custom (non-predefined)
// //       const filtered = prev.filter((n) => quickNoteOptions.includes(n));
// //       // add new custom if not already present
// //       if (!filtered.includes(value)) {
// //         return [...filtered, value];
// //       }
// //       return filtered;
// //     });
// //   };

// //   const removeQuickNote = (note) => {
// //     setSelectedQuickNotes((prev) => prev.filter((n) => n !== note));
// //     if (note === otherNote) {
// //       setOtherNote("");
// //       setIsOtherSelected(false);
// //     }
// //   };

// //   // --------------------------
// //   // Save Note
// //   // --------------------------
// //   const handleSave = async () => {
// //     if (!selectedStudent) {
// //       alert("Please select a student");
// //       return;
// //     }

// //     if (!mentorInfo) {
// //       alert("Mentor profile not found!");
// //       return;
// //     }

// //     const payload = {
// //       student_id: selectedStudent,
// //       mentor_type: mentorInfo.mentor_type,
// //       school_educator_id:
// //         mentorInfo.mentor_type === "school" ? mentorInfo.mentor_id : null,
// //       college_lecturer_id:
// //         mentorInfo.mentor_type === "college" ? mentorInfo.mentor_id : null,
// //       quick_notes: selectedQuickNotes,
// //       feedback,
// //       action_points: actionPoints,
// //     };

// //     await saveMentorNote(payload);
// //     alert("Saved successfully!");

// //     const n = await getMentorNotes();
// //     setNotes(n);

// //     setSelectedQuickNotes([]);
// //     setFeedback("");
// //     setActionPoints("");
// //     setOtherNote("");
// //     setIsOtherSelected(false);
// //   };

// //   return (
// //     <div className="p-6 bg-gray-50 min-h-screen">
// //       {/* Header */}
// //       <div className="max-w-7xl mx-auto mb-6">
// //         <h1 className="text-2xl font-bold text-gray-800">📝 Mentor Notes</h1>
// //         <p className="text-gray-600 mt-1">
// //           Track and record qualitative feedback for your students.
// //         </p>
// //       </div>

// //       {/* Add New Note */}
// //       <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-8 mb-10 border border-gray-100">
// //         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
// //           <Edit3 className="text-blue-600" size={20} />
// //           Add New Note
// //         </h2>

// //         {/* Student Dropdown */}
// //         <div className="relative" ref={dropdownRef}>
// //           <label className="text-sm text-gray-600">Select Student</label>

// //           <div
// //             onClick={() => setDropdownOpen(!dropdownOpen)}
// //             className="w-full border border-gray-300 bg-white rounded-lg p-3 mt-1 cursor-pointer flex justify-between items-center hover:border-gray-400"
// //           >
// //             <span className="text-gray-700">
// //               {selectedStudent
// //                 ? students.find((s) => s.id === selectedStudent)?.name
// //                 : "Select Student"}
// //             </span>

// //             <svg
// //               className={`w-5 h-5 text-gray-500 transition-transform ${
// //                 dropdownOpen ? "rotate-180" : ""
// //               }`}
// //               fill="none"
// //               stroke="currentColor"
// //               strokeWidth="2"
// //               viewBox="0 0 24 24"
// //             >
// //               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
// //             </svg>
// //           </div>

// //           {dropdownOpen && (
// //             <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
// //               <input
// //                 type="text"
// //                 placeholder="Search student..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3"
// //               />

// //               <div className="max-h-60 overflow-y-auto">
// //                 {displayStudents.length > 0 ? (
// //                   displayStudents.map((s) => (
// //                     <div
// //                       key={s.id}
// //                       onClick={() => {
// //                         setSelectedStudent(s.id);
// //                         setDropdownOpen(false);
// //                       }}
// //                       className="p-2 rounded-lg cursor-pointer hover:bg-blue-50 text-gray-800 text-sm"
// //                     >
// //                       {s.name}
// //                     </div>
// //                   ))
// //                 ) : (
// //                   <p className="text-sm text-gray-500 p-2 text-center">No matching students</p>
// //                 )}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* QUICK ADD NOTES (Multi-select dropdown matching your style) */}
// //         <div className="mt-4 relative" ref={quickDropdownRef}>
// //           <label className="text-sm text-gray-600">Quick Add Notes</label>

// //           {/* Dropdown toggle (looks like your other dropdown) */}
// //           <div
// //             onClick={() => setQuickDropdownOpen((v) => !v)}
// //             className="w-full border border-gray-300 bg-white rounded-lg p-3 mt-1 cursor-pointer flex justify-between items-center hover:border-gray-400"
// //           >
// //             <span className="text-gray-700">
// //               {selectedQuickNotes.length > 0
// //                 ? `Selected (${selectedQuickNotes.length})`
// //                 : "Select Quick Notes"}
// //             </span>

// //             <svg
// //               className={`w-5 h-5 text-gray-500 transition-transform ${
// //                 quickDropdownOpen ? "rotate-180" : ""
// //               }`}
// //               fill="none"
// //               stroke="currentColor"
// //               strokeWidth="2"
// //               viewBox="0 0 24 24"
// //             >
// //               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
// //             </svg>
// //           </div>

// //           {/* Dropdown panel */}
// //           {quickDropdownOpen && (
// //             <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
// //               <div className="max-h-60 overflow-y-auto">
// //                 {quickNoteOptions.map((note, index) => {
// //                   const checked = selectedQuickNotes.includes(note);
// //                   return (
// //                     <label
// //                       key={index}
// //                       className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-blue-50"
// //                       onClick={(e) => {
// //                         e.preventDefault(); // prevent label click from blurring
// //                         toggleQuickNote(note);
// //                       }}
// //                     >
// //                       <input
// //                         type="checkbox"
// //                         checked={checked}
// //                         readOnly
// //                         className="cursor-pointer"
// //                       />
// //                       <span className="text-gray-800 text-sm">{note}</span>
// //                     </label>
// //                   );
// //                 })}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* Selected Quick Notes Chips (colored, removable) */}
// //         {selectedQuickNotes.length > 0 && (
// //           <div className="flex flex-wrap gap-2 mt-3">
// //             {selectedQuickNotes.map((note, idx) => {
// //               const colorClass = chipColors[idx % chipColors.length];
// //               return (
// //                 <span
// //                   key={idx}
// //                   className={`px-3 py-1 rounded-full border text-sm flex items-center gap-2 ${colorClass}`}
// //                 >
// //                   <span className="whitespace-nowrap">{note}</span>
// //                   <button
// //                     onClick={() => removeQuickNote(note)}
// //                     className="text-gray-700 hover:text-red-600 ml-1"
// //                     aria-label={`Remove ${note}`}
// //                     type="button"
// //                   >
// //                     ✕
// //                   </button>
// //                 </span>
// //               );
// //             })}
// //           </div>
// //         )}

// //         {/* Others: custom note input */}
// //         {isOtherSelected && (
// //           <div className="mt-3">
// //             <label className="text-sm text-gray-600">Enter Custom Note</label>
// //             <input
// //               type="text"
// //               value={otherNote}
// //               onChange={handleOtherNoteChange}
// //               placeholder="Type custom note and it will be added as a chip"
// //               className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// //             />
// //           </div>
// //         )}

// //         {/* Feedback */}
// //         <div className="mt-4">
// //           <label className="text-sm text-gray-600">Feedback</label>
// //           <textarea
// //             className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// //             rows="3"
// //             value={feedback}
// //             onChange={(e) => setFeedback(e.target.value)}
// //           ></textarea>
// //         </div>

// //         {/* Action Points */}
// //         <div className="mt-4">
// //           <label className="text-sm text-gray-600">Action Points</label>
// //           <textarea
// //             className="w-full border border-gray-300 rounded-lg p-3 mt-1"
// //             rows="2"
// //             value={actionPoints}
// //             onChange={(e) => setActionPoints(e.target.value)}
// //           ></textarea>
// //         </div>

// //         <div className="mt-6 flex justify-end">
// //           <button
// //             onClick={handleSave}
// //             className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md"
// //           >
// //             Save Note
// //           </button>
// //         </div>
// //       </div>

// //       {/* Previous Notes */}
// //       <div className="max-w-7xl mx-auto">
// //         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
// //           <MessageCircle className="text-green-600" size={20} />
// //           Previous Notes
// //         </h2>

// //         <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
// //           {notes.map((note) => (
// //             <div
// //               key={note.id}
// //               className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
// //             >
// //               <div className="flex justify-between mb-3">
// //                 <div className="flex items-center gap-2">
// //                   <User size={18} className="text-blue-600" />
// //                   <p className="font-medium text-gray-800">{note.students?.name}</p>
// //                 </div>
// //                 <div className="flex items-center gap-1 text-gray-500 text-sm">
// //                   <Calendar size={16} />
// //                   <span>{new Date(note.note_date).toLocaleDateString()}</span>
// //                 </div>
// //               </div>

// //               <p className="text-gray-700">{note.feedback}</p>

// //               <p className="text-sm text-gray-600 mt-3">
// //                 <strong>Action Points:</strong> {note.action_points}
// //               </p>
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default MentorNotes;
// import React, { useEffect, useState, useRef } from "react";
// import { supabase } from "../../lib/supabaseClient";
// import { User, Calendar, Edit3, MessageCircle } from "lucide-react";
// import {
//   getLoggedInMentor,
//   getStudents,
//   getMentorNotes,
//   saveMentorNote,
// } from "../../services/educator/mentorNotes";

// const MentorNotes = () => {
//   // main data
//   const [students, setStudents] = useState([]);
//   const [notes, setNotes] = useState([]);

//   // form state for adding new note
//   const [selectedStudent, setSelectedStudent] = useState("");
//   const [selectedQuickNotes, setSelectedQuickNotes] = useState([]);
//   const [feedback, setFeedback] = useState("");
//   const [actionPoints, setActionPoints] = useState("");
//   const [otherNote, setOtherNote] = useState("");
//   const [isOtherSelected, setIsOtherSelected] = useState(false);

//   const quickNoteOptions = [
//     "Excellent Progress",
//     "Needs Improvement",
//     "Strong Communication Skills",
//     "Great Technical Knowledge",
//     "Consistent Performance",
//     "Slow but Improving",
//     "Good Leadership Quality",
//     "Teamwork is Improving",
//     "Needs Extra Practice",
//     "Outstanding Creativity",
//     "Others",
//   ];

//   // chip colors
//   const chipColors = [
//     "bg-blue-100 text-blue-700 border-blue-300",
//     "bg-green-100 text-green-700 border-green-300",
//     "bg-purple-100 text-purple-700 border-purple-300",
//     "bg-pink-100 text-pink-700 border-pink-300",
//     "bg-yellow-100 text-yellow-700 border-yellow-300",
//     "bg-indigo-100 text-indigo-700 border-indigo-300",
//   ];

//   const [mentorInfo, setMentorInfo] = useState(null);

//   // Student dropdown search
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const dropdownRef = useRef();

//   // Quick-notes dropdown
//   const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
//   const quickDropdownRef = useRef();

//   // Pagination
//   const [page, setPage] = useState(1);
//   const pageSize = 6; // cards per page

//   // View/Edit modal state
//   const [viewingNote, setViewingNote] = useState(null); // note object or null
//   const [editingNote, setEditingNote] = useState(null); // note object being edited
//   const [editQuickNotes, setEditQuickNotes] = useState([]);
//   const [editFeedback, setEditFeedback] = useState("");
//   const [editActionPoints, setEditActionPoints] = useState("");
//   const [editOther, setEditOther] = useState("");

//   // refs for click outside
//   const quickPanelRef = useRef();
//   const studentPanelRef = useRef();

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setDropdownOpen(false);
//       }
//       if (quickDropdownRef.current && !quickDropdownRef.current.contains(event.target)) {
//         setQuickDropdownOpen(false);
//       }
//       // modals handled by overlay
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // filtered students for dropdown search
//   const filteredStudents = students.filter((s) =>
//     s.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   const displayStudents =
//     searchTerm.trim() === "" ? filteredStudents.slice(0, 8) : filteredStudents;

//   // load mentor + lists
//   useEffect(() => {
//     const load = async () => {
//       try {
//         const {
//           data: { user },
//         } = await supabase.auth.getUser();

//         const info = await getLoggedInMentor(user.id);
//         setMentorInfo(info);

//         const s = await getStudents();
//         setStudents(s || []);

//         const n = await getMentorNotes();
//         setNotes(n || []);
//       } catch (err) {
//         console.error("Failed to load initial data", err);
//       }
//     };
//     load();
//   }, []);

//   // -------------------------
//   // helper: refresh notes
//   // -------------------------
//   const refreshNotes = async () => {
//     const n = await getMentorNotes();
//     setNotes(n || []);
//     // if current page has no items after refresh, go back a page
//     const lastPage = Math.max(1, Math.ceil((n?.length || 0) / pageSize));
//     if (page > lastPage) setPage(lastPage);
//   };

//   // -------------------------
//   // Add new note
//   // -------------------------
//   const handleSave = async () => {
//     if (!selectedStudent) {
//       alert("Please select a student");
//       return;
//     }
//     if (!mentorInfo) {
//       alert("Mentor profile not found!");
//       return;
//     }

//     const payload = {
//       student_id: selectedStudent,
//       mentor_type: mentorInfo.mentor_type,
//       school_educator_id:
//         mentorInfo.mentor_type === "school" ? mentorInfo.mentor_id : null,
//       college_lecturer_id:
//         mentorInfo.mentor_type === "college" ? mentorInfo.mentor_id : null,
//       quick_notes: selectedQuickNotes,
//       feedback,
//       action_points: actionPoints,
//     };

//     try {
//       await saveMentorNote(payload);
//       await refreshNotes();
//       // reset form
//       setSelectedQuickNotes([]);
//       setFeedback("");
//       setActionPoints("");
//       setOtherNote("");
//       setIsOtherSelected(false);
//       alert("Saved successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to save note.");
//     }
//   };

//   // -------------------------
//   // update & delete helpers
//   // -------------------------
//   const updateMentorNote = async (id, updates) => {
//     const { data, error } = await supabase
//       .from("mentor_notes")
//       .update(updates)
//       .eq("id", id)
//       .select();
//     if (error) throw error;
//     return data;
//   };

//   const deleteMentorNote = async (id) => {
//     const { data, error } = await supabase.from("mentor_notes").delete().eq("id", id);
//     if (error) throw error;
//     return data;
//   };

//   // open view modal
//   const handleView = (note) => {
//     setViewingNote(note);
//   };

//   // open edit modal and populate state
//   const handleEditOpen = (note) => {
//     setEditingNote(note);
//     setEditQuickNotes(Array.isArray(note.quick_notes) ? [...note.quick_notes] : []);
//     setEditFeedback(note.feedback || "");
//     setEditActionPoints(note.action_points || "");
//     // if a custom note exists in quick_notes that is not in quickNoteOptions, set editOther
//     const custom = (note.quick_notes || []).find((n) => !quickNoteOptions.includes(n));
//     setEditOther(custom || "");
//   };

//   const handleEditToggle = (opt) => {
//     setEditQuickNotes((prev) => {
//       if (prev.includes(opt)) return prev.filter((p) => p !== opt);
//       return [...prev, opt];
//     });
//   };

//   const handleEditSave = async () => {
//     if (!editingNote) return;
//     const updates = {
//       quick_notes: editQuickNotes,
//       feedback: editFeedback,
//       action_points: editActionPoints,
//     };
//     try {
//       await updateMentorNote(editingNote.id, updates);
//       await refreshNotes();
//       setEditingNote(null);
//       alert("Updated successfully");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update note");
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this note?")) return;
//     try {
//       await deleteMentorNote(id);
//       await refreshNotes();
//       alert("Deleted");
//     } catch (err) {
//       console.error(err);
//       alert("Delete failed");
//     }
//   };

//   // -------------------------
//   // quick notes add/remove for new note form
//   // -------------------------
//   const toggleQuickNote = (note) => {
//     if (note === "Others") {
//       setIsOtherSelected(true);
//       setQuickDropdownOpen(true);
//       return;
//     }
//     setIsOtherSelected(false);
//     setSelectedQuickNotes((prev) => (prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]));
//   };

//   const handleOtherNoteChange = (e) => {
//     const value = e.target.value;
//     setOtherNote(value);

//     if (value.trim() === "") {
//       setSelectedQuickNotes((prev) => prev.filter((n) => quickNoteOptions.includes(n)));
//       return;
//     }

//     setSelectedQuickNotes((prev) => {
//       const filtered = prev.filter((n) => quickNoteOptions.includes(n));
//       if (!filtered.includes(value)) return [...filtered, value];
//       return filtered;
//     });
//   };

//   const removeQuickNote = (note) => {
//     setSelectedQuickNotes((prev) => prev.filter((n) => n !== note));
//     if (note === otherNote) {
//       setOtherNote("");
//       setIsOtherSelected(false);
//     }
//   };

//   // -------------------------
//   // Pagination derived data
//   // -------------------------
//   const totalNotes = notes.length;
//   const totalPages = Math.max(1, Math.ceil(totalNotes / pageSize));
//   const paginatedNotes = notes.slice((page - 1) * pageSize, page * pageSize);

//   // small helper to ensure page in range
//   useEffect(() => {
//     if (page > totalPages) setPage(totalPages);
//   }, [totalPages, page]);

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="max-w-7xl mx-auto mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">📝 Mentor Notes</h1>
//         <p className="text-gray-600 mt-1">Track and record qualitative feedback for your students.</p>
//       </div>

//       {/* Add New Note */}
//       <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-8 mb-8 border border-gray-100">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//           <Edit3 className="text-blue-600" size={20} />
//           Add New Note
//         </h2>

//         {/* Student Dropdown (searchable) */}
//         <div className="relative mb-4" ref={dropdownRef}>
//           <label className="text-sm text-gray-600">Select Student</label>

//           <div
//             onClick={() => setDropdownOpen((v) => !v)}
//             className="w-full border border-gray-300 bg-white rounded-lg p-3 mt-1 cursor-pointer flex justify-between items-center hover:border-gray-400"
//           >
//             <span className="text-gray-700">
//               {selectedStudent ? students.find((s) => s.id === selectedStudent)?.name : "Select Student"}
//             </span>
//             <svg className={`w-5 h-5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//             </svg>
//           </div>

//           {dropdownOpen && (
//             <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
//               <input
//                 type="text"
//                 placeholder="Search student..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3"
//               />
//               <div className="max-h-60 overflow-y-auto">
//                 {displayStudents.length > 0 ? (
//                   displayStudents.map((s) => (
//                     <div
//                       key={s.id}
//                       onClick={() => {
//                         setSelectedStudent(s.id);
//                         setDropdownOpen(false);
//                       }}
//                       className="p-2 rounded-lg cursor-pointer hover:bg-blue-50 text-gray-800 text-sm"
//                     >
//                       {s.name}
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-sm text-gray-500 p-2 text-center">No matching students</p>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* QUICK ADD NOTES */}
//         <div className="relative mb-3" ref={quickDropdownRef}>
//           <label className="text-sm text-gray-600">Quick Add Notes</label>
//           <div
//             onClick={() => setQuickDropdownOpen((v) => !v)}
//             className="w-full border border-gray-300 bg-white rounded-lg p-3 mt-1 cursor-pointer flex justify-between items-center hover:border-gray-400"
//           >
//             <span className="text-gray-700">{selectedQuickNotes.length > 0 ? `Selected (${selectedQuickNotes.length})` : "Select Quick Notes"}</span>
//             <svg className={`w-5 h-5 text-gray-500 transition-transform ${quickDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//             </svg>
//           </div>

//           {quickDropdownOpen && (
//             <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
//               <div className="max-h-60 overflow-y-auto">
//                 {quickNoteOptions.map((note, idx) => {
//                   const checked = selectedQuickNotes.includes(note);
//                   return (
//                     <label
//                       key={idx}
//                       className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-blue-50"
//                       onClick={(e) => {
//                         e.preventDefault();
//                         toggleQuickNote(note);
//                       }}
//                     >
//                       <input type="checkbox" checked={checked} readOnly className="cursor-pointer" />
//                       <span className="text-gray-800 text-sm">{note}</span>
//                     </label>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* selected chips */}
//         {selectedQuickNotes.length > 0 && (
//           <div className="flex flex-wrap gap-2 mb-3">
//             {selectedQuickNotes.map((note, idx) => {
//               const colorClass = chipColors[idx % chipColors.length];
//               return (
//                 <span key={idx} className={`px-3 py-1 rounded-full border text-sm flex items-center gap-2 ${colorClass}`}>
//                   <span className="whitespace-nowrap">{note}</span>
//                   <button onClick={() => removeQuickNote(note)} className="text-gray-700 hover:text-red-600 ml-1" type="button" aria-label={`Remove ${note}`}>
//                     ✕
//                   </button>
//                 </span>
//               );
//             })}
//           </div>
//         )}

//         {/* Others custom */}
//         {isOtherSelected && (
//           <div className="mb-3">
//             <label className="text-sm text-gray-600">Enter Custom Note</label>
//             <input
//               type="text"
//               value={otherNote}
//               onChange={handleOtherNoteChange}
//               placeholder="Type custom note and it will be added as a chip"
//               className="w-full border border-gray-300 rounded-lg p-3 mt-1"
//             />
//           </div>
//         )}

//         {/* Feedback */}
//         <div className="mb-3">
//           <label className="text-sm text-gray-600">Feedback</label>
//           <textarea className="w-full border border-gray-300 rounded-lg p-3 mt-1" rows="3" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
//         </div>

//         {/* Action Points */}
//         <div className="mb-3">
//           <label className="text-sm text-gray-600">Action Points</label>
//           <textarea className="w-full border border-gray-300 rounded-lg p-3 mt-1" rows="2" value={actionPoints} onChange={(e) => setActionPoints(e.target.value)} />
//         </div>

//         <div className="flex justify-end">
//           <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md">Save Note</button>
//         </div>
//       </div>

//       {/* Previous Notes header + pagination controls */}
//       <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between">
//         <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
//           <MessageCircle className="text-green-600" size={20} />
//           Previous Notes
//         </h2>

//         {/* Pagination controls */}
//         <div className="flex items-center gap-3">
//           <div className="text-sm text-gray-600">
//             Showing <strong>{Math.min((page - 1) * pageSize + 1, totalNotes || 0)}</strong> - <strong>{Math.min(page * pageSize, totalNotes || 0)}</strong> of <strong>{totalNotes}</strong>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className={`px-3 py-1 rounded-md border ${page === 1 ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`}
//             >
//               Prev
//             </button>

//             {/* page numbers */}
//             <div className="flex items-center gap-1">
//               {Array.from({ length: totalPages }).map((_, i) => {
//                 const p = i + 1;
//                 return (
//                   <button
//                     key={p}
//                     onClick={() => setPage(p)}
//                     className={`px-3 py-1 rounded-md border ${p === page ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`}
//                   >
//                     {p}
//                   </button>
//                 );
//               })}
//             </div>

//             <button
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               disabled={page === totalPages}
//               className={`px-3 py-1 rounded-md border ${page === totalPages ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Notes grid */}
//       <div className="max-w-7xl mx-auto">
//         <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
//           {paginatedNotes.map((note) => (
//             <div key={note.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
//               <div className="flex justify-between mb-3">
//                 <div className="flex items-center gap-2">
//                   <User size={18} className="text-blue-600" />
//                   <p className="font-medium text-gray-800">{note.students?.name}</p>
//                 </div>

//                 <div className="flex items-center gap-1 text-gray-500 text-sm">
//                   <Calendar size={16} />
//                   <span>{new Date(note.note_date).toLocaleDateString()}</span>
//                 </div>
//               </div>

//               <p className="text-gray-700 min-h-[48px]">{note.feedback || <span className="text-gray-400">No feedback</span>}</p>

//               <p className="text-sm text-gray-600 mt-3">
//                 <strong>Action Points:</strong> {note.action_points || <span className="text-gray-400">—</span>}
//               </p>

//               {/* quick notes chips preview */}
//               {Array.isArray(note.quick_notes) && note.quick_notes.length > 0 && (
//                 <div className="flex flex-wrap gap-2 mt-3">
//                   {note.quick_notes.map((qn, i) => (
//                     <span key={i} className={`px-2 py-0.5 rounded-full text-xs border ${chipColors[i % chipColors.length]}`}>
//                       {qn}
//                     </span>
//                   ))}
//                 </div>
//               )}

//               {/* action buttons */}
//               <div className="flex gap-2 mt-4">
//                 <button
//                   onClick={() => handleView(note)}
//                   className="px-3 py-1 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
//                 >
//                   View
//                 </button>

//                 <button
//                   onClick={() => handleEditOpen(note)}
//                   className="px-3 py-1 rounded-md border text-sm text-blue-700 hover:bg-blue-50"
//                 >
//                   Edit
//                 </button>

//                 <button
//                   onClick={() => handleDelete(note.id)}
//                   className="px-3 py-1 rounded-md border text-sm text-red-600 hover:bg-red-50"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}

//           {paginatedNotes.length === 0 && (
//             <div className="col-span-full bg-white p-6 rounded-2xl border border-gray-100 text-center text-gray-500">
//               No notes found.
//             </div>
//           )}
//         </div>
//       </div>

//       {/* View modal */}
//       {viewingNote && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-lg">
//             <div className="flex justify-between items-start">
//               <h3 className="text-lg font-semibold">View Note</h3>
//               <button onClick={() => setViewingNote(null)} className="text-gray-500">✕</button>
//             </div>

//             <div className="mt-4">
//               <div className="flex items-center gap-3">
//                 <User size={18} className="text-blue-600" />
//                 <div>
//                   <div className="font-medium text-gray-800">{viewingNote.students?.name}</div>
//                   <div className="text-sm text-gray-500">{new Date(viewingNote.note_date).toLocaleString()}</div>
//                 </div>
//               </div>

//               {Array.isArray(viewingNote.quick_notes) && viewingNote.quick_notes.length > 0 && (
//                 <div className="flex gap-2 flex-wrap mt-3">
//                   {viewingNote.quick_notes.map((qn, i) => (
//                     <span key={i} className={`px-2 py-0.5 rounded-full text-xs border ${chipColors[i % chipColors.length]}`}>
//                       {qn}
//                     </span>
//                   ))}
//                 </div>
//               )}

//               <div className="mt-4">
//                 <h4 className="text-sm font-semibold text-gray-700">Feedback</h4>
//                 <p className="mt-1 text-gray-700">{viewingNote.feedback || "—"}</p>
//               </div>

//               <div className="mt-3">
//                 <h4 className="text-sm font-semibold text-gray-700">Action Points</h4>
//                 <p className="mt-1 text-gray-700">{viewingNote.action_points || "—"}</p>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end gap-2">
//               <button onClick={() => setViewingNote(null)} className="px-4 py-2 rounded-md border text-sm">Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit modal */}
//       {editingNote && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-lg">
//             <div className="flex justify-between items-start">
//               <h3 className="text-lg font-semibold">Edit Note</h3>
//               <button onClick={() => setEditingNote(null)} className="text-gray-500">✕</button>
//             </div>

//             <div className="mt-4 grid grid-cols-1 gap-4">
//               <div>
//                 <div className="text-sm text-gray-600">Student</div>
//                 <div className="font-medium">{editingNote.students?.name}</div>
//               </div>

//               <div>
//                 <div className="text-sm text-gray-600 mb-2">Quick Notes</div>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
//                   {quickNoteOptions.map((opt, i) => {
//                     const checked = editQuickNotes.includes(opt);
//                     return (
//                       <label key={i} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
//                         <input type="checkbox" checked={checked} onChange={() => handleEditToggle(opt)} readOnly />
//                         <span className="text-sm">{opt}</span>
//                       </label>
//                     );
//                   })}
//                 </div>

//                 {/* custom edit other */}
//                 <div className="mt-2">
//                   <input
//                     type="text"
//                     placeholder="Custom quick note (optional)"
//                     value={editOther}
//                     onChange={(e) => {
//                       setEditOther(e.target.value);
//                       // ensure editQuickNotes contains the custom text
//                       const v = e.target.value;
//                       setEditQuickNotes((prev) => {
//                         const predefined = prev.filter((p) => quickNoteOptions.includes(p));
//                         if (!v.trim()) return predefined;
//                         if (!predefined.includes(v)) return [...predefined, v];
//                         return predefined;
//                       });
//                     }}
//                     className="w-full border border-gray-300 rounded-lg p-2 mt-2"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm text-gray-600">Feedback</label>
//                 <textarea value={editFeedback} onChange={(e) => setEditFeedback(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 mt-1" rows={3} />
//               </div>

//               <div>
//                 <label className="text-sm text-gray-600">Action Points</label>
//                 <textarea value={editActionPoints} onChange={(e) => setEditActionPoints(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 mt-1" rows={2} />
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end gap-2">
//               <button onClick={() => setEditingNote(null)} className="px-4 py-2 rounded-md border text-sm">Cancel</button>
//               <button onClick={handleEditSave} className="px-4 py-2 rounded-md bg-blue-600 text-white">Save</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MentorNotes;
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MessageCircle,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FeatureGate } from '../../components/Subscription/FeatureGate';
import { useEducatorSchool } from '../../hooks/useEducatorSchool';
import { supabase } from '../../lib/supabaseClient';
import { saveMentorNote } from '../../services/educator/mentorNotes';

interface Student {
  id: string;
  name: string;
  user_id: string;
  grade?: string;
  section?: string;
  school_class_id?: string;
}

interface MentorNote {
  id: string;
  student_id: string;
  feedback: string;
  action_points: string;
  quick_notes: string[];
  note_date: string;
  students: { name: string } | { name: string }[];
}

const MentorNotesContent = () => {
  // Get educator's school information with class assignments
  const {
    school: educatorSchool,
    college: educatorCollege,
    educatorType,
    educatorRole,
    assignedClassIds,
    loading: schoolLoading,
  } = useEducatorSchool();

  // main data
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);

  // form state for adding new note
  const [loading, setLoading] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedQuickNotes, setSelectedQuickNotes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [actionPoints, setActionPoints] = useState('');
  const [otherNote, setOtherNote] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const quickNoteOptions = [
    'Excellent Progress',
    'Needs Improvement',
    'Strong Communication Skills',
    'Great Technical Knowledge',
    'Consistent Performance',
    'Slow but Improving',
    'Good Leadership Quality',
    'Teamwork is Improving',
    'Needs Extra Practice',
    'Outstanding Creativity',
    'Others',
  ];

  // chip colors
  const chipColors = [
    'bg-blue-100 text-blue-700 border-blue-300',
    'bg-green-100 text-green-700 border-green-300',
    'bg-purple-100 text-purple-700 border-purple-300',
    'bg-pink-100 text-pink-700 border-pink-300',
    'bg-yellow-100 text-yellow-700 border-yellow-300',
    'bg-indigo-100 text-indigo-700 border-indigo-300',
  ];

  // Student dropdown search
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick-notes dropdown
  const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
  const quickDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6; // cards per page

  // View/Edit modal state
  const [viewingNote, setViewingNote] = useState<MentorNote | null>(null);
  const [editingNote, setEditingNote] = useState<MentorNote | null>(null);
  const [editQuickNotes, setEditQuickNotes] = useState<string[]>([]);
  const [editFeedback, setEditFeedback] = useState('');
  const [editActionPoints, setEditActionPoints] = useState('');
  const [editOther, setEditOther] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (quickDropdownRef.current && !quickDropdownRef.current.contains(event.target as Node)) {
        setQuickDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // filtered students for dropdown search
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayStudents =
    searchTerm.trim() === '' ? filteredStudents.slice(0, 8) : filteredStudents;

  // Load students and notes filtered by educator's assigned classes
  useEffect(() => {
    const loadData = async () => {
      // Wait for educator school data to be loaded
      if (schoolLoading || (!educatorSchool && !educatorCollege)) {
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [MentorNotes] Loading students for educator type:', educatorType);

        let students: Student[] = [];

        if (educatorType === 'school' && educatorSchool) {
          // For school educators, check role and class assignments
          if (educatorRole === 'admin' || educatorRole === 'school_admin') {
            // School admins can see all students in their school
            console.log('👨‍💼 [MentorNotes] Fetching all school students (admin)');
            const { data: schoolStudents, error: studentsError } = await supabase
              .from('students')
              .select('id, name, user_id, grade, section, school_class_id')
              .eq('school_id', educatorSchool.id)
              .eq('is_deleted', false)
              .order('name', { ascending: true });

            if (studentsError) throw studentsError;
            students = schoolStudents || [];
          } else if (assignedClassIds && assignedClassIds.length > 0) {
            // Regular educators can only see students in their assigned classes
            console.log(
              '📚 [MentorNotes] Fetching students for assigned classes:',
              assignedClassIds
            );
            const { data: schoolStudents, error: studentsError } = await supabase
              .from('students')
              .select('id, name, user_id, grade, section, school_class_id')
              .eq('school_id', educatorSchool.id)
              .in('school_class_id', assignedClassIds)
              .eq('is_deleted', false)
              .order('name', { ascending: true });

            if (studentsError) throw studentsError;
            students = schoolStudents || [];
          } else {
            // Educators with no class assignments should see no students
            console.log('❌ [MentorNotes] Educator has no class assignments');
            students = [];
          }
        } else if (educatorType === 'college' && educatorCollege) {
          // For college educators, filter by college
          console.log(
            '🎓 [MentorNotes] Fetching college students for college:',
            educatorCollege.id
          );
          const { data: collegeStudents, error: studentsError } = await supabase
            .from('students')
            .select('id, name, user_id, grade, section')
            .eq('college_id', educatorCollege.id)
            .eq('is_deleted', false)
            .order('name', { ascending: true });

          if (studentsError) throw studentsError;
          students = collegeStudents || [];
        }

        console.log(
          `✅ [MentorNotes] Loaded ${students.length} students for ${educatorType} educator`
        );
        setStudents(students);

        // Get student user_ids for filtering notes
        const studentUserIds = students.map((s) => s.user_id).filter(Boolean);

        if (studentUserIds.length === 0) {
          console.log('⚠️ [MentorNotes] No students found, clearing notes');
          setNotes([]);
          return;
        }

        // Fetch notes only for students in educator's assigned classes/college
        console.log('📝 [MentorNotes] Fetching notes for', studentUserIds.length, 'students');
        const { data: filteredNotes, error: notesError } = await supabase
          .from('mentor_notes')
          .select(
            `
            id,
            student_id,
            feedback,
            action_points,
            quick_notes,
            note_date,
            students(name)
          `
          )
          .in('student_id', studentUserIds)
          .order('note_date', { ascending: false });

        if (notesError) throw notesError;
        console.log(`✅ [MentorNotes] Loaded ${filteredNotes?.length || 0} notes`);
        setNotes(filteredNotes || []);
      } catch (err) {
        console.error('❌ [MentorNotes] Error loading mentor data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [educatorSchool?.id, educatorCollege?.id, educatorType, assignedClassIds, schoolLoading]);

  // -------------------------
  // helper: refresh notes (filtered by educator's assigned classes/college)
  // -------------------------
  const refreshNotes = async () => {
    if ((!educatorSchool && !educatorCollege) || students.length === 0) {
      setNotes([]);
      return;
    }

    try {
      // Get student user_ids from current filtered students
      const studentUserIds = students.map((s) => s.user_id).filter(Boolean);

      if (studentUserIds.length === 0) {
        setNotes([]);
        return;
      }

      // Fetch notes only for students in educator's assigned classes/college
      const { data: filteredNotes, error } = await supabase
        .from('mentor_notes')
        .select(
          `
          id,
          student_id,
          feedback,
          action_points,
          quick_notes,
          note_date,
          students(name)
        `
        )
        .in('student_id', studentUserIds)
        .order('note_date', { ascending: false });

      if (error) throw error;
      setNotes(filteredNotes || []);

      // if current page has no items after refresh, go back a page
      const lastPage = Math.max(1, Math.ceil((filteredNotes?.length || 0) / pageSize));
      if (page > lastPage) setPage(lastPage);
    } catch (err) {
      console.error('Error refreshing notes:', err);
    }
  };

  // -------------------------
  // Add new note
  // -------------------------
  // const handleSave = async () => {
  //   if (!selectedStudent) {
  //     alert("Please select a student");
  //     return;
  //   }
  //   if (!mentorInfo) {
  //     alert("Mentor profile not found!");
  //     return;
  //   }

  //   const payload = {
  //     student_id: selectedStudent,
  //     mentor_type: mentorInfo.mentor_type,
  //     school_educator_id:
  //       mentorInfo.mentor_type === "school" ? mentorInfo.mentor_id : null,
  //     college_lecturer_id:
  //       mentorInfo.mentor_type === "college" ? mentorInfo.mentor_id : null,
  //     quick_notes: selectedQuickNotes,
  //     feedback,
  //     action_points: actionPoints,
  //   };

  //   try {
  //     await saveMentorNote(payload);
  //     await refreshNotes();
  //     // reset form
  //     setSelectedQuickNotes([]);
  //     setFeedback("");
  //     setActionPoints("");
  //     setOtherNote("");
  //     setIsOtherSelected(false);
  //     alert("Saved successfully!");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to save note.");
  //   }
  // };
  const handleSaveNote = async () => {
    try {
      if (!educatorSchool?.id && !educatorCollege?.id) {
        alert('School/College information not found!');
        return;
      }

      if (!selectedStudent) {
        alert('Please select a student!');
        return;
      }

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('User not authenticated!');
        return;
      }

      let payload;

      if (educatorType === 'school') {
        // Get the educator ID from school_educators table
        const { data: educator, error: educatorError } = await supabase
          .from('school_educators')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (educatorError || !educator) {
          alert('School educator profile not found!');
          return;
        }

        payload = {
          student_id: selectedStudent,
          mentor_type: 'school',
          school_educator_id: educator.id,
          college_lecturer_id: null,
          quick_notes: selectedQuickNotes || [],
          feedback: feedback || '',
          action_points: actionPoints || '',
        };
      } else if (educatorType === 'college') {
        // Get the lecturer ID from college_lecturers table
        const { data: lecturer, error: lecturerError } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (lecturerError || !lecturer) {
          alert('College lecturer profile not found!');
          return;
        }

        payload = {
          student_id: selectedStudent,
          mentor_type: 'college',
          school_educator_id: null,
          college_lecturer_id: lecturer.id,
          quick_notes: selectedQuickNotes || [],
          feedback: feedback || '',
          action_points: actionPoints || '',
        };
      } else {
        alert('Educator type not recognized!');
        return;
      }

      await saveMentorNote(payload);

      alert('Note saved successfully!');
      await refreshNotes();

      // Reset form
      setSelectedStudent('');
      setSelectedQuickNotes([]);
      setFeedback('');
      setActionPoints('');
      setOtherNote('');
      setIsOtherSelected(false);
    } catch (err) {
      console.error('Save note failed:', err);
      alert('Failed to save note.');
    }
  };

  // -------------------------
  // update & delete helpers
  // -------------------------
  const updateMentorNote = async (id: string, updates: Partial<MentorNote>) => {
    const { data, error } = await supabase
      .from('mentor_notes')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  };

  const deleteMentorNote = async (id: string) => {
    const { data, error } = await supabase.from('mentor_notes').delete().eq('id', id);
    if (error) throw error;
    return data;
  };

  // open view modal
  const handleView = (note: MentorNote) => {
    setViewingNote(note);
  };

  // open edit modal and populate state
  const handleEditOpen = (note: MentorNote) => {
    setEditingNote(note);
    setEditQuickNotes(Array.isArray(note.quick_notes) ? [...note.quick_notes] : []);
    setEditFeedback(note.feedback || '');
    setEditActionPoints(note.action_points || '');
    // if a custom note exists in quick_notes that is not in quickNoteOptions, set editOther
    const custom = (note.quick_notes || []).find((n) => !quickNoteOptions.includes(n));
    setEditOther(custom || '');
    // scroll modal into view on small screens
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditToggle = (opt: string) => {
    setEditQuickNotes((prev) => {
      if (prev.includes(opt)) return prev.filter((p) => p !== opt);
      return [...prev, opt];
    });
  };

  const handleEditSave = async () => {
    if (!editingNote) return;
    const updates = {
      quick_notes: editQuickNotes,
      feedback: editFeedback,
      action_points: editActionPoints,
    };
    try {
      await updateMentorNote(editingNote.id, updates);
      await refreshNotes();
      setEditingNote(null);
      alert('Updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update note');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteMentorNote(id);
      await refreshNotes();
      alert('Deleted');
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  // -------------------------
  // quick notes add/remove for new note form
  // -------------------------
  const toggleQuickNote = (note: string) => {
    if (note === 'Others') {
      setIsOtherSelected(true);
      setQuickDropdownOpen(true);
      return;
    }
    setIsOtherSelected(false);
    setSelectedQuickNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleOtherNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherNote(value);

    if (value.trim() === '') {
      setSelectedQuickNotes((prev) => prev.filter((n) => quickNoteOptions.includes(n)));
      return;
    }

    setSelectedQuickNotes((prev) => {
      const filtered = prev.filter((n) => quickNoteOptions.includes(n));
      if (!filtered.includes(value)) return [...filtered, value];
      return filtered;
    });
  };

  const removeQuickNote = (note: string) => {
    setSelectedQuickNotes((prev) => prev.filter((n) => n !== note));
    if (note === otherNote) {
      setOtherNote('');
      setIsOtherSelected(false);
    }
  };

  // -------------------------
  // Pagination derived data
  // -------------------------
  const totalNotes = notes.length;
  const totalPages = Math.max(1, Math.ceil(totalNotes / pageSize));
  const paginatedNotes = notes.slice((page - 1) * pageSize, page * pageSize);

  // small helper to ensure page in range
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // small util to get chip color by text (so same text maps same color in component lifetime)
  const colorForText = (text: string) => {
    if (!text) return chipColors[0];
    const idx = [...text].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % chipColors.length;
    return chipColors[idx];
  };

  // Show loading state
  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading mentor notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <MessageCircle className="text-green-600" size={22} />
            Mentor Notes
          </h1>
          <p className="text-gray-600 mt-1">
            Track and record qualitative feedback for your students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 hidden sm:block">
            Showing <strong>{Math.min((page - 1) * pageSize + 1, totalNotes || 0)}</strong> -{' '}
            <strong>{Math.min(page * pageSize, totalNotes || 0)}</strong> of{' '}
            <strong>{totalNotes}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md border ${page === 1 ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    aria-label={`Go to page ${p}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md border ${page === totalPages ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add New Note */}
      <div className="max-w-7xl mx-auto bg-white shadow-sm rounded-2xl p-8 mb-8 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-1">
            <Edit3 className="text-blue-600" size={20} />
            Add New Note
          </h2>
          <div className="text-sm text-gray-500 hidden sm:block">
            Quickly add feedback for a student
          </div>
        </div>

        <div className="space-y-5">
          {/* Student Dropdown (searchable) */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>

            <div
              onClick={() => students.length > 0 && setDropdownOpen((v) => !v)}
              className={`w-full border border-gray-300 bg-white rounded-lg px-4 py-3 flex justify-between items-center transition-colors ${
                students.length > 0
                  ? 'cursor-pointer hover:border-gray-400'
                  : 'cursor-not-allowed bg-gray-50 text-gray-400'
              }`}
              role="button"
              tabIndex={students.length > 0 ? 0 : -1}
              onKeyDown={(e) =>
                students.length > 0 && e.key === 'Enter' && setDropdownOpen((v) => !v)
              }
            >
              <span className={students.length > 0 ? 'text-gray-700' : 'text-gray-400'}>
                {selectedStudent
                  ? students.find((s) => s.id === selectedStudent)?.name
                  : students.length === 0
                    ? 'No students available'
                    : 'Select Student'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {dropdownOpen && students.length > 0 && (
              <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="max-h-56 overflow-y-auto p-2">
                  {displayStudents.length > 0 ? (
                    displayStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s.id);
                          setDropdownOpen(false);
                        }}
                        className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50 text-gray-800 text-sm"
                      >
                        {s.name}
                      </div>
                    ))
                  ) : students.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm text-gray-500 mb-1">No students available</p>
                      <p className="text-xs text-gray-400">
                        {educatorType === 'school' &&
                        educatorRole !== 'admin' &&
                        assignedClassIds.length === 0
                          ? 'You have not been assigned to any classes yet'
                          : 'No students found in your assigned classes'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 px-3 py-2 text-center">
                      No matching students
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Notes */}
          <div className="relative" ref={quickDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add Notes</label>
            <div
              onClick={() => setQuickDropdownOpen((v) => !v)}
              className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 cursor-pointer flex justify-between items-center hover:border-gray-400 transition-colors"
            >
              <span className="text-gray-700">
                {selectedQuickNotes.length > 0
                  ? `${selectedQuickNotes.length} selected`
                  : 'Select Quick Notes'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${quickDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {quickDropdownOpen && (
              <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                <div className="max-h-56 overflow-y-auto">
                  {quickNoteOptions.map((note, idx) => {
                    const checked = selectedQuickNotes.includes(note);
                    return (
                      <label
                        key={idx}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleQuickNote(note);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="cursor-pointer w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-800 text-sm">{note}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* selected chips */}
          {selectedQuickNotes.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedQuickNotes.map((note, idx) => {
                const colorClass = chipColors[idx % chipColors.length];
                return (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full border text-sm flex items-center gap-2 ${colorClass}`}
                  >
                    <span className="whitespace-nowrap">{note}</span>
                    <button
                      onClick={() => removeQuickNote(note)}
                      className="text-gray-700 hover:text-red-600 ml-1"
                      type="button"
                      aria-label={`Remove ${note}`}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {isOtherSelected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Custom Note
              </label>
              <input
                type="text"
                value={otherNote}
                onChange={handleOtherNoteChange}
                placeholder="Type custom note and it will be added as a chip"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {/* Save button area */}
          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback..."
            />
          </div>

          {/* Action Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Points</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              value={actionPoints}
              onChange={(e) => setActionPoints(e.target.value)}
              placeholder="Enter action points..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handleSaveNote}
              disabled={students.length === 0 || !selectedStudent}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save Note
            </button>
            <button
              onClick={() => {
                setSelectedQuickNotes([]);
                setFeedback('');
                setActionPoints('');
                setOtherNote('');
                setIsOtherSelected(false);
              }}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Notes grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedNotes.map((note) => (
            <article
              key={note.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative hover:shadow-md transition"
            >
              <header className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {Array.isArray(note.students) ? note.students[0]?.name : note.students?.name}
                    </h3>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                      <Calendar size={14} />
                      <span>{new Date(note.note_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* compact icon buttons */}
                  <button
                    onClick={() => handleView(note)}
                    title="View"
                    className="p-2 rounded-md hover:bg-gray-50"
                  >
                    <Eye size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleEditOpen(note)}
                    title="Edit"
                    className="p-2 rounded-md hover:bg-gray-50"
                  >
                    <Edit3 size={16} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    title="Delete"
                    className="p-2 rounded-md hover:bg-red-50"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </header>

              <div>
                <p className="text-gray-700 min-h-[48px]">
                  {note.feedback || <span className="text-gray-400">No feedback</span>}
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  <strong>Action Points:</strong>{' '}
                  {note.action_points || <span className="text-gray-400">—</span>}
                </p>

                {/* quick notes chips preview */}
                {Array.isArray(note.quick_notes) && note.quick_notes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {note.quick_notes.map((qn, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-full text-xs border ${colorForText(qn)}`}
                      >
                        {qn}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* action buttons (labelled) */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleView(note)}
                  className="px-3 py-1 rounded-md border text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye size={14} /> View
                </button>

                <button
                  onClick={() => handleEditOpen(note)}
                  className="px-3 py-1 rounded-md border text-sm bg-blue-50 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  <Edit3 size={14} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(note.id)}
                  className="px-3 py-1 rounded-md border text-sm bg-red-50 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </article>
          ))}

          {paginatedNotes.length === 0 && (
            <div className="col-span-full bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <div className="text-gray-500 mb-2">No notes found.</div>
              {students.length === 0 && (
                <div className="text-sm text-gray-400">
                  {educatorType === 'school' &&
                  educatorRole !== 'admin' &&
                  assignedClassIds.length === 0
                    ? 'You need to be assigned to classes before you can add mentor notes.'
                    : 'Start by adding a note for one of your students above.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom pagination for mobile (visible) */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <strong>{Math.min((page - 1) * pageSize + 1, totalNotes || 0)}</strong> -{' '}
            <strong>{Math.min(page * pageSize, totalNotes || 0)}</strong> of{' '}
            <strong>{totalNotes}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md border ${page === 1 ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              aria-label="Previous"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md border ${page === totalPages ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              aria-label="Next"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 sm:pt-24 bg-black/40">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-lg overflow-auto max-h-[80vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-green-50 p-2">
                  <Eye size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">View Note</h3>
                  <div className="text-sm text-gray-500">
                    {Array.isArray(viewingNote.students)
                      ? viewingNote.students[0]?.name
                      : viewingNote.students?.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400" />
                <div className="text-sm text-gray-500">
                  {new Date(viewingNote.note_date).toLocaleString()}
                </div>
              </div>

              {Array.isArray(viewingNote.quick_notes) && viewingNote.quick_notes.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {viewingNote.quick_notes.map((qn, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-full text-xs border ${colorForText(qn)}`}
                    >
                      {qn}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700">Feedback</h4>
                <p className="mt-1 text-gray-700">{viewingNote.feedback || '—'}</p>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-700">Action Points</h4>
                <p className="mt-1 text-gray-700">{viewingNote.action_points || '—'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewingNote(null)}
                className="px-4 py-2 rounded-md border text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 sm:pt-20 bg-black/40">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-lg overflow-auto max-h-[85vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-50 p-2">
                  <Edit3 size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Edit Note</h3>
                  <div className="text-sm text-gray-500">
                    {Array.isArray(editingNote.students)
                      ? editingNote.students[0]?.name
                      : editingNote.students?.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingNote(null)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Quick Notes</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickNoteOptions.map((opt, i) => {
                    const checked = editQuickNotes.includes(opt);
                    return (
                      <label
                        key={i}
                        className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleEditToggle(opt)}
                          readOnly
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {/* custom edit other */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Custom quick note (optional)"
                    value={editOther}
                    onChange={(e) => {
                      setEditOther(e.target.value);
                      // ensure editQuickNotes contains the custom text
                      const v = e.target.value;
                      setEditQuickNotes((prev) => {
                        const predefined = prev.filter((p) => quickNoteOptions.includes(p));
                        if (!v.trim()) return predefined;
                        if (!predefined.includes(v)) return [...predefined, v];
                        return predefined;
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Feedback</label>
                <textarea
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Action Points</label>
                <textarea
                  value={editActionPoints}
                  onChange={(e) => setEditActionPoints(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  rows={2}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 rounded-md border text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 rounded-md bg-blue-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Wrapped MentorNotes with FeatureGate for mentor_notes add-on
 */
const MentorNotes = () => (
  // @ts-expect-error - Auto-suppressed for migration
  <FeatureGate featureKey="mentor_notes" showUpgradePrompt={true}>
    <MentorNotesContent />
  </FeatureGate>
);

export default MentorNotes;
// load mentor + lists
//   useEffect(() => {
//     const load = async () => {
//   try {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       console.error("No logged-in user found!");
//       return; // ⛔ stop execution
//     }

//     const info = await getLoggedInMentor(user.id);

//     if (!info) {
//       console.error("Mentor profile not found for this user!");
//       setMentorInfo(null);
//     } else {
//       setMentorInfo(info);
//     }

//     const s = await getStudents();
//     setStudents(s || []);

//     const n = await getMentorNotes();
//     setNotes(n || []);
//   } catch (err) {
//     console.error("Failed to load initial data", err);
//   }
// };
// load();
//   }, []);
