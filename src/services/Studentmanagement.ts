import { supabase } from "../lib/supabaseClient";

export async function addStudentManually(studentData) {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-student', {
      body: {
        action: 'create_single',
        studentData: studentData
      }
    });

    if (error) {
      console.error("Edge Function error:", error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error("Error calling Edge Function:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Add multiple students from CSV
 * @param {Array} studentsArray - Array of student objects from CSV
 * @returns {Promise<{success: boolean, data?: Object, errors?: Array}>}
 */
export async function addStudentsBulk(studentsArray) {
    try {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('create-student', {
            body: {
                action: 'create_bulk',
                studentsArray: studentsArray
            }
        });

        if (error) {
            console.error("Edge Function error:", error);
            return { success: false, error: error.message };
        }

        return data;
    } catch (err) {
        console.error("Error calling Edge Function:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Update student information
 * @param {string} studentId - Student ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updateStudent(studentId, updates) {
    try {
        // Helper functions
        const toNullIfEmpty = (value) => (value === "" || value === undefined || value === null) ? null : value;
        const toNumberOrNull = (value) => {
            if (value === "" || value === undefined || value === null) return null;
            const num = Number(value);
            return isNaN(num) ? null : num;
        };

        // Map the form field names to database column names
        const dbUpdates = {
            name: toNullIfEmpty(updates.name),
            contactNumber: toNullIfEmpty(updates.phone),
            alternate_number: toNullIfEmpty(updates.alternatePhone),
            dateOfBirth: toNullIfEmpty(updates.dateOfBirth),
            age: toNumberOrNull(updates.age),
            gender: toNullIfEmpty(updates.gender),
            bloodGroup: toNullIfEmpty(updates.bloodGroup),
            address: toNullIfEmpty(updates.address),
            city: toNullIfEmpty(updates.city),
            state: toNullIfEmpty(updates.state),
            country: updates.country || "India",
            pincode: toNullIfEmpty(updates.pincode),
            university: toNullIfEmpty(updates.university),
            college_school_name: toNullIfEmpty(updates.college),
            branch_field: toNullIfEmpty(updates.department),
            registration_number: toNullIfEmpty(updates.registrationNumber),
            enrollmentNumber: toNullIfEmpty(updates.enrollmentNumber),
            enrollmentDate: toNullIfEmpty(updates.enrollmentDate),
            expectedGraduationDate: toNullIfEmpty(updates.expectedGraduationDate),
            currentCgpa: toNumberOrNull(updates.cgpa),
            guardianName: toNullIfEmpty(updates.guardianName),
            guardianPhone: toNullIfEmpty(updates.guardianPhone),
            guardianEmail: toNullIfEmpty(updates.guardianEmail),
            guardianRelation: toNullIfEmpty(updates.guardianRelation),
            updatedAt: new Date().toISOString(),
        };

        // Remove undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });

        const { data, error } = await supabase
            .from("students")
            .update(dbUpdates)
            .eq("id", studentId)
            .select()
            .single();

        if (error) {
            console.error("Error updating student:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error updating student:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Soft delete a student (set approval_status to 'deleted')
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function softDeleteStudent(studentId) {
    try {
        const { data, error } = await supabase
            .from("students")
            .update({
                approval_status: "deleted",
                updatedAt: new Date().toISOString(),
            })
            .eq("id", studentId)
            .select()
            .single();

        if (error) {
            console.error("Error deleting student:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error deleting student:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Restore a soft-deleted student
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function restoreStudent(studentId) {
    try {
        const { data, error } = await supabase
            .from("students")
            .update({
                approval_status: "pending",
                updatedAt: new Date().toISOString(),
            })
            .eq("id", studentId)
            .select()
            .single();

        if (error) {
            console.error("Error restoring student:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error restoring student:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Get CSV template headers
 * @returns {Array<string>} - Array of CSV headers
 */
export function getCSVTemplate() {
    return [
        "name",
        "email",
        "phone",
        "alternatePhone",
        "dateOfBirth",
        "age",
        "gender",
        "bloodGroup",
        "address",
        "city",
        "state",
        "country",
        "pincode",
        "university",
        "college",
        "department",
        "registrationNumber",
        "enrollmentNumber",
        "enrollmentDate",
        "expectedGraduationDate",
        "cgpa",
        "guardianName",
        "guardianPhone",
        "guardianEmail",
        "guardianRelation",
    ];
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate() {
    const headers = getCSVTemplate();
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_upload_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}