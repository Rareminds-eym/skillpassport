import React from 'react';
import toast from 'react-hot-toast';

interface LibraryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  borrowHistory: any[];
  overdueBooks: any[];
  loadBorrowHistory: () => Promise<void>;
  loadOverdueBooks: () => Promise<void>;
}

const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "details", label: "Details" },
  { id: "history", label: "History" },
  { id: "overdue", label: "Overdue" },
];

export const LibraryTabs: React.FC<LibraryTabsProps> = ({
  activeTab,
  setActiveTab,
  borrowHistory,
  overdueBooks,
  loadBorrowHistory,
  loadOverdueBooks,
}) => {
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // Load data when switching tabs
    if (tabId === "history" && borrowHistory.length === 0) {
      toast.loading('Loading borrow history...', { id: 'load-history' });
      loadBorrowHistory().finally(() => toast.dismiss('load-history'));
    } else if (tabId === "overdue" && overdueBooks.length === 0) {
      toast.loading('Loading overdue books...', { id: 'load-overdue' });
      loadOverdueBooks().finally(() => toast.dismiss('load-overdue'));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              activeTab === tab.id 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
