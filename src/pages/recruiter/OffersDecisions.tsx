import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  PaperAirplaneIcon,
  CalendarDaysIcon,
  UserIcon,
  ChartBarIcon,
  XMarkIcon,
  BanknotesIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { offersData } from '../../data/sampleData';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    case 'withdrawn':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-4 w-4" />;
    case 'accepted':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'rejected':
      return <XCircleIcon className="h-4 w-4" />;
    case 'expired':
      return <ExclamationCircleIcon className="h-4 w-4" />;
    case 'withdrawn':
      return <HandRaisedIcon className="h-4 w-4" />;
    default:
      return <DocumentTextIcon className="h-4 w-4" />;
  }
};

const CreateOfferModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    candidate_name: '',
    job_title: '',
    template: 'Full-time Offer - Standard',
    ctc_band: '4.0-6.0 LPA',
    offered_ctc: '',
    expiry_days: 7,
    benefits: ['Health Insurance'],
    notes: ''
  });

  const handleCreate = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + formData.expiry_days);

    const newOffer = {
      id: `off_${Date.now()}`,
      ...formData,
      offer_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'pending',
      sent_via: 'email',
      response_deadline: expiryDate.toISOString()
    };
    
    onCreate(newOffer);
    setFormData({
      candidate_id: '',
      candidate_name: '',
      job_title: '',
      template: 'Full-time Offer - Standard',
      ctc_band: '4.0-6.0 LPA',
      offered_ctc: '',
      expiry_days: 7,
      benefits: ['Health Insurance'],
      notes: ''
    });
    onClose();
  };

  const benefitOptions = [
    'Health Insurance',
    'Flexible Hours',
    'Learning Budget',
    'Gym Membership',
    'Food Safety Certification',
    'Transport Allowance',
    'Performance Bonus'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Create New Offer</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
              <input
                type="text"
                value={formData.candidate_name}
                onChange={(e) => setFormData({...formData, candidate_name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Enter candidate name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., Software Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Template</label>
              <select
                value={formData.template}
                onChange={(e) => setFormData({...formData, template: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option>Full-time Offer - Standard</option>
                <option>Intern Offer - Tech</option>
                <option>Full-time Offer - Quality</option>
                <option>Contract Offer - Consultant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTC Band</label>
              <select
                value={formData.ctc_band}
                onChange={(e) => setFormData({...formData, ctc_band: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option>3.6-4.2 LPA</option>
                <option>4.0-6.0 LPA</option>
                <option>4.5-6.0 LPA</option>
                <option>6.0-8.0 LPA</option>
                <option>8.0-12.0 LPA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Offered CTC</label>
              <input
                type="text"
                value={formData.offered_ctc}
                onChange={(e) => setFormData({...formData, offered_ctc: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., 5.2 LPA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (Days)</label>
              <select
                value={formData.expiry_days}
                onChange={(e) => setFormData({...formData, expiry_days: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
            <div className="grid grid-cols-2 gap-2">
              {benefitOptions.map(benefit => (
                <label key={benefit} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.benefits.includes(benefit)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, benefits: [...formData.benefits, benefit]});
                      } else {
                        setFormData({...formData, benefits: formData.benefits.filter(b => b !== benefit)});
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Additional notes about this offer..."
            />
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.candidate_name || !formData.job_title || !formData.offered_ctc}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OfferCard = ({ offer, onViewDetails, onWithdraw, onExtend }) => {
  const isExpiring = () => {
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays > 0;
  };

  const isExpired = () => {
    return new Date(offer.expiry_date) < new Date();
  };

  const getDaysUntilExpiry = () => {
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffTime = expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
      isExpiring() ? 'border-yellow-300 bg-yellow-50' : 
      isExpired() ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{offer.candidate_name}</h3>
          <p className="text-sm text-gray-600">{offer.job_title}</p>
          <p className="text-xs text-gray-500 mt-1">{offer.template}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
            {getStatusIcon(offer.status)}
            <span className="ml-1 capitalize">{offer.status}</span>
          </span>
          {isExpiring() && (
            <span className="mt-1 text-xs text-yellow-700 font-medium">
              Expires in {getDaysUntilExpiry()} day(s)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">CTC Band:</span>
          <span className="text-sm font-medium text-gray-900">{offer.ctc_band}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Offered:</span>
          <span className="text-sm font-bold text-green-600">{offer.offered_ctc}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Offer Date:</span>
          <span className="text-sm text-gray-900">
            {new Date(offer.offer_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Expires:</span>
          <span className={`text-sm ${isExpiring() ? 'text-yellow-700 font-medium' : 'text-gray-900'}`}>
            {new Date(offer.expiry_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {offer.benefits && offer.benefits.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Benefits:</p>
          <div className="flex flex-wrap gap-1">
            {offer.benefits.slice(0, 3).map((benefit, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {benefit}
              </span>
            ))}
            {offer.benefits.length > 3 && (
              <span className="text-xs text-gray-500">+{offer.benefits.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {offer.status === 'accepted' && offer.acceptance_notes && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">
            <strong>Acceptance Note:</strong> {offer.acceptance_notes}
          </p>
          {offer.response_date && (
            <p className="text-xs text-green-600 mt-1">
              Accepted on {new Date(offer.response_date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(offer)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </button>
          
          {offer.status === 'pending' && !isExpired() && (
            <button
              onClick={() => onExtend(offer)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
            >
              <CalendarDaysIcon className="h-3 w-3 mr-1" />
              Extend
            </button>
          )}
          
          {offer.status === 'pending' && (
            <button
              onClick={() => onWithdraw(offer)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
            >
              <XCircleIcon className="h-3 w-3 mr-1" />
              Withdraw
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Sent via {offer.sent_via}
        </div>
      </div>
    </div>
  );
};

const OffersDecisions = () => {
  const [offers, setOffers] = useState(offersData);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCreateOffer = (newOffer) => {
    setOffers(prev => [newOffer, ...prev]);
  };

  const handleWithdrawOffer = (offer) => {
    if (confirm(`Are you sure you want to withdraw the offer for ${offer.candidate_name}?`)) {
      setOffers(prev => prev.map(o => 
        o.id === offer.id ? { ...o, status: 'withdrawn' } : o
      ));
    }
  };

  const handleExtendOffer = (offer) => {
    const days = prompt('Extend by how many days?', '7');
    if (days && !isNaN(days)) {
      const newExpiryDate = new Date(offer.expiry_date);
      newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(days));
      
      setOffers(prev => prev.map(o => 
        o.id === offer.id 
          ? { ...o, expiry_date: newExpiryDate.toISOString(), response_deadline: newExpiryDate.toISOString() }
          : o
      ));
      
      alert(`Offer extended by ${days} days for ${offer.candidate_name}`);
    }
  };

  const filteredOffers = filterStatus === 'all' 
    ? offers 
    : offers.filter(offer => offer.status === filterStatus);

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    expired: offers.filter(o => o.status === 'expired').length,
    expiring_soon: offers.filter(o => {
      if (o.status !== 'pending') return false;
      const expiryDate = new Date(o.expiry_date);
      const now = new Date();
      const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays > 0;
    }).length
  };

  const acceptanceRate = stats.total > 0 
    ? ((stats.accepted / (stats.accepted + stats.rejected)) * 100).toFixed(1)
    : 0;

  const avgTimeToOffer = offers.filter(o => o.status === 'accepted').length > 0
    ? 5.2 // This would be calculated from interview completion to offer date
    : 0;

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Decisions</h1>
          <p className="text-gray-600 mt-1">Manage job offers and candidate responses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Offer
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Total Offers</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Accepted</p>
              <p className="text-xl font-semibold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-xl font-semibold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Expiring Soon</p>
              <p className="text-xl font-semibold text-gray-900">{stats.expiring_soon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Accept Rate</p>
              <p className="text-xl font-semibold text-gray-900">{acceptanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Acceptance Rate</p>
              <p className="text-3xl font-bold text-green-900">{acceptanceRate}%</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.accepted} accepted of {stats.accepted + stats.rejected} responded
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Avg Time-to-Offer</p>
              <p className="text-3xl font-bold text-blue-900">{avgTimeToOffer} days</p>
              <p className="text-xs text-blue-600 mt-1">From interview to offer</p>
            </div>
            <ClockIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Avg CTC Offered</p>
              <p className="text-3xl font-bold text-purple-900">
                {offers.length > 0 
                  ? (offers.reduce((sum, offer) => {
                      const ctc = parseFloat(offer.offered_ctc.replace(/[^\d.]/g, ''));
                      return sum + (ctc || 0);
                    }, 0) / offers.length).toFixed(1)
                  : 0} L
              </p>
              <p className="text-xs text-purple-600 mt-1">Across all offers</p>
            </div>
            <BanknotesIcon className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          {[
            { key: 'all', label: 'All Offers' },
            { key: 'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'expired', label: 'Expired' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === filter.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map(offer => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onViewDetails={(offer) => {
              alert(`Viewing details for offer to ${offer.candidate_name}`);
            }}
            onWithdraw={handleWithdrawOffer}
            onExtend={handleExtendOffer}
          />
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No offers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus === 'all' 
              ? 'Get started by creating your first offer.'
              : `No offers with status "${filterStatus}" found.`
            }
          </p>
        </div>
      )}

      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateOffer}
      />
    </div>
  );
};

export default OffersDecisions;