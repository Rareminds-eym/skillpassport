import { useState, useEffect, useCallback } from 'react';
import {
  expenditureService,
  ExpenditureFilters,
  StudentFeeLedgerDetailed,
  ExpenditureSummary,
  DepartmentExpenditure,
  ProgramExpenditure,
} from '../services/expenditureService';
import toast from 'react-hot-toast';

export const useExpenditureReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [studentLedgerData, setStudentLedgerData] = useState<StudentFeeLedgerDetailed[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<ExpenditureSummary | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentExpenditure[]>([]);
  const [programData, setProgramData] = useState<ProgramExpenditure[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    academicYears: [] as string[],
    semesters: [] as string[],
    paymentStatuses: [] as string[],
    departments: [] as string[],
    programs: [] as string[],
  });

  // Filter states
  const [filters, setFilters] = useState<ExpenditureFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Load student ledger data
  const loadStudentLedger = useCallback(
    async (newFilters?: ExpenditureFilters, page?: number) => {
      try {
        setLoading(true);
        setError(null);

        const currentFilters = newFilters || filters;
        const currentPage = page || 1;

        const { data, count } = await expenditureService.getStudentFeeLedger({
          ...currentFilters,
          page: currentPage,
          limit: pageSize,
        });

        setStudentLedgerData(data);
        setTotalCount(count || 0);
        setCurrentPage(currentPage);

        if (newFilters) {
          setFilters(newFilters);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load student ledger data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [filters, pageSize]
  );

  // Load summary data
  const loadSummary = useCallback(async () => {
    try {
      const summaryData = await expenditureService.getExpenditureSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading summary:', err);
      toast.error('Failed to load expenditure summary');
    }
  }, []);

  // Load department data
  const loadDepartmentData = useCallback(async () => {
    try {
      const data = await expenditureService.getDepartmentExpenditure();
      setDepartmentData(data);
    } catch (err) {
      console.error('Error loading department data:', err);
      toast.error('Failed to load department expenditure data');
    }
  }, []);

  //load program data
  const loadProgramData = useCallback(async () => {
    try {
      const data = await expenditureService.getProgramExpenditure();
      setProgramData(data);
    } catch (err) {
      console.error('Error loading Program Expenditure data:', err);
      toast.error('Failed to load Program expenditure data');
    }
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await expenditureService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(
    async (exportFilters?: ExpenditureFilters) => {
      try {
        const loadingToast = toast.loading('Preparing export...');

        const csvContent = await expenditureService.exportToCSV(exportFilters || filters);

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `expenditure_report_${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.dismiss(loadingToast);
        toast.success('Export completed successfully!');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
        toast.error(errorMessage);
      }
    },
    [filters]
  );

  // Apply filters
  const applyFilters = useCallback(
    (newFilters: ExpenditureFilters) => {
      setCurrentPage(1);
      loadStudentLedger(newFilters, 1);
    },
    [loadStudentLedger]
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    const emptyFilters: ExpenditureFilters = {};
    setFilters(emptyFilters);
    setCurrentPage(1);
    loadStudentLedger(emptyFilters, 1);
  }, [loadStudentLedger]);

  // Change page
  const changePage = useCallback(
    (page: number) => {
      loadStudentLedger(filters, page);
    },
    [loadStudentLedger, filters]
  );

  // Change page size
  const changePageSize = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setCurrentPage(1);
      loadStudentLedger(filters, 1);
    },
    [loadStudentLedger, filters]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadStudentLedger(),
      loadSummary(),
      loadDepartmentData(),
      loadProgramData(),
      loadFilterOptions(),
    ]);
  }, [loadStudentLedger, loadSummary, loadDepartmentData, loadProgramData, loadFilterOptions]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, []);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return {
    // Data
    studentLedgerData,
    summary,
    departmentData,
    programData,
    filterOptions,

    // State
    loading,
    error,
    filters,

    // Pagination
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    startIndex,
    endIndex,

    // Actions
    loadStudentLedger,
    applyFilters,
    clearFilters,
    changePage,
    changePageSize,
    exportToCSV,
    refreshData,

    // Individual loaders
    loadSummary,
    loadDepartmentData,
    loadProgramData,
    loadFilterOptions,
  };
};
