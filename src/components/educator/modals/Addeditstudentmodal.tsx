import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Papa from "papaparse";
import toast from "react-hot-toast";
import {
  addStudentManually,
  addStudentsBulk,
  updateStudent,
  downloadCSVTemplate,
} from "../../../services/Studentmanagement";

const AddEditStudentModal = ({ isOpen, onClose, student, onSuccess }) => {
  const isEditMode = !!student;
  const [activeTab, setActiveTab] = useState("manual");
  const [loading, setLoading] = useState(false);

  // Manual form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    university: "",
    college: "",
    department: "",
    registrationNumber: "",
    enrollmentNumber: "",
    enrollmentDate: "",
    expectedGraduationDate: "",
    cgpa: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelation: "",
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [uploadResults, setUploadResults] = useState(null);

  useEffect(() => {
    if (isEditMode && student) {
      // Parse profile data if available
      let profileData = {};
      if (student.profile) {
        try {
          if (typeof student.profile === 'string') {
            profileData = JSON.parse(student.profile);
          } else {
            profileData = student.profile;
          }
        } catch (error) {
          console.error('Error parsing student profile:', error);
        }
      }

      const dateOfBirth = student.date_of_birth || profileData.date_of_birth || "";
      const existingAge = student.age || profileData.age || "";
      const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : "";

      setFormData({
        name: student.name || profileData.name || "",
        email: student.email || profileData.email || "",
        phone: student.contact_number || profileData.contact_number || student.phone || "",
        alternatePhone: student.alternate_number || profileData.alternate_number || "",
        dateOfBirth,
        age: existingAge || calculatedAge,
        gender: student.gender || profileData.gender || "",
        bloodGroup: student.blood_group || profileData.blood_group || profileData.bloodGroup || "",
        address: student.address || profileData.address || "",
        city: student.city || profileData.city || "",
        state: student.state || profileData.state || "",
        country: student.country || profileData.country || "India",
        pincode: student.pincode || profileData.pincode || "",
        university: student.university || profileData.university || "",
        college: student.college_school_name || profileData.college_school_name || profileData.college || student.college || "",
        department: student.branch_field || profileData.branch_field || profileData.dept || student.dept || "",
        registrationNumber: student.registration_number || profileData.registration_number || "",
        enrollmentNumber: student.enrollment_number || profileData.enrollment_number || "",
        enrollmentDate: student.enrollment_date || profileData.enrollment_date || "",
        expectedGraduationDate: student.expected_graduation_date || profileData.expected_graduation_date || "",
        cgpa: student.current_cgpa || profileData.current_cgpa || profileData.cgpa || student.cgpa || "",
        guardianName: student.guardian_name || profileData.guardian_name || "",
        guardianPhone: student.guardian_phone || profileData.guardian_phone || "",
        guardianEmail: student.guardian_email || profileData.guardian_email || "",
        guardianRelation: student.guardian_relation || profileData.guardian_relation || "",
      });
      setActiveTab("manual");
    } else {
      resetForm();
    }
  }, [isEditMode, student]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      alternatePhone: "",
      dateOfBirth: "",
      age: "",
      gender: "",
      bloodGroup: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      university: "",
      college: "",
      department: "",
      registrationNumber: "",
      enrollmentNumber: "",
      enrollmentDate: "",
      expectedGraduationDate: "",
      cgpa: "",
      guardianName: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianRelation: "",
    });
    setCsvFile(null);
    setCsvData([]);
    setCsvError("");
    setUploadResults(null);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age > 0 ? age.toString() : "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-calculate age when date of birth changes
      if (name === "dateOfBirth") {
        newData.age = calculateAge(value);
      }

      return newData;
    });
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError("");
    setCsvData([]);
    setUploadResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setCsvError("Error parsing CSV file");
          return;
        }

        const students = results.data
          .map((row) => {
            // Normalize keys (trim and lowercase)
            const normalized = Object.entries(row).reduce((acc, [key, value]) => {
              acc[key.trim().toLowerCase()] = typeof value === "string" ? value.trim() : value;
              return acc;
            }, {});

            // Validate required fields
            if (!normalized.name || !normalized.email) {
              return null;
            }

            const dateOfBirth = normalized.dateofbirth || "";
            const age = normalized.age || (dateOfBirth ? calculateAge(dateOfBirth) : "");

            return {
              name: normalized.name,
              email: normalized.email,
              phone: normalized.phone || "",
              alternatePhone: normalized.alternatephone || "",
              dateOfBirth,
              age,
              gender: normalized.gender || "",
              bloodGroup: normalized.bloodgroup || "",
              address: normalized.address || "",
              city: normalized.city || "",
              state: normalized.state || "",
              country: normalized.country || "India",
              pincode: normalized.pincode || "",
              university: normalized.university || "",
              college: normalized.college || "",
              department: normalized.department || "",
              registrationNumber: normalized.registrationnumber || "",
              enrollmentNumber: normalized.enrollmentnumber || "",
              enrollmentDate: normalized.enrollmentdate || "",
              expectedGraduationDate: normalized.expectedgraduationdate || "",
              cgpa: normalized.cgpa || "",
              guardianName: normalized.guardianname || "",
              guardianPhone: normalized.guardianphone || "",
              guardianEmail: normalized.guardianemail || "",
              guardianRelation: normalized.guardianrelation || "",
            };
          })
          .filter((student) => student !== null);

        if (students.length === 0) {
          setCsvError("No valid student records found in CSV");
          return;
        }

        setCsvData(students);
      },
      error: (error) => {
        setCsvError(`Error reading CSV: ${error.message}`);
      },
    });

    e.target.value = "";
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isEditMode) {
        result = await updateStudent(student.id, formData);
      } else {
        result = await addStudentManually(formData);
      }

      if (result.success) {
        toast.success(
          isEditMode
            ? "Student updated successfully"
            : "Student added successfully"
        );
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        toast.error(result.error || "Failed to save student");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (csvData.length === 0) {
      toast.error("No valid student data to upload");
      return;
    }

    setLoading(true);

    try {
      const result = await addStudentsBulk(csvData);

      if (result.success) {
        setUploadResults(result.data);
        toast.success(
          `Successfully added ${result.data.successful} students`
        );

        if (result.data.failed > 0) {
          toast.error(`Failed to add ${result.data.failed} students`);
        }

        if (result.data.successful > 0) {
          onSuccess?.();
        }
      } else {
        toast.error(result.error || "Failed to upload students");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className="inline-block w-full max-w-4xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Student" : "Add Student"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isEditMode
                  ? "Update student information"
                  : "Add a new student manually or via CSV upload"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {!isEditMode && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("manual")}
                    className={`${
                      activeTab === "manual"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <UserPlusIcon className="h-5 w-5 inline mr-2" />
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setActiveTab("csv")}
                    className={`${
                      activeTab === "csv"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 inline mr-2" />
                    CSV Upload
                  </button>
                </nav>
              </div>
            </div>
          )}

          {activeTab === "manual" || isEditMode ? (
            <form onSubmit={handleManualSubmit}>
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Basic Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isEditMode}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  </div>

                  {/* Address Information */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Address Information
                    </h3>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Academic Information */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Academic Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College/School
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department/Branch
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enrollment Number
                    </label>
                    <input
                      type="text"
                      name="enrollmentNumber"
                      value={formData.enrollmentNumber}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enrollment Date
                    </label>
                    <input
                      type="date"
                      name="enrollmentDate"
                      value={formData.enrollmentDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Graduation
                    </label>
                    <input
                      type="date"
                      name="expectedGraduationDate"
                      value={formData.expectedGraduationDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CGPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="cgpa"
                      value={formData.cgpa}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Guardian Information */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Guardian Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian Phone
                    </label>
                    <input
                      type="tel"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian Relation
                    </label>
                    <select
                      name="guardianRelation"
                      value={formData.guardianRelation}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      {isEditMode ? "Update Student" : "Add Student"}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Download CSV Template
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Use our template to ensure proper formatting
                    </p>
                  </div>
                  <button
                    onClick={downloadCSVTemplate}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download Template
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCSVUpload}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                {csvError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-red-800">{csvError}</p>
                    </div>
                  </div>
                )}

                {csvData.length > 0 && !uploadResults && (
                  <div className="border border-gray-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Preview ({csvData.length} students)
                    </h4>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Email
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Department
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {csvData.slice(0, 10).map((student, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {student.name}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">
                                {student.email}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">
                                {student.department || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          ... and {csvData.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {uploadResults && (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Successfully added {uploadResults.successful} students
                          </p>
                        </div>
                      </div>
                    </div>

                    {uploadResults.failed > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-900 mb-2">
                              Failed to add {uploadResults.failed} students
                            </p>
                            <div className="max-h-32 overflow-y-auto">
                              <ul className="text-xs text-yellow-800 space-y-1">
                                {uploadResults.failedStudents.map((failed, index) => (
                                  <li key={index}>
                                    {failed.name} ({failed.email}): {failed.reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  {uploadResults ? "Close" : "Cancel"}
                </button>
                {csvData.length > 0 && !uploadResults && (
                  <button
                    onClick={handleBulkUpload}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                        Upload {csvData.length} Students
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEditStudentModal;