import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  code: string;
  industry: string;
  companySize: string;
  hqCity: string;
  hqState: string;
  phone: string;
  email: string;
  website: string;
  establishedYear: number;
  contactPersonName: string;
  contactPersonDesignation: string;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'blacklisted';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  eligibilityTemplate: string;
  mouDocument?: string;
  jdDocument?: string;
  companyDescription: string;
  specialRequirements: string;
  lastUpdated: string;
  updatedBy: string;
  hqAddress?: string;
  hqCountry?: string;
  hqPincode?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  history?: CompanyHistoryEntry[];
}

interface CompanyHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
}

interface CompanyFormData {
  name: string;
  code: string;
  industry: string;
  companySize: string;
  establishedYear: string;
  hqAddress: string;
  hqCity: string;
  hqState: string;
  hqCountry: string;
  hqPincode: string;
  phone: string;
  email: string;
  website: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  eligibilityTemplate: string;
  companyDescription: string;
  specialRequirements: string;
  mouDocument: File | null;
  jdDocument: File | null;
}

const CompanyRegistration: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedCompanySize, setSelectedCompanySize] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showCompanyHistoryModal, setShowCompanyHistoryModal] = useState(false);
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [selectedCompanyForHistory, setSelectedCompanyForHistory] = useState<Company | null>(null);
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<Company | null>(null);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<Company | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    eligibilityTemplate: "",
    companyDescription: "",
    specialRequirements: "",
    mouDocument: null,
    jdDocument: null,
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
    eligibilityTemplate: "",
    companyDescription: "",
    specialRequirements: "",
    mouDocument: null,
    jdDocument: null,
  });

  // Static data for companies
  const companiesData: Company[] = [
    {
      id: "1",
      name: "TechCorp Solutions",
      code: "TECH001",
      industry: "Technology",
      companySize: "501-1000 employees",
      hqCity: "Bangalore",
      hqState: "Karnataka",
      phone: "+91 80 1234 5678",
      email: "hr@techcorp.com",
      website: "https://www.techcorp.com",
      establishedYear: 2010,
      contactPersonName: "Priya Sharma",
      contactPersonDesignation: "HR Manager",
      accountStatus: "active",
      approvalStatus: "approved",
      createdAt: "2024-01-15",
      eligibilityTemplate: "tech_premium",
      mouDocument: "techcorp_mou_2024.pdf",
      jdDocument: "techcorp_jd_software_engineer.pdf",
      companyDescription: "Leading technology solutions provider specializing in enterprise software development and digital transformation services.",
      specialRequirements: "Strong programming skills, experience with modern frameworks, good communication skills",
      lastUpdated: "2024-03-10",
      updatedBy: "Admin User",
      history: [
        {
          id: "h1",
          action: "Company Approved",
          performedBy: "Admin User",
          timestamp: "2024-01-20T10:30:00Z",
          details: "Company registration approved after document verification",
          previousStatus: "pending",
          newStatus: "approved"
        },
        {
          id: "h2",
          action: "Status Activated",
          performedBy: "Admin User",
          timestamp: "2024-01-22T14:15:00Z",
          details: "Company status activated for placement activities",
          previousStatus: "approved",
          newStatus: "active"
        }
      ]
    },
    {
      id: "2",
      name: "HealthPlus Medical",
      code: "HLTH002",
      industry: "Healthcare",
      companySize: "201-500 employees",
      hqCity: "Mumbai",
      hqState: "Maharashtra",
      phone: "+91 22 9876 5432",
      email: "careers@healthplus.com",
      website: "https://www.healthplus.com",
      establishedYear: 2015,
      contactPersonName: "Dr. Rajesh Kumar",
      contactPersonDesignation: "Recruitment Head",
      accountStatus: "active",
      approvalStatus: "approved",
      createdAt: "2024-02-10",
      eligibilityTemplate: "tech_standard",
      mouDocument: "healthplus_mou_2024.pdf",
      jdDocument: "healthplus_jd_data_analyst.pdf",
      companyDescription: "Healthcare technology company focused on improving patient care through data analytics and digital health solutions.",
      specialRequirements: "Healthcare domain knowledge preferred, analytical skills, attention to detail",
      lastUpdated: "2024-02-15",
      updatedBy: "HR Admin",
      history: [
        {
          id: "h3",
          action: "Company Registered",
          performedBy: "System",
          timestamp: "2024-02-10T09:00:00Z",
          details: "Company registration submitted",
          newStatus: "pending"
        },
        {
          id: "h4",
          action: "Documents Verified",
          performedBy: "Verification Team",
          timestamp: "2024-02-12T11:30:00Z",
          details: "MoU and JD documents verified successfully"
        }
      ]
    },
    {
      id: "3",
      name: "FinanceFirst Bank",
      code: "FIN003",
      industry: "Finance",
      companySize: "1000+ employees",
      hqCity: "Delhi",
      hqState: "Delhi",
      phone: "+91 11 5555 7777",
      email: "recruitment@financefirst.com",
      website: "https://www.financefirst.com",
      establishedYear: 2005,
      contactPersonName: "Anita Verma",
      contactPersonDesignation: "Senior HR Executive",
      accountStatus: "pending",
      approvalStatus: "pending",
      createdAt: "2024-03-05",
      eligibilityTemplate: "finance_standard",
      mouDocument: "financefirst_mou_draft.pdf",
      jdDocument: "financefirst_jd_analyst.pdf",
      companyDescription: "Leading financial services provider offering comprehensive banking and investment solutions across India.",
      specialRequirements: "Strong analytical skills, financial modeling experience, CFA certification preferred",
      lastUpdated: "2024-03-05",
      updatedBy: "System",
      history: [
        {
          id: "h5",
          action: "Company Registered",
          performedBy: "System",
          timestamp: "2024-03-05T16:45:00Z",
          details: "New company registration submitted for review",
          newStatus: "pending"
        }
      ]
    }
  ];

  const industryOptions = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Consulting", "Automotive", "Telecommunications", "Energy",
    "Real Estate", "Media & Entertainment", "Transportation", "Agriculture", "Other"
  ];

  const companySizeOptions = [
    "1-10 employees", "11-50 employees", "51-200 employees", 
    "201-500 employees", "501-1000 employees", "1000+ employees"
  ];

  const eligibilityTemplateOptions = [
    "tech_premium",
    "tech_standard", 
    "finance_standard",
    "healthcare_standard",
    "manufacturing_standard",
    "retail_standard",
    "consulting_standard",
    "custom_template"
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

  // Filter companies based on search and filters
  const filteredCompanies = companiesData.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
    const matchesSize = !selectedCompanySize || company.companySize === selectedCompanySize;
    const matchesStatus = !selectedStatus || company.accountStatus === selectedStatus;
    
    return matchesSearch && matchesIndustry && matchesSize && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
      case 'blacklisted':
        return <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-full">Blacklisted</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const getClickableStatusBadge = (company: Company) => {
    const status = company.accountStatus;
    let badgeClasses = "px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1";
    
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
        badgeClasses += " bg-gray-100 text-gray-800 hover:bg-gray-200";
        break;
      case 'blacklisted':
        badgeClasses += " bg-black text-white hover:bg-gray-800";
        break;
      default:
        badgeClasses += " bg-gray-100 text-gray-800 hover:bg-gray-200";
    }

    return (
      <div className="relative">
        <button 
          onClick={() => toggleDropdown(company.id)}
          className={badgeClasses}
          title="Click to change status"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
          <ChevronDown className="h-3 w-3" />
        </button>
        
        {openDropdownId === company.id && (
          <div className="absolute left-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Change Status To:
            </div>
            {getAvailableStatusOptions(company.accountStatus).map((statusOption, index) => {
              const StatusIcon = statusOption.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleActionSelect(company, statusOption.action)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-start gap-2 ${statusOption.color} transition-colors`}
                >
                  <StatusIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{statusOption.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{statusOption.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { 
        status: 'approved', 
        action: 'approve', 
        icon: CheckCircle, 
        color: 'text-blue-600', 
        title: 'Set as Approved',
        description: 'Company is approved but not yet active'
      },
      { 
        status: 'active', 
        action: 'activate', 
        icon: CheckCircle, 
        color: 'text-green-600', 
        title: 'Set as Active',
        description: 'Company can post jobs and recruit'
      },
      { 
        status: 'inactive', 
        action: 'deactivate', 
        icon: Clock, 
        color: 'text-orange-600', 
        title: 'Set as Inactive',
        description: 'Company cannot post new jobs'
      },
      { 
        status: 'blacklisted', 
        action: 'blacklist', 
        icon: X, 
        color: 'text-red-600', 
        title: 'Set as Blacklisted',
        description: 'Company is permanently restricted'
      },
      { 
        status: 'rejected', 
        action: 'reject', 
        icon: X, 
        color: 'text-red-500', 
        title: 'Set as Rejected',
        description: 'Company registration is rejected'
      }
    ];

    return allStatuses.filter(statusOption => statusOption.status !== currentStatus);
  };

  const toggleDropdown = (companyId: string) => {
    setOpenDropdownId(openDropdownId === companyId ? null : companyId);
  };

  const handleActionSelect = (company: Company, action: string) => {
    setOpenDropdownId(null);
    toast.success(`Company status changed to ${action}`);
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
      industry: company.industry,
      companySize: company.companySize,
      establishedYear: company.establishedYear.toString(),
      hqAddress: company.hqAddress || "",
      hqCity: company.hqCity,
      hqState: company.hqState,
      hqCountry: company.hqCountry || "India",
      hqPincode: company.hqPincode || "",
      phone: company.phone,
      email: company.email,
      website: company.website,
      contactPersonName: company.contactPersonName,
      contactPersonDesignation: company.contactPersonDesignation,
      contactPersonEmail: company.contactPersonEmail || "",
      contactPersonPhone: company.contactPersonPhone || "",
      eligibilityTemplate: company.eligibilityTemplate,
      companyDescription: company.companyDescription,
      specialRequirements: company.specialRequirements,
      mouDocument: null,
      jdDocument: null,
    });
    setShowEditCompanyModal(true);
  };

  const handleEditInputChange = (field: keyof CompanyFormData, value: string | File | null) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditFileChange = (field: 'mouDocument' | 'jdDocument', file: File | null) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Updating company:", selectedCompanyForEdit?.id, editFormData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Company updated successfully!");
      setShowEditCompanyModal(false);
      setSelectedCompanyForEdit(null);
      
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Error updating company. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

  const handleInputChange = (field: keyof CompanyFormData, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: 'mouDocument' | 'jdDocument', file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would typically make an API call to save the company
      console.log("Company data to submit:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        eligibilityTemplate: "",
        companyDescription: "",
        specialRequirements: "",
        mouDocument: null,
        jdDocument: null,
      });
      setShowAddCompanyModal(false);
      
      toast.success("Company added successfully!");
      
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
      eligibilityTemplate: "",
      companyDescription: "",
      specialRequirements: "",
      mouDocument: null,
      jdDocument: null,
    });
  };

  const clearFilters = () => {
    setSelectedIndustry("");
    setSelectedCompanySize("");
    setSelectedStatus("");
    setShowFilterModal(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.industry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.companySize}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.hqCity}</div>
                      <div className="text-sm text-gray-500">{company.hqState}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.contactPersonName}</div>
                      <div className="text-sm text-gray-500">{company.contactPersonDesignation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getClickableStatusBadge(company)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => viewCompanyDetails(company)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => editCompany(company)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit Company"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => viewCompanyHistory(company)}
                          className="text-purple-600 hover:text-purple-900 p-1"
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

      {/* Results Summary */}
      {filteredCompanies.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredCompanies.length} of {companiesData.length} companies
          </div>
          <div className="flex items-center gap-4">
            <span>Active: {filteredCompanies.filter(c => c.accountStatus === 'active').length}</span>
            <span>Pending: {filteredCompanies.filter(c => c.accountStatus === 'pending').length}</span>
            <span>Rejected: {filteredCompanies.filter(c => c.accountStatus === 'rejected').length}</span>
          </div>
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
                  <option value="active">Active</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="inactive">Inactive</option>
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
              {selectedCompanyForHistory.history && selectedCompanyForHistory.history.length > 0 ? (
                <div className="space-y-4">
                  {selectedCompanyForHistory.history.map((entry, index) => (
                    <div key={entry.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-900">{entry.action}</h3>
                          <div className="text-right">
                            <div className="text-sm text-gray-900">{formatDate(entry.timestamp)}</div>
                            <div className="text-sm text-gray-500">{formatTime(entry.timestamp)}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
                        
                        {entry.previousStatus && entry.newStatus && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(entry.previousStatus)}`}>
                              {entry.previousStatus.charAt(0).toUpperCase() + entry.previousStatus.slice(1)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(entry.newStatus)}`}>
                              {entry.newStatus.charAt(0).toUpperCase() + entry.newStatus.slice(1)}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Performed by {entry.performedBy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
                  <p className="text-gray-500">No historical records found for this company.</p>
                </div>
              )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Template</label>
                  <select
                    value={formData.eligibilityTemplate}
                    onChange={(e) => handleInputChange('eligibilityTemplate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Template</option>
                    {eligibilityTemplateOptions.map(template => (
                      <option key={template} value={template}>
                        {template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MoU Document</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('mouDocument', e.target.files?.[0] || null)}
                        className="hidden"
                        id="mouDocument"
                      />
                      <label
                        htmlFor="mouDocument"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="text-gray-500">
                          {formData.mouDocument ? formData.mouDocument.name : "Choose File"}
                        </span>
                        <span className="text-sm text-gray-400">No file chosen</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload MoU document (PDF, DOC, DOCX)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JD Document</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('jdDocument', e.target.files?.[0] || null)}
                        className="hidden"
                        id="jdDocument"
                      />
                      <label
                        htmlFor="jdDocument"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="text-gray-500">
                          {formData.jdDocument ? formData.jdDocument.name : "Choose File"}
                        </span>
                        <span className="text-sm text-gray-400">No file chosen</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload Job Description template (PDF, DOC, DOCX)</p>
                  </div>
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
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(selectedCompanyForDetails.accountStatus)}`}>
                    {selectedCompanyForDetails.accountStatus.charAt(0).toUpperCase() + selectedCompanyForDetails.accountStatus.slice(1)}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(selectedCompanyForDetails.approvalStatus)}`}>
                    {selectedCompanyForDetails.approvalStatus.charAt(0).toUpperCase() + selectedCompanyForDetails.approvalStatus.slice(1)}
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
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.industry}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Size</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.companySize}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Established Year</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.establishedYear}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <a href={selectedCompanyForDetails.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                        {selectedCompanyForDetails.website}
                      </a>
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
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.hqCity}, {selectedCompanyForDetails.hqState}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedCompanyForDetails.email}</p>
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
                    <p className="text-sm text-gray-900">{selectedCompanyForDetails.contactPersonName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <p className="text-sm text-gray-900">{selectedCompanyForDetails.contactPersonDesignation}</p>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedCompanyForDetails.companyDescription}</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Template</label>
                  <select
                    value={editFormData.eligibilityTemplate}
                    onChange={(e) => handleEditInputChange('eligibilityTemplate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Template</option>
                    {eligibilityTemplateOptions.map(template => (
                      <option key={template} value={template}>
                        {template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
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

    </div>
  );
};

export default CompanyRegistration;