import React, { useState } from "react";
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
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

interface Circular {
  id: number;
  title: string;
  audience: string;
  audienceType: "all" | "grade" | "department" | "batch" | "section";
  priority: "normal" | "high";
  publishDate: string;
  expiryDate: string;
  status: "published" | "draft";
  messageBody: string;
  attachments?: string[];
  createdBy: string;
  readBy?: number[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: string;
  isRead: boolean;
  sender: string;
}

const CircularsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"circulars" | "notifications">("circulars");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "normal" | "high">("all");
  const [showFilters, setShowFilters] = useState(false);

  const [circulars, setCirculars] = useState<Circular[]>([
    {
      id: 1,
      title: "Academic Calendar Update",
      audience: "All Students",
      audienceType: "all",
      priority: "high",
      publishDate: "2025-12-01",
      expiryDate: "2025-12-31",
      status: "published",
      messageBody: "The academic calendar has been updated with new examination dates. Please check the revised schedule.",
      attachments: ["academic-calendar-2025.pdf"],
      createdBy: "Admin",
      readBy: [1, 2, 3],
    },
    {
      id: 2,
      title: "Library Hours Extension",
      audience: "Computer Science Department",
      audienceType: "department",
      priority: "normal",
      publishDate: "2025-12-05",
      expiryDate: "2025-12-20",
      status: "draft",
      messageBody: "Library hours will be extended during examination period.",
      createdBy: "Librarian",
    },
  ]);

  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New Assignment Posted",
      message: "Mathematics assignment for Grade 12 has been posted",
      type: "info",
      timestamp: "2025-12-11T10:30:00Z",
      isRead: false,
      sender: "Prof. Smith",
    },
    {
      id: 2,
      title: "Fee Payment Reminder",
      message: "Semester fee payment due date is approaching",
      type: "warning",
      timestamp: "2025-12-11T09:15:00Z",
      isRead: true,
      sender: "Accounts Department",
    },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    audienceType: "all" as const,
    audience: "",
    priority: "normal" as const,
    messageBody: "",
    publishDate: "",
    expiryDate: "",
    attachments: [] as File[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper functions
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (formData.audienceType !== "all" && !formData.audience.trim()) {
      errors.audience = "Audience is required";
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
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCircular = () => {
    if (validateForm()) {
      const newCircular: Circular = {
        id: Date.now(),
        title: formData.title,
        audience: formData.audienceType === "all" ? "All Students" : formData.audience,
        audienceType: formData.audienceType,
        priority: formData.priority,
        publishDate: formData.publishDate,
        expiryDate: formData.expiryDate,
        status: "draft",
        messageBody: formData.messageBody,
        attachments: formData.attachments.map(file => file.name),
        createdBy: "Admin",
      };
      
      setCirculars([...circulars, newCircular]);
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      audienceType: "all",
      audience: "",
      priority: "normal",
      messageBody: "",
      publishDate: "",
      expiryDate: "",
      attachments: [],
    });
    setFormErrors({});
  };

  const handlePublishToggle = (id: number) => {
    setCirculars(circulars.map(circular => 
      circular.id === id 
        ? { ...circular, status: circular.status === "published" ? "draft" : "published" }
        : circular
    ));
  };

  const handleDelete = (id: number) => {
    setCirculars(circulars.filter(circular => circular.id !== id));
  };

  const filteredCirculars = circulars.filter(circular => {
    const matchesSearch = circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         circular.audience.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || circular.status === filterStatus;
    const matchesPriority = filterPriority === "all" || circular.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Notifications & Circulars
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage institutional communication
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("circulars")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "circulars"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Circulars
              </div>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notifications"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "circulars" ? (
            <>
              {/* Circulars Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Circulars Management</h2>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  Create Circular
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search circulars..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FunnelIcon className="h-5 w-5" />
                  Filters
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Priorities</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Circulars List */}
              <div className="space-y-3">
                {filteredCirculars.map((circular) => (
                  <div
                    key={circular.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{circular.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              circular.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {circular.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              circular.status === "published"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {circular.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <UserGroupIcon className="inline h-4 w-4 mr-1" />
                          Audience: {circular.audience}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          <CalendarIcon className="inline h-4 w-4 mr-1" />
                          Published: {circular.publishDate} • Expires: {circular.expiryDate}
                        </p>
                        {circular.attachments && circular.attachments.length > 0 && (
                          <p className="text-sm text-blue-600">
                            <PaperClipIcon className="inline h-4 w-4 mr-1" />
                            {circular.attachments.length} attachment(s)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedCircular(circular);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCircular(circular);
                            setFormData({
                              title: circular.title,
                              audienceType: circular.audienceType,
                              audience: circular.audience,
                              priority: circular.priority,
                              messageBody: circular.messageBody,
                              publishDate: circular.publishDate,
                              expiryDate: circular.expiryDate,
                              attachments: [],
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
                  <div className="text-center py-8 text-gray-500">
                    No circulars found matching your criteria.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Notifications Tab */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications Inbox</h2>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition ${
                        notification.isRead 
                          ? "border-gray-200 bg-white" 
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-semibold ${notification.isRead ? "text-gray-900" : "text-blue-900"}`}>
                              {notification.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                notification.type === "warning"
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
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            From: {notification.sender} • {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Mark as read">
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No notifications available.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Circular Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
            
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formErrors.title ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter circular title"
                />
                {formErrors.title && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Audience Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Type *
                </label>
                <select
                  value={formData.audienceType}
                  onChange={(e) => setFormData({...formData, audienceType: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Students</option>
                  <option value="grade">Specific Grade</option>
                  <option value="department">Department</option>
                  <option value="batch">Batch</option>
                  <option value="section">Section</option>
                </select>
              </div>

              {/* Specific Audience */}
              {formData.audienceType !== "all" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Audience *
                  </label>
                  <input
                    type="text"
                    value={formData.audience}
                    onChange={(e) => setFormData({...formData, audience: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.audience ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder={`Enter ${formData.audienceType} name`}
                  />
                  {formErrors.audience && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.audience}</p>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                </label>
                <textarea
                  value={formData.messageBody}
                  onChange={(e) => setFormData({...formData, messageBody: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the circular message..."
                />
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
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
                  onChange={(e) => setFormData({...formData, attachments: Array.from(e.target.files || [])})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-500">
                      {formData.attachments.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCircular}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedCircular ? "Update Circular" : "Create Circular"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Circular Modal */}
      {showViewModal && selectedCircular && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">View Circular</h3>
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
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 text-xl mb-2">{selectedCircular.title}</h4>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCircular.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedCircular.priority} priority
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCircular.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedCircular.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Audience:</span>
                  <p className="text-gray-600">{selectedCircular.audience}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-600">{selectedCircular.createdBy}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Publish Date:</span>
                  <p className="text-gray-600">{selectedCircular.publishDate}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Expiry Date:</span>
                  <p className="text-gray-600">{selectedCircular.expiryDate}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-gray-700">Message:</span>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{selectedCircular.messageBody}</p>
              </div>

              {selectedCircular.attachments && selectedCircular.attachments.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Attachments:</span>
                  <div className="mt-2 space-y-2">
                    {selectedCircular.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <PaperClipIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{attachment}</span>
                        <button className="ml-auto text-blue-600 hover:text-blue-800">
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCircular.readBy && selectedCircular.readBy.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Read by:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedCircular.readBy.length} users</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
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
