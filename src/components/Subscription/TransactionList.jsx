import { Check } from 'lucide-react';

/**
 * TransactionList Component
 * Displays transaction details in a simple list layout (reference design style)
 *
 * @param {Object} props
 * @param {string} props.referenceNumber - Payment reference/transaction ID
 * @param {string} props.paymentTime - Formatted payment timestamp
 * @param {string} props.paymentMethod - Payment method used
 * @param {string} props.senderName - Name of the person who made the payment
 */
function TransactionList({ referenceNumber, paymentTime, paymentMethod, senderName }) {
  const listItems = [
    { label: 'Payment ID', value: referenceNumber, mono: true, id: 'payment-id' },
    { label: 'Payment Time', value: paymentTime, id: 'payment-time' },
    { label: 'Payment Method', value: paymentMethod, id: 'payment-method' },
    { label: 'Sender Name', value: senderName, id: 'sender-name' },
  ];

  return (
    <dl className="space-y-4" role="list" aria-label="Transaction details">
      {listItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center" role="listitem">
          <dt className="text-sm sm:text-base text-gray-300" id={`${item.id}-label`}>
            {item.label}
          </dt>
          <dd
            className={`text-sm sm:text-base font-medium text-white text-right ${item.mono ? 'font-mono' : ''}`}
            aria-labelledby={`${item.id}-label`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default TransactionList;
