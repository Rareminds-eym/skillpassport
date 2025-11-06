import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FunnelIcon,
  PlusCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  UserIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  PencilSquareIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  HomeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import Pagination from "../../../components/admin/Pagination";

/* ==============================
   TYPES & INTERFACES
   ============================== */
interface Student {
  id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  nationality: string;
  category: "General" | "OBC" | "SC" | "ST" | "Other";

  // Academic Information
  academic: {
    department: string;
    program: string;
    batch: string;
    semester: number;
    section: string;
    admissionDate: string;
    expectedGraduation: string;
  };

  // Verification & Workflow (SPEC ALIGNED)
  profileStatus: ProfileStatus;
  verificationStage: VerificationStage;
  verificationStatus: VerificationStatus;

  // Administrative
  status: "Active" | "Inactive" | "Suspended" | "Graduated" | "Dropout";
  admissionStatus: "Pending" | "Approved" | "Rejected" | "Waitlisted";

  // Metadata
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  verificationNotes?: string;
}

interface FilterState {
  departments: string[];
  programs: string[];
  batches: string[];
  status: string[];
  admissionStatus: string[];
  semesters: number[];
}

/* ==============================
   UTILITY COMPONENTS
   ============================== */
const StatusBadge = ({ status }: { status: Student["status"] }) => {
  const config: Record<Student["status"], { bg: string; text: string; icon?: any }> = {
    Active: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircleIcon },
    Inactive: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700" },
    Suspended: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: ExclamationTriangleIcon },
    Graduated: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: AcademicCapIcon },
    Dropout: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircleIcon },
  };

  const { bg, text, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
};

const AdmissionStatusBadge = ({ status }: { status: Student["admissionStatus"] }) => {
  const config: Record<Student["admissionStatus"], { bg: string; text: string; icon?: any }> = {
    Pending: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", icon: ClockIcon },
    Approved: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: CheckCircleIcon },
    Rejected: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircleIcon },
    Waitlisted: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: InformationCircleIcon },
  };

  const { bg, text, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
};

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 pb-6 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left py-2 group"
        type="button"
      >
        <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
          {title}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-slate-500 transition-all duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => (
  <div className="space-y-2">
    {options.map((opt: any) => (
      <label
        key={opt.value}
        className="flex items-center text-sm text-slate-700 hover:bg-slate-50 p-3 rounded-lg cursor-pointer transition-colors"
      >
        <input
          type="checkbox"
          checked={selectedValues.includes(opt.value)}
          onChange={(e) => {
            if (e.target.checked) onChange([...selectedValues, opt.value]);
            else onChange(selectedValues.filter((v: string) => v !== opt.value));
          }}
          className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
        />
        <span className="ml-3 flex-1 font-medium">{opt.label}</span>
        {opt.count !== undefined && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {opt.count}
          </span>
        )}
      </label>
    ))}
  </div>
);

