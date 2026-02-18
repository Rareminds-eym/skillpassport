import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddBadgeModal from './AddBadgeModal';

interface BadgeFormData {
  name: string;
  icon: string;
  description: string;
  category: string;
  criteria: string;
}

const BadgeManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeFormData[]>([]);
  
  // Simulate user type - in real app this would come from auth context
  const userType: 'school' | 'college' = 'school'; // Change to 'college' to test

  const handleAddBadge = (badgeData: BadgeFormData) => {
    setBadges(prev => [...prev, badgeData]);
    console.log('New badge created:', badgeData);
    // Here you would typically send the data to your backend
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badge Management</h1>
          <p className="text-gray-600 mt-1">Create and manage student achievement badges</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Badge
        </button>
      </div>

      {/* Badge List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Created Badges</h2>
        </div>
        
        <div className="p-6">
          {badges.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No badges created yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first badge</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Badge
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{badge.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{badge.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{badge.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {badge.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Badge Modal */}
      <AddBadgeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddBadge}
        userType={userType}
      />
    </div>
  );
};

export default BadgeManagement;