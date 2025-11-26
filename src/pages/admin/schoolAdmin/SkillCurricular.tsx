
import React, { useState, useMemo } from "react";
import {
    Search,
    Users,
    Calendar,
    Trophy,
    Plus,
    X,
    ChevronDown,
    FileDown,
} from "lucide-react";

const sampleClubs = [
    {
        club_id: "c1",
        name: "Robotics Club",
        category: "robotics",
        description: "Build and program robots. Participate in competitions and workshops.",
        members: ["s1", "s2", "s3"],
        capacity: 30,
        upcomingCompetitions: ["comp1"],
    },
    {
        club_id: "c2",
        name: "Literature Circle",
        category: "literature",
        description: "Book discussions, creative writing and contests.",
        members: ["s2"],
        capacity: 20,
        upcomingCompetitions: [],
    },
    {
        club_id: "c3",
        name: "Coding Club",
        category: "science",
        description: "Learn programming and participate in hackathons.",
        members: [],
        capacity: 50,
        upcomingCompetitions: ["comp2"],
    },
    {
        club_id: "c4",
        name: "Football Team",
        category: "sports",
        description: "Practice daily, play interschool matches.",
        members: ["s1", "s4", "s5"],
        capacity: 25,
        upcomingCompetitions: [],
    },
];

const sampleCompetitions = [
    {
        comp_id: "comp1",
        name: "State Robotics Challenge",
        level: "district",
        date: "2026-01-15",
        participatingClubs: ["c1"],
        results: [],
    },
    {
        comp_id: "comp2",
        name: "Inter-school Hackathon",
        level: "interschool",
        date: "2025-12-05",
        participatingClubs: ["c3"],
        results: [],
    },
];

const categories = [
    { id: "all", label: "All" },
    { id: "arts", label: "Arts" },
    { id: "sports", label: "Sports" },
    { id: "robotics", label: "Robotics" },
    { id: "science", label: "Science" },
    { id: "literature", label: "Literature" },
];

function formatDate(d) {
    try {
        const dd = new Date(d);
        return dd.toLocaleDateString();
    } catch (e) {
        return d;
    }
}

function downloadCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const header = Object.keys(rows[0]);
    const csv = [header.join("\t")]
        .concat(
            rows.map((r) => header.map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join("\t"))
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/tab-separated-values;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function exportTableAsPrint(htmlString, title = "Report") {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return alert("Unable to open export window. Please allow popups.");
    w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${htmlString}
      </body>
    </html>
  `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
}

function ClubCard({ club, isJoined, onJoin, onLeave, onOpenDetails }) {
    const memberCount = club.members?.length ?? 0;
    const full = memberCount >= club.capacity;

    return (
        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-md flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-full p-2">
                            <Users size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{club.name}</h3>
                            <p className="text-xs text-slate-500 capitalize">{club.category}</p>
                        </div>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                        <div>{memberCount}/{club.capacity}</div>
                        <div className="text-xs">Members</div>
                    </div>
                </div>

                <p className="mt-3 text-sm text-slate-700">{club.description}</p>

                {club.upcomingCompetitions?.length ? (
                    <div className="mt-3">
                        <span className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            <Trophy size={14} /> Upcoming
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <button
                    onClick={() => onOpenDetails(club)}
                    className="text-sm px-3 py-1 border rounded-md bg-white text-slate-700 hover:shadow-sm"
                >
                    View
                </button>

                {!isJoined ? (
                    <button
                        disabled={full}
                        onClick={() => onJoin(club)}
                        className={`flex items-center gap-2 text-sm px-3 py-1 rounded-md ${full ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                    >
                        <Plus size={14} /> Join
                    </button>
                ) : (
                    <button
                        onClick={() => onLeave(club)}
                        className="flex items-center gap-2 text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100"
                    >
                        <X size={14} /> Leave
                    </button>
                )}
            </div>
        </div>
    );
}

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
                        <X />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

export default function ClubsActivitiesPage() {
    const currentStudent = useMemo(() => ({ id: "s_new", name: "You" }), []);

    const [clubs, setClubs] = useState(sampleClubs);
    const [competitions, setCompetitions] = useState(sampleCompetitions);

    const [q, setQ] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showMine, setShowMine] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [viewComp, setViewComp] = useState(null);
    const [notice, setNotice] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [registerCompModal, setRegisterCompModal] = useState(null);
    const [addClubModal, setAddClubModal] = useState(false);
    const [addCompModal, setAddCompModal] = useState(false);
    const [studentDrawer, setStudentDrawer] = useState({ open: false, club: null });
