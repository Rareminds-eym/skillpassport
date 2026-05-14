#!/usr/bin/env python3
"""
Script to add feature gating to Opportunities page and improve upgrade prompt styling
"""

import re
from pathlib import Path

def update_opportunities_page():
    """Add feature gating to the Opportunities page Apply Now button"""
    opportunities_file = Path('src/pages/learner/Opportunities.jsx')
    
    if not opportunities_file.exists():
        print(f"❌ File not found: {opportunities_file}")
        return False
    
    content = opportunities_file.read_text(encoding='utf-8')
    
    # Add imports at the top
    import_pattern = r"(import.*from\s+['\"]react['\"];)"
    import_addition = r"\1\nimport { useState } from 'react';\nimport { useNavigate } from 'react-router-dom';\nimport { LockClosedIcon } from 'lucide-react';\nimport { useUser } from '@/shared/model/authStore';\nimport { useSubscriptionContext } from '@/features/subscription/model/subscriptionStore';\nimport { checkFeatureAccess } from '@/features/subscription/lib/featureGating';\nimport { PLAN_IDS } from '@/shared/config/subscriptionPlans';"
    
    if 'checkFeatureAccess' not in content:
        content = re.sub(import_pattern, import_addition, content, count=1)
    
    # Add state and hooks in the component
    component_start = r"(const\s+Opportunities\s*=\s*\(\)\s*=>\s*\{)"
    hooks_addition = r"\1\n  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);\n  const navigate = useNavigate();\n  const user = useUser();\n  const subscriptionContext = useSubscriptionContext();\n  const subscription = subscriptionContext?.subscription;\n  const userPlan = subscription?.plan || PLAN_IDS.PAY_AS_YOU_GO;\n  \n  // Check feature access for job applications\n  const accessResult = checkFeatureAccess(userPlan, 'opportunities_access', [], {}, user?.id);\n  const canApply = accessResult.hasAccess;\n"
    
    if 'canApply' not in content:
        content = re.sub(component_start, hooks_addition, content, count=1)
    
    # Find and replace Apply Now button handlers
    # This is a generic pattern - adjust based on actual button implementation
    apply_pattern = r"(onClick=\{[^}]*handleApply[^}]*\})"
    
    # Add upgrade prompt modal before the return statement
    modal_code = '''
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
              <LockClosedIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Upgrade Required</h3>
            <p className="text-gray-600 text-center mb-6">
              Job applications are not available on the Freemium plan. Upgrade to a paid plan to apply for opportunities.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUpgradePrompt(false);
                  navigate('/subscription/plans?type=learner');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
'''
    
    # Add modal before the closing of the main component
    if 'showUpgradePrompt' not in content or 'Upgrade Required' not in content:
        # Find the last return statement's closing
        content = content.replace('</div>\n    </>\n  );\n};', f'{modal_code}\n      </div>\n    </>\n  );\n}}')
    
    opportunities_file.write_text(content, encoding='utf-8')
    print(f"✅ Updated: {opportunities_file}")
    return True

def update_course_modal_blur():
    """Update CourseDetailModal to have better backdrop blur"""
    modal_file = Path('src/features/courses/ui/CourseDetailModal.jsx')
    
    if not modal_file.exists():
        print(f"❌ File not found: {modal_file}")
        return False
    
    content = modal_file.read_text(encoding='utf-8')
    
    # Update the upgrade prompt modal backdrop
    old_backdrop = 'className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"'
    new_backdrop = 'className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] backdrop-blur-sm"'
    
    content = content.replace(old_backdrop, new_backdrop)
    
    modal_file.write_text(content, encoding='utf-8')
    print(f"✅ Updated: {modal_file}")
    return True

def update_header_modal_blur():
    """Update Header component upgrade prompt to have better backdrop blur"""
    header_file = Path('src/widgets/learner-dashboard/ui/Header.jsx')
    
    if not header_file.exists():
        print(f"❌ File not found: {header_file}")
        return False
    
    content = header_file.read_text(encoding='utf-8')
    
    # Update the upgrade prompt modal backdrop
    old_backdrop = 'className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"'
    new_backdrop = 'className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"'
    
    content = content.replace(old_backdrop, new_backdrop)
    
    header_file.write_text(content, encoding='utf-8')
    print(f"✅ Updated: {header_file}")
    return True

def main():
    print("🚀 Starting feature gating fixes...\n")
    
    success = True
    success &= update_opportunities_page()
    success &= update_course_modal_blur()
    success &= update_header_modal_blur()
    
    if success:
        print("\n✅ All updates completed successfully!")
        print("\nNext steps:")
        print("1. Clear build cache: rm -rf .wrangler/tmp/* node_modules/.vite")
        print("2. Restart dev server: npm run dev")
    else:
        print("\n❌ Some updates failed. Please check the errors above.")
    
    return 0 if success else 1

if __name__ == '__main__':
    exit(main())
