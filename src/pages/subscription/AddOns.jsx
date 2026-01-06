/**
 * AddOns Page
 * 
 * Full-page add-on marketplace with category filters, search, and bundle section.
 * 
 * @requirement Task 6.2 - Create AddOns page
 */

import { ArrowLeft, Package, Sparkles } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AddOnCheckout } from '../../components/subscription/AddOnCheckout';
import { AddOnMarketplace } from '../../components/subscription/AddOnMarketplace';
import useAuth from '../../hooks/useAuth';

function AddOns() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();
  
  // Check if we're in checkout mode
  const checkoutMode = searchParams.get('checkout') === 'true';

  // Get role for filtering add-ons
  const userRole = user?.user_metadata?.role || user?.raw_user_meta_data?.role || role || 'student';

  // Map user roles to add-on categories
  const getAddOnRole = useCallback(() => {
    const roleMapping = {
      'student': 'student',
      'school_student': 'student',
      'college_student': 'student',
      'educator': 'educator',
      'school_educator': 'educator',
      'college_educator': 'educator',
      'admin': 'admin',
      'school_admin': 'admin',
      'college_admin': 'admin',
      'university_admin': 'admin',
      'recruiter': 'recruiter',
      'company_admin': 'recruiter',
    };
    return roleMapping[userRole] || 'student';
  }, [userRole]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (checkoutMode) {
      navigate('/subscription/add-ons');
    } else {
      navigate(-1);
    }
  }, [navigate, checkoutMode]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {checkoutMode ? 'Back to Add-ons' : 'Back'}
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {checkoutMode ? (
                  <>
                    <Package className="w-6 h-6 text-indigo-600" />
                    Checkout
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                    Add-On Marketplace
                  </>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {checkoutMode 
                  ? 'Complete your purchase'
                  : 'Enhance your experience with premium features'
                }
              </p>
            </div>
            
            {!checkoutMode && (
              <button
                onClick={() => navigate('/subscription/manage')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                My Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {checkoutMode ? (
          <AddOnCheckout 
            onSuccess={() => navigate('/subscription/manage?success=true')}
            onCancel={() => navigate('/subscription/add-ons')}
          />
        ) : (
          <AddOnMarketplace 
            role={getAddOnRole()}
            showBundles={true}
          />
        )}
      </div>

      {/* Help Section */}
      {!checkoutMode && (
        <div className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Need Help Choosing?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Not sure which add-ons are right for you? Our team can help you find the perfect combination for your needs.
              </p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="mailto:support@skillpassport.in?subject=Add-On%20Inquiry"
                  className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Contact Support
                </a>
                <button
                  onClick={() => navigate('/subscription/plans')}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddOns;
