import { useState, useEffect } from 'react';
import { Badge, BadgeCategory } from '../../types/badge';
import BadgeCard from '../../components/educator/BadgeCard';
import { Award, Search, Filter, Grid, List, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAwardedBadges, deleteAwardedBadge, StudentBadgeData } from '../../services/badgeService';
import AwardBadgeModal from '../../components/educator/AwardBadgeModal';

const Badges = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmBadge, setDeleteConfirmBadge] = useState<string | null>(null);
  const [showAwardModal, setShowAwardModal] = useState(false);

  const categories: (BadgeCategory | 'All')[] = [
    'All',
    'Achievement',
    'Academic',
    'Skills',
    'Participation',
    'Leadership',
    'Attendance',
    'Career'
  ];

  // Load awarded badges on mount
  useEffect(() => {
    loadAwardedBadges();
  }, []);

  const loadAwardedBadges = async () => {
    try {
      setLoading(true);
      const awardedBadges = await fetchAwardedBadges();
      
      // Transform StudentBadgeData to Badge format
      const transformedBadges: Badge[] = awardedBadges.map((sb: StudentBadgeData) => ({
        id: sb.id,
        name: sb.badge?.name || 'Unknown Badge',
        description: sb.badge?.description || '',
        iconName: 'award' as any,
        emoji: sb.badge?.icon || '🏆',
        category: 'Achievement' as BadgeCategory,
        institutionType: sb.school_id ? 'School' : 'College',
        activity: 'Participation' as any,
        criteria: sb.notes || '',
        isActive: true,
        createdAt: new Date(sb.awarded_date),
        studentId: sb.student?.id,
        studentName: sb.student?.name || 'Unknown Student',
        awardedDate: new Date(sb.awarded_date)
      }));

      setBadges(transformedBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    try {
      await deleteAwardedBadge(id);
      setBadges(prev => prev.filter(badge => badge.id !== id));
      setDeleteConfirmBadge(null);
      toast.success('Badge deleted successfully!');
    } catch (error) {
      console.error('Error deleting badge:', error);
      toast.error('Failed to delete badge');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmBadge(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmBadge(null);
  };

  // Filter badges - search by student name, badge name, description, or criteria
  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.criteria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (badge.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || badge.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Stats - only show categories that have badges
  const stats = {
    total: badges.length,
    byCategory: categories
      .slice(1) // Remove 'All'
      .map(cat => ({
        name: cat,
        count: badges.filter(b => b.category === cat).length
      }))
      .filter(cat => cat.count > 0), // Only show categories with badges
    uniqueStudents: new Set(badges.map(b => b.studentId).filter(Boolean)).size
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="text-blue-600" size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Badge Management
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  View all badges awarded to students
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAwardModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              Award Badge
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {badges.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Badges Awarded</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.uniqueStudents}</div>
              <div className="text-sm text-gray-500">Students Awarded</div>
            </div>
            {stats.byCategory.map(cat => (
              <div key={cat.name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{cat.count}</div>
                <div className="text-sm text-gray-500">{cat.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Create Badge Form */}
        {/* Removed - now using modal */}

        {/* Badges List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Section Header with Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Awarded Badges ({filteredBadges.length})
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by student name or badge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={20} />
                Filters
              </button>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as BadgeCategory | 'All')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setFilterCategory('All');
                  setSearchTerm('');
                }}
                className="self-end px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Badges Grid/List */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Award className="text-gray-400" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Loading badges...
              </h3>
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-gray-400" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No badges awarded yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                Badges will appear here when educators award them to students from their profiles.
              </p>
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400" size={36} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No badges found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBadges.map(badge => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBadges.map(badge => (
                <div 
                  key={badge.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
                    {badge.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{badge.description}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">Awarded to: {badge.studentName || 'Unknown Student'}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {badge.category}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                      {badge.institutionType}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteClick(badge.id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmBadge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Badge</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{badges.find(b => b.id === deleteConfirmBadge)?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBadge(deleteConfirmBadge)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Award Badge Modal */}
      <AwardBadgeModal
        isOpen={showAwardModal}
        onClose={() => setShowAwardModal(false)}
        onSuccess={loadAwardedBadges}
      />
    </div>
  );
};

export default Badges;