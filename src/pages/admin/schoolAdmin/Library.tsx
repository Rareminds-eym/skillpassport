
// import React, { useState } from "react";
// import { v4 as uuidv4 } from "uuid"; // For generating UUIDs

// export default function LibraryModule() {
//   const [activeTab, setActiveTab] = useState("dashboard");

//   // Books DB (simulate table)
//   const [books, setBooks] = useState([
//     { book_id: uuidv4(), title: "Mathematics Grade 8", author: "R.S. Sharma", isbn: "1234567890", copies: 5, status: "Available" },
//     { book_id: uuidv4(), title: "Science Grade 9", author: "S. Gupta", isbn: "9876543210", copies: 3, status: "Issued" },
//   ]);

//   const [borrowHistory, setBorrowHistory] = useState([
//     { id: 1, book: "Math Grade 9", due: "2025-02-10", status: "Returned" },
//     { id: 2, book: "Physics Grade 11", due: "2025-02-15", status: "Overdue" },
//   ]);

//   // New book form state
//   const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", copies: 1 });

//   const addBook = () => {
//     if (!newBook.title || !newBook.author || !newBook.isbn || newBook.copies < 1) {
//       alert("Please fill all fields correctly.");
//       return;
//     }
//     setBooks([...books, { ...newBook, book_id: uuidv4(), status: "Available" }]);
//     setNewBook({ title: "", author: "", isbn: "", copies: 1 });
//     alert("Book added successfully!");
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Library Module</h1>

//       {/* Tabs */}
//       <div className="flex gap-2 mb-6 flex-wrap">
//         {["dashboard", "add", "details", "issue", "return", "history", "overdue"].map((tab) => (
//           <button
//             key={tab}
//             onClick={() => setActiveTab(tab)}
//             className={`px-4 py-2 rounded-lg ${
//               activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
//             }`}
//           >
//             {tab.charAt(0).toUpperCase() + tab.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* Dashboard / Book List */}
//       {activeTab === "dashboard" && (
//         <div>
//           <table className="w-full border rounded-lg">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border">Book ID</th>
//                 <th className="p-2 border">Title</th>
//                 <th className="p-2 border">Author</th>
//                 <th className="p-2 border">ISBN</th>
//                 <th className="p-2 border">Copies</th>
//                 <th className="p-2 border">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {books.map((book) => (
//                 <tr key={book.book_id}>
//                   <td className="p-2 border">{book.book_id.slice(0, 8)}</td>
//                   <td className="p-2 border">{book.title}</td>
//                   <td className="p-2 border">{book.author}</td>
//                   <td className="p-2 border">{book.isbn}</td>
//                   <td className="p-2 border">{book.copies}</td>
//                   <td className="p-2 border">
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${
//                         book.status === "Available"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-yellow-100 text-yellow-700"
//                       }`}
//                     >
//                       {book.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Add New Book */}
//       {activeTab === "add" && (
//         <div className="max-w-xl mx-auto">
//           <h2 className="text-xl font-bold mb-4">Add New Book</h2>
//           <label className="block mb-2 font-medium">Title</label>
//           <input
//             className="w-full p-2 border rounded mb-3"
//             value={newBook.title}
//             onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
//           />
//           <label className="block mb-2 font-medium">Author</label>
//           <input
//             className="w-full p-2 border rounded mb-3"
//             value={newBook.author}
//             onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
//           />
//           <label className="block mb-2 font-medium">ISBN</label>
//           <input
//             className="w-full p-2 border rounded mb-3"
//             value={newBook.isbn}
//             onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
//           />
//           <label className="block mb-2 font-medium">Copies</label>
//           <input
//             type="number"
//             className="w-full p-2 border rounded mb-4"
//             value={newBook.copies}
//             onChange={(e) => setNewBook({ ...newBook, copies: Number(e.target.value) })}
//           />
//           <button onClick={addBook} className="w-full bg-green-600 text-white p-2 rounded-lg">
//             Add Book
//           </button>
//         </div>
//       )}

//       {/* Book Details */}
//       {activeTab === "details" && (
//         <div>
//           <h2 className="text-xl font-bold mb-4">Book Details</h2>
//           {books.map((book) => (
//             <div key={book.book_id} className="border p-4 mb-3 rounded-lg">
//               <p><strong>ID:</strong> {book.book_id}</p>
//               <p><strong>Title:</strong> {book.title}</p>
//               <p><strong>Author:</strong> {book.author}</p>
//               <p><strong>ISBN:</strong> {book.isbn}</p>
//               <p><strong>Copies:</strong> {book.copies}</p>
//               <p><strong>Status:</strong> {book.status}</p>
//               <div className="mt-2 flex gap-2">
//                 <button className="px-3 py-1 bg-blue-500 text-white rounded-lg">Issue</button>
//                 <button className="px-3 py-1 bg-green-600 text-white rounded-lg">Return</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Issue Book */}
//       {/* Issue Book */}
// {activeTab === "issue" && (
//   <div className="max-w-xl mx-auto">
//     <h2 className="text-xl font-bold mb-4">Issue Book</h2>

//     {/* Student Name */}
//     <label className="block mb-2 font-medium">Student Name</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter student name" />

//     {/* Roll Number */}
//     <label className="block mb-2 font-medium">Roll Number</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter roll number" />

//     {/* Class */}
//     <label className="block mb-2 font-medium">Class</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter class/grade" />

//     {/* Academic Year */}
//     <label className="block mb-2 font-medium">Academic Year</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter academic year" />

//     {/* Book Selection */}
//     <label className="block mb-2 font-medium">Book</label>
//     <select className="w-full p-2 border rounded mb-3">
//       {books.map((book) => (
//         <option key={book.book_id} value={book.book_id}>
//           {book.title} ({book.book_id.slice(0, 8)})
//         </option>
//       ))}
//     </select>

//     {/* Due Date */}
//     <label className="block mb-2 font-medium">Due Date</label>
//     <input type="date" className="w-full p-2 border rounded mb-4" />

//     <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Issue Book</button>
//   </div>
// )}


//       {/* Return Book */}
//       {activeTab === "return" && (
//         <div className="max-w-xl mx-auto">
//           <h2 className="text-xl font-bold mb-4">Return Book</h2>
//           <label className="block mb-2 font-medium">Book ID</label>
//           <input className="w-full p-2 border rounded mb-3" />
//           <label className="block mb-2 font-medium">Student ID</label>
//           <input className="w-full p-2 border rounded mb-3" />
//           <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded mb-4">
//             Fine: ₹20 (Auto-calculated based on overdue days)
//           </div>
//           <button className="w-full bg-green-600 text-white p-2 rounded-lg">Return Book</button>
//         </div>
//       )}

//       {/* Borrow History */}
//       {activeTab === "history" && (
//         <div>
//           <h2 className="text-xl font-bold mb-4">Borrow History</h2>
//           <table className="w-full border rounded-lg">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border">Book</th>
//                 <th className="p-2 border">Due Date</th>
//                 <th className="p-2 border">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {borrowHistory.map((item) => (
//                 <tr key={item.id}>
//                   <td className="p-2 border">{item.book}</td>
//                   <td className="p-2 border">{item.due}</td>
//                   <td className="p-2 border">
//                     {item.status === "Overdue" ? (
//                       <span className="text-red-600 font-bold">Overdue</span>
//                     ) : (
//                       <span className="text-green-600">Returned</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Overdue List */}
//       {activeTab === "overdue" && (
//         <div>
//           <h2 className="text-xl font-bold mb-4">Overdue Books</h2>
//           <table className="w-full border rounded-lg">
//             <thead className="bg-red-100">
//               <tr>
//                 <th className="p-2 border">Book</th>
//                 <th className="p-2 border">Student ID</th>
//                 <th className="p-2 border">Due Date</th>
//                 <th className="p-2 border">Fine</th>
//               </tr>
//             </thead>
//             <tbody>
//               {borrowHistory
//                 .filter((item) => item.status === "Overdue")
//                 .map((item) => (
//                   <tr key={item.id}>
//                     <td className="p-2 border">{item.book}</td>
//                     <td className="p-2 border">STD-001</td>
//                     <td className="p-2 border">{item.due}</td>
//                     <td className="p-2 border">₹20</td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // For generating UUIDs

export default function LibraryModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Library Configuration Rules (Fixed/Automatic)
  const LIBRARY_RULES = {
    maxBooksPerStudent: 3,
    defaultLoanPeriodDays: 14, // Auto-set to 14 days from issue date
    finePerDay: 10, // ₹10 per day overdue
  };

  // Books DB (simulate table)
  const [books, setBooks] = useState([
    { book_id: uuidv4(), title: "Mathematics Grade 8", author: "R.S. Sharma", isbn: "1234567890", copies: 5, availableCopies: 5, status: "Available" },
    { book_id: uuidv4(), title: "Science Grade 9", author: "S. Gupta", isbn: "9876543210", copies: 3, availableCopies: 1, status: "Issued" },
    { book_id: uuidv4(), title: "English Grammar", author: "L. Roy", isbn: "1122334455", copies: 4, availableCopies: 4, status: "Available" },
    { book_id: uuidv4(), title: "History of India", author: "A. Singh", isbn: "2233445566", copies: 2, availableCopies: 2, status: "Available" },
    { book_id: uuidv4(), title: "Geography Basics", author: "M. Patel", isbn: "3344556677", copies: 6, availableCopies: 6, status: "Available" },
    { book_id: uuidv4(), title: "Physics Grade 10", author: "S. Kumar", isbn: "4455667788", copies: 3, availableCopies: 0, status: "Issued" },
    { book_id: uuidv4(), title: "Chemistry Grade 10", author: "R. Das", isbn: "5566778899", copies: 5, availableCopies: 5, status: "Available" },
    { book_id: uuidv4(), title: "Biology Grade 9", author: "N. Mehta", isbn: "6677889900", copies: 4, availableCopies: 4, status: "Available" },
    { book_id: uuidv4(), title: "Computer Science Basics", author: "V. Sharma", isbn: "7788990011", copies: 2, availableCopies: 2, status: "Available" },
    { book_id: uuidv4(), title: "Environmental Studies", author: "P. Jain", isbn: "8899001122", copies: 3, availableCopies: 3, status: "Available" },
  ]);

  // Issued Books (Active loans)
  const [issuedBooks, setIssuedBooks] = useState<any[]>([
    { 
      id: uuidv4(), 
      bookId: books[1]?.book_id, 
      bookTitle: "Science Grade 9", 
      studentId: "STD-002", 
      studentName: "Diya", 
      rollNumber: "102",
      class: "9",
      academicYear: "2024-25",
      issueDate: "2025-01-15", 
      dueDate: "2025-02-15", 
      status: "Issued",
      returnDate: null
    },
    { 
      id: uuidv4(), 
      bookId: books[5]?.book_id, 
      bookTitle: "Physics Grade 10", 
      studentId: "STD-004", 
      studentName: "Isha", 
      rollNumber: "104",
      class: "10",
      academicYear: "2024-25",
      issueDate: "2025-01-10", 
      dueDate: "2025-02-10", 
      status: "Issued",
      returnDate: null
    },
  ]);

  // Borrow History
  const [borrowHistory, setBorrowHistory] = useState([
    { id: 1, bookTitle: "Mathematics Grade 8", studentId: "STD-001", studentName: "Aarav", issueDate: "2025-01-05", dueDate: "2025-02-05", returnDate: "2025-02-03", status: "Returned", fine: 0 },
    { id: 2, bookTitle: "Physics Grade 10", studentId: "STD-004", studentName: "Isha", issueDate: "2025-01-10", dueDate: "2025-02-10", returnDate: null, status: "Issued", fine: 0 },
    { id: 3, bookTitle: "English Grammar", studentId: "STD-003", studentName: "Rohan", issueDate: "2025-01-08", dueDate: "2025-02-08", returnDate: "2025-02-07", status: "Returned", fine: 0 },
    { id: 4, bookTitle: "Science Grade 9", studentId: "STD-002", studentName: "Diya", issueDate: "2025-01-15", dueDate: "2025-02-15", returnDate: null, status: "Issued", fine: 0 },
  ]);

  // New book form state
  const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", copies: 1 });

  // Dashboard pagination
  const [dashboardPage, setDashboardPage] = useState(1);
  const dashboardBooksPerPage = 10;

  // Book Details filters and pagination
  const [bookSearch, setBookSearch] = useState("");
  const [bookFilter, setBookFilter] = useState("all"); // all, available, issued
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 6;

  // Return Book - Issued books pagination and modal
  const [issuedBooksSearch, setIssuedBooksSearch] = useState("");
  const [issuedBooksPage, setIssuedBooksPage] = useState(1);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const issuedBooksPerPage = 6;

  // Issue book form state
  const [issueForm, setIssueForm] = useState({
    studentName: "",
    rollNumber: "",
    class: "",
    academicYear: "",
    bookId: "",
    dueDate: "",
  });

  // Return book form state
  const [returnForm, setReturnForm] = useState({
    bookId: "",
    studentId: "",
    studentName: "",
    rollNumber: "",
    class: "",
    bookTitle: "",
    issueDate: "",
    dueDate: "",
    returnDate: new Date().toISOString().split('T')[0],
  });

  // Calculate fine based on overdue days (Issue Date + 14 days = Due Date)
  const calculateFine = (issueDate: string, returnDate: string) => {
    // Calculate due date: Issue Date + 14 days
    const issue = new Date(issueDate);
    const dueDate = new Date(issue);
    dueDate.setDate(dueDate.getDate() + LIBRARY_RULES.defaultLoanPeriodDays);
    
    // Calculate overdue days
    const ret = new Date(returnDate);
    const overdueDays = Math.max(0, Math.floor((ret.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const fine = overdueDays * LIBRARY_RULES.finePerDay;
    
    return { 
      dueDate: dueDate.toISOString().split('T')[0], 
      overdueDays, 
      fine 
    };
  };

  const addBook = () => {
    if (!newBook.title || !newBook.author || !newBook.isbn || newBook.copies < 1) {
      alert("Please fill all fields correctly.");
      return;
    }
    setBooks([...books, { ...newBook, book_id: uuidv4(), availableCopies: newBook.copies, status: "Available" }]);
    setNewBook({ title: "", author: "", isbn: "", copies: 1 });
    alert("Book added successfully!");
  };

  const issueBook = () => {
    if (!issueForm.studentName || !issueForm.rollNumber || !issueForm.class || !issueForm.academicYear || !issueForm.bookId) {
      alert("Please fill all fields.");
      return;
    }

    const selectedBook = books.find(b => b.book_id === issueForm.bookId);
    if (!selectedBook || selectedBook.availableCopies <= 0) {
      alert("Book not available for issue.");
      return;
    }

    // Generate or find student ID
    const studentId = `STD-${issueForm.rollNumber}`;

    // Check max books per student rule
    const studentCurrentBooks = issuedBooks.filter(
      ib => ib.studentId === studentId && ib.status === "Issued"
    ).length;

    if (studentCurrentBooks >= LIBRARY_RULES.maxBooksPerStudent) {
      alert(`Student has already issued ${LIBRARY_RULES.maxBooksPerStudent} books. Maximum limit reached. Please return a book before issuing a new one.`);
      return;
    }

    // Auto-calculate due date (Issue Date + 14 days)
    const issueDate = new Date();
    const calculatedDueDate = new Date(issueDate);
    calculatedDueDate.setDate(calculatedDueDate.getDate() + LIBRARY_RULES.defaultLoanPeriodDays);
    
    const finalDueDate = calculatedDueDate.toISOString().split('T')[0];

    const newIssue = {
      id: uuidv4(),
      bookId: issueForm.bookId,
      bookTitle: selectedBook.title,
      studentId: studentId,
      studentName: issueForm.studentName,
      rollNumber: issueForm.rollNumber,
      class: issueForm.class,
      academicYear: issueForm.academicYear,
      issueDate: issueDate.toISOString().split('T')[0],
      dueDate: finalDueDate,
      status: "Issued",
    };

    setIssuedBooks([...issuedBooks, newIssue]);
    
    // Update book availability
    setBooks(books.map(book => 
      book.book_id === issueForm.bookId 
        ? { ...book, availableCopies: book.availableCopies - 1, status: book.availableCopies - 1 === 0 ? "Issued" : "Available" }
        : book
    ));

    // Add to history
    setBorrowHistory([...borrowHistory, {
      id: borrowHistory.length + 1,
      bookTitle: selectedBook.title,
      studentId: newIssue.studentId,
      studentName: issueForm.studentName,
      issueDate: newIssue.issueDate,
      dueDate: finalDueDate,
      returnDate: null,
      status: "Issued",
      fine: 0,
    }]);

    setIssueForm({ studentName: "", rollNumber: "", class: "", academicYear: "", bookId: "", dueDate: "" });
    alert(`Book issued successfully! Due date: ${finalDueDate}`);
  };

  const searchIssuedBook = () => {
    if (!returnForm.bookId && !returnForm.studentId) {
      alert("Please enter at least Book ID or Student ID to search.");
      return;
    }

    // Search by both IDs if provided, or by either one
    const issued = issuedBooks.find(
      ib => {
        const matchBookId = !returnForm.bookId || ib.bookId === returnForm.bookId;
        const matchStudentId = !returnForm.studentId || ib.studentId === returnForm.studentId;
        return matchBookId && matchStudentId && ib.status === "Issued";
      }
    );

    if (issued) {
      // Calculate current overdue status based on issue date
      const today = new Date().toISOString().split('T')[0];
      const { dueDate, overdueDays, fine } = calculateFine(issued.issueDate, today);
      
      setReturnForm({
        ...returnForm,
        bookId: issued.bookId,
        studentId: issued.studentId,
        studentName: issued.studentName,
        rollNumber: issued.rollNumber,
        class: issued.class,
        bookTitle: issued.bookTitle,
        issueDate: issued.issueDate,
        dueDate: dueDate,
        returnDate: new Date().toISOString().split('T')[0],
      });
      
      if (overdueDays > 0) {
        alert(`Book found! This book is ${overdueDays} days overdue. Current fine: ₹${fine}`);
      } else {
        alert("Book found! No overdue charges.");
      }
    } else {
      alert("No matching issued book found. Please check the Book ID and Student ID.");
      setReturnForm({
        bookId: returnForm.bookId,
        studentId: returnForm.studentId,
        studentName: "",
        rollNumber: "",
        class: "",
        bookTitle: "",
        issueDate: "",
        dueDate: "",
        returnDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  const returnBook = () => {
    if (!returnForm.bookId || !returnForm.studentId || !returnForm.bookTitle) {
      alert("Please search for the issued book first before returning.");
      return;
    }

    const issuedIndex = issuedBooks.findIndex(
      ib => ib.bookId === returnForm.bookId && ib.studentId === returnForm.studentId && ib.status === "Issued"
    );

    if (issuedIndex === -1) {
      alert("No matching issued book found. Please search again.");
      return;
    }

    const issuedBook = issuedBooks[issuedIndex];
    
    // Calculate fine based on issue date (Issue Date + 14 days = Due Date)
    const { overdueDays, fine } = calculateFine(issuedBook.issueDate, returnForm.returnDate);

    // Update issued books
    const updatedIssuedBooks = [...issuedBooks];
    updatedIssuedBooks[issuedIndex] = { ...issuedBook, status: "Returned", returnDate: returnForm.returnDate };
    setIssuedBooks(updatedIssuedBooks);

    // Update book availability
    setBooks(books.map(book => 
      book.book_id === returnForm.bookId 
        ? { ...book, availableCopies: book.availableCopies + 1, status: "Available" }
        : book
    ));

    // Update history
    setBorrowHistory(borrowHistory.map(h => 
      h.bookTitle === issuedBook.bookTitle && h.studentId === issuedBook.studentId && h.status === "Issued"
        ? { ...h, returnDate: returnForm.returnDate, status: overdueDays > 0 ? "Overdue" : "Returned", fine }
        : h
    ));

    const fineMessage = fine > 0 
      ? `Overdue: ${overdueDays} days | Fine: ₹${fine} (@ ₹${LIBRARY_RULES.finePerDay}/day)` 
      : "No fine. Returned on time.";
    
    alert(`Book returned successfully!\n\nStudent: ${returnForm.studentName}\nBook: ${returnForm.bookTitle}\n${fineMessage}`);
    
    setReturnForm({ 
      bookId: "", 
      studentId: "", 
      studentName: "", 
      rollNumber: "", 
      class: "", 
      bookTitle: "", 
      issueDate: "", 
      dueDate: "", 
      returnDate: new Date().toISOString().split('T')[0] 
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Library Module</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["dashboard", "add", "details", "issue", "return", "history", "overdue"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Dashboard / Book List */}
      {activeTab === "dashboard" && (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Total Books</h3>
              <p className="text-3xl font-bold">{books.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Available</h3>
              <p className="text-3xl font-bold">{books.filter(b => b.availableCopies > 0).length}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Currently Issued</h3>
              <p className="text-3xl font-bold">{issuedBooks.filter(ib => ib.status === "Issued").length}</p>
            </div>
          </div>

          {(() => {
            // Pagination logic
            const totalPages = Math.ceil(books.length / dashboardBooksPerPage);
            const startIndex = (dashboardPage - 1) * dashboardBooksPerPage;
            const endIndex = startIndex + dashboardBooksPerPage;
            const paginatedBooks = books.slice(startIndex, endIndex);

            return (
              <>
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, books.length)} of {books.length} books
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Book ID</th>
                        <th className="p-2 border">Title</th>
                        <th className="p-2 border">Author</th>
                        <th className="p-2 border">ISBN</th>
                        <th className="p-2 border">Total Copies</th>
                        <th className="p-2 border">Available</th>
                        <th className="p-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBooks.map((book) => (
                        <tr key={book.book_id} className="hover:bg-gray-50">
                          <td className="p-2 border font-mono text-xs">{book.book_id.slice(0, 8)}...</td>
                          <td className="p-2 border font-semibold">{book.title}</td>
                          <td className="p-2 border">{book.author}</td>
                          <td className="p-2 border">{book.isbn}</td>
                          <td className="p-2 border text-center">{book.copies}</td>
                          <td className="p-2 border text-center">
                            <span className={`font-bold ${
                              book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {book.availableCopies}
                            </span>
                          </td>
                          <td className="p-2 border text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                book.availableCopies > 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {book.availableCopies > 0 ? "Available" : "All Issued"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setDashboardPage(prev => Math.max(1, prev - 1))}
                      disabled={dashboardPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        dashboardPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setDashboardPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium ${
                            dashboardPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setDashboardPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={dashboardPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        dashboardPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Add New Book */}
      {activeTab === "add" && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Add New Book</h2>
          <label className="block mb-2 font-medium">Title</label>
          <input
            className="w-full p-2 border rounded mb-3"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
          />
          <label className="block mb-2 font-medium">Author</label>
          <input
            className="w-full p-2 border rounded mb-3"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
          />
          <label className="block mb-2 font-medium">ISBN</label>
          <input
            className="w-full p-2 border rounded mb-3"
            value={newBook.isbn}
            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
          />
          <label className="block mb-2 font-medium">Copies</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            value={newBook.copies}
            onChange={(e) => setNewBook({ ...newBook, copies: Number(e.target.value) })}
          />
          <button onClick={addBook} className="w-full bg-green-600 text-white p-2 rounded-lg">
            Add Book
          </button>
        </div>
      )}

      {/* Book Details */}
      {activeTab === "details" && (
        <div>
          <h2 className="text-xl font-bold mb-6">Book Details</h2>
          
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-sm">Search Books</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    className="w-full p-2 pl-10 border rounded-lg"
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
              </div>
              
              {/* Filter */}
              <div>
                <label className="block mb-2 font-medium text-sm">Filter by Status</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={bookFilter}
                  onChange={(e) => {
                    setBookFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Books</option>
                  <option value="available">Available Only</option>
                  <option value="issued">Issued/Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          {(() => {
            // Filter books based on search and filter
            let filteredBooks = books.filter(book => {
              const matchesSearch = 
                book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
                book.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
                book.isbn.includes(bookSearch);
              
              const matchesFilter = 
                bookFilter === "all" ||
                (bookFilter === "available" && book.availableCopies > 0) ||
                (bookFilter === "issued" && book.availableCopies === 0);
              
              return matchesSearch && matchesFilter;
            });

            // Pagination
            const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
            const startIndex = (currentPage - 1) * booksPerPage;
            const endIndex = startIndex + booksPerPage;
            const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

            return (
              <>
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredBooks.length)} of {filteredBooks.length} books
                  {bookSearch && ` (filtered from ${books.length} total)`}
                </div>

                {/* Books Grid */}
                {paginatedBooks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No books found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {paginatedBooks.map((book) => (
                      <div 
                        key={book.book_id} 
                        className={`border-2 rounded-lg p-4 hover:shadow-lg transition ${
                          book.availableCopies > 0 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        {/* Book Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800 mb-1">{book.title}</h3>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          </div>
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              book.availableCopies > 0
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {book.availableCopies > 0 ? 'Available' : 'All Issued'}
                          </span>
                        </div>

                        {/* Book Details */}
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">ISBN:</span>
                            <span className="font-medium">{book.isbn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Copies:</span>
                            <span className="font-medium">{book.copies}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Available:</span>
                            <span className={`font-bold ${
                              book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {book.availableCopies}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Book ID:</span>
                            <span className="font-mono text-xs">{book.book_id.slice(0, 12)}...</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button 
                            className={`flex-1 py-2 rounded-lg font-medium transition ${
                              book.availableCopies > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={book.availableCopies === 0}
                            onClick={() => {
                              setActiveTab("issue");
                              setIssueForm({ ...issueForm, bookId: book.book_id });
                            }}
                          >
                            Issue Book
                          </button>
                          <button 
                            className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition"
                            onClick={() => {
                              setActiveTab("return");
                              setReturnForm({ ...returnForm, bookId: book.book_id });
                            }}
                          >
                            Return
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Issue Book */}
      {activeTab === "issue" && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Issue Book</h2>
          
          {/* Library Rules Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-blue-900 mb-2">📚 Library Rules (Automatic)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-medium">Max Books per Student:</span> {LIBRARY_RULES.maxBooksPerStudent}
              </div>
              <div>
                <span className="font-medium">Loan Period:</span> {LIBRARY_RULES.defaultLoanPeriodDays} days (Auto-calculated)
              </div>
              <div>
                <span className="font-medium">Overdue Fine:</span> ₹{LIBRARY_RULES.finePerDay}/day
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Student Name</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter student name"
                  value={issueForm.studentName}
                  onChange={(e) => setIssueForm({ ...issueForm, studentName: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Roll Number</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter roll number"
                  value={issueForm.rollNumber}
                  onChange={(e) => setIssueForm({ ...issueForm, rollNumber: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Class</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter class/grade"
                  value={issueForm.class}
                  onChange={(e) => setIssueForm({ ...issueForm, class: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Academic Year</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="e.g., 2024-25"
                  value={issueForm.academicYear}
                  onChange={(e) => setIssueForm({ ...issueForm, academicYear: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Select Book</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={issueForm.bookId}
                  onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                >
                  <option value="">-- Select Book --</option>
                  {books.filter(b => b.availableCopies > 0).map((book) => (
                    <option key={book.book_id} value={book.book_id}>
                      {book.title} (Available: {book.availableCopies})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Due date will be automatically set to {LIBRARY_RULES.defaultLoanPeriodDays} days from today
                </p>
              </div>
            </div>
            
            <button 
              onClick={issueBook}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
            >
              Issue Book
            </button>
          </div>

          {/* Currently Issued Books */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Currently Issued Books</h3>
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Book Title</th>
                    <th className="p-2 border">Student Name</th>
                    <th className="p-2 border">Roll No</th>
                    <th className="p-2 border">Class</th>
                    <th className="p-2 border">Issue Date</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedBooks.filter(ib => ib.status === "Issued").map((issued) => (
                    <tr key={issued.id}>
                      <td className="p-2 border">{issued.bookTitle}</td>
                      <td className="p-2 border">{issued.studentName}</td>
                      <td className="p-2 border">{issued.rollNumber}</td>
                      <td className="p-2 border">{issued.class}</td>
                      <td className="p-2 border">{issued.issueDate}</td>
                      <td className="p-2 border">{issued.dueDate}</td>
                      <td className="p-2 border">
                        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                          {issued.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Return Book */}
      {activeTab === "return" && (
        <div>
          <h2 className="text-xl font-bold mb-6">Return Book</h2>
          
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 font-medium text-sm">Search by Book ID</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter book ID..."
                  value={returnForm.bookId}
                  onChange={(e) => setReturnForm({ ...returnForm, bookId: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-sm">Search by Student ID</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter student ID..."
                  value={returnForm.studentId}
                  onChange={(e) => setReturnForm({ ...returnForm, studentId: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-sm">Or Search All</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Search by book title or student..."
                  value={issuedBooksSearch}
                  onChange={(e) => {
                    setIssuedBooksSearch(e.target.value);
                    setIssuedBooksPage(1);
                  }}
                />
              </div>
            </div>
            
            <button 
              onClick={searchIssuedBook}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              🔍 Search by ID
            </button>
          </div>

          {/* Currently Issued Books Grid */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-bold mb-4 text-lg">📚 Currently Issued Books</h3>
            
            {(() => {
              const filteredIssued = issuedBooks.filter(ib => {
                if (ib.status !== "Issued") return false;
                if (!issuedBooksSearch) return true;
                
                const search = issuedBooksSearch.toLowerCase();
                return (
                  ib.bookTitle.toLowerCase().includes(search) ||
                  ib.studentName.toLowerCase().includes(search) ||
                  ib.studentId.toLowerCase().includes(search) ||
                  ib.rollNumber.includes(search)
                );
              });

              const totalPages = Math.ceil(filteredIssued.length / issuedBooksPerPage);
              const startIndex = (issuedBooksPage - 1) * issuedBooksPerPage;
              const endIndex = startIndex + issuedBooksPerPage;
              const paginatedIssued = filteredIssued.slice(startIndex, endIndex);

              return (
                <>
                  {/* Results Count */}
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredIssued.length)} of {filteredIssued.length} issued books
                  </div>

                  {paginatedIssued.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-lg">No issued books found</p>
                      <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {paginatedIssued.map((issued) => {
                        const today = new Date().toISOString().split('T')[0];
                        const { dueDate, overdueDays, fine } = calculateFine(issued.issueDate, today);
                        const isOverdue = overdueDays > 0;
                        
                        return (
                          <div 
                            key={issued.id} 
                            className={`border-2 rounded-lg p-4 hover:shadow-lg transition ${
                              isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-base text-gray-800">{issued.bookTitle}</h4>
                                <p className="text-xs text-gray-500 mt-1">ID: {issued.bookId.slice(0, 12)}...</p>
                              </div>
                              {isOverdue && (
                                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">
                                  OVERDUE
                                </span>
                              )}
                            </div>

                            {/* Student Info */}
                            <div className="space-y-2 mb-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Student:</span>
                                <span className="font-medium">{issued.studentName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Roll No:</span>
                                <span className="font-medium">{issued.rollNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Class:</span>
                                <span className="font-medium">{issued.class}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Issue Date:</span>
                                <span className="font-medium">{issued.issueDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Due Date:</span>
                                <span className="font-medium">{dueDate}</span>
                              </div>
                              {isOverdue && (
                                <div className="flex justify-between pt-2 border-t border-red-200">
                                  <span className="text-red-700 font-semibold">Fine:</span>
                                  <span className="text-red-700 font-bold">₹{fine} ({overdueDays}d)</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <button 
                              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                              onClick={() => {
                                setReturnForm({
                                  bookId: issued.bookId,
                                  studentId: issued.studentId,
                                  studentName: issued.studentName,
                                  rollNumber: issued.rollNumber,
                                  class: issued.class,
                                  bookTitle: issued.bookTitle,
                                  issueDate: issued.issueDate,
                                  dueDate: dueDate,
                                  returnDate: new Date().toISOString().split('T')[0],
                                });
                                setShowReturnModal(true);
                              }}
                            >
                              Select for Return
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => setIssuedBooksPage(prev => Math.max(1, prev - 1))}
                        disabled={issuedBooksPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          issuedBooksPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        ← Previous
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setIssuedBooksPage(page)}
                            className={`px-3 py-2 rounded-lg font-medium ${
                              issuedBooksPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setIssuedBooksPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={issuedBooksPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          issuedBooksPage === totalPages
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Return Modal/Drawer */}
          {showReturnModal && returnForm.bookTitle && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-xl font-bold">📖 Return Book</h3>
                  <button 
                    onClick={() => setShowReturnModal(false)}
                    className="text-white hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Book Title</label>
                      <p className="font-semibold">{returnForm.bookTitle}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Student Name</label>
                      <p className="font-semibold">{returnForm.studentName}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Roll Number</label>
                      <p className="font-semibold">{returnForm.rollNumber}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                      <p className="font-semibold">{returnForm.class}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Issue Date</label>
                      <p className="font-semibold">{returnForm.issueDate}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                      <p className="font-semibold">{returnForm.dueDate}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Return Date</label>
                    <input 
                      type="date"
                      className="w-full p-3 border rounded-lg" 
                      value={returnForm.returnDate}
                      onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
                    />
                  </div>

                  {(() => {
                    const { dueDate, overdueDays, fine } = calculateFine(returnForm.issueDate, returnForm.returnDate);
                    
                    return overdueDays > 0 ? (
                      <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">⚠️</span>
                          <strong className="text-lg">Overdue Book</strong>
                        </div>
                        <p><strong>Calculated Due Date:</strong> {dueDate}</p>
                        <p><strong>Days Overdue:</strong> {overdueDays} days</p>
                        <p className="text-xl font-bold mt-2"><strong>Fine Amount:</strong> ₹{fine}</p>
                      </div>
                    ) : (
                      <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✓</span>
                          <strong>No fine. Book returned on time.</strong>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowReturnModal(false)}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        returnBook();
                        setShowReturnModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      ✓ Confirm Return
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Borrow History */}
      {activeTab === "history" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Borrow History</h2>
          <div className="overflow-x-auto">
            <table className="w-full border rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Book Title</th>
                  <th className="p-2 border">Student ID</th>
                  <th className="p-2 border">Student Name</th>
                  <th className="p-2 border">Issue Date</th>
                  <th className="p-2 border">Due Date</th>
                  <th className="p-2 border">Return Date</th>
                  <th className="p-2 border">Fine</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {borrowHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2 border">{item.bookTitle}</td>
                    <td className="p-2 border">{item.studentId}</td>
                    <td className="p-2 border">{item.studentName}</td>
                    <td className="p-2 border">{item.issueDate}</td>
                    <td className="p-2 border">{item.dueDate}</td>
                    <td className="p-2 border">{item.returnDate || "Not Returned"}</td>
                    <td className="p-2 border">₹{item.fine}</td>
                    <td className="p-2 border">
                      {item.status === "Overdue" ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 font-bold">Overdue</span>
                      ) : item.status === "Issued" ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">Issued</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">Returned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue List */}
      {activeTab === "overdue" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Overdue Books</h2>
          <div className="overflow-x-auto">
            <table className="w-full border rounded-lg">
              <thead className="bg-red-100">
                <tr>
                  <th className="p-2 border">Book Title</th>
                  <th className="p-2 border">Student ID</th>
                  <th className="p-2 border">Student Name</th>
                  <th className="p-2 border">Issue Date</th>
                  <th className="p-2 border">Due Date</th>
                  <th className="p-2 border">Days Overdue</th>
                  <th className="p-2 border">Fine</th>
                </tr>
              </thead>
              <tbody>
                {issuedBooks
                  .filter((item) => {
                    if (item.status !== "Issued") return false;
                    const today = new Date().toISOString().split('T')[0];
                    const { overdueDays } = calculateFine(item.issueDate, today);
                    return overdueDays > 0;
                  })
                  .map((item) => {
                    const today = new Date().toISOString().split('T')[0];
                    // Calculate based on issue date (Issue Date + 14 days = Due Date)
                    const { dueDate, overdueDays, fine } = calculateFine(item.issueDate, today);
                    
                    return (
                      <tr key={item.id}>
                        <td className="p-2 border">{item.bookTitle}</td>
                        <td className="p-2 border">{item.studentId}</td>
                        <td className="p-2 border">{item.studentName}</td>
                        <td className="p-2 border">{item.issueDate}</td>
                        <td className="p-2 border">{dueDate}</td>
                        <td className="p-2 border text-red-600 font-bold">{overdueDays} days</td>
                        <td className="p-2 border text-red-600 font-bold">₹{fine}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {issuedBooks.filter((item) => {
              if (item.status !== "Issued") return false;
              const today = new Date().toISOString().split('T')[0];
              const { overdueDays } = calculateFine(item.issueDate, today);
              return overdueDays > 0;
            }).length === 0 && (
              <div className="text-center p-8 text-gray-500">
                No overdue books at the moment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
