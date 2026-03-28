import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Factory, MapPin, Calendar, Tag, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import factoryVisitsService from '../../../services/factoryVisitsService';

const IndustrialVisitsSection = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadVisits();
  }, []);

  // Add/remove blur effect on body when modal opens/closes
  useEffect(() => {
    if (showModal) {
      // Add blur class to root element
      const root = document.getElementById('root');
      if (root) {
        root.style.filter = 'blur(4px)';
        root.style.transition = 'filter 0.2s ease-in-out';
      }
    } else {
      // Remove blur class
      const root = document.getElementById('root');
      if (root) {
        root.style.filter = 'none';
      }
    }

    return () => {
      const root = document.getElementById('root');
      if (root) {
        root.style.filter = 'none';
      }
    };
  }, [showModal]);

  const loadVisits = async () => {
    try {
      const data = await factoryVisitsService.getAllFactoryVisits();
      setVisits(data); // Show all visits
    } catch (error) {
      console.error('Error loading factory visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setShowModal(true);
    // Add blur effect to body content
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVisit(null);
    // Remove blur effect
    document.body.style.overflow = 'unset';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
        {visits.map((visit) => (
          <div
            key={visit.id}
            className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-base font-bold text-gray-900">{visit.company_name}</h4>
              <Badge className="!bg-blue-100 !text-blue-600 text-xs">Visit</Badge>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{visit.sector}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{visit.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              {visit.posted_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(visit.posted_date).toLocaleDateString()}</span>
                </div>
              )}

              <Button
                onClick={() => handleViewDetails(visit)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Use Portal to render outside root */}
      {showModal && selectedVisit && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Factory className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                      {selectedVisit.company_name}
                    </h2>
                  </div>
                  <Badge className="!bg-blue-50 !text-blue-700 !border-blue-200 text-sm font-medium px-3 py-1">
                    Industrial Visit Opportunity
                  </Badge>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-8 py-6">
              <div className="space-y-6">
                {/* Industry Type */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Industry Type
                      </h3>
                      <p className="text-base font-medium text-gray-900">
                        {selectedVisit.sector}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Location
                      </h3>
                      <p className="text-base font-medium text-gray-900">
                        {selectedVisit.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* About */}
                {selectedVisit.description && (
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      About This Visit
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedVisit.description}
                    </p>
                  </div>
                )}

                {/* Posted Date */}
                {selectedVisit.posted_date && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 pt-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Posted on {new Date(selectedVisit.posted_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default IndustrialVisitsSection;
