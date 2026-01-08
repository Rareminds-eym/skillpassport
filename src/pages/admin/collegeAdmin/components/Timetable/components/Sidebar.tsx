import React from "react";
import { Coffee, Filter, Plus, Pencil, X, Building2 } from "lucide-react";
import { Department, Faculty, CollegeClass, Break } from "../types";
import { BREAK_CARD_COLORS, BREAK_TYPE_LABELS } from "../constants";

interface SidebarProps {
  departments: Department[];
  faculty: Faculty[];
  classes: CollegeClass[];
  facultyClasses: CollegeClass[];
  breaks: Break[];
  selectedDepartmentFilter: string;
  selectedFacultyFilter: string;
  selectedClassFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  onFacultyFilterChange: (value: string) => void;
  onClassFilterChange: (value: string) => void;
  onAddBreak: () => void;
  onEditBreak: (breakItem: Break) => void;
  onDeleteBreak: (breakId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  departments,
  faculty,
  classes,
  facultyClasses,
  breaks,
  selectedDepartmentFilter,
  selectedFacultyFilter,
  selectedClassFilter,
  onDepartmentFilterChange,
  onFacultyFilterChange,
  onClassFilterChange,
  onAddBreak,
  onEditBreak,
  onDeleteBreak,
}) => {
  // Filter faculty and classes by department
  const filteredFaculty = selectedDepartmentFilter
    ? faculty.filter(f => f.department_id === selectedDepartmentFilter)
    : faculty;
  
  const filteredClasses = selectedDepartmentFilter
    ? classes.filter(c => c.department_id === selectedDepartmentFilter)
    : classes;

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
        </h3>

        <div className="space-y-3">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-indigo-600" />
              Department
            </label>
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => onDepartmentFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            {selectedDepartmentFilter && (
              <p className="text-[10px] text-indigo-600 mt-1">
                {filteredFaculty.length} faculty, {filteredClasses.length} classes
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Faculty</label>
            <select
              value={selectedFacultyFilter}
              onChange={(e) => onFacultyFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Faculty</option>
              {filteredFaculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.first_name} {f.last_name} {f.is_hod ? "(HOD)" : ""}
                </option>
              ))}
            </select>
            {selectedDepartmentFilter && filteredFaculty.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No faculty in this department</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => onClassFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Classes</option>
              {(selectedFacultyFilter ? facultyClasses : filteredClasses).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade}-{c.section})
                </option>
              ))}
            </select>
            {selectedFacultyFilter && facultyClasses.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No classes assigned to this faculty.</p>
            )}
            {selectedDepartmentFilter && !selectedFacultyFilter && filteredClasses.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No classes in this department</p>
            )}
          </div>
        </div>
      </div>

      {/* Break Management */}
      <div className="p-4 border-b border-gray-200 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Coffee className="h-4 w-4" /> Breaks & Holidays
          </h3>
          <button
            onClick={onAddBreak}
            className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {breaks.map((b) => (
            <div
              key={b.id}
              onClick={() => onEditBreak(b)}
              className={`p-2 border rounded-lg text-xs group cursor-pointer transition-colors ${
                BREAK_CARD_COLORS[b.break_type] || "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBreak(b);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-80 p-0.5"
                    title="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBreak(b.id!);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-80 p-0.5"
                    title="Delete"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 opacity-80">
                <span>
                  {b.start_date} {b.end_date !== b.start_date && `- ${b.end_date}`}
                </span>
                <span className="text-[10px] uppercase font-medium">
                  {BREAK_TYPE_LABELS[b.break_type] || b.break_type}
                </span>
              </div>
            </div>
          ))}
          {breaks.length === 0 && (
            <p className="text-xs text-gray-500 italic">No breaks or holidays added</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Legend</h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 bg-gray-200 rounded"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #ccc, #ccc 2px, transparent 2px, transparent 4px)",
              }}
            ></div>
            <span className="text-gray-600">Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span className="text-gray-600">Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
            <span className="text-gray-600">Exam</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
