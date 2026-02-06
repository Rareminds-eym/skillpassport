import { Check } from 'lucide-react';
import TransactionList from './TransactionList';

/**
 * ReceiptCard Component
 * Displays payment receipt with dark theme styling matching reference design
 * Features: Overlapping checkmark badge, integrated heading, simple list layout
 * 
 * @param {Object} props
 * @param {string} props.totalAmount - Formatted total payment amount
 * @param {Object} props.transactionDetails - Transaction information
 * @param {string} props.transactionDetails.referenceNumber - Payment reference ID
 * @param {string} props.transactionDetails.paymentTime - Formatted payment timestamp
 * @param {string} props.transactionDetails.paymentMethod - Payment method used
 * @param {string} props.transactionDetails.senderName - Name of the payer
 * @param {React.ReactNode} props.children - Additional content (subscription details, email status, etc.)
 */
function ReceiptCard({ totalAmount, transactionDetails, children }) {
  return (
    <article 
      className="relative max-w-lg mx-auto pt-12"
      role="article"
      aria-label="Payment receipt"
    >
      {/* Checkmark Badge - Overlapping top of card */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
        role="img"
        aria-label="Payment successful"
      >
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-white stroke-[3]" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Main Receipt Card */}
      <div className="relative bg-gray-800 rounded-t-3xl overflow-hidden">
        {/* Card Content */}
        <div className="relative text-white px-6 sm:px-8 pt-14 pb-6">
          {/* Payment Success Heading */}
          <h1 
            className="text-2xl sm:text-3xl font-semibold text-center mb-6 text-gray-100"
            id="payment-success-heading"
          >
            Payment Success!
          </h1>

          {/* Total Amount - Large and Prominent */}
          <div className="text-center mb-8">
            <p 
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              aria-label={`Total amount: ${totalAmount}`}
              role="text"
            >
              {totalAmount}
            </p>
          </div>

          {/* Transaction Details List */}
          <div className="mb-6">
            <TransactionList
              referenceNumber={transactionDetails.referenceNumber}
              paymentTime={transactionDetails.paymentTime}
              paymentMethod={transactionDetails.paymentMethod}
              senderName={transactionDetails.senderName}
            />
          </div>

          {/* Dashed Separator */}
          <div 
            className="border-t-2 border-dashed border-gray-600 my-6"
            aria-hidden="true"
          />

          {/* Amount Breakdown (if needed in future) */}
          {/* Can be added here */}
        </div>

        {/* Scalloped Bottom Edge */}
        <div className="scalloped-bottom" aria-hidden="true"></div>
      </div>

      {/* Additional content area (subscription details, email status, actions) */}
      {children && (
        <div className="bg-white rounded-b-2xl p-6 sm:p-8 space-y-6 -mt-1">
          {children}
        </div>
      )}

      {/* Scalloped Edge Styling */}
      <style jsx>{`
        .scalloped-bottom {
          position: relative;
          height: 30px;
          background: #1F2937;
        }

        /* Clean white semicircles - modern, crisp design */
        .scalloped-bottom::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: 
            radial-gradient(circle 15px at 15px 20px, #FFFFFF 15px, transparent 15px) repeat-x;
          background-size: 30px 20px;
          background-position: 0 0;
          z-index: 2;
        }
      `}</style>
    </article>
  );
}

export default ReceiptCard;