const [allStudents] = useState([
    { id: "s1", name: "Alice Johnson", grade: "10A" },
    { id: "s2", name: "Bob Smith", grade: "11B" },
    { id: "s3", name: "Charlie Brown", grade: "10C" },
    { id: "s4", name: "Diana Prince", grade: "12A" },
    { id: "s5", name: "Ethan Hunt", grade: "11A" },
    { id: "s6", name: "Fiona Green", grade: "10B" },
    { id: "s7", name: "George Wilson", grade: "12C" },
    { id: "s8", name: "Hannah Lee", grade: "11C" },
]);
    const [newCompForm, setNewCompForm] = useState({
        name: "",
        level: "district",
        date: "",
        results: [],
        participatingClubs: []
    });

    const [newClubForm, setNewClubForm] = useState({
        name: "",
        category: "arts",
        description: "",
        capacity: 30
    });
    const [registrationForm, setRegistrationForm] = useState({
        studentName: "",
        studentId: "",
        grade: "",
        teamMembers: "",
        notes: ""
    });

    const joinedClubIds = useMemo(() => {
        return new Set(clubs.filter((c) => c.members.includes(currentStudent.id)).map((c) => c.club_id));
    }, [clubs, currentStudent]);

    const filteredClubs = useMemo(() => {
        return clubs.filter((c) => {
            if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
            if (showMine && !c.members.includes(currentStudent.id)) return false;
            if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
            return true;
        });
    }, [clubs, q, categoryFilter, showMine, currentStudent]);

    const enrollStudent = (club) => {
    setStudentDrawer({ open: true, club: club });
};

    const leaveClub = (club) => {
        if (!club.members.includes(currentStudent.id)) {
            setNotice({ type: "warning", text: "You are not a member of this club." });
            return;
        }

        const updated = clubs.map((c) => (c.club_id === club.club_id ? { ...c, members: c.members.filter((m) => m !== currentStudent.id) } : c));
        setClubs(updated);
        setNotice({ type: "info", text: `Left ${club.name}` });
    };

    const openDetails = (club) => {
        setSelectedClub(club);
        setDetailsOpen(true);
    };
   const handleStudentEnroll = (studentId, club) => {
    if (club.members.includes(studentId)) {
        setNotice({ type: "warning", text: "Student is already enrolled in this club." });
        return;
    }

    if ((club.members.length ?? 0) >= club.capacity) {
        setNotice({ type: "error", text: "Club is full. Cannot join." });
        return;
    }

    const updated = clubs.map((c) => 
        c.club_id === club.club_id 
            ? { ...c, members: [...c.members, studentId] } 
            : c
    );
    setClubs(updated);
    setStudentDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) });
    setNotice({ type: "success", text: `Student enrolled in ${club.name}` });
};