const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  subtext,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "purple" | "amber" | "red" | "slate" | "indigo";
  subtext?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
          {subtext && <p className="text-xs text-slate-600">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   ADD STUDENT MODAL
   ============================== */
const AddStudentModal = ({
  isOpen,
  onClose,
  onCreated,
  departments,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (student: Student) => void;
  departments: string[];
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "Male" as "Male" | "Female" | "Other",
    bloodGroup: "",
    nationality: "Indian",
    category: "General" as "General" | "OBC" | "SC" | "ST" | "Other",
    aadhaarNumber: "",
    emergencyContact: { name: "", relationship: "Father", phone: "" },
    familyDetails: {
      fatherName: "",
      fatherOccupation: "",
      motherName: "",
      motherOccupation: "",
      annualIncome: 0,
    },
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      permanentAddress: "",
    },
    guardian: { name: "", relationship: "Father", phone: "", email: "" },
    academic: {
      department: "",
      program: "",
      batch: new Date().getFullYear().toString(),
      semester: 1,
      section: "A",
      admissionDate: new Date().toISOString().split("T")[0],
      expectedGraduation: "",
      entranceExam: { name: "", score: 0, year: new Date().getFullYear() },
    },
    previousEducation: {
      institution: "",
      board: "",
      percentage: 0,
      yearOfPassing: 0,
      subjects: [],
    },
    medicalInfo: {
      allergies: "",
      medicalConditions: "",
      bloodGroup: "",
      emergencyMedication: "",
    },
    preferences: {
      hostelRequired: false,
      transportationMode: "Self" as "Self" | "College Bus" | "Public Transport" | "Other",
      languagesKnown: [],
      extracurricularActivities: "",
    },
    feeDetails: {
      totalFees: 0,
      paidAmount: 0,
      pendingAmount: 0,
      scholarship: { type: "", amount: 0, provider: "" },
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "Male",
      bloodGroup: "",
      nationality: "Indian",
      category: "General",
      aadhaarNumber: "",
      emergencyContact: { name: "", relationship: "Father", phone: "" },
      familyDetails: {
        fatherName: "",
        fatherOccupation: "",
        motherName: "",
        motherOccupation: "",
        annualIncome: 0,
      },
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        permanentAddress: "",
      },
      guardian: { name: "", relationship: "Father", phone: "", email: "" },
      academic: {
        department: "",
        program: "",
        batch: new Date().getFullYear().toString(),
        semester: 1,
        section: "A",
        admissionDate: new Date().toISOString().split("T")[0],
        expectedGraduation: "",
        entranceExam: { name: "", score: 0, year: new Date().getFullYear() },
      },
      previousEducation: {
        institution: "",
        board: "",
        percentage: 0,
        yearOfPassing: 0,
        subjects: [],
      },
      medicalInfo: {
        allergies: "",
        medicalConditions: "",
        bloodGroup: "",
        emergencyMedication: "",
      },
      preferences: {
        hostelRequired: false,
        transportationMode: "Self",
        languagesKnown: [],
        extracurricularActivities: "",
      },
      feeDetails: {
        totalFees: 0,
        paidAmount: 0,
        pendingAmount: 0,
        scholarship: { type: "", amount: 0, provider: "" },
      },
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Invalid email format";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      else if (!/^[0-9]{10}$/.test(formData.phone))
        newErrors.phone = "Phone must be 10 digits";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required";
      if (!formData.emergencyContact.name.trim()) newErrors.emergencyName = "Emergency contact name is required";
      if (!formData.emergencyContact.phone.trim()) newErrors.emergencyPhone = "Emergency contact phone is required";
    } else if (stepNumber === 2) {
      if (!formData.familyDetails.fatherName.trim()) newErrors.fatherName = "Father's name is required";
      if (!formData.familyDetails.motherName.trim()) newErrors.motherName = "Mother's name is required";
      if (!formData.address.street.trim()) newErrors.street = "Address is required";
      if (!formData.address.city.trim()) newErrors.city = "City is required";
      if (!formData.address.state.trim()) newErrors.state = "State is required";
      if (!formData.address.pincode.trim()) newErrors.pincode = "Pincode is required";
      if (!formData.guardian.name.trim()) newErrors.guardianName = "Guardian name is required";
      if (!formData.guardian.phone.trim()) newErrors.guardianPhone = "Guardian phone is required";
    } else if (stepNumber === 3) {
      if (!formData.academic.department) newErrors.department = "Department is required";
      if (!formData.academic.program.trim()) newErrors.program = "Program is required";
      if (!formData.previousEducation.institution.trim())
        newErrors.institution = "Previous institution is required";
    } else if (stepNumber === 4) {
      if (!formData.medicalInfo.bloodGroup.trim()) newErrors.bloodGroup = "Blood group is required";
      if (formData.preferences.languagesKnown.length === 0) newErrors.languages = "At least one language is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(step)) return;

    setSubmitting(true);
    setTimeout(() => {
      const newStudent: Student = {
        id: `STU${Date.now()}`,
        registrationNumber: `REG${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        ...formData,
        documents: {
          aadhaar: false,
          tenthMarksheet: false,
          twelfthMarksheet: false,
          transferCertificate: false,
          birthCertificate: false,
          casteCertificate: false,
          incomeCertificate: false,
          medicalCertificate: false,
        },
        status: "Active",
        admissionStatus: "Pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCreated(newStudent);
      setSubmitting(false);
      handleClose();
    }, 500);
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: "Personal Info", icon: UserIcon },
    { number: 2, title: "Family & Address", icon: HomeIcon },
    { number: 3, title: "Academic Details", icon: AcademicCapIcon },
    { number: 4, title: "Medical & Preferences", icon: BriefcaseIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />

        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Add New Student</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Complete the form to register a new student in the system
                </p>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.number;
                const isCompleted = step > s.number;

                return (
                  <React.Fragment key={s.number}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : isActive
                            ? "border-indigo-500 bg-indigo-500 text-white"
                            : "border-slate-300 bg-white text-slate-400"
                          }`}
                      >
                        {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-xs font-medium ${isActive ? "text-indigo-600" : "text-slate-500"}`}>
                          {s.title}
                        </p>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-px mx-4 mt-5 ${isCompleted ? "bg-green-500" : "bg-slate-300"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            {step === 1 && (
              <div className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-indigo-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.firstName ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.lastName ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.email ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="student@example.com"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.phone ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="9876543210"
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.dateOfBirth ? "border-red-300" : "border-slate-300"
                          }`}
                      />
                      {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Gender *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" | "Other" })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nationality *
                      </label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.nationality ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Indian"
                      />
                      {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as "General" | "OBC" | "SC" | "ST" | "Other" })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Aadhaar Number
                      </label>
                      <input
                        type="text"
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="1234 5678 9012"
                        maxLength={12}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <PhoneIcon className="h-5 w-5 text-indigo-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.emergencyName ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="John Doe"
                      />
                      {errors.emergencyName && <p className="mt-1 text-sm text-red-600">{errors.emergencyName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.emergencyContact.relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.emergencyPhone ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="9876543210"
                      />
                      {errors.emergencyPhone && <p className="mt-1 text-sm text-red-600">{errors.emergencyPhone}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                {/* Family Details */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                    Family Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Father's Name *
                      </label>
                      <input
                        type="text"
                        value={formData.familyDetails.fatherName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familyDetails: { ...formData.familyDetails, fatherName: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.fatherName ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Rajesh Kumar"
                      />
                      {errors.fatherName && <p className="mt-1 text-sm text-red-600">{errors.fatherName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Father's Occupation
                      </label>
                      <input
                        type="text"
                        value={formData.familyDetails.fatherOccupation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familyDetails: { ...formData.familyDetails, fatherOccupation: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Mother's Name *
                      </label>
                      <input
                        type="text"
                        value={formData.familyDetails.motherName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familyDetails: { ...formData.familyDetails, motherName: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.motherName ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Priya Kumar"
                      />
                      {errors.motherName && <p className="mt-1 text-sm text-red-600">{errors.motherName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Mother's Occupation
                      </label>
                      <input
                        type="text"
                        value={formData.familyDetails.motherOccupation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familyDetails: { ...formData.familyDetails, motherOccupation: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Teacher"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Annual Family Income (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.familyDetails.annualIncome}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familyDetails: { ...formData.familyDetails, annualIncome: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="500000"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-indigo-600" />
                    Residential Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, street: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.street ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="123 Main Street, Apartment 4B"
                      />
                      {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.city ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Bangalore"
                      />
                      {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, state: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.state ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Karnataka"
                      />
                      {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, pincode: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.pincode ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="560001"
                      />
                      {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, country: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="India"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Permanent Address (if different)
                      </label>
                      <textarea
                        value={formData.address.permanentAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, permanentAddress: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Same as above or different permanent address"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-indigo-600" />
                    Guardian Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Guardian Name *
                      </label>
                      <input
                        type="text"
                        value={formData.guardian.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guardian: { ...formData.guardian, name: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.guardianName ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="John Doe"
                      />
                      {errors.guardianName && <p className="mt-1 text-sm text-red-600">{errors.guardianName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.guardian.relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guardian: { ...formData.guardian, relationship: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Guardian Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.guardian.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guardian: { ...formData.guardian, phone: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.guardianPhone ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="9876543210"
                      />
                      {errors.guardianPhone && <p className="mt-1 text-sm text-red-600">{errors.guardianPhone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Guardian Email
                      </label>
                      <input
                        type="email"
                        value={formData.guardian.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guardian: { ...formData.guardian, email: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="guardian@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                {/* Academic Details */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Department *
                      </label>
                      <select
                        value={formData.academic.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: { ...formData.academic, department: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.department ? "border-red-300" : "border-slate-300"
                          }`}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Program *
                      </label>
                      <input
                        type="text"
                        value={formData.academic.program}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: { ...formData.academic, program: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.program ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="B.Tech Computer Science"
                      />
                      {errors.program && <p className="mt-1 text-sm text-red-600">{errors.program}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Batch
                      </label>
                      <input
                        type="text"
                        value={formData.academic.batch}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: { ...formData.academic, batch: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Semester
                      </label>
                      <select
                        value={formData.academic.semester}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: { ...formData.academic, semester: parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>
                            {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        value={formData.academic.section}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: { ...formData.academic, section: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Admission Date
                      </label>
                      <input
                        type="date"
                        value={formData.academic.admissionDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: { ...formData.academic, admissionDate: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Entrance Exam */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <DocumentCheckIcon className="h-5 w-5 text-indigo-600" />
                    Entrance Exam Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Exam Name
                      </label>
                      <input
                        type="text"
                        value={formData.academic.entranceExam?.name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: {
                              ...formData.academic,
                              entranceExam: {
                                ...formData.academic.entranceExam,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="JEE Main, CET, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Score
                      </label>
                      <input
                        type="number"
                        value={formData.academic.entranceExam?.score || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: {
                              ...formData.academic,
                              entranceExam: {
                                ...formData.academic.entranceExam,
                                score: parseFloat(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="95.5"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Year
                      </label>
                      <input
                        type="number"
                        value={formData.academic.entranceExam?.year || new Date().getFullYear()}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic: {
                              ...formData.academic,
                              entranceExam: {
                                ...formData.academic.entranceExam,
                                year: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="2024"
                        min="2000"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                  </div>
                </div>

                {/* Previous Education */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                    Previous Education
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        value={formData.previousEducation.institution}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previousEducation: { ...formData.previousEducation, institution: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.institution ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="Delhi Public School"
                      />
                      {errors.institution && <p className="mt-1 text-sm text-red-600">{errors.institution}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Board
                      </label>
                      <input
                        type="text"
                        value={formData.previousEducation.board}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previousEducation: { ...formData.previousEducation, board: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="CBSE"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={formData.previousEducation.percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previousEducation: { ...formData.previousEducation, percentage: parseFloat(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="92.5"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Year of Passing
                      </label>
                      <input
                        type="number"
                        value={formData.previousEducation.yearOfPassing}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previousEducation: { ...formData.previousEducation, yearOfPassing: parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Subjects (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.previousEducation.subjects?.join(", ") || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previousEducation: {
                              ...formData.previousEducation,
                              subjects: e.target.value.split(",").map(s => s.trim()).filter(s => s),
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Physics, Chemistry, Mathematics, English"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-indigo-600" />
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Blood Group *
                      </label>
                      <select
                        value={formData.medicalInfo.bloodGroup}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicalInfo: { ...formData.medicalInfo, bloodGroup: e.target.value },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.bloodGroup ? "border-red-300" : "border-slate-300"
                          }`}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      {errors.bloodGroup && <p className="mt-1 text-sm text-red-600">{errors.bloodGroup}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Allergies
                      </label>
                      <input
                        type="text"
                        value={formData.medicalInfo.allergies}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicalInfo: { ...formData.medicalInfo, allergies: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Dust, Nuts, etc."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Medical Conditions
                      </label>
                      <textarea
                        value={formData.medicalInfo.medicalConditions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicalInfo: { ...formData.medicalInfo, medicalConditions: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Any chronic conditions, past surgeries, etc."
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Emergency Medication
                      </label>
                      <input
                        type="text"
                        value={formData.medicalInfo.emergencyMedication}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicalInfo: { ...formData.medicalInfo, emergencyMedication: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Asthalin inhaler, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <BriefcaseIcon className="h-5 w-5 text-indigo-600" />
                    Preferences & Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Hostel Required
                      </label>
                      <select
                        value={formData.preferences.hostelRequired ? "yes" : "no"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferences: {
                              ...formData.preferences,
                              hostelRequired: e.target.value === "yes",
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Transportation Mode
                      </label>
                      <select
                        value={formData.preferences.transportationMode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferences: {
                              ...formData.preferences,
                              transportationMode: e.target.value as "Self" | "College Bus" | "Public Transport" | "Other",
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="Self">Self</option>
                        <option value="College Bus">College Bus</option>
                        <option value="Public Transport">Public Transport</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Languages Known *
                      </label>
                      <input
                        type="text"
                        value={formData.preferences.languagesKnown.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferences: {
                              ...formData.preferences,
                              languagesKnown: e.target.value.split(",").map(s => s.trim()).filter(s => s),
                            },
                          })
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.languages ? "border-red-300" : "border-slate-300"
                          }`}
                        placeholder="English, Hindi, Kannada"
                      />
                      {errors.languages && <p className="mt-1 text-sm text-red-600">{errors.languages}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Extracurricular Activities
                      </label>
                      <textarea
                        value={formData.preferences.extracurricularActivities}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferences: {
                              ...formData.preferences,
                              extracurricularActivities: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Sports, Music, Dance, Clubs, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-between">
            <button
              onClick={step > 1 ? () => setStep(step - 1) : handleClose}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              {step > 1 ? "Previous" : "Cancel"}
            </button>
            <div className="flex gap-3">
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Student"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   CSV IMPORT MODAL
   ============================== */

const CSVImportModal = ({
  isOpen,
  onClose,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Partial<Student>[]) => void;
}) => {
  const [preview, setPreview] = useState<Partial<Student>[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        const requiredHeaders = ["firstname", "lastname", "email", "phone", "department"];
        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setErrors([`Missing required columns: ${missingHeaders.join(", ")}`]);
          return;
        }

        const newErrors: string[] = [];
        const students: Partial<Student>[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const row: Record<string, string> = {};

          headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
          });

          // Validate
          if (!row.firstname) newErrors.push(`Row ${i + 1}: First name is required`);
          if (!row.lastname) newErrors.push(`Row ${i + 1}: Last name is required`);
          if (!row.email || !/\S+@\S+\.\S+/.test(row.email))
            newErrors.push(`Row ${i + 1}: Valid email is required`);
          if (!row.phone || !/^[0-9]{10}$/.test(row.phone))
            newErrors.push(`Row ${i + 1}: Phone must be 10 digits`);
          if (!row.department) newErrors.push(`Row ${i + 1}: Department is required`);

          if (newErrors.length === 0) {
            students.push({
              firstName: row.firstname,
              lastName: row.lastname,
              email: row.email,
              phone: row.phone,
              academic: {
                department: row.department,
                program: row.program || "B.Tech",
                batch: row.batch || new Date().getFullYear().toString(),
                semester: parseInt(row.semester || "1", 10),
                section: row.section || "A",
                admissionDate: row.admissiondate || new Date().toISOString().split("T")[0],
                expectedGraduation: row.expectedgraduation || "",
              },
              dateOfBirth: row.dateofbirth || "",
              gender: (row.gender as "Male" | "Female" | "Other") || "Male",
              nationality: row.nationality || "Indian",
              category: (row.category as "General" | "OBC" | "SC" | "ST" | "Other") || "General",
              profileStatus: "DRAFT",
              verificationStage: "educator",
              verificationStatus: "pending",
              status: "Active",
              admissionStatus: "Pending",
            });
          }
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }

        setPreview(students);
        setErrors([]);
      } catch (err) {
        setErrors(["Failed to parse CSV file. Please check the format."]);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = () => {
    if (preview && preview.length > 0) {
      onImport(preview);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpTrayIcon className="h-6 w-6 text-indigo-600" />
                Import Students via CSV
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {!preview ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Select CSV File
                  </label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ArrowUpTrayIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">Click to upload CSV</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Required columns: firstName, lastName, email, phone, department
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-700 mb-2">Import Errors:</p>
                    <ul className="space-y-1">
                      {errors.map((error, idx) => (
                        <li key={idx} className="text-xs text-red-600">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-700">
                    ✓ Found {preview.length} valid student records
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 font-medium text-slate-700">Name</th>
                        <th className="text-left p-2 font-medium text-slate-700">Email</th>
                        <th className="text-left p-2 font-medium text-slate-700">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((student, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="p-2">{student.firstName} {student.lastName}</td>
                          <td className="p-2 text-slate-600">{student.email}</td>
                          <td className="p-2 text-slate-600">{student.academic?.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleImport}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    Import {preview.length} Students
                  </button>
                  <button
                    onClick={() => {
                      setPreview(null);
                      setErrors([]);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/* ==============================
   STUDENT DETAIL DRAWER
   ============================== */
const StudentDetailDrawer = ({
  student,
  onClose,
  onEdit,
}: {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
}) => {
  if (!student) return null;

  const InfoSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-indigo-600" />
        {title}
      </h3>
      {children}
    </div>
  );

  const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex h-full w-full sm:max-w-2xl flex-col bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold shadow-lg">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-sm text-slate-600">{student.registrationNumber}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={student.status} />
                  <AdmissionStatusBadge status={student.admissionStatus} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Personal Information */}
          <InfoSection title="Personal Information" icon={UserIcon}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Email" value={student.email} />
              <InfoItem label="Phone" value={student.phone} />
              <InfoItem label="Date of Birth" value={new Date(student.dateOfBirth).toLocaleDateString()} />
              <InfoItem label="Gender" value={student.gender} />
              {student.bloodGroup && <InfoItem label="Blood Group" value={student.bloodGroup} />}
            </div>
          </InfoSection>

          {/* Address */}
          <InfoSection title="Residential Address" icon={MapPinIcon}>
            <div className="space-y-1">
              <p className="text-sm text-slate-900">{student.address.street}</p>
              <p className="text-sm text-slate-900">
                {student.address.city}, {student.address.state} - {student.address.pincode}
              </p>
              <p className="text-sm text-slate-900">{student.address.country}</p>
            </div>
          </InfoSection>

          {/* Guardian */}
          <InfoSection title="Guardian Details" icon={UserGroupIcon}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Name" value={student.guardian.name} />
              <InfoItem label="Relationship" value={student.guardian.relationship} />
              <InfoItem label="Phone" value={student.guardian.phone} />
              {student.guardian.email && <InfoItem label="Email" value={student.guardian.email} />}
            </div>
          </InfoSection>

          {/* Academic Details */}
          <InfoSection title="Academic Information" icon={AcademicCapIcon}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Department" value={student.academic.department} />
              <InfoItem label="Program" value={student.academic.program} />
              <InfoItem label="Batch" value={student.academic.batch} />
              <InfoItem label="Semester" value={`Semester ${student.academic.semester}`} />
              <InfoItem label="Section" value={student.academic.section} />
              <InfoItem label="Admission Date" value={new Date(student.academic.admissionDate).toLocaleDateString()} />
            </div>
          </InfoSection>

          {/* Previous Education */}
          <InfoSection title="Previous Education" icon={BuildingOfficeIcon}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Institution" value={student.previousEducation.institution} />
              <InfoItem label="Board" value={student.previousEducation.board} />
              <InfoItem label="Percentage" value={`${student.previousEducation.percentage}%`} />
              <InfoItem label="Year of Passing" value={student.previousEducation.yearOfPassing} />
            </div>
          </InfoSection>

          {/* Documents */}
          <InfoSection title="Document Status" icon={DocumentCheckIcon}>
            <div className="space-y-3">
              {Object.entries(student.documents).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-700 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    {typeof value === "boolean" ? (
                      value ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-400" />
                      )
                    ) : null}
                    <span className="text-xs text-slate-500">
                      {typeof value === "boolean" ? (value ? "Submitted" : "Pending") : "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </InfoSection>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(student)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <PencilSquareIcon className="h-5 w-5" />
            Edit Student
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   STUDENT CARD (GRID VIEW)
   ============================== */
const StudentCard = ({
  student,
  onView,
}: {
  student: Student;
  onView: () => void;
}) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-lg font-bold shadow-lg">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white leading-tight">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-xs text-indigo-100">{student.registrationNumber}</p>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <StatusBadge status={student.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <AcademicCapIcon className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{student.academic.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
            <span className="truncate">{student.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <PhoneIcon className="h-4 w-4 text-slate-400" />
            <span>{student.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span>Sem {student.academic.semester} • {student.academic.section}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <AdmissionStatusBadge status={student.admissionStatus} />
          <button
            onClick={onView}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   MAIN COMPONENT
   ============================== */
const StudentDataAdmission: React.FC = () => {
  // Sample departments
  const departments = [
    "Computer Science & Engineering",
    "Electronics & Communication Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Information Technology",
    "Biotechnology",
    "Chemical Engineering",
  ];

  // State
  const [students, setStudents] = useState<Student[]>([
    {
      id: "STU001",
      registrationNumber: "REG20241001",
      firstName: "Raj",
      lastName: "Kumar",
      email: "raj@example.com",
      phone: "9876543210",
      dateOfBirth: "2002-05-15",
      gender: "Male",
      nationality: "Indian",
      category: "General",
      academic: {
        department: "Computer Science & Engineering",
        program: "B.Tech",
        batch: "2024",
        semester: 1,
        section: "A",
        admissionDate: "2024-07-01",
        expectedGraduation: "2028-05-31",
      },
      profileStatus: "PENDING_EDU",
      verificationStage: "educator",
      verificationStatus: "pending",
      status: "Active",
      admissionStatus: "Approved",
      createdAt: "2024-10-01T10:00:00Z",
      updatedAt: "2024-10-15T14:30:00Z",
      submittedAt: "2024-10-15T10:00:00Z",
    },
    {
      id: "STU002",
      registrationNumber: "REG20241002",
      firstName: "Priya",
      lastName: "Singh",
      email: "priya@example.com",
      phone: "9876543211",
      dateOfBirth: "2003-08-20",
      gender: "Female",
      nationality: "Indian",
      category: "OBC",
      academic: {
        department: "Electronics & Communication Engineering",
        program: "B.Tech",
        batch: "2024",
        semester: 1,
        section: "B",
        admissionDate: "2024-07-01",
        expectedGraduation: "2028-05-31",
      },
      profileStatus: "VERIFIED",
      verificationStage: "platform_admin",
      verificationStatus: "approved",
      status: "Active",
      admissionStatus: "Approved",
      createdAt: "2024-09-15T10:00:00Z",
      updatedAt: "2024-10-10T11:30:00Z",
    },
  ]);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [itemsPerPage] = useState(12);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    programs: [],
    batches: [],
    status: [],
    admissionStatus: [],
    semesters: [],
  });

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone.includes(searchQuery);

      const matchesDept =
        filters.departments.length === 0 ||
        filters.departments.includes(student.academic.department);

      const matchesStatus =
        filters.status.length === 0 || filters.status.includes(student.status);

      const matchesAdmissionStatus =
        filters.admissionStatus.length === 0 ||
        filters.admissionStatus.includes(student.admissionStatus);

      return (
        matchesSearch && matchesDept && matchesStatus && matchesAdmissionStatus
      );
    });
  }, [students, searchQuery, filters]);



  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  // Analytics Calculations
  const stats = useMemo(() => {
    const total = students.length;
    const verified = students.filter((s) => s.profileStatus === "VERIFIED").length;
    const pending = students.filter(
      (s) => s.profileStatus === "PENDING_EDU" || s.profileStatus === "PENDING_ADMIN"
    ).length;
    const flagged = students.filter((s) => s.profileStatus === "FLAGGED").length;

    return { total, verified, pending, flagged };
  }, [students]);


  // Filter options
  const filterOptions = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const admissionCounts: Record<string, number> = {};

    students.forEach((s) => {
      deptCounts[s.academic.department] =
        (deptCounts[s.academic.department] || 0) + 1;
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      admissionCounts[s.admissionStatus] =
        (admissionCounts[s.admissionStatus] || 0) + 1;
    });

    return {
      departments: Object.entries(deptCounts).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
      status: Object.entries(statusCounts).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
      admissionStatus: Object.entries(admissionCounts).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    };
  }, [students]);

  const totalFilters =
    filters.departments.length +
    filters.status.length +
    filters.admissionStatus.length;

  const handleClearFilters = () => {
    setFilters({
      departments: [],
      programs: [],
      batches: [],
      status: [],
      admissionStatus: [],
      semesters: [],
    });
  };

  const handleStudentCreated = (student: Student) => {
    setStudents([...students, student]);
    setShowAddModal(false);
  };

    const handleBulkImport = (importedStudents: Partial<Student>[]) => {
    const newStudents: Student[] = importedStudents.map((student, idx) => ({
      id: `STU${String(students.length + idx + 1).padStart(3, "0")}`,
      registrationNumber: `REG${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth || "",
      gender: student.gender || "Male",
      nationality: student.nationality || "Indian",
      category: student.category || "General",
      academic: student.academic || {
        department: "",
        program: "",
        batch: "",
        semester: 1,
        section: "",
        admissionDate: "",
        expectedGraduation: "",
      },
      profileStatus: student.profileStatus || "DRAFT",
      verificationStage: student.verificationStage || "educator",
      verificationStatus: student.verificationStatus || "pending",
      status: student.status || "Active",
      admissionStatus: student.admissionStatus || "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setStudents([...students, ...newStudents]);
  };


  return (
    <div className="min-h-screen mx-auto px-4 sm:px-6 lg:px-8 pt-8 bg-gray-50">
      {/* HEADER */}
      <div className=" mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
              Student Management
            </h1>
            <p className="mt-2 text-gray-600">Manage student admissions, verification, and academic records</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Total Students"
          value={stats.total}
          icon={UserGroupIcon}
          color="blue"
          subtext={`${stats.verified} verified`}
        />
        <StatsCard
          label="Verified Profiles"
          value={stats.verified}
          icon={CheckCircleIcon}
          color="green"
          subtext={`${Math.round((stats.verified / stats.total) * 100)}% of total`}
        />
        <StatsCard
          label="Pending Review"
          value={stats.pending}
          icon={ClockIcon}
          color="amber"
          subtext="Awaiting approval"
        />
        <StatsCard
          label="Flagged Cases"
          value={stats.flagged}
          icon={ExclamationTriangleIcon}
          color="red"
          subtext="Requires attention"
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1">
        <div className="flex flex-1 gap-6">
          {/* FILTERS SIDEBAR */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 overflow-y-auto shadow-xl lg:static lg:inset-auto lg:z-auto lg:shadow-none">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-slate-900">Filters</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleClearFilters}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Clear all
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="lg:hidden text-slate-400 hover:text-slate-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <FilterSection title="Department" defaultOpen>
                      <CheckboxGroup
                        options={filterOptions.departments}
                        selectedValues={filters.departments}
                        onChange={(values: string[]) =>
                          setFilters({ ...filters, departments: values })
                        }
                      />
                    </FilterSection>

                    <FilterSection title="Status">
                      <CheckboxGroup
                        options={filterOptions.status}
                        selectedValues={filters.status}
                        onChange={(values: string[]) =>
                          setFilters({ ...filters, status: values })
                        }
                      />
                    </FilterSection>

                    <FilterSection title="Admission Status">
                      <CheckboxGroup
                        options={filterOptions.admissionStatus}
                        selectedValues={filters.admissionStatus}
                        onChange={(values: string[]) =>
                          setFilters({ ...filters, admissionStatus: values })
                        }
                      />
                    </FilterSection>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search & Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by name, registration number, email, or phone..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 relative transition-colors"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                    {totalFilters > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                        {totalFilters}
                      </span>
                    )}
                  </button>

                  <div className="flex rounded-lg shadow-sm border border-slate-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === "grid"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 text-sm font-medium border-l border-slate-300 transition-colors ${viewMode === "table"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <TableCellsIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                  Showing <span className="font-semibold">{paginatedStudents.length}</span> of{" "}
                  <span className="font-semibold">{filteredStudents.length}</span> student
                  {filteredStudents.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Students Grid/Table */}
            {paginatedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <UserGroupIcon className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No students found
                </h3>
                <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                  {searchQuery || totalFilters > 0
                    ? "Try adjusting your search criteria or filters to find students"
                    : "Get started by adding your first student to the system"}
                </p>
                {!searchQuery && totalFilters === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Add Your First Student
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onView={() => setSelectedStudent(student)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Registration
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Semester
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Admission
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {paginatedStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-slate-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {student.registrationNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {student.academic.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900">
                            Sem {student.academic.semester}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge status={student.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <AdmissionStatusBadge status={student.admissionStatus} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStudents.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleStudentCreated}
        departments={departments}
      />

      <StudentDetailDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onEdit={(student) => {
          // Handle edit
          setSelectedStudent(null);
        }}
      />
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
};

export default StudentDataAdmission;