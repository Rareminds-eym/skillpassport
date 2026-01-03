import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityContent } from '../../utils/getEntityContent';
import RecruiterLoginModal from './RecruiterLoginModal';
import RecruitmentAdminSignupModal from './RecruitmentAdminSignupModal';

// Memoized PlanCard component for the modal
const PlanCard = React.memo(({ plan, onSelect }) => {
  return (
    <div
      className={`relative rounded-xl bg-white p-5 shadow-md flex flex-col transition-all hover:shadow-lg ${
        plan.recommended ? 'ring-2 ring-blue-600' : 'border border-gray-200'
      }`}
    >
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Recommended
          </span>
        </div>
      )}

      <div className="mb-4 pt-2">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            ₹{plan.price}
          </span>
          <span className="ml-1 text-sm font-semibold text-gray-600">
            /{plan.duration}
          </span>
        </div>
      </div>

      <ul className="mb-4 space-y-2 flex-1 text-sm">
        {plan.features.slice(0, 4).map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="ml-2 text-gray-600">{feature}</span>
          </li>
        ))}
        {plan.features.length > 4 && (
          <li className="text-xs text-blue-600 ml-6">
            +{plan.features.length - 4} more features
          </li>
        )}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
          plan.recommended
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
        }`}
      >
        Select Plan
      </button>
    </div>
  );
});

PlanCard.displayName = 'PlanCard';

export default function RecruitmentAdminPlansModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const studentType = 'recruitment-admin';
  
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Get entity-specific content
  const { title, subtitle, plans } = useMemo(() => {
    return getEntityContent(studentType);
  }, []);

  const handlePlanSelection = useCallback((plan) => {
    setSelectedPlan(plan);
    setShowSignupModal(true);
  }, []);

  const handleSignupSuccess = useCallback((userData) => {
    setShowSignupModal(false);
    // Navigate to payment with selected plan
    navigate('/subscription/payment', { 
      state: { 
        plan: selectedPlan, 
        studentType,
        isUpgrade: false 
      } 
    });
    onClose();
  }, [navigate, selectedPlan, onClose]);

  const handleSwitchToLogin = useCallback(() => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  }, []);

  const handleSwitchToSignup = useCallback(() => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLoginModal(false);
    // Navigate to payment with selected plan
    navigate('/subscription/payment', { 
      state: { 
        plan: selectedPlan, 
        studentType,
        isUpgrade: false 
      } 
    });
    onClose();
  }, [navigate, selectedPlan, onClose]);

  const handleCloseSignupModal = useCallback(() => {
    setShowSignupModal(false);
    setSelectedPlan(null);
  }, []);

  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setSelectedPlan(null);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && !showSignupModal && !showLoginModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="relative w-full max-w-4xl bg-gray-50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-1 shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="p-6 pb-4 bg-white border-b border-gray-100 rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 pr-8">{title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {subtitle}
                  </p>
                </div>

                {/* Plans Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onSelect={handlePlanSelection}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
                  <p className="text-center text-xs text-gray-500">
                    All plans include a 7-day free trial. Cancel anytime.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Signup Modal */}
      <RecruitmentAdminSignupModal
        isOpen={showSignupModal}
        onClose={handleCloseSignupModal}
        selectedPlan={selectedPlan}
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* Login Modal */}
      <RecruiterLoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        selectedPlan={selectedPlan}
        studentType={studentType}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </>
  );
}
