/**
 * Admin Feature - Status Helper Utilities
 */

/**
 * Get status configuration for attendance status
 */
export const getStatusConfig = (status: string) => {
  const configs = {
    present: {
      color: "text-green-600 bg-green-50",
      label: "Present",
    },
    absent: {
      color: "text-red-600 bg-red-50",
      label: "Absent",
    },
    late: {
      color: "text-yellow-600 bg-yellow-50",
      label: "Late",
    },
    excused: {
      color: "text-blue-600 bg-blue-50",
      label: "Excused",
    },
  };

  return configs[status as keyof typeof configs] || {
    color: "text-gray-600 bg-gray-50",
    label: status,
  };
};
