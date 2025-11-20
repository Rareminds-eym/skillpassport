

// import React, { useState } from "react";
// import { User, Calendar, Edit3, MessageCircle } from "lucide-react";

// const MentorNotes = () => {
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
//     "Others", // ➜ Added Others
//   ];

//   const handleQuickNoteSelect = (e) => {
//     const value = e.target.value;

//     if (value === "Others") {
//       setIsOtherSelected(true);
//       return;
//     }

//     setIsOtherSelected(false);

//     if (value && !selectedQuickNotes.includes(value)) {
//       setSelectedQuickNotes([...selectedQuickNotes, value]);
//     }
//   };

//   const handleOtherNoteChange = (e) => {
//     const value = e.target.value;
//     setOtherNote(value);

//     if (value.trim() !== "") {
//       // Update selected notes live
//       const newNotes = selectedQuickNotes.filter((n) => n !== otherNote);
//       setSelectedQuickNotes([...newNotes, value]);
//     }
//   };

//   // static sample notes
//   const notes = [
//     {
//       id: 1,
//       studentName: "Aarav Sharma",
//       date: "12 Nov 2025",
//       feedback:
//         "Aarav showed excellent confidence during the class presentation. He is improving his clarity and engagement while speaking.",
//       actionPoints: "Encourage him to take part in the upcoming debate competition.",
//     },
//     {
//       id: 2,
//       studentName: "Diya Patel",
//       date: "08 Nov 2025",
//       feedback:
//         "Diya demonstrated strong creative thinking in her science project. Her unique idea on sustainable energy stood out.",
//       actionPoints: "Motivate her to document her idea in the school innovation fair.",
//     },
//     {
//       id: 3,
//       studentName: "Rahul Verma",
//       date: "05 Nov 2025",
//       feedback:
//         "Rahul coordinated the group activity effectively and ensured every member contributed. Shows developing leadership skills.",
//       actionPoints: "Assign him a class project leader role next month.",
//     },
//   ];

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">

//       {/* Header */}
//       <div className="max-w-5xl mx-auto mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">📝 Mentor Notes</h1>
//         <p className="text-gray-600 mt-1">
//           Track and record qualitative feedback for your students.
//         </p>
//       </div>

//       {/* Add New Note Form */}
//       <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6 mb-10">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//           <Edit3 className="text-blue-600" size={20} />
//           Add New Note
//         </h2>

//         {/* Student */}
//         <div className="grid md:grid-cols-1 gap-4">
//           <div>
//             <label className="text-sm text-gray-600">Select Student</label>
//             <select className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500">
//               <option>Select Student</option>
//               <option>Aarav Sharma</option>
//               <option>Diya Patel</option>
//               <option>Rahul Verma</option>
//             </select>
//           </div>
//         </div>

//         {/* Quick Notes Dropdown */}
//         <div className="mt-4">
//           <label className="text-sm text-gray-600">Quick Add Notes</label>
//           <select
//             onChange={handleQuickNoteSelect}
//             defaultValue=""
//             className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="" disabled>
//               Select a note to add
//             </option>

//             {quickNoteOptions.map((note, index) => (
//               <option key={index} value={note}>
//                 {note}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Others Input */}
//         {isOtherSelected && (
//           <div className="mt-3">
//             <label className="text-sm text-gray-600">Enter Custom Note</label>
//             <input
//               type="text"
//               value={otherNote}
//               onChange={handleOtherNoteChange}
//               placeholder="Type your custom note..."
//               className="w-full border border-gray-300 rounded-lg p-2 mt-1"
//             />
//           </div>
//         )}

        

//         {/* Feedback */}
//         <div className="mt-4">
//           <label className="text-sm text-gray-600">Feedback</label>
//           <textarea
//             className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500"
//             rows="3"
//             placeholder="Write feedback..."
//             value={feedback}
//             onChange={(e) => setFeedback(e.target.value)}
//           ></textarea>
//         </div>

//         {/* Action Points */}
//         <div className="mt-4">
//           <label className="text-sm text-gray-600">Action Points</label>
//           <textarea
//             className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500"
//             rows="2"
//             placeholder="Suggested next steps..."
//             value={actionPoints}
//             onChange={(e) => setActionPoints(e.target.value)}
//           ></textarea>
//         </div>

//         <div className="mt-6 flex justify-end">
//           <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
//             Save Note
//           </button>
//         </div>
//       </div>

//       {/* Previous Notes */}
//       <div className="max-w-5xl mx-auto">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//           <MessageCircle className="text-green-600" size={20} />
//           Previous Notes
//         </h2>

//         <div className="grid gap-4">
//           {notes.map((note) => (
//             <div
//               key={note.id}
//               className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <div className="flex items-center gap-2">
//                   <User size={18} className="text-blue-600" />
//                   <p className="font-medium text-gray-800">{note.studentName}</p>
//                 </div>
//                 <div className="flex items-center gap-1 text-gray-500 text-sm">
//                   <Calendar size={16} />
//                   <span>{note.date}</span>
//                 </div>
//               </div>

//               <p className="text-gray-700 mt-2">{note.feedback}</p>
//               <p className="text-sm text-gray-600 mt-2">
//                 <strong>Action Points:</strong> {note.actionPoints}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MentorNotes;
// import React, { useState } from "react";
// import { User, Calendar, Edit3, MessageCircle } from "lucide-react";

// const MentorNotes = () => {
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

//   const handleQuickNoteSelect = (e) => {
//     const value = e.target.value;

//     if (value === "Others") {
//       setIsOtherSelected(true);
//       return;
//     }

//     setIsOtherSelected(false);

//     if (value && !selectedQuickNotes.includes(value)) {
//       setSelectedQuickNotes([...selectedQuickNotes, value]);
//     }
//   };

//   const handleOtherNoteChange = (e) => {
//     const value = e.target.value;
//     setOtherNote(value);

//     if (value.trim() !== "") {
//       const updated = selectedQuickNotes.filter((n) => n !== otherNote);
//       setSelectedQuickNotes([...updated, value]);
//     }
//   };

//   // sample previous notes
//   const notes = [
//     {
//       id: 1,
//       studentName: "Aarav Sharma",
//       date: "12 Nov 2025",
//       feedback:
//         "Aarav showed excellent confidence during the class presentation. He is improving his clarity and engagement while speaking.",
//       actionPoints: "Encourage him to take part in the upcoming debate competition.",
//     },
//     {
//       id: 2,
//       studentName: "Diya Patel",
//       date: "08 Nov 2025",
//       feedback:
//         "Diya demonstrated strong creative thinking in her science project. Her unique idea on sustainable energy stood out.",
//       actionPoints: "Motivate her to document her idea in the school innovation fair.",
//     },
//     {
//       id: 3,
//       studentName: "Rahul Verma",
//       date: "05 Nov 2025",
//       feedback:
//         "Rahul coordinated the group activity effectively and ensured every member contributed. Shows developing leadership skills.",
//       actionPoints: "Assign him a class project leader role next month.",
//     },
//   ];

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
      
//       {/* Header */}
//       <div className="max-w-5xl mx-auto mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">📝 Mentor Notes</h1>
//         <p className="text-gray-600 mt-1">
//           Track and record qualitative feedback for your students.
//         </p>
//       </div>

//       {/* Add New Note Form */}
//       <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6 mb-10">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//           <Edit3 className="text-blue-600" size={20} />
//           Add New Note
//         </h2>

//         {/* Student */}
//         <div className="grid md:grid-cols-1 gap-4">
//           <div>
//             <label className="text-sm text-gray-600">Select Student</label>
//             <select className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500">
//               <option>Select Student</option>
//               <option>Aarav Sharma</option>
//               <option>Diya Patel</option>
//               <option>Rahul Verma</option>
//             </select>
//           </div>
//         </div>

//         {/* Quick Notes Dropdown */}
//         <div className="mt-4">
//           <label className="text-sm text-gray-600">Quick Add Notes</label>
//           <select
//             onChange={handleQuickNoteSelect}
//             defaultValue=""
//             className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="" disabled>
//               Select a note to add
//             </option>

//             {quickNoteOptions.map((note, index) => (
//               <option key={index} value={note}>
//                 {note}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Others Input */}
//         {isOtherSelected && (
//           <div className="mt-3">
//             <label className="text-sm text-gray-600">Enter Custom Note</label>
//             <input
//               type="text"
//               value={otherNote}
//               onChange={handleOtherNoteChange}
//               placeholder="Type your custom note..."
//               className="w-full border border-gray-300 rounded-lg p-2 mt-1"
//             />
//           </div>
//         )}

//         {/* Feedback */}
//         <div className="mt-4">
//           <label className="text-sm text-gray-600">Feedback</label>
//           <textarea
//             className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500"
//             rows="3"
//             placeholder="Write feedback..."
//             value={feedback}
//             onChange={(e) => setFeedback(e.target.value)}
//           ></textarea>
//         </div>

//         {/* Action Points */}
//         <div className="mt-4">
//           <label className="text-sm text-gray-600">Action Points</label>
//           <textarea
//             className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500"
//             rows="2"
//             placeholder="Suggested next steps..."
//             value={actionPoints}
//             onChange={(e) => setActionPoints(e.target.value)}
//           ></textarea>
//         </div>

//         <div className="mt-6 flex justify-end">
//           <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
//             Save Note
//           </button>
//         </div>
//       </div>

//       {/* Previous Notes */}
//       <div className="max-w-5xl mx-auto">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//           <MessageCircle className="text-green-600" size={20} />
//           Previous Notes
//         </h2>

//         {/* ⭐ GRID ADDED HERE ⭐ */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

//           {notes.map((note) => (
//             <div
//               key={note.id}
//               className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <div className="flex items-center gap-2">
//                   <User size={18} className="text-blue-600" />
//                   <p className="font-medium text-gray-800">{note.studentName}</p>
//                 </div>
//                 <div className="flex items-center gap-1 text-gray-500 text-sm">
//                   <Calendar size={16} />
//                   <span>{note.date}</span>
//                 </div>
//               </div>

//               <p className="text-gray-700 mt-2">{note.feedback}</p>
//               <p className="text-sm text-gray-600 mt-2">
//                 <strong>Action Points:</strong> {note.actionPoints}
//               </p>
//             </div>
//           ))}

//         </div>
//       </div>
//     </div>
//   );
// };

// export default MentorNotes;
import React, { useState } from "react";
import { User, Calendar, Edit3, MessageCircle } from "lucide-react";

const MentorNotes = () => {
  const [selectedQuickNotes, setSelectedQuickNotes] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [actionPoints, setActionPoints] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const quickNoteOptions = [
    "Excellent Progress",
    "Needs Improvement",
    "Strong Communication Skills",
    "Great Technical Knowledge",
    "Consistent Performance",
    "Slow but Improving",
    "Good Leadership Quality",
    "Teamwork is Improving",
    "Needs Extra Practice",
    "Outstanding Creativity",
    "Others",
  ];

  const handleQuickNoteSelect = (e) => {
    const value = e.target.value;

    if (value === "Others") {
      setIsOtherSelected(true);
      return;
    }

    setIsOtherSelected(false);

    if (value && !selectedQuickNotes.includes(value)) {
      setSelectedQuickNotes([...selectedQuickNotes, value]);
    }
  };

  const handleOtherNoteChange = (e) => {
    const value = e.target.value;
    setOtherNote(value);

    if (value.trim() !== "") {
      const updated = selectedQuickNotes.filter((n) => n !== otherNote);
      setSelectedQuickNotes([...updated, value]);
    }
  };

  // sample previous notes
  const notes = [
    {
      id: 1,
      studentName: "Aarav Sharma",
      date: "12 Nov 2025",
      feedback:
        "Aarav showed excellent confidence during the class presentation. He is improving his clarity and engagement while speaking.",
      actionPoints: "Encourage him to take part in the upcoming debate competition.",
    },
    {
      id: 2,
      studentName: "Diya Patel",
      date: "08 Nov 2025",
      feedback:
        "Diya demonstrated strong creative thinking in her science project. Her unique idea on sustainable energy stood out.",
      actionPoints: "Motivate her to document her idea in the school innovation fair.",
    },
    {
      id: 3,
      studentName: "Rahul Verma",
      date: "05 Nov 2025",
      feedback:
        "Rahul coordinated the group activity effectively and ensured every member contributed. Shows developing leadership skills.",
      actionPoints: "Assign him a class project leader role next month.",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📝 Mentor Notes</h1>
        <p className="text-gray-600 mt-1">
          Track and record qualitative feedback for your students.
        </p>
      </div>

      {/* Add New Note Form */}
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-8 mb-10 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Edit3 className="text-blue-600" size={20} />
          Add New Note
        </h2>

        {/* Student */}
        <div className="grid md:grid-cols-1 gap-4">
          <div>
            <label className="text-sm text-gray-600">Select Student</label>
            <select className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-blue-500">
              <option>Select Student</option>
              <option>Aarav Sharma</option>
              <option>Diya Patel</option>
              <option>Rahul Verma</option>
            </select>
          </div>
        </div>

        {/* Quick Notes Dropdown */}
        <div className="mt-4">
          <label className="text-sm text-gray-600">Quick Add Notes</label>
          <select
            onChange={handleQuickNoteSelect}
            defaultValue=""
            className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select a note to add
            </option>

            {quickNoteOptions.map((note, index) => (
              <option key={index} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>

        {/* Others Input */}
        {isOtherSelected && (
          <div className="mt-3">
            <label className="text-sm text-gray-600">Enter Custom Note</label>
            <input
              type="text"
              value={otherNote}
              onChange={handleOtherNoteChange}
              placeholder="Type your custom note..."
              className="w-full border border-gray-300 rounded-lg p-3 mt-1"
            />
          </div>
        )}

        {/* Feedback */}
        <div className="mt-4">
          <label className="text-sm text-gray-600">Feedback</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Write feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          ></textarea>
        </div>

        {/* Action Points */}
        <div className="mt-4">
          <label className="text-sm text-gray-600">Action Points</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="Suggested next steps..."
            value={actionPoints}
            onChange={(e) => setActionPoints(e.target.value)}
          ></textarea>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md">
            Save Note
          </button>
        </div>
      </div>

      {/* Previous Notes */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="text-green-600" size={20} />
          Previous Notes
        </h2>

        {/* Responsive Grid with Wider Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">

          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 min-h-[230px]"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  <p className="font-medium text-gray-800">{note.studentName}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Calendar size={16} />
                  <span>{note.date}</span>
                </div>
              </div>

              <p className="text-gray-700 mt-2 leading-relaxed">
                {note.feedback}
              </p>

              <p className="text-sm text-gray-600 mt-3">
                <strong>Action Points:</strong> {note.actionPoints}
              </p>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default MentorNotes;
