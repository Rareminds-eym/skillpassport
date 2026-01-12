import { useState, useEffect } from 'react';
import {
  BuildingLibraryIcon,
  BookOpenIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  Users,
  AlertTriangle,
  Edit2,
  Plus,
  BarChart3,
  Activity,
  Filter,
  Search,
  Book,
} from 'lucide-react';
import { libraryService, LibraryBook, LibraryBookIssue, LibraryStats } from '../../../../services/libraryService';
import KPICard from '../../../../components/admin/KPICard';

const LibraryManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [issues, setIssues] = useState<LibraryBookIssue[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'books', name: 'Book Management', icon: Book },
    { id: 'members', name: 'Member Management', icon: Users },
    { id: 'transactions', name: 'Transactions', icon: Activity },
  ];

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load stats for overview
      if (activeTab === 'overview') {
        const [statsData, recentIssues, overdueData] = await Promise.all([
          libraryService.getLibraryStats(),
          libraryService.getBookIssues({ limit: 10 }),
          libraryService.getOverdueBooks(),
        ]);
        
        setStats(statsData);
        setIssues(recentIssues.issues);
        setOverdueBooks(overdueData);
      }
      
      // Load books for book management
      if (activeTab === 'books') {
        const [booksData, categoriesData] = await Promise.all([
          libraryService.getBooks({ limit: 50 }),
          libraryService.getCategories(),
        ]);
        
        setBooks(booksData.books);
        setCategories(categoriesData);
      }
      
      // Load transactions
      if (activeTab === 'transactions') {
        const issuesData = await libraryService.getBookIssues({ limit: 50 });
        setIssues(issuesData.issues);
      }
      
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      setLoading(true);
      await libraryService.deleteBook(bookId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete book:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (book: LibraryBook) => {
    // Note: Modal functionality would need to be implemented
    console.log('Edit modal would open for book:', book.title);
  };

  const handleViewDetails = (issue: LibraryBookIssue) => {
    // Create a modal or detailed view for the transaction
    alert(`Transaction Details:
    
Student: ${issue.student_name} (${issue.roll_number})
Book: ${issue.book?.title} by ${issue.book?.author}
Issue Date: ${issue.issue_date}
Due Date: ${issue.due_date}
Status: ${issue.status}
${issue.return_date ? `Return Date: ${issue.return_date}` : ''}
${issue.fine_amount ? `Fine Amount: ₹${issue.fine_amount}` : ''}`);
  };

  // KPI Data based on stats
  const kpiData = stats ? [
    {
      title: "Total Books",
      value: stats.total_books.toLocaleString(),
      change: 0,
      changeLabel: "unique titles",
      icon: <Book className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Copies",
      value: stats.total_copies.toLocaleString(),
      change: 0,
      changeLabel: "physical copies",
      icon: <BookOpenIcon className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Currently Issued",
      value: stats.currently_issued.toLocaleString(),
      change: 0,
      changeLabel: "books in circulation",
      icon: <Users className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Overdue Books",
      value: stats.overdue_count.toLocaleString(),
      change: 0,
      changeLabel: "need attention",
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ] : [];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            <button 
              onClick={() => setActiveTab('transactions')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {issues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    issue.status === 'issued' ? 'bg-blue-100' :
                    issue.status === 'returned' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Book className={`h-4 w-4 ${
                      issue.status === 'issued' ? 'text-blue-600' :
                      issue.status === 'returned' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{issue.student_name}</p>
                    <p className="text-sm text-gray-600">{issue.book?.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{issue.issue_date}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    issue.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                    issue.status === 'returned' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Books */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Overdue Books</h3>
            <span className="text-sm text-red-600 font-medium">{overdueBooks.length} items</span>
          </div>
          <div className="space-y-4">
            {overdueBooks.slice(0, 5).map((overdue) => (
              <div key={overdue.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{overdue.student_name}</p>
                    <p className="text-sm text-gray-600">{overdue.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{overdue.days_overdue} days</p>
                  <p className="text-xs text-gray-500">₹{overdue.current_fine}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Book Inventory ({books.length})</h3>
        <button 
          onClick={() => console.log('Add book functionality would be implemented here')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Book
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books
          .filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((book) => (
          <div key={book.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <Book className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-gray-600">by {book.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditModal(book)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteBook(book.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ISBN:</span>
                <span className="text-sm font-medium text-gray-900">{book.isbn}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Copies:</span>
                <span className="text-sm font-bold text-gray-900">{book.total_copies}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available:</span>
                <span className={`text-sm font-bold ${
                  book.available_copies > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {book.available_copies}
                </span>
              </div>

              {book.category && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {book.category}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  book.status === 'available' ? 'bg-green-100 text-green-700 border border-green-200' :
                  book.status === 'all_issued' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                  'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {book.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Book className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No books found</p>
          <p className="text-sm text-gray-400">Add your first book to get started</p>
        </div>
      )}
    </div>
  );

  const renderMemberManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Library Members</h3>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-2">Member management interface</p>
        <p className="text-sm text-gray-400">Features: Student registration, Faculty access, Membership types, Access levels</p>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Library Transactions ({issues.length})</h3>
        <button 
          onClick={() => console.log('Issue book functionality would be implemented here')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Plus className="h-4 w-4" />
          Issue Book
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800">All Transactions</h4>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm">
                <option value="">All Status</option>
                <option value="issued">Issued</option>
                <option value="returned">Returned</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Student</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Book</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Issue Date</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Due Date</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Status</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{issue.student_name}</p>
                      <p className="text-sm text-gray-500">{issue.roll_number}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{issue.book?.title}</p>
                      <p className="text-sm text-gray-500">by {issue.book?.author}</p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-700">{issue.issue_date}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-700">{issue.due_date}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      issue.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                      issue.status === 'returned' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(issue)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {issues.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No transactions found</p>
          <p className="text-sm text-gray-400">Issue your first book to get started</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'books':
        return renderBookManagement();
      case 'members':
        return renderMemberManagement();
      case 'transactions':
        return renderTransactions();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BuildingLibraryIcon className="h-8 w-8 text-indigo-600" />
          Library Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage library resources, members, and transactions across all affiliated colleges
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default LibraryManagement;