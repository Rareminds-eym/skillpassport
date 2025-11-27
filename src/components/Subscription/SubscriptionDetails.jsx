/**
 * SubscriptionDetails Component
 * Displays subscription information with distinct styling from transaction details
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @param {Object} props
 * @param {string} props.planType - The subscription plan type (e.g., "Premium", "Basic")
 * @param {string} props.billingCycle - The billing cycle duration (e.g., "monthly", "yearly")
 * @param {string} props.startDate - Formatted subscription start date
 * @param {string} props.endDate - Formatted subscription end date
 */
function SubscriptionDetails({ planType, billingCycle, startDate, endDate }) {
  // Format billing cycle for display
  const formatBillingCycle = (cycle) => {
    if (!cycle) return 'N/A';
    
    const cycleMap = {
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'yearly': 'Yearly',
      'annual': 'Yearly'
    };
    
    return cycleMap[cycle.toLowerCase()] || cycle;
  };

  return (
    <section 
      className="bg-blue-50 rounded-xl p-6 border border-blue-200"
      role="region"
      aria-labelledby="subscription-details-heading"
    >
      <h2 
        className="text-lg font-semibold text-gray-900 mb-4"
        id="subscription-details-heading"
      >
        Subscription Details
      </h2>
      
      <dl className="space-y-3">
        {/* Plan Type */}
        <div className="flex justify-between items-center">
          <dt className="text-sm text-gray-600" id="plan-type-label">Plan</dt>
          <dd 
            className="text-sm font-medium text-gray-900"
            aria-labelledby="plan-type-label"
          >
            {planType || 'N/A'}
          </dd>
        </div>

        {/* Billing Cycle */}
        <div className="flex justify-between items-center">
          <dt className="text-sm text-gray-600" id="billing-cycle-label">Billing Cycle</dt>
          <dd 
            className="text-sm font-medium text-gray-900"
            aria-labelledby="billing-cycle-label"
          >
            {formatBillingCycle(billingCycle)}
          </dd>
        </div>

        {/* Start Date */}
        <div className="flex justify-between items-center">
          <dt className="text-sm text-gray-600" id="start-date-label">Start Date</dt>
          <dd 
            className="text-sm font-medium text-gray-900"
            aria-labelledby="start-date-label"
          >
            {startDate || 'N/A'}
          </dd>
        </div>

        {/* End Date */}
        <div className="flex justify-between items-center">
          <dt className="text-sm text-gray-600" id="end-date-label">End Date</dt>
          <dd 
            className="text-sm font-medium text-gray-900"
            aria-labelledby="end-date-label"
          >
            {endDate || 'N/A'}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default SubscriptionDetails;
