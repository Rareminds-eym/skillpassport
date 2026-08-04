import { X, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2Details } from './steps/Step2Details';
import { Step3AddressLogo } from './steps/Step3AddressLogo';
import { Step4InviteRecruiter } from './steps/Step4InviteRecruiter';

interface OrgSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialProgress: {
    step1_completed: boolean;
    step2_completed: boolean;
    step3_completed: boolean;
    step3_skipped: boolean;
    step4_completed: boolean;
  };
  orgData: {
    name?: string;
    workEmail?: string;
    industry?: string;
    companySize?: string;
    address?: string;
    city?: string;
    country?: string;
    logoUrl?: string;
  };
}

export const OrgSetupModal: React.FC<OrgSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialProgress,
  orgData,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(initialProgress);

  // Determine which step to show on open
  useEffect(() => {
    if (isOpen) {
      if (!progress.step1_completed) {
        setCurrentStep(1);
      } else if (!progress.step2_completed) {
        setCurrentStep(2);
      } else if (!progress.step3_completed && !progress.step3_skipped) {
        setCurrentStep(3);
      } else if (!progress.step4_completed) {
        setCurrentStep(4);
      } else {
        setCurrentStep(1); // All done, show step 1 for review
      }
    }
  }, [isOpen, progress]);

  if (!isOpen) return null;

  const handleStepComplete = (step: number) => {
    setProgress((prev) => ({
      ...prev,
      [`step${step}_completed`]: true,
    }));

    // Move to next incomplete step
    if (step < 4) {
      setCurrentStep(step + 1);
    } else {
      // All steps complete
      onComplete();
    }
  };

  const handleStep3Skip = () => {
    setProgress((prev) => ({
      ...prev,
      step3_skipped: true,
    }));
    setCurrentStep(4);
  };

  const steps = [
    {
      number: 1,
      title: 'Organization Info',
      completed: progress.step1_completed,
    },
    {
      number: 2,
      title: 'Business Details',
      completed: progress.step2_completed,
    },
    {
      number: 3,
      title: 'Address & Logo',
      completed: progress.step3_completed || progress.step3_skipped,
      optional: true,
    },
    {
      number: 4,
      title: 'Invite Team',
      completed: progress.step4_completed,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Organization Setup
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {completedCount === 4
                    ? '🎉 Setup complete! You can review or update your information anytime.'
                    : `Complete ${4 - completedCount} more ${4 - completedCount === 1 ? 'step' : 'steps'} to finish setup.`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="mt-4 flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1
                      ${currentStep === step.number
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : step.completed
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-gray-50 border-2 border-gray-200'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${step.completed
                          ? 'bg-green-500 text-white'
                          : currentStep === step.number
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }
                      `}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        className={`
                          text-xs font-semibold truncate
                          ${currentStep === step.number
                            ? 'text-blue-900'
                            : step.completed
                              ? 'text-green-900'
                              : 'text-gray-600'
                          }
                        `}
                      >
                        {step.title}
                      </div>
                      {step.optional && (
                        <div className="text-[10px] text-gray-500">Optional</div>
                      )}
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="w-2 h-0.5 bg-gray-300 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {currentStep === 1 && (
              <Step1BasicInfo
                onComplete={() => handleStepComplete(1)}
                isCompleted={progress.step1_completed}
                initialData={{
                  name: orgData.name,
                  workEmail: orgData.workEmail,
                }}
              />
            )}
            {currentStep === 2 && (
              <Step2Details
                onComplete={() => handleStepComplete(2)}
                isCompleted={progress.step2_completed}
                initialData={{
                  industry: orgData.industry,
                  companySize: orgData.companySize,
                }}
              />
            )}
            {currentStep === 3 && (
              <Step3AddressLogo
                onComplete={() => handleStepComplete(3)}
                onSkip={handleStep3Skip}
                isCompleted={progress.step3_completed}
                isSkipped={progress.step3_skipped}
                initialData={{
                  address: orgData.address,
                  city: orgData.city,
                  country: orgData.country,
                  logoUrl: orgData.logoUrl,
                }}
              />
            )}
            {currentStep === 4 && (
              <Step4InviteRecruiter
                onComplete={() => handleStepComplete(4)}
                isCompleted={progress.step4_completed}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
