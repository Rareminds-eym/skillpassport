import { X, Check } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  featureName: string;
  availablePlans: Array<{
    name: string;
    price: number;
    duration: string;
    recommended?: boolean;
  }>;
  onClose: () => void;
}

export function UpgradePrompt({ 
  featureName, 
  availablePlans, 
  onClose 
}: UpgradePromptProps) {
  const navigate = useNavigate();

  // Memoize plan selection handler
  const handleSelectPlan = useCallback(() => {
    navigate('/subscription/plans/learner/purchase');
    onClose();
  }, [navigate, onClose]);

  // Memoize sorted plans (recommended first)
  const sortedPlans = useMemo(
    () => [...availablePlans].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)),
    [availablePlans]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-light text-slate-900 mb-2" 
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            Unlock {featureName}
          </h2>
          <p className="text-slate-600">
            Choose a plan to access this feature
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {sortedPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                plan.recommended
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                    Recommended
                  </span>
                </div>
              )}

              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {plan.name}
              </h3>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{plan.price}
                </span>
                <span className="text-slate-500"> ({plan.duration})</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
                <Check className="h-4 w-4" />
                <span>Includes {featureName}</span>
              </div>

              <button
                onClick={handleSelectPlan}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.recommended
                    ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black shadow-lg'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSelectPlan}
          className="w-full py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
        >
          View All Plans
        </button>
      </div>
    </div>
  );
}
