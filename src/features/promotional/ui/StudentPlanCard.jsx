/**
 * StudentPlanCard - Individual student pricing card component
 * Matches the reference design with ESFE Special pricing
 */

import { memo } from 'react';
import { Check } from 'lucide-react';

const StudentPlanCard = memo(({ plan, isSelected, onSelect, isPromoActive }) => {
  const hasEsfePrice = isPromoActive && plan.esfe_active && plan.esfe_price;
  const displayPrice = hasEsfePrice ? plan.esfe_price : plan.price;
  const originalPrice = plan.price;
  const discountPercent = hasEsfePrice ? plan.esfe_discount_percent : 0;
  
  return (
    <div 
      onClick={() => onSelect(plan)}
      className={`relative flex flex-col bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected 
          ? 'border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.02]' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      {/* Recommended Badge */}
      {plan.is_recommended && (
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-b-xl shadow-lg">
            Recommended
          </div>
        </div>
      )}
      
      <div className="p-6 pt-8 flex flex-col flex-1">
        {/* Plan Name */}
        <h3 className={`text-xl font-bold text-center mb-3 ${
          plan.tier_name === 'Professional' ? 'text-blue-600' : 'text-gray-900'
        }`}>
          {plan.tier_name}
        </h3>
        
        {/* ESFE Special Badge */}
        {hasEsfePrice && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-sm">
              <span>✨</span> ESFE Special
            </span>
          </div>
        )}
        
        {/* Pricing */}
        <div className="text-center mb-3">
          {/* Original Price (crossed out) */}
          {hasEsfePrice && (
            <div className="text-gray-400 text-lg line-through mb-1">
              ₹{originalPrice.toLocaleString()}
            </div>
          )}
          
          {/* Display Price */}
          <div className={`text-4xl font-bold ${
            plan.tier_name === 'Professional' ? 'text-emerald-600' : 'text-gray-900'
          }`}>
            ₹{displayPrice.toLocaleString()}
          </div>
          
          {/* Per Month Label */}
          <div className="text-gray-500 text-sm mt-1">
            per month
          </div>
          
          {/* Savings Badge */}
          {hasEsfePrice && discountPercent > 0 && (
            <div className="flex justify-center mt-2">
              <span className="inline-flex items-center px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                Save {discountPercent}%
              </span>
            </div>
          )}
        </div>
        
        {/* Features List */}
        <ul className="space-y-3 mt-4 flex-1">
          {(plan.features || []).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-gray-600 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Select Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(plan);
          }}
          className={`w-full mt-6 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isSelected
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSelected && <Check className="w-5 h-5" strokeWidth={2.5} />}
          {isSelected ? 'Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
});

StudentPlanCard.displayName = 'StudentPlanCard';

export default StudentPlanCard;