const handleStudentLeave = (studentId, club) => {
    if (!club.members.includes(studentId)) {
        setNotice({ type: "warning", text: "Student is not a member of this club." });
        return;
    }

    const updated = clubs.map((c) => 
        c.club_id === club.club_id 
            ? { ...c, members: c.members.filter((m) => m !== studentId) } 
            : c
    );
    setClubs(updated);
    setStudentDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) });
    setNotice({ type: "info", text: `Student removed from ${club.name}` });
};

    const buildClubParticipationRows = () => {
        return clubs.map((c) => ({
            "Club Name": c.name,
            "Student Count": c.members.length,
            "Average attendance": "--",
            "Top performers": "--",
            "Participation score": Math.round((c.members.length / c.capacity) * 100),
        }));
    };

    const buildCompetitionPerformanceRows = () => {
        return competitions.map((t) => ({
            "Competition Name": t.name,
            Level: t.level,
            "Student Results": t.results?.length ? JSON.stringify(t.results) : "--",
            Awards: "--",
        }));
    };

    const exportClubsCSV = () => {
        const rows = buildClubParticipationRows();
        downloadCSV("club_participation.tsv", rows);
        setShowExportMenu(false);
    };

    const exportCompetitionsCSV = () => {
        const rows = buildCompetitionPerformanceRows();
        downloadCSV("competition_performance.tsv", rows);
        setShowExportMenu(false);
    };

    const exportClubsPDF = () => {
        const rows = buildClubParticipationRows();
        const html = `<table><thead><tr>${Object.keys(rows[0]).map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows
            .map((r) => `<tr>${Object.keys(r).map((k) => `<td>${r[k]}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`;
        exportTableAsPrint(html, "Club Participation Report");
        setShowExportMenu(false);
    };

    const exportCompetitionsPDF = () => {
        const rows = buildCompetitionPerformanceRows();
        const html = `<table><thead><tr>${Object.keys(rows[0]).map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows
            .map((r) => `<tr>${Object.keys(r).map((k) => `<td>${r[k]}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`;
        exportTableAsPrint(html, "Competition Performance Report");
        setShowExportMenu(false);
    };

    const handleAddClub = () => {
        if (!newClubForm.name.trim()) {
            setNotice({ type: "error", text: "Club name is required" });
            return;
        }

        if (!newClubForm.description.trim()) {
            setNotice({ type: "error", text: "Club description is required" });
            return;
        }

        if (newClubForm.capacity < 1) {
            setNotice({ type: "error", text: "Capacity must be at least 1" });
            return;
        }

        const newClub = {
            club_id: `c${clubs.length + 1}`,
            name: newClubForm.name,
            category: newClubForm.category,
            description: newClubForm.description,
            capacity: parseInt(newClubForm.capacity),
            members: [],
            upcomingCompetitions: []
        };

        setClubs([...clubs, newClub]);
        setNotice({ type: "success", text: `${newClub.name} has been created successfully!` });
        setAddClubModal(false);
        setNewClubForm({ name: "", category: "arts", description: "", capacity: 30 });
    };

    const handleRegisterCompetition = () => {
        if (!registrationForm.studentName.trim() || !registrationForm.studentId.trim() || !registrationForm.grade.trim()) {
            setNotice({ type: "error", text: "Please fill all required fields" });
            return;
        }

        setNotice({
            type: "success",
            text: `Successfully registered for ${registerCompModal?.name}!`
        });
        setRegisterCompModal(null);
        setRegistrationForm({ studentName: "", studentId: "", grade: "", teamMembers: "", notes: "" });
    };
    const handleAddCompetition = () => {
        if (!newCompForm.name.trim()) {
            setNotice({ type: "error", text: "Competition name is required" });
            return;
        }

        if (!newCompForm.date) {
            setNotice({ type: "error", text: "Competition date is required" });
            return;
        }

        const newCompetition = {
            comp_id: `comp${competitions.length + 1}`,
            name: newCompForm.name,
            level: newCompForm.level,
            date: newCompForm.date,
            participatingClubs: newCompForm.participatingClubs,
            results: []
        };

        setCompetitions([...competitions, newCompetition]);

        // Reset UI
        setNotice({ type: "success", text: `${newCompetition.name} added successfully!` });
        setAddCompModal(false);
        setNewCompForm({
            name: "",
            level: "district",
            date: "",
            participatingClubs: []
        });
    };

    return (
        <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Skills & Co-Curricular</h1>
                        <p className="text-sm text-slate-600">Clubs • Activities • Competitions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-white border hover:bg-gray-50"
                            >
                                <FileDown size={16} />
                                Export Reports
                                <ChevronDown size={16} />
                            </button>

                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50">
                                    <div className="py-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Clubs</div>
                                        <button
                                            onClick={exportClubsCSV}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                            Export Clubs (CSV)
                                        </button>
                                        <button
                                            onClick={exportClubsPDF}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                            Export Clubs (PDF)
                                        </button>

                                        <div className="border-t my-1"></div>

                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Competitions</div>
                                        <button
                                            onClick={exportCompetitionsCSV}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                            Export Competitions (CSV)
                                        </button>
                                        <button
                                            onClick={exportCompetitionsPDF}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                            Export Competitions (PDF)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                            <Search />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search clubs..."
                                className="w-full outline-none bg-transparent placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>

                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={showMine} onChange={(e) => setShowMine(e.target.checked)} /> My Clubs
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setAddClubModal(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <Plus size={16} />
                                Add Club
                            </button>
                        </div>
                    </div>
                </div>

                {notice ? (
                    <div className={`p-3 rounded-md mb-4 ${notice.type === "error" ? "bg-red-50 text-red-700" : notice.type === "success" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                        {notice.text}
                        <button onClick={() => setNotice(null)} className="ml-3 text-xs underline">Dismiss</button>
                    </div>
                ) : null}

                <section>
                    <h2 className="text-lg font-semibold mb-3">Clubs</h2>
                    {filteredClubs.length === 0 ? (
                        <div className="p-6 bg-white rounded-2xl text-center">No clubs found</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredClubs.map((club) => (
                                <ClubCard
                                    key={club.club_id}
                                    club={club}
                                    isJoined={joinedClubIds.has(club.club_id)}
                                    onJoin={enrollStudent}
                                    onLeave={leaveClub}
                                    onOpenDetails={openDetails}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Upcoming Competitions</h2>
                        <div className="text-sm text-slate-500">{competitions.length} competitions</div>
                        <button
                            onClick={() => setAddCompModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                            <Plus size={16} />
                            Add Competition
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {competitions.map((comp) => (
                            <div key={comp.comp_id} className="min-w-[260px] bg-white p-4 rounded-2xl shadow-sm border">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold">{comp.name}</h3>
                                        <div className="text-xs text-slate-500 capitalize">{comp.level} • {formatDate(comp.date)}</div>
                                    </div>
                                    <div className="text-slate-400">
                                        <Calendar />
                                    </div>
                                </div>

                                <p className="mt-3 text-sm text-slate-600">Participating: {comp.participatingClubs?.length ?? 0}</p>

                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        className="text-sm px-3 py-1 rounded-md border hover:bg-slate-100"
                                        onClick={() => setViewComp(comp)}
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => setRegisterCompModal(comp)}
                                        className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title={selectedClub?.name ?? "Details"}>
                    {selectedClub ? (
                        <div>
                            <div className="mb-3 text-sm text-slate-600">Category: {selectedClub.category}</div>
                            <div className="mb-3 text-sm">{selectedClub.description}</div>

                            <div className="mb-3">
                                <div className="text-xs text-slate-500">Members ({selectedClub.members.length}/{selectedClub.capacity})</div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {selectedClub.members.map((m) => (
                                        <div key={m} className="px-2 py-1 bg-gray-100 rounded-full text-xs">{m}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {!selectedClub.members.includes(currentStudent.id) ? (
                                    <button onClick={() => { enrollStudent(selectedClub); setDetailsOpen(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Join Club</button>
                                ) : (
                                    <button onClick={() => { leaveClub(selectedClub); setDetailsOpen(false); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-md border">Leave Club</button>
                                )}

                                <button onClick={() => setDetailsOpen(false)} className="px-3 py-2 border rounded-md">Close</button>
                            </div>
                        </div>
                    ) : null}
                </Modal>

                <Modal open={addClubModal} onClose={() => setAddClubModal(false)} title="Add New Club">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Club Name *</label>
                            <input
                                type="text"
                                value={newClubForm.name}
                                onChange={(e) => setNewClubForm({ ...newClubForm, name: e.target.value })}
                                placeholder="Enter club name"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <select
                                value={newClubForm.category}
                                onChange={(e) => setNewClubForm({ ...newClubForm, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="arts">Arts</option>
                                <option value="sports">Sports</option>
                                <option value="robotics">Robotics</option>
                                <option value="science">Science</option>
                                <option value="literature">Literature</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description *</label>
                            <textarea
                                value={newClubForm.description}
                                onChange={(e) => setNewClubForm({ ...newClubForm, description: e.target.value })}
                                placeholder="Enter club description"
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity *</label>
                            <input
                                type="number"
                                value={newClubForm.capacity}
                                onChange={(e) => setNewClubForm({ ...newClubForm, capacity: e.target.value })}
                                min="1"
                                placeholder="Maximum members"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={handleAddClub}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create Club
                            </button>
                            <button
                                onClick={() => setAddClubModal(false)}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    open={!!registerCompModal}
                    onClose={() => setRegisterCompModal(null)}
                    title={`Register for ${registerCompModal?.name ?? ""}`}
                >
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-md text-sm">
                            <div className="font-medium">{registerCompModal?.name}</div>
                            <div className="text-xs text-slate-600 mt-1">
                                {registerCompModal?.level} • {formatDate(registerCompModal?.date)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Student Name *</label>
                            <input
                                type="text"
                                value={registrationForm.studentName}
                                onChange={(e) => setRegistrationForm({ ...registrationForm, studentName: e.target.value })}
                                placeholder="Enter student name"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Student ID *</label>
                            <input
                                type="text"
                                value={registrationForm.studentId}
                                onChange={(e) => setRegistrationForm({ ...registrationForm, studentId: e.target.value })}
                                placeholder="Enter student ID"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Grade/Class *</label>
                            <input
                                type="text"
                                value={registrationForm.grade}
                                onChange={(e) => setRegistrationForm({ ...registrationForm, grade: e.target.value })}
                                placeholder="e.g., Grade 10, Class 12A"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Team Members (if applicable)</label>
                            <input
                                type="text"
                                value={registrationForm.teamMembers}
                                onChange={(e) => setRegistrationForm({ ...registrationForm, teamMembers: e.target.value })}
                                placeholder="Comma-separated names"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Additional Notes</label>
                            <textarea
                                value={registrationForm.notes}
                                onChange={(e) => setRegistrationForm({ ...registrationForm, notes: e.target.value })}
                                placeholder="Any special requirements or notes"
                                rows={2}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={handleRegisterCompetition}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Submit Registration
                            </button>
                            <button
                                onClick={() => setRegisterCompModal(null)}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
                {/* Competition View Modal */}
                <Modal
                    open={!!viewComp}
                    onClose={() => setViewComp(null)}
                    title="Competition Details"
                >
                    {viewComp && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">{viewComp.name}</h2>

                            <p className="text-sm text-slate-600">
                                Category: <span className="capitalize">{viewComp.category}</span>
                            </p>

                            <p className="text-sm text-slate-700">{viewComp.description}</p>

                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                                <p>Reward: {viewComp.reward}</p>
                                <p>Skill Level: {viewComp.skill_level}</p>
                                <p>Team Size: {viewComp.team_size}</p>
                                <p>Status: {viewComp.status}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setRegisterCompModal(viewComp.comp_id);
                                    setViewComp(null);
                                }}
                                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Register Now
                            </button>
                        </div>
                    )}
                </Modal>
                <Modal
                    open={addCompModal}
                    onClose={() => setAddCompModal(false)}
                    title="Add New Competition"
                >
                    <div className="space-y-3">

                        <div>
                            <label className="text-sm font-medium">Competition Name</label>
                            <input
                                value={newCompForm.name}
                                onChange={(e) => setNewCompForm({ ...newCompForm, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="Enter Competition Name"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Level</label>
                            <select
                                value={newCompForm.level}
                                onChange={(e) => setNewCompForm({ ...newCompForm, level: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                            >
                                <option value="district">District</option>
                                <option value="state">State</option>
                                <option value="national">National</option>
                                <option value="interschool">Inter-School</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date</label>
                            <input
                                type="date"
                                value={newCompForm.date}
                                onChange={(e) => setNewCompForm({ ...newCompForm, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Participating Clubs</label>
                            <select
                                multiple
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                value={newCompForm.participatingClubs}
                                onChange={(e) =>
                                    setNewCompForm({
                                        ...newCompForm,
                                        participatingClubs: Array.from(
                                            e.target.selectedOptions,
                                            (option) => option.value
                                        ),
                                    })
                                }
                            >
                                {clubs.map((c) => (
                                    <option key={c.club_id} value={c.club_id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500">Hold CTRL (Windows) or CMD (Mac) to select multiple</p>
                        </div>

                        <button
                            onClick={handleAddCompetition}
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mt-3"
                        >
                            Create Competition
                        </button>
                    </div>
                </Modal>
                <Modal
    open={studentDrawer.open}
    onClose={() => setStudentDrawer({ open: false, club: null })}
    title={`Manage Students - ${studentDrawer.club?.name ?? ""}`}
>
    {studentDrawer.club && (
        <div className="space-y-3">
            <div className="text-sm text-slate-600 mb-4">
                Current Members: {studentDrawer.club.members.length} / {studentDrawer.club.capacity}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
                {allStudents.map((student) => {
                    const isEnrolled = studentDrawer.club.members.includes(student.id);
                    const isFull = studentDrawer.club.members.length >= studentDrawer.club.capacity;

                    return (
                        <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                            <div>
                                <div className="font-medium text-sm">{student.name}</div>
                                <div className="text-xs text-slate-500">{student.grade}</div>
                            </div>

                            {isEnrolled ? (
                                <button
                                    onClick={() => handleStudentLeave(student.id, studentDrawer.club)}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100"
                                >
                                    <X size={14} />
                                    Remove
                                </button>
                            ) : (
                                <button
                                    disabled={isFull}
                                    onClick={() => handleStudentEnroll(student.id, studentDrawer.club)}
                                    className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md ${
                                        isFull
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                >
                                    <Plus size={14} />
                                    Add
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t">
                <button
                    onClick={() => setStudentDrawer({ open: false, club: null })}
                    className="w-full px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        </div>
    )}
</Modal>

            </div>
        </div>
        
    );
}