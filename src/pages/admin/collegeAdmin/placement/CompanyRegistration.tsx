import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Clock,
  X,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import toast from 'react-hot-toast';
import { companyService } from '@/services/companyService';
import type { Company, CompanyFormData } from '@/services/companyService';
import CompanyStatusModal from '@/components/modals/CompanyStatusModal';

interface CompanyRegistrationProps {
  onStatsUpdate?: () => void;
}

const CompanyRegistration: React.FC<CompanyRegistrationProps> = ({ onStatsUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedCompanySize, setSelectedCompanySize] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showCompanyHistoryModal, setShowCompanyHistoryModal] = useState(false);
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCompanyForHistory, setSelectedCompanyForHistory] = useState<Company | null>(null);
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<Company | null>(null);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<Company | null>(null);
  const [selectedCompanyForStatus, setSelectedCompanyForStatus] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [editFormData, setEditFormData] = useState<CompanyFormData>({
    name: "",
    code: "",
    industry: "",
    companySize: "",
    establishedYear: "",
    hqAddress: "",
    hqCity: "",
    hqState: "",
    hqCountry: "India",
    hqPincode: "",
    phone: "",
    email: "",
    website: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    companyDescription: "",
    specialRequirements: "",
  });

  // Form data state
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    code: "",
    industry: "",
    companySize: "",
    establishedYear: "",
    hqAddress: "",
    hqCity: "",
    hqState: "",
    hqCountry: "India",
    hqPincode: "",
    phone: "",
    email: "",
    website: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    companyDescription: "",
    specialRequirements: "",
  });

  // Load companies on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [companies, searchTerm, selectedIndustry, selectedCompanySize, selectedStatus]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedIndustry, selectedCompanySize, selectedStatus]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const companiesData = await companyService.getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...companies];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.name?.toLowerCase().includes(search) ||
        company.code?.toLowerCase().includes(search) ||
        company.industry?.toLowerCase().includes(search) ||
        company.hqCity?.toLowerCase().includes(search)
      );
    }

    // Industry filter
    if (selectedIndustry) {
      filtered = filtered.filter(company => company.industry === selectedIndustry);
    }

    // Company size filter
    if (selectedCompanySize) {
      filtered = filtered.filter(company => company.companySize === selectedCompanySize);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(company => company.accountStatus === selectedStatus);
    }

    setTotalItems(filtered.length);
    setFilteredCompanies(filtered);
  };

  // Get paginated data
  const getPaginatedCompanies = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCompanies.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCompanies = getPaginatedCompanies();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Static data for companies - removed as we're now using Supabase data

  const industryOptions = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Consulting", "Automotive", "Telecommunications", "Energy",
    "Real Estate", "Media & Entertainment", "Transportation", "Agriculture", "Other"
  ];

  const companySizeOptions = [
    "1-10 employees", "11-50 employees", "51-200 employees", 
    "201-500 employees", "501-1000 employees", "1000+ employees"
  ];



  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
    "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
  ];

  // Filter companies based on search and filters - now using loaded companies
  // Filtering is handled by applyFilters() function and filteredCompanies state



  const getClickableStatusBadge = (company: Company) => {
    const status = company.accountStatus || 'pending';
    let badgeClasses = "px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity";
    
    switch (status) {
      case 'active':
        badgeClasses += " bg-green-100 text-green-800 hover:bg-green-200";
        break;
      case 'approved':
        badgeClasses += " bg-blue-100 text-blue-800 hover:bg-blue-200";
        break;
      case 'pending':
        badgeClasses += " bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        break;
      case 'rejected':
        badgeClasses += " bg-red-100 text-red-800 hover:bg-red-200";
        break;
      case 'inactive':
        badgeClasses += " bg-orange-100 text-orange-800 hover:bg-orange-200";
        break;
      case 'suspended':
        badgeClasses += " bg-red-100 text-red-800 hover:bg-red-200";
        break;
      case 'blacklisted':
        badgeClasses += " bg-gray-100 text-gray-800 hover:bg-gray-200";
        break;
      default:
        badgeClasses += " bg-gray-100 text-gray-800 hover:bg-gray-200";
    }

    return (
      <button 
        onClick={() => openStatusModal(company)}
        className={badgeClasses}
        title="Click to change status"
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </button>
    );
  };

  const openStatusModal = (company: Company) => {
    setSelectedCompanyForStatus(company);
    setShowStatusModal(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCompanyForStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await companyService.updateCompanyStatus(selectedCompanyForStatus.id, newStatus);
      toast.success(`Company status updated to ${newStatus}`);
      
      // Reload companies to reflect the change
      loadCompanies();
      
      // Update stats in parent component
      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error updating company status:', error);
      toast.error('Failed to update company status');
      throw error; // Re-throw to let modal handle it
    } finally {
      setIsUpdatingStatus(false);
    }
  };



  const viewCompanyHistory = (company: Company) => {
    setSelectedCompanyForHistory(company);
    setShowCompanyHistoryModal(true);
  };

  const viewCompanyDetails = (company: Company) => {
    setSelectedCompanyForDetails(company);
    setShowCompanyDetailsModal(true);
  };

  const editCompany = (company: Company) => {
    setSelectedCompanyForEdit(company);
    setEditFormData({
      name: company.name,
      code: company.code,
      industry: company.industry || "",
      companySize: company.companySize || "",
      establishedYear: company.establishedYear?.toString() || "",
      hqAddress: company.hqAddress || "",
      hqCity: company.hqCity || "",
      hqState: company.hqState || "",
      hqCountry: company.hqCountry || "India",
      hqPincode: company.hqPincode || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      contactPersonName: company.contactPersonName || "",
      contactPersonDesignation: company.contactPersonDesignation || "",
      contactPersonEmail: company.contactPersonEmail || "",
      contactPersonPhone: company.contactPersonPhone || "",
      companyDescription: company.metadata?.companyDescription || "",
      specialRequirements: company.metadata?.specialRequirements || "",
    });
    setShowEditCompanyModal(true);
  };

  const handleEditInputChange = (field: keyof CompanyFormData, value: string) => {
    setEditFormData((prev: CompanyFormData) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedCompanyForEdit) {
        toast.error("No company selected for editing");
        return;
      }

      // Validate required fields
      if (!editFormData.name.trim()) {
        toast.error("Company name is required");
        return;
      }

      if (!editFormData.code.trim()) {
        toast.error("Company code is required");
        return;
      }

      // Prepare the update data - convert null to undefined for TypeScript compatibility
      const updateData: Partial<CompanyFormData> = {
        name: editFormData.name.trim(),
        code: editFormData.code.trim(),
        industry: editFormData.industry || undefined,
        companySize: editFormData.companySize || undefined,
        establishedYear: editFormData.establishedYear || undefined,
        hqAddress: editFormData.hqAddress || undefined,
        hqCity: editFormData.hqCity || undefined,
        hqState: editFormData.hqState || undefined,
        hqCountry: editFormData.hqCountry || "India",
        hqPincode: editFormData.hqPincode || undefined,
        phone: editFormData.phone || undefined,
        email: editFormData.email || undefined,
        website: editFormData.website || undefined,
        contactPersonName: editFormData.contactPersonName || undefined,
        contactPersonDesignation: editFormData.contactPersonDesignation || undefined,
        contactPersonEmail: editFormData.contactPersonEmail || undefined,
        contactPersonPhone: editFormData.contactPersonPhone || undefined,
        companyDescription: editFormData.companyDescription || undefined,
        specialRequirements: editFormData.specialRequirements || undefined,
      };
      
      await companyService.updateCompany(selectedCompanyForEdit.id, updateData);
      
      toast.success("Company updated successfully!");
      setShowEditCompanyModal(false);
      setSelectedCompanyForEdit(null);
      
      // Reload companies to reflect the changes
      loadCompanies();
      
      // Update stats in parent component
      if (onStatsUpdate) {
        onStatsUpdate();
      }
      
    } catch (error) {
      console.error("Error updating company:", error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error("Company code already exists. Please use a different code.");
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          toast.error("You don't have permission to update this company.");
        } else {
          toast.error(`Update failed: ${error.message}`);
        }
      } else {
        toast.error("Error updating company. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev: CompanyFormData) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Add company to Supabase
      await companyService.addCompany(formData);
      
      // Reset form and close modal
      setFormData({
        name: "",
        code: "",
        industry: "",
        companySize: "",
        establishedYear: "",
        hqAddress: "",
        hqCity: "",
        hqState: "",
        hqCountry: "India",
        hqPincode: "",
        phone: "",
        email: "",
        website: "",
        contactPersonName: "",
        contactPersonDesignation: "",
        contactPersonEmail: "",
        contactPersonPhone: "",
        companyDescription: "",
        specialRequirements: "",
      });
      setShowAddCompanyModal(false);
      
      toast.success("Company added successfully!");
      
      // Reload companies to show the new company
      loadCompanies();
      
      // Update stats in parent component
      if (onStatsUpdate) {
        onStatsUpdate();
      }
      
    } catch (error) {
      console.error("Error adding company:", error);
      toast.error("Error adding company. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddCompanyModal(false);
    setFormData({
      name: "",
      code: "",
      industry: "",
      companySize: "",
      establishedYear: "",
      hqAddress: "",
      hqCity: "",
      hqState: "",
      hqCountry: "India",
      hqPincode: "",
      phone: "",
      email: "",
      website: "",
      contactPersonName: "",
      contactPersonDesignation: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      companyDescription: "",
      specialRequirements: "",
    });
  };

  const clearFilters = () => {
    setSelectedIndustry("");
    setSelectedCompanySize("");
    setSelectedStatus("");
    setShowFilterModal(false);
  };



  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Company Registration</h2>
        <button 
          onClick={() => setShowAddCompanyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>
      
      <p className="text-gray-600 mb-4">Manage company profiles, MoU/JD uploads, and status management.</p>
      
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies by name, code, or industry..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setShowFilterModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Filter className="h-4 w-4" />
          Filter
          {(selectedIndustry || selectedCompanySize || selectedStatus) && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {[selectedIndustry, selectedCompanySize, selectedStatus].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Companies Table */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading companies...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Large screens) */}
          <div className="hidden xl:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCompanies.length > 0 ? (
                    paginatedCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="w-64 px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={company.name}>
                                {company.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate" title={company.code}>
                                {company.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="w-32 px-4 py-4">
                          <div className="text-sm text-gray-900 break-words" title={company.industry || 'N/A'}>
                            {company.industry || 'N/A'}
                          </div>
                        </td>
                        <td className="w-36 px-4 py-4">
                          <div className="text-sm text-gray-900 break-words" title={company.companySize || 'N/A'}>
                            {company.companySize || 'N/A'}
                          </div>
                        </td>
                        <td className="w-40 px-4 py-4">
                          <div className="text-sm text-gray-900 break-words" title={`${company.hqCity || 'N/A'}, ${company.hqState || 'N/A'}`}>
                            {company.hqCity || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 break-words">
                            {company.hqState || 'N/A'}
                          </div>
                        </td>
                        <td className="w-48 px-4 py-4">
                          <div className="text-sm text-gray-900 break-words" title={company.contactPersonName || 'N/A'}>
                            {company.contactPersonName || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 break-words" title={company.contactPersonDesignation || 'N/A'}>
                            {company.contactPersonDesignation || 'N/A'}
                          </div>
                        </td>
                        <td className="w-32 px-4 py-4">
                          {getClickableStatusBadge(company)}
                        </td>
                        <td className="w-28 px-4 py-4 text-sm font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => viewCompanyDetails(company)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => editCompany(company)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Company"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => viewCompanyHistory(company)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                              title="View History"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                          <p className="text-gray-500 mb-4">
                            {searchTerm || selectedIndustry || selectedCompanySize || selectedStatus
                              ? "Try adjusting your search or filters"
                              : "Get started by adding your first company"}
                          </p>
                          {!(searchTerm || selectedIndustry || selectedCompanySize || selectedStatus) && (
                            <button 
                              onClick={() => setShowAddCompanyModal(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              <Plus className="h-4 w-4" />
                              Add First Company
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tablet Horizontal Scroll Table View (Medium to Large screens) */}
          <div className="hidden md:block xl:hidden bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Company
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Industry
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Size
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Location
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Contact Person
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCompanies.length > 0 ? (
                    paginatedCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={company.name}>
                                {company.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate" title={company.code}>
                                {company.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-[100px] truncate" title={company.industry || 'N/A'}>
                            {company.industry || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-[120px] truncate" title={company.companySize || 'N/A'}>
                            {company.companySize || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-[120px] truncate" title={`${company.hqCity || 'N/A'}, ${company.hqState || 'N/A'}`}>
                            {company.hqCity || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[120px] truncate">
                            {company.hqState || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-[140px] truncate" title={company.contactPersonName || 'N/A'}>
                            {company.contactPersonName || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[140px] truncate" title={company.contactPersonDesignation || 'N/A'}>
                            {company.contactPersonDesignation || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {getClickableStatusBadge(company)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => viewCompanyDetails(company)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => editCompany(company)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Company"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => viewCompanyHistory(company)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                              title="View History"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                          <p className="text-gray-500 mb-4">
                            {searchTerm || selectedIndustry || selectedCompanySize || selectedStatus
                              ? "Try adjusting your search or filters"
                              : "Get started by adding your first company"}
                          </p>
                          {!(searchTerm || selectedIndustry || selectedCompanySize || selectedStatus) && (
                            <button 
                              onClick={() => setShowAddCompanyModal(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              <Plus className="h-4 w-4" />
                              Add First Company
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedCompanies.length > 0 ? (
              paginatedCompanies.map((company) => (
                <div key={company.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{company.name}</h3>
                        <p className="text-xs text-gray-500">{company.code}</p>
                      </div>
                    </div>
                    {getClickableStatusBadge(company)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</p>
                      <p className="text-sm text-gray-900 mt-1">{company.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Size</p>
                      <p className="text-sm text-gray-900 mt-1">{company.companySize || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</p>
                      <p className="text-sm text-gray-900 mt-1">{company.hqCity || 'N/A'}, {company.hqState || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</p>
                      <p className="text-sm text-gray-900 mt-1">{company.contactPersonName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{company.contactPersonDesignation || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => viewCompanyDetails(company)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                    <button 
                      onClick={() => editCompany(company)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                      title="Edit Company"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <button 
                      onClick={() => viewCompanyHistory(company)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                      title="View History"
                    >
                      <Clock className="h-3 w-3" />
                      History
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedIndustry || selectedCompanySize || selectedStatus
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first company"}
                </p>
                {!(searchTerm || selectedIndustry || selectedCompanySize || selectedStatus) && (
                  <button 
                    onClick={() => setShowAddCompanyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Company
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Pagination and Results Summary */}
      {!isLoading && totalItems > 0 && (
        <div className="mt-4 space-y-4">
          {/* Show entries selector and results info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} companies
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Active: {filteredCompanies.filter(c => c.accountStatus === 'active').length}</span>
                <span>Pending: {filteredCompanies.filter(c => c.accountStatus === 'pending').length}</span>
                <span>Approved: {filteredCompanies.filter(c => c.accountStatus === 'approved').length}</span>
                <span>Rejected: {filteredCompanies.filter(c => c.accountStatus === 'rejected').length}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Companies</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Industries</option>
                  {industryOptions.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select
                  value={selectedCompanySize}
                  onChange={(e) => setSelectedCompanySize(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sizes</option>
                  {companySizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company History Modal */}
      {showCompanyHistoryModal && selectedCompanyForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Company History</h2>
                  <p className="text-sm text-gray-600">{selectedCompanyForHistory.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompanyHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
                <p className="text-gray-500">Company history feature will be implemented soon.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCompanyHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Company</h2>
                  <p className="text-sm text-gray-600">Register a new company for placement opportunities</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Company Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="Enter company code (e.g., TECH001)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Industry</option>
                      {industryOptions.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Company Size</option>
                      {companySizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                    <input
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      placeholder="e.g., 2010"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Headquarters Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Headquarters Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.hqAddress}
                    onChange={(e) => handleInputChange('hqAddress', e.target.value)}
                    placeholder="Enter complete address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.hqCity}
                      onChange={(e) => handleInputChange('hqCity', e.target.value)}
                      placeholder="Enter city"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={formData.hqState}
                      onChange={(e) => handleInputChange('hqState', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.hqPincode}
                      onChange={(e) => handleInputChange('hqPincode', e.target.value)}
                      placeholder="Enter pincode"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.hqCountry}
                    onChange={(e) => handleInputChange('hqCountry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 80 1234 5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="hr@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Person Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={formData.contactPersonName}
                      onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                      placeholder="Enter contact person name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.contactPersonDesignation}
                      onChange={(e) => handleInputChange('contactPersonDesignation', e.target.value)}
                      placeholder="HR Manager"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Email</label>
                    <input
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                      placeholder="contact@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
                    <input
                      type="tel"
                      value={formData.contactPersonPhone}
                      onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <textarea
                    value={formData.companyDescription}
                    onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                    placeholder="Enter detailed company description..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                    placeholder="Enter any special requirements or preferences..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Company
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Company Details Modal */}
      {showCompanyDetailsModal && selectedCompanyForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCompanyForDetails.name}</h2>
                  <p className="text-sm text-gray-600">{selectedCompanyForDetails.code}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompanyDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Current Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h3>
                <p className="text-sm text-gray-600 mb-3">Account status and approval information</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(selectedCompanyForDetails.accountStatus || 'pending')}`}>
                    {(selectedCompanyForDetails.accountStatus || 'pending').charAt(0).toUpperCase() + (selectedCompanyForDetails.accountStatus || 'pending').slice(1)}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(selectedCompanyForDetails.approvalStatus || 'pending')}`}>
                    {(selectedCompanyForDetails.approvalStatus || 'pending').charAt(0).toUpperCase() + (selectedCompanyForDetails.approvalStatus || 'pending').slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Industry</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Size</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.companySize || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Established Year</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.establishedYear || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      {selectedCompanyForDetails.website ? (
                        <a href={selectedCompanyForDetails.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                          {selectedCompanyForDetails.website}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-900">N/A</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Location & Contact</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Headquarters</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.hqCity || 'N/A'}, {selectedCompanyForDetails.hqState || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Person</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedCompanyForDetails.contactPersonName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <p className="text-sm text-gray-900">{selectedCompanyForDetails.contactPersonDesignation || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedCompanyForDetails.metadata?.companyDescription || 'No description available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditCompanyModal && selectedCompanyForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Edit className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Company</h2>
                  <p className="text-sm text-gray-600">Update company information for {selectedCompanyForEdit.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditCompanyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Company Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => handleEditInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.code}
                      onChange={(e) => handleEditInputChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      value={editFormData.industry}
                      onChange={(e) => handleEditInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Industry</option>
                      {industryOptions.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <select
                      value={editFormData.companySize}
                      onChange={(e) => handleEditInputChange('companySize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Company Size</option>
                      {companySizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                    <input
                      type="number"
                      value={editFormData.establishedYear}
                      onChange={(e) => handleEditInputChange('establishedYear', e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Headquarters Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Headquarters Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={editFormData.hqAddress}
                    onChange={(e) => handleEditInputChange('hqAddress', e.target.value)}
                    placeholder="Enter complete address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editFormData.hqCity}
                      onChange={(e) => handleEditInputChange('hqCity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={editFormData.hqState}
                      onChange={(e) => handleEditInputChange('hqState', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editFormData.hqPincode}
                      onChange={(e) => handleEditInputChange('hqPincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editFormData.hqCountry}
                    onChange={(e) => handleEditInputChange('hqCountry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={editFormData.website}
                      onChange={(e) => handleEditInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Person Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={editFormData.contactPersonName}
                      onChange={(e) => handleEditInputChange('contactPersonName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editFormData.contactPersonDesignation}
                      onChange={(e) => handleEditInputChange('contactPersonDesignation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Email</label>
                    <input
                      type="email"
                      value={editFormData.contactPersonEmail}
                      onChange={(e) => handleEditInputChange('contactPersonEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
                    <input
                      type="tel"
                      value={editFormData.contactPersonPhone}
                      onChange={(e) => handleEditInputChange('contactPersonPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <textarea
                    value={editFormData.companyDescription}
                    onChange={(e) => handleEditInputChange('companyDescription', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <textarea
                    value={editFormData.specialRequirements}
                    onChange={(e) => handleEditInputChange('specialRequirements', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditCompanyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Update Company
                    </>
                  )}  </button> </div> </form>
          </div>
        </div>
      )}

      {/* Company Status Modal */}
      <CompanyStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={selectedCompanyForStatus?.accountStatus || 'pending'}
        companyName={selectedCompanyForStatus?.name || ''}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdatingStatus}
      />

    </div>
  );
};

export default CompanyRegistration;