import React, { useState, useEffect } from "react";
import {
  BellIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface Circular {
  id: number;
  title: string;
  audience: string;
  audienceType: "all_universities" | "specific_colleges" | "all_colleges" | "departments" | "students" | "faculty";
  targetColleges?: string[];
  priority: "normal" | "high" | "urgent";
  publishDate: string;
  expiryDate: string;
  status: "published" | "draft" | "scheduled" | "expired";
  messageBody: string;
  attachments?: string[];
  createdBy: string;
  readBy?: number[];
  category: "academic" | "administrative" | "examination" | "finance" | "general";
  isSystemWide: boolean;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "urgent";
  timestamp: string;
  isRead: boolean;
  sender: string;
  category: "system" | "college_update" | "examination" | "finance" | "academic";
  collegeId?: string;
  collegeName?: string;
}

interface Analytics {
  totalCirculars: number;
  publishedCirculars: number;
  draftCirculars: number;
  expiredCirculars: number;
  totalReach: number;
  readRate: number;
  collegesReached: number;
}

const CircularsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"circulars" | "notifications" | "analytics">("circulars");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "scheduled" | "expired">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "normal" | "high" | "urgent">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "academic" | "administrative" | "examination" | "finance" | "general">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for colleges
  const [availableColleges] = useState([
    { id: "1", name: "Government Engineering College", district: "Mumbai" },
    { id: "2", name: "Arts & Science College", district: "Pune" },
    { id: "3", name: "Medical College", district: "Nagpur" },
    { id: "4", name: "Commerce College", district: "Nashik" },
    { id: "5", name: "Technology Institute", district: "Aurangabad" },
  ]);

  const [circulars, setCirculars] = useState<Circular[]>([
    {
      id: 1,
      title: "University-wide Examination Schedule 2025",
      audience: "All Affiliated Colleges",
      audienceType: "all_colleges",
      priority: "high",
      publishDate: "2025-01-15",
      expiryDate: "2025-03-31",
      status: "published",
      messageBody: "The examination schedule for the academic year 2025 has been finalized. All colleges must adhere to the prescribed dates and guidelines.",
      attachments: ["exam-schedule-2025.pdf", "guidelines.pdf"],
      createdBy: "University Registrar",
      readBy: [1, 2, 3, 4, 5],
      category: "examination",
      isSystemWide: true,
      approvalRequired: true,
      approvedBy: "Vice Chancellor",
      approvedAt: "2025-01-14T10:00:00Z",
    },
    {
      id: 2,
      title: "New Academic Policy Implementation",
      audience: "Engineering Colleges",
      audienceType: "specific_colleges",
      targetColleges: ["1", "5"],
      priority: "urgent",
      publishDate: "2025-01-20",
      expiryDate: "2025-02-28",
      status: "draft",
      messageBody: "Implementation guidelines for the new academic policy framework effective from next semester.",
      attachments: ["policy-document.pdf"],
      createdBy: "Academic Council",
      category: "academic",
      isSystemWide: false,
      approvalRequired: true,
    },
    {
      id: 3,
      title: "Fee Structure Update Notice",
      audience: "All Colleges - Finance Departments",
      audienceType: "departments",
      priority: "normal",
      publishDate: "2025-01-10",
      expiryDate: "2025-01-31",
      status: "published",
      messageBody: "Updated fee structure for the upcoming academic session. Please ensure compliance with the new rates.",
      createdBy: "Finance Controller",
      category: "finance",
      isSystemWide: true,
      approvalRequired: false,
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "College Registration Pending",
      message: "Government Engineering College has submitted documents for affiliation renewal",
      type: "info",
      timestamp: "2025-01-11T14:30:00Z",
      isRead: false,
      sender: "Registration Department",
      category: "college_update",
      collegeId: "1",
      collegeName: "Government Engineering College",
    },
    {
      id: 2,
      title: "Examination Results Delayed",
      message: "Results for semester 3 examinations are delayed due to technical issues",
      type: "warning",
      timestamp: "2025-01-11T12:15:00Z",
      isRead: true,
      sender: "Examination Controller",
      category: "examination",
    },
    {
      id: 3,
      title: "System Maintenance Scheduled",
      message: "University portal will be under maintenance on January 15th from 2 AM to 6 AM",
      type: "urgent",
      timestamp: "2025-01-11T09:00:00Z",
      isRead: false,
      sender: "IT Department",
      category: "system",
    },
  ]);

  const [analytics] = useState<Analytics>({
    totalCirculars: 15,
    publishedCirculars: 12,
    draftCirculars: 2,
    expiredCirculars: 1,
    totalReach: 2500,
    readRate: 78.5,
    collegesReached: 25,
  });

  const [formData, setFormData] = useState<{
    title: string;
    audienceType: "all_universities" | "specific_colleges" | "all_colleges" | "departments" | "students" | "faculty";
    targetColleges: string[];
    priority: "normal" | "high" | "urgent";
    messageBody: string;
    publishDate: string;
    expiryDate: string;
    attachments: File[];
    category: "academic" | "administrative" | "examination" | "finance" | "general";
    isSystemWide: boolean;
    approvalRequired: boolean;
  }>({
    title: "",
    audienceType: "all_colleges",
    targetColleges: [],
    priority: "normal",
    messageBody: "",
    publishDate: "",
    expiryDate: "",
    attachments: [],
    category: "general",
    isSystemWide: false,
    approvalRequired: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch new notifications from the server
      console.log("Checking for new notifications...");
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (formData.audienceType === "specific_colleges" && formData.targetColleges.length === 0) {
      errors.targetColleges = "Please select at least one college";
    }
    
    if (!formData.publishDate) {
      errors.publishDate = "Publish date is required";
    }
    
    if (!formData.expiryDate) {
      errors.expiryDate = "Expiry date is required";
    }
    
    if (formData.publishDate && formData.expiryDate && new Date(formData.expiryDate) < new Date(formData.publishDate)) {
      errors.expiryDate = "Expiry date must be after publish date";
    }

    if (!formData.messageBody.trim()) {
      errors.messageBody = "Message body is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCircular = async () => {
    if (validateForm()) {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCircular: Circular = {
        id: Date.now(),
        title: formData.title,
        audience: formData.audienceType === "all_colleges" 
          ? "All Affiliated Colleges" 
          : formData.audienceType === "specific_colleges"
          ? `Selected Colleges (${formData.targetColleges.length})`
          : formData.audienceType.replace("_", " ").toUpperCase(),
        audienceType: formData.audienceType,
        targetColleges: formData.targetColleges,
        priority: formData.priority,
        publishDate: formData.publishDate,
        expiryDate: formData.expiryDate,
        status: "draft",
        messageBody: formData.messageBody,
        attachments: formData.attachments.map(file => file.name),
        createdBy: "University Admin",
        category: formData.category,
        isSystemWide: formData.isSystemWide,
        approvalRequired: formData.approvalRequired,
      };
      
      if (selectedCircular) {
        setCirculars(circulars.map(circular => 
          circular.id === selectedCircular.id ? { ...newCircular, id: selectedCircular.id } : circular
        ));
      } else {
        setCirculars([...circulars, newCircular]);
      }
      
      setShowCreateModal(false);
      setSelectedCircular(null);
      resetForm();
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      audienceType: "all_colleges",
      targetColleges: [],
      priority: "normal",
      messageBody: "",
      publishDate: "",
      expiryDate: "",
      attachments: [],
      category: "general",
      isSystemWide: false,
      approvalRequired: false,
    });
    setFormErrors({});
  };

  const handlePublishToggle = async (id: number) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCirculars(circulars.map(circular => {
      if (circular.id === id) {
        const newStatus = circular.status === "published" ? "draft" : "published";
        return { 
          ...circular, 
          status: newStatus,
          ...(newStatus === "published" && {
            approvedBy: "University Admin",
            approvedAt: new Date().toISOString()
          })
        };
      }
      return circular;
    }));
    
    setIsLoading(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this circular?")) {
      setCirculars(circulars.filter(circular => circular.id !== id));
    }
  };

  const filteredCirculars = circulars.filter(circular => {
    const matchesSearch = circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         circular.audience.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         circular.messageBody.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || circular.status === filterStatus;
    const matchesPriority = filterPriority === "all" || circular.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || circular.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  const handleDownloadAttachment = (attachmentName: string) => {
    // Simulate file download
    const link = document.createElement('a');
    link.href = '#';
    link.download = attachmentName;
    link.click();
    console.log(`Downloading ${attachmentName}...`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-700 border-green-200";
      case "scheduled": return "bg-blue-100 text-blue-700 border-blue-200";
      case "expired": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic": return "bg-blue-50 text-blue-700";
      case "examination": return "bg-purple-50 text-purple-700";
      case "finance": return "bg-green-50 text-green-700";
      case "administrative": return "bg-orange-50 text-orange-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              University Communications
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage circulars, notices, and notifications across all affiliated institutions
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{analytics.collegesReached}</div>
              <div className="text-xs text-gray-500">Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalReach}</div>
              <div className="text-xs text-gray-500">Total Reach</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.readRate}%</div>
              <div className="text-xs text-gray-500">Read Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("circulars")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "circulars"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Circulars & Notices
                <span className="bg-indigo-100 text-indigo-600 text-xs rounded-full px-2 py-1">
                  {circulars.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notifications"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5" />
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Analytics
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "circulars" ? (
            <>
              {/* Circulars Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Circulars Management</h2>
                  <p className="text-sm text-gray-500">Create and manage university-wide communications</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    disabled={isLoading}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Create Circular
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search circulars by title, audience, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filters
                  {(filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all") && (
                    <span className="bg-indigo-100 text-indigo-600 text-xs rounded-full px-2 py-1">
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Priorities</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="academic">Academic</option>
                        <option value="administrative">Administrative</option>
                        <option value="examination">Examination</option>
                        <option value="finance">Finance</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setFilterStatus("all");
                        setFilterPriority("all");
                        setFilterCategory("all");
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Circulars List */}
              <div className="space-y-4">
                {filteredCirculars.map((circular) => (
                  <div
                    key={circular.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{circular.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(circular.priority)}`}>
                            {circular.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(circular.status)}`}>
                            {circular.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(circular.category)}`}>
                            {circular.category}
                          </span>
                          {circular.isSystemWide && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              System-wide
                            </span>
                          )}
                          {circular.approvalRequired && !circular.approvedBy && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Approval Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <UserGroupIcon className="inline h-4 w-4 mr-1" />
                          Audience: {circular.audience}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          <CalendarIcon className="inline h-4 w-4 mr-1" />
                          Published: {circular.publishDate} • Expires: {circular.expiryDate}
                        </p>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {circular.messageBody}
                        </p>
                        {circular.attachments && circular.attachments.length > 0 && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-indigo-600">
                              <PaperClipIcon className="inline h-4 w-4 mr-1" />
                              {circular.attachments.length} attachment(s)
                            </p>
                          </div>
                        )}
                        {circular.approvedBy && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Approved by {circular.approvedBy} on {circular.approvedAt ? new Date(circular.approvedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => {
                            setSelectedCircular(circular);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCircular(circular);
                            setFormData({
                              title: circular.title,
                              audienceType: circular.audienceType,
                              targetColleges: circular.targetColleges || [],
                              priority: circular.priority,
                              messageBody: circular.messageBody,
                              publishDate: circular.publishDate,
                              expiryDate: circular.expiryDate,
                              attachments: [],
                              category: circular.category,
                              isSystemWide: circular.isSystemWide,
                              approvalRequired: circular.approvalRequired,
                            });
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handlePublishToggle(circular.id)}
                          className={`p-2 rounded ${
                            circular.status === "published"
                              ? "text-yellow-600 hover:bg-yellow-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={circular.status === "published" ? "Unpublish" : "Publish"}
                          disabled={isLoading}
                        >
                          {circular.status === "published" ? (
                            <ClockIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(circular.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredCirculars.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No circulars found</p>
                    <p className="text-sm">Try adjusting your search criteria or create a new circular.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "notifications" ? (
            <>
              {/* Notifications Tab */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">System Notifications</h2>
                    <p className="text-sm text-gray-500">Real-time updates from colleges and system alerts</p>
                  </div>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Mark All as Read
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition ${
                        notification.isRead 
                          ? "border-gray-200 bg-white" 
                          : "border-indigo-200 bg-indigo-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-semibold ${notification.isRead ? "text-gray-900" : "text-indigo-900"}`}>
                              {notification.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                notification.type === "urgent"
                                  ? "bg-red-100 text-red-700"
                                  : notification.type === "warning"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : notification.type === "error"
                                  ? "bg-red-100 text-red-700"
                                  : notification.type === "success"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {notification.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                              {notification.category.replace("_", " ")}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>From: {notification.sender}</span>
                            <span>{formatTimestamp(notification.timestamp)}</span>
                            {notification.collegeName && (
                              <span className="flex items-center gap-1">
                                <BuildingOfficeIcon className="h-3 w-3" />
                                {notification.collegeName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <button 
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded" 
                              title="Mark as read"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <InformationCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No notifications</p>
                      <p className="text-sm">You're all caught up! New notifications will appear here.</p>
                    </div>
                  )}
                </div>
                
                {/* Notifications Summary */}
                {notifications.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{notifications.length}</div>
                        <div className="text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-indigo-600">{notifications.filter(n => !n.isRead).length}</div>
                        <div className="text-gray-500">Unread</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">{notifications.filter(n => n.type === "urgent").length}</div>
                        <div className="text-gray-500">Urgent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{notifications.filter(n => n.category === "college_update").length}</div>
                        <div className="text-gray-500">College Updates</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Analytics Tab */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Communication Analytics</h2>
                  <p className="text-sm text-gray-500">Track the effectiveness of your university communications</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Circulars</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.totalCirculars}</p>
                      </div>
                      <BellIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-green-600">+2</span>
                      <span className="text-gray-500 ml-1">this month</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Published</p>
                        <p className="text-2xl font-bold text-green-600">{analytics.publishedCirculars}</p>
                      </div>
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-gray-500">{((analytics.publishedCirculars / analytics.totalCirculars) * 100).toFixed(1)}% of total</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Reach</p>
                        <p className="text-2xl font-bold text-blue-600">{analytics.totalReach.toLocaleString()}</p>
                      </div>
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-blue-600">Across {analytics.collegesReached} colleges</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Read Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{analytics.readRate}%</p>
                      </div>
                      <EyeIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-green-600">+5.2%</span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Circular Status Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analytics.publishedCirculars}</div>
                      <div className="text-sm text-green-700">Published</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{analytics.draftCirculars}</div>
                      <div className="text-sm text-yellow-700">Drafts</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-blue-700">Scheduled</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{analytics.expiredCirculars}</div>
                      <div className="text-sm text-gray-700">Expired</div>
                    </div>
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Categories</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Academic", count: 5, color: "bg-blue-500" },
                      { name: "Examination", count: 4, color: "bg-purple-500" },
                      { name: "Administrative", count: 3, color: "bg-orange-500" },
                      { name: "Finance", count: 2, color: "bg-green-500" },
                      { name: "General", count: 1, color: "bg-gray-500" },
                    ].map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{category.count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${category.color}`}
                              style={{ width: `${(category.count / analytics.totalCirculars) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Examination Schedule Published</p>
                        <p className="text-xs text-gray-500">2 hours ago • Reached 25 colleges</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <PencilSquareIcon className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Academic Policy Draft Created</p>
                        <p className="text-xs text-gray-500">1 day ago • Pending approval</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Fee Structure Notice Expiring Soon</p>
                        <p className="text-xs text-gray-500">Expires in 3 days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Circular Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCircular ? "Edit Circular" : "Create New Circular"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCircular(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circular Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.title ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter a clear and descriptive title"
                />
                {formErrors.title && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Category and Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="administrative">Administrative</option>
                    <option value="examination">Examination</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Audience Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience *
                </label>
                <select
                  value={formData.audienceType}
                  onChange={(e) => {
                    setFormData({
                      ...formData, 
                      audienceType: e.target.value as any,
                      targetColleges: [] // Reset target colleges when audience type changes
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all_colleges">All Affiliated Colleges</option>
                  <option value="specific_colleges">Specific Colleges</option>
                  <option value="departments">Department Heads</option>
                  <option value="students">All Students</option>
                  <option value="faculty">All Faculty</option>
                  <option value="all_universities">All Universities (System-wide)</option>
                </select>
              </div>

              {/* Specific Colleges Selection */}
              {formData.audienceType === "specific_colleges" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Colleges *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {availableColleges.map((college) => (
                      <label key={college.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={formData.targetColleges.includes(college.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                targetColleges: [...formData.targetColleges, college.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                targetColleges: formData.targetColleges.filter(id => id !== college.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{college.name}</div>
                          <div className="text-xs text-gray-500">{college.district}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {formErrors.targetColleges && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.targetColleges}</p>
                  )}
                  {formData.targetColleges.length > 0 && (
                    <p className="text-sm text-indigo-600 mt-2">
                      {formData.targetColleges.length} college(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content *
                </label>
                <textarea
                  value={formData.messageBody}
                  onChange={(e) => setFormData({...formData, messageBody: e.target.value})}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.messageBody ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter the detailed message content. Be clear and specific about any actions required."
                />
                {formErrors.messageBody && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.messageBody}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.messageBody.length} characters
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({...formData, publishDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.publishDate ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {formErrors.publishDate && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.publishDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    min={formData.publishDate || new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.expiryDate ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {formErrors.expiryDate && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.expiryDate}</p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                  onChange={(e) => setFormData({...formData, attachments: Array.from(e.target.files || [])})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT (Max 10MB per file)
                </p>
                {formData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <PaperClipIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          onClick={() => {
                            const newAttachments = formData.attachments.filter((_, i) => i !== index);
                            setFormData({...formData, attachments: newAttachments});
                          }}
                          className="ml-auto text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Advanced Options</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isSystemWide}
                      onChange={(e) => setFormData({...formData, isSystemWide: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">System-wide Communication</div>
                      <div className="text-xs text-gray-500">Mark as university-level policy or directive</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.approvalRequired}
                      onChange={(e) => setFormData({...formData, approvalRequired: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Requires Approval</div>
                      <div className="text-xs text-gray-500">Circular will need approval before publishing</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedCircular(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCircular}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                {selectedCircular ? "Update Circular" : "Create Circular"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Circular Modal */}
      {showViewModal && selectedCircular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Circular Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCircular(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div>
                <h4 className="font-bold text-gray-900 text-xl mb-3">{selectedCircular.title}</h4>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedCircular.priority)}`}>
                    {selectedCircular.priority.toUpperCase()} Priority
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedCircular.status)}`}>
                    {selectedCircular.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedCircular.category)}`}>
                    {selectedCircular.category.toUpperCase()}
                  </span>
                  {selectedCircular.isSystemWide && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
                      SYSTEM-WIDE
                    </span>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Target Audience:</span>
                    <p className="text-gray-600 mt-1">{selectedCircular.audience}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created by:</span>
                    <p className="text-gray-600 mt-1">{selectedCircular.createdBy}</p>
                  </div>
                  {selectedCircular.approvedBy && (
                    <div>
                      <span className="font-medium text-gray-700">Approved by:</span>
                      <p className="text-green-600 mt-1">
                        ✓ {selectedCircular.approvedBy}
                        {selectedCircular.approvedAt && (
                          <span className="text-gray-500 text-xs ml-2">
                            on {new Date(selectedCircular.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Publish Date:</span>
                    <p className="text-gray-600 mt-1">{new Date(selectedCircular.publishDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expiry Date:</span>
                    <p className="text-gray-600 mt-1">{new Date(selectedCircular.expiryDate).toLocaleDateString()}</p>
                  </div>
                  {selectedCircular.readBy && (
                    <div>
                      <span className="font-medium text-gray-700">Read Statistics:</span>
                      <p className="text-gray-600 mt-1">{selectedCircular.readBy.length} recipients have read this circular</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Colleges */}
              {selectedCircular.targetColleges && selectedCircular.targetColleges.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Target Colleges:</span>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCircular.targetColleges.map((collegeId) => {
                      const college = availableColleges.find(c => c.id === collegeId);
                      return college ? (
                        <div key={collegeId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{college.name}</div>
                            <div className="text-xs text-gray-500">{college.district}</div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div>
                <span className="font-medium text-gray-700">Message Content:</span>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedCircular.messageBody}</p>
                </div>
              </div>

              {/* Attachments */}
              {selectedCircular.attachments && selectedCircular.attachments.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Attachments:</span>
                  <div className="mt-2 space-y-2">
                    {selectedCircular.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <PaperClipIcon className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-700 flex-1">{attachment}</span>
                        <button 
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm"
                          title={`Download ${attachment}`}
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Status */}
              {selectedCircular.approvalRequired && !selectedCircular.approvedBy && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Approval Required</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    This circular requires approval before it can be published to the target audience.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex gap-2">
                {selectedCircular.status === "draft" && (
                  <button
                    onClick={() => handlePublishToggle(selectedCircular.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Publish Now
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCircular(selectedCircular);
                    setFormData({
                      title: selectedCircular.title,
                      audienceType: selectedCircular.audienceType,
                      targetColleges: selectedCircular.targetColleges || [],
                      priority: selectedCircular.priority,
                      messageBody: selectedCircular.messageBody,
                      publishDate: selectedCircular.publishDate,
                      expiryDate: selectedCircular.expiryDate,
                      attachments: [],
                      category: selectedCircular.category,
                      isSystemWide: selectedCircular.isSystemWide,
                      approvalRequired: selectedCircular.approvalRequired,
                    });
                    setShowViewModal(false);
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCircular(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularsManagement;