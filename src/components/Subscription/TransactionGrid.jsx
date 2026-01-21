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
function TransactionGrid({ referenceNumber, paymentTime, paymentMethod, senderName }) {
  const gridItems = [
    { label: 'Reference Number', value: referenceNumber, mono: true, id: 'ref-number' },
    { label: 'Payment Time', value: paymentTime, id: 'payment-time' },
    { label: 'Payment Method', value: paymentMethod, id: 'payment-method' },
    { label: 'Sender Name', value: senderName, id: 'sender-name' },
  ];

  return (
    <dl
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      role="list"
      aria-label="Transaction details"
    >
      {gridItems.map((item, index) => (
        <div
          key={index}
          className="border border-gray-600 rounded-lg p-4 bg-gray-700/50"
          role="listitem"
        >
          <dt className="text-xs sm:text-sm text-gray-300 mb-1" id={`${item.id}-label`}>
            {item.label}
          </dt>
          <dd
            className={`text-sm sm:text-base font-medium text-white break-words ${item.mono ? 'font-mono' : ''}`}
            aria-labelledby={`${item.id}-label`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default TransactionGrid;
