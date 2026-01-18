/**
 * BulkPurchaseWizard Component
 * 
 * A multi-step wizard for organization admins to purchase subscriptions in bulk.
 * Steps:
 * 1. Plan Selection - Choose subscription plan and member type
 * 2. Seat Configuration - Enter seat count, view volume discounts
 * 3. Member Selection - Auto-assign, select specific members, or create pool
 * 4. Review & Payment - Summary and Razorpay integration
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.4, 8.1, 8.2, 8.3, 10.3, 11.1, 11.2, 11.3
 */

import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    CreditCard,
    Loader2,
    Settings,
    ShoppingCart,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import AddStudentModal from '../../educator/modals/Addstudentmodal';
import MemberTypeSelector, { MemberType } from './MemberTypeSelector';
import PricingBreakdown, { PricingBreakdownData } from './PricingBreakdown';
import SeatSelector from './SeatSelector';

// Types
interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  description?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  type: 'educator' | 'student';
  department?: string;
  grade?: string;
}

type AssignmentMode = 'auto-all' | 'select-specific' | 'create-pool';

interface WizardState {
  // Step 1: Plan Selection
  selectedPlan: Plan | null;
  memberType: MemberType;
  billingCycle: 'monthly' | 'annual';
  
  // Step 2: Seat Configuration
  seatCount: number;
  pricing: PricingBreakdownData | null;
  
  // Step 3: Member Selection
  assignmentMode: AssignmentMode;
  selectedMemberIds: string[];
  poolName: string;
  autoAssignNewMembers: boolean;
  
  // Step 4: Review & Payment
  billingEmail: string;
  billingName: string;
  gstNumber: string;
  agreeToTerms: boolean;
}

interface BulkPurchaseWizardProps {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  organizationName: string;
  availablePlans: Plan[];
  availableMembers: Member[];
  onComplete: (purchaseData: PurchaseData) => Promise<void>;
  onCancel: () => void;
  onMemberAdded?: () => void;
  isLoading?: boolean;
}

export interface PurchaseData {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  planId: string;
  seatCount: number;
  memberType: MemberType;
  billingCycle: 'monthly' | 'annual';
  pricing: PricingBreakdownData;
  assignmentMode: AssignmentMode;
  selectedMemberIds: string[];
  poolName?: string;
  autoAssignNewMembers: boolean;
  billingEmail: string;
  billingName: string;
  gstNumber?: string;
}

const STEPS = [
  { id: 1, title: 'Select Plan', icon: ShoppingCart },
  { id: 2, title: 'Configure Seats', icon: Settings },
  { id: 3, title: 'Select Members', icon: Users },
  { id: 4, title: 'Review & Pay', icon: CreditCard },
];

const initialState: WizardState = {
  selectedPlan: null,
  memberType: 'both',
  billingCycle: 'annual',
  seatCount: 10,
  pricing: null,
  assignmentMode: 'auto-all',
  selectedMemberIds: [],
  poolName: '',
  autoAssignNewMembers: true,
  billingEmail: '',
  billingName: '',
  gstNumber: '',
  agreeToTerms: false,
};

