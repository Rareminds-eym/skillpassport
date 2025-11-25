/**
 * TransactionGrid Component
 * Displays transaction details in a 2x2 grid layout
 * 
 * @param {Object} props
 * @param {string} props.referenceNumber - Payment reference/transaction ID
 * @param {string} props.paymentTime - Formatted payment timestamp
 * @param {string} props.paymentMethod - Payment method used
 * @param {string} props.senderName - Name of the person who made the payment
 */
function TransactionGrid({ 
  referenceNumber, 
  paymentTime, 
  paymentMethod, 
  senderName 
}) {
  const gridItems = [
    { label: 'Reference Number', value: referenceNumber, mono: true },
    { label: 'Payment Time', value: paymentTime },
    { label: 'Payment Method', value: paymentMethod },
    { label: 'Sender Name', value: senderName }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {gridItems.map((item, index) => (
        <div 
          key={index}
          className="border border-gray-600 rounded-lg p-4 bg-gray-700/50"
        >
          <dt className="text-xs sm:text-sm text-gray-300 mb-1">{item.label}</dt>
          <dd className={`text-sm sm:text-base font-medium text-white break-words ${item.mono ? 'font-mono' : ''}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </div>
  );
}

export default TransactionGrid;
