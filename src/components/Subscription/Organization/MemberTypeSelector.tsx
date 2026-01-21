/**
 * MemberTypeSelector Component
 *
 * Allows organization admins to select which member types will receive the subscription.
 * Options: Educators only, Students only, or Both.
 */

import { GraduationCap, UserCheck, Users } from 'lucide-react';
import { memo, useCallback } from 'react';

export type MemberType = 'educator' | 'student' | 'both';

interface MemberTypeOption {
  value: MemberType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const MEMBER_TYPE_OPTIONS: MemberTypeOption[] = [
  {
    value: 'educator',
    label: 'Educators Only',
    description: 'Teachers, professors, and instructors',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    value: 'student',
    label: 'Students Only',
    description: 'Enrolled students and learners',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    value: 'both',
    label: 'Both',
    description: 'All educators and students',
    icon: <Users className="w-5 h-5" />,
  },
];

interface MemberTypeSelectorProps {
  value: MemberType;
  onChange: (memberType: MemberType) => void;
  disabled?: boolean;
  showDescription?: boolean;
  layout?: 'horizontal' | 'vertical';
}

function MemberTypeSelector({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  layout = 'horizontal',
}: MemberTypeSelectorProps) {
  const handleSelect = useCallback(
    (memberType: MemberType) => {
      if (!disabled) {
        onChange(memberType);
      }
    },
    [disabled, onChange]
  );

  const containerClass = layout === 'horizontal' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-3';

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Who will use this subscription?
      </label>

      <div className={containerClass}>
        {MEMBER_TYPE_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={disabled}
              className={`
                relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${layout === 'vertical' ? 'w-full' : ''}
              `}
              aria-pressed={isSelected}
              aria-label={`Select ${option.label}`}
            >
              {/* Radio indicator */}
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
                `}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              {/* Icon */}
              <div
                className={`
                  flex-shrink-0
                  ${isSelected ? 'text-blue-600' : 'text-gray-400'}
                `}
              >
                {option.icon}
              </div>

              {/* Label and description */}
              <div className="flex-1 text-left">
                <div
                  className={`
                    font-medium text-sm
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                  `}
                >
                  {option.label}
                </div>
                {showDescription && (
                  <div
                    className={`
                      text-xs mt-0.5
                      ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                    `}
                  >
                    {option.description}
                  </div>
                )}
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {value === 'both'
          ? 'Licenses can be assigned to any member type'
          : `Licenses can only be assigned to ${value}s`}
      </p>
    </div>
  );
}

export default memo(MemberTypeSelector);