function BulkPurchaseWizard({
  organizationId,
  organizationType,
  organizationName,
  availablePlans,
  availableMembers,
  onComplete,
  onCancel,
  onMemberAdded,
  isLoading = false,
}: BulkPurchaseWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Filter members by type
  const filteredMembers = useMemo(() => {
    if (state.memberType === 'both') return availableMembers;
    return availableMembers.filter((m) => m.type === state.memberType);
  }, [availableMembers, state.memberType]);

  // Validation for each step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return state.selectedPlan !== null;
      case 2:
        return state.seatCount > 0 && state.pricing !== null;
      case 3:
        if (state.assignmentMode === 'select-specific') {
          return state.selectedMemberIds.length > 0 && 
                 state.selectedMemberIds.length <= state.seatCount;
        }
        if (state.assignmentMode === 'create-pool') {
          return state.poolName.trim().length > 0;
        }
        return true; // auto-all is always valid
      case 4:
        return state.billingEmail.trim() !== '' && 
               state.billingName.trim() !== '' && 
               state.agreeToTerms;
      default:
        return false;
    }
  }, [currentStep, state]);

  // Handlers
  const handleNext = useCallback(() => {
    if (currentStep < 4 && canProceed) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, canProceed]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handlePlanSelect = useCallback((plan: Plan) => {
    setState((prev) => ({ ...prev, selectedPlan: plan }));
  }, []);

  const handleSeatCountChange = useCallback(
    (count: number, pricing: PricingBreakdownData) => {
      setState((prev) => ({ ...prev, seatCount: count, pricing }));
    },
    []
  );

  const handleMemberToggle = useCallback((memberId: string) => {
    setState((prev) => {
      const isSelected = prev.selectedMemberIds.includes(memberId);
      return {
        ...prev,
        selectedMemberIds: isSelected
          ? prev.selectedMemberIds.filter((id) => id !== memberId)
          : [...prev.selectedMemberIds, memberId],
      };
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedMemberIds: filteredMembers.slice(0, prev.seatCount).map((m) => m.id),
    }));
  }, [filteredMembers]);

  const handleClearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedMemberIds: [] }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!state.selectedPlan || !state.pricing) return;

    setIsSubmitting(true);
    try {
      await onComplete({
        organizationId,
        organizationType,
        planId: state.selectedPlan.id,
        seatCount: state.seatCount,
        memberType: state.memberType,
        billingCycle: state.billingCycle,
        pricing: state.pricing,
        assignmentMode: state.assignmentMode,
        selectedMemberIds: state.selectedMemberIds,
        poolName: state.assignmentMode === 'create-pool' ? state.poolName : undefined,
        autoAssignNewMembers: state.autoAssignNewMembers,
        billingEmail: state.billingEmail,
        billingName: state.billingName,
        gstNumber: state.gstNumber || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [state, onComplete, organizationId, organizationType]);

  const organizationLabel = {
    school: 'School',
    college: 'College',
    university: 'University',
  }[organizationType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Bulk Purchase for {organizationName}
                </h2>
                <p className="text-sm text-gray-500">{organizationLabel} Subscription</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="mt-6 flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium hidden sm:block ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Plan Selection */}
          {currentStep === 1 && (
            <Step1PlanSelection
              plans={availablePlans}
              selectedPlan={state.selectedPlan}
              memberType={state.memberType}
              billingCycle={state.billingCycle}
              onPlanSelect={handlePlanSelect}
              onMemberTypeChange={(type) => setState((prev) => ({ ...prev, memberType: type }))}
              onBillingCycleChange={(cycle) => setState((prev) => ({ ...prev, billingCycle: cycle }))}
            />
          )}

          {/* Step 2: Seat Configuration */}
          {currentStep === 2 && state.selectedPlan && (
            <Step2SeatConfiguration
              plan={state.selectedPlan}
              seatCount={state.seatCount}
              pricing={state.pricing}
              billingCycle={state.billingCycle}
              onSeatCountChange={handleSeatCountChange}
            />
          )}

          {/* Step 3: Member Selection */}
          {currentStep === 3 && (
            <Step3MemberSelection
              members={filteredMembers}
              seatCount={state.seatCount}
              assignmentMode={state.assignmentMode}
              selectedMemberIds={state.selectedMemberIds}
              poolName={state.poolName}
              autoAssignNewMembers={state.autoAssignNewMembers}
              isLoading={isLoading}
              onAssignmentModeChange={(mode) => setState((prev) => ({ ...prev, assignmentMode: mode }))}
              onMemberToggle={handleMemberToggle}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onPoolNameChange={(name) => setState((prev) => ({ ...prev, poolName: name }))}
              onAutoAssignChange={(auto) => setState((prev) => ({ ...prev, autoAssignNewMembers: auto }))}
              onAddStudent={() => setShowAddStudentModal(true)}
            />
          )}

          {/* Step 4: Review & Payment */}
          {currentStep === 4 && state.selectedPlan && state.pricing && (
            <Step4ReviewPayment
              plan={state.selectedPlan}
              state={state}
              filteredMembers={filteredMembers}
              organizationName={organizationName}
              onBillingEmailChange={(email) => setState((prev) => ({ ...prev, billingEmail: email }))}
              onBillingNameChange={(name) => setState((prev) => ({ ...prev, billingName: name }))}
              onGstNumberChange={(gst) => setState((prev) => ({ ...prev, gstNumber: gst }))}
              onAgreeToTermsChange={(agree) => setState((prev) => ({ ...prev, agreeToTerms: agree }))}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting || isLoading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Complete Purchase
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShowAddStudentModal(false);
          onMemberAdded?.();
        }}
      />
    </div>
  );
}

// Step 1: Plan Selection Component
interface Step1Props {
  plans: Plan[];
  selectedPlan: Plan | null;
  memberType: MemberType;
  billingCycle: 'monthly' | 'annual';
  onPlanSelect: (plan: Plan) => void;
  onMemberTypeChange: (type: MemberType) => void;
  onBillingCycleChange: (cycle: 'monthly' | 'annual') => void;
}

function Step1PlanSelection({
  plans,
  selectedPlan,
  memberType,
  billingCycle,
  onPlanSelect,
  onMemberTypeChange,
  onBillingCycleChange,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose a Subscription Plan
        </h3>
        <p className="text-sm text-gray-500">
          Select the plan that best fits your organization's needs
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Billing Cycle
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBillingCycleChange('monthly')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onBillingCycleChange('annual')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors relative ${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Member Type Selector */}
      <MemberTypeSelector
        value={memberType}
        onChange={onMemberTypeChange}
        showDescription={true}
        layout="horizontal"
      />

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const displayPrice = billingCycle === 'annual' 
            ? Math.round(plan.price * 0.83) 
            : plan.price;

          return (
            <button
              key={plan.id}
              onClick={() => onPlanSelect(plan)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  ₹{displayPrice}
                </span>
                <span className="text-sm text-gray-500">/seat/{billingCycle === 'annual' ? 'year' : 'month'}</span>
              </div>
              {plan.description && (
                <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
              )}
              <ul className="space-y-1">
                {plan.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// Step 2: Seat Configuration Component
interface Step2Props {
  plan: Plan;
  seatCount: number;
  pricing: PricingBreakdownData | null;
  billingCycle: 'monthly' | 'annual';
  onSeatCountChange: (count: number, pricing: PricingBreakdownData) => void;
}

function Step2SeatConfiguration({
  plan,
  seatCount,
  pricing,
  billingCycle,
  onSeatCountChange,
}: Step2Props) {
  const displayPrice = billingCycle === 'annual' 
    ? Math.round(plan.price * 0.83) 
    : plan.price;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configure Seat Count
        </h3>
        <p className="text-sm text-gray-500">
          Choose how many seats you need. Volume discounts apply automatically.
        </p>
      </div>

      {/* Selected Plan Summary */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-600 font-medium">Selected Plan</p>
          <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-blue-600 font-medium">Base Price</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{displayPrice}/seat
          </p>
        </div>
      </div>

      {/* Seat Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Number of Seats
        </label>
        <SeatSelector
          basePrice={displayPrice}
          initialSeats={seatCount}
          onSeatCountChange={onSeatCountChange}
          showVolumeDiscounts={true}
        />
      </div>

      {/* Pricing Breakdown */}
      {pricing && (
        <PricingBreakdown
          pricing={pricing}
          billingCycle={billingCycle}
          showPerSeatPrice={true}
        />
      )}

      {/* Volume Discount Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">
          Volume Discount Tiers
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className={`p-2 rounded-lg ${seatCount >= 50 && seatCount < 100 ? 'bg-green-100 ring-2 ring-green-400' : 'bg-white/50'}`}>
            <p className="text-lg font-bold text-green-700">10%</p>
            <p className="text-xs text-green-600">50+ seats</p>
          </div>
          <div className={`p-2 rounded-lg ${seatCount >= 100 && seatCount < 500 ? 'bg-green-100 ring-2 ring-green-400' : 'bg-white/50'}`}>
            <p className="text-lg font-bold text-green-700">20%</p>
            <p className="text-xs text-green-600">100+ seats</p>
          </div>
          <div className={`p-2 rounded-lg ${seatCount >= 500 ? 'bg-green-100 ring-2 ring-green-400' : 'bg-white/50'}`}>
            <p className="text-lg font-bold text-green-700">30%</p>
            <p className="text-xs text-green-600">500+ seats</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Member Selection Component
interface Step3Props {
  members: Member[];
  seatCount: number;
  assignmentMode: AssignmentMode;
  selectedMemberIds: string[];
  poolName: string;
  autoAssignNewMembers: boolean;
  isLoading?: boolean;
  onAssignmentModeChange: (mode: AssignmentMode) => void;
  onMemberToggle: (memberId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onPoolNameChange: (name: string) => void;
  onAutoAssignChange: (auto: boolean) => void;
  onAddStudent: () => void;
}

function Step3MemberSelection({
  members,
  seatCount,
  assignmentMode,
  selectedMemberIds,
  poolName,
  autoAssignNewMembers,
  isLoading = false,
  onAssignmentModeChange,
  onMemberToggle,
  onSelectAll,
  onClearSelection,
  onPoolNameChange,
  onAutoAssignChange,
  onAddStudent,
}: Step3Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            How would you like to assign licenses?
          </h3>
          <p className="text-sm text-gray-500">
            You have {seatCount} seats to assign. Choose your assignment method.
          </p>
        </div>
        <button
          onClick={onAddStudent}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Assignment Mode Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onAssignmentModeChange('auto-all')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            assignmentMode === 'auto-all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Auto-assign All</span>
          </div>
          <p className="text-sm text-gray-500">
            Automatically assign to all current members (up to {seatCount} seats)
          </p>
        </button>

        <button
          onClick={() => onAssignmentModeChange('select-specific')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            assignmentMode === 'select-specific'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Select Specific</span>
          </div>
          <p className="text-sm text-gray-500">
            Choose specific members to receive licenses
          </p>
        </button>

        <button
          onClick={() => onAssignmentModeChange('create-pool')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            assignmentMode === 'create-pool'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Create Pool</span>
          </div>
          <p className="text-sm text-gray-500">
            Create a license pool for later assignment
          </p>
        </button>
      </div>

      {/* Auto-assign All Options */}
      {assignmentMode === 'auto-all' && (
        <div className="bg-blue-50 rounded-xl p-4">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading members...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {members.length === 0 
                    ? 'No members available to assign'
                    : `${Math.min(members.length, seatCount)} members will be assigned`}
                </p>
                <p className="text-sm text-gray-500">
                  {members.length === 0
                    ? 'Add students or educators to your organization first'
                    : members.length > seatCount
                    ? `${members.length - seatCount} members won't receive licenses (not enough seats)`
                    : 'All current members will receive licenses'}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAssignNewMembers}
                  onChange={(e) => onAutoAssignChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-assign new members</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Select Specific Members */}
      {assignmentMode === 'select-specific' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Select All
              </button>
              <button
                onClick={onClearSelection}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Selected: {selectedMemberIds.length} / {seatCount} seats
          </div>

          <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="mb-2">No members found</p>
                <p className="text-xs text-gray-400 mb-3">
                  {members.length === 0 
                    ? 'Add students or educators to your organization first'
                    : 'Try a different search term'}
                </p>
                <button
                  onClick={onAddStudent}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Student
                </button>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);
                const isDisabled = !isSelected && selectedMemberIds.length >= seatCount;

                return (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && onMemberToggle(member.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        member.type === 'educator'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {member.type}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Pool Options */}
      {assignmentMode === 'create-pool' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pool Name
            </label>
            <input
              type="text"
              placeholder="e.g., Computer Science Department, Grade 10"
              value={poolName}
              onChange={(e) => onPoolNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAssignNewMembers}
              onChange={(e) => onAutoAssignChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Automatically assign licenses to new members who join this pool
            </span>
          </label>

          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Licenses will not be assigned immediately. 
              You can assign them later from the License Pool Manager in your dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


// Step 4: Review & Payment Component
interface Step4Props {
  plan: Plan;
  state: WizardState;
  filteredMembers: Member[];
  organizationName: string;
  onBillingEmailChange: (email: string) => void;
  onBillingNameChange: (name: string) => void;
  onGstNumberChange: (gst: string) => void;
  onAgreeToTermsChange: (agree: boolean) => void;
}

function Step4ReviewPayment({
  plan,
  state,
  filteredMembers,
  organizationName,
  onBillingEmailChange,
  onBillingNameChange,
  onGstNumberChange,
  onAgreeToTermsChange,
}: Step4Props) {
  const assignmentSummary = useMemo(() => {
    switch (state.assignmentMode) {
      case 'auto-all':
        return `Auto-assign to ${Math.min(filteredMembers.length, state.seatCount)} members`;
      case 'select-specific':
        return `Assign to ${state.selectedMemberIds.length} selected members`;
      case 'create-pool':
        return `Create pool "${state.poolName}" for later assignment`;
      default:
        return '';
    }
  }, [state.assignmentMode, state.selectedMemberIds.length, state.poolName, filteredMembers.length, state.seatCount]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Review Your Purchase
        </h3>
        <p className="text-sm text-gray-500">
          Please review the details below before completing your purchase
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <h4 className="font-medium text-gray-900">Order Summary</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Organization</p>
            <p className="font-medium text-gray-900">{organizationName}</p>
          </div>
          <div>
            <p className="text-gray-500">Plan</p>
            <p className="font-medium text-gray-900">{plan.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Billing Cycle</p>
            <p className="font-medium text-gray-900 capitalize">{state.billingCycle}</p>
          </div>
          <div>
            <p className="text-gray-500">Member Type</p>
            <p className="font-medium text-gray-900 capitalize">{state.memberType}</p>
          </div>
          <div>
            <p className="text-gray-500">Seats</p>
            <p className="font-medium text-gray-900">{state.seatCount}</p>
          </div>
          <div>
            <p className="text-gray-500">Assignment</p>
            <p className="font-medium text-gray-900">{assignmentSummary}</p>
          </div>
        </div>

        {/* Pricing Summary */}
        {state.pricing && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({state.seatCount} seats × ₹{state.pricing.basePrice})</span>
                <span className="text-gray-900">₹{state.pricing.subtotal.toLocaleString()}</span>
              </div>
              {state.pricing.discountPercentage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Volume Discount ({state.pricing.discountPercentage}%)</span>
                  <span>-₹{state.pricing.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">GST (18%)</span>
                <span className="text-gray-900">₹{state.pricing.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{state.pricing.finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Billing Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Organization or contact name"
              value={state.billingName}
              onChange={(e) => onBillingNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="billing@organization.com"
              value={state.billingEmail}
              onChange={(e) => onBillingEmailChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 22AAAAA0000A1Z5"
              value={state.gstNumber}
              onChange={(e) => onGstNumberChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide your GST number for tax invoice purposes
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={state.agreeToTerms}
            onChange={(e) => onAgreeToTermsChange(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
              Privacy Policy
            </a>
            . I understand that this is a recurring subscription that will auto-renew 
            unless cancelled.
          </span>
        </label>
      </div>

      {/* Payment Security Notice */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>
          Secure payment powered by Razorpay. Your payment information is encrypted and secure.
        </span>
      </div>
    </div>
  );
}

export default memo(BulkPurchaseWizard);
