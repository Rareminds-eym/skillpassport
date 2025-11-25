import TransactionGrid from './TransactionGrid';

/**
 * ReceiptCard Component
 * Displays payment receipt with dark theme styling and scalloped edge
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
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Dark theme receipt card with scalloped edge */}
      <div className="bg-gray-800 text-white p-6 sm:p-8 relative scalloped-edge">
        {/* Total Amount - Prominent Display */}
        <div className="text-center mb-6">
          <p className="text-sm sm:text-base text-gray-300 mb-2">Total Amount</p>
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold">{totalAmount}</p>
        </div>

        {/* Transaction Details Grid */}
        <div className="mt-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-100">Transaction Details</h2>
          <TransactionGrid
            referenceNumber={transactionDetails.referenceNumber}
            paymentTime={transactionDetails.paymentTime}
            paymentMethod={transactionDetails.paymentMethod}
            senderName={transactionDetails.senderName}
          />
        </div>

        {/* Scalloped edge decoration */}
        <div className="scalloped-decoration" aria-hidden="true"></div>
      </div>

      {/* Additional content area (subscription details, email status, actions) */}
      {children && (
        <div className="p-6 sm:p-8 space-y-6">
          {children}
        </div>
      )}

      <style jsx>{`
        .scalloped-edge {
          position: relative;
        }

        .scalloped-decoration {
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 20px;
          background: 
            radial-gradient(circle at 10px 0, transparent 10px, #1F2937 10px) repeat-x;
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

export default ReceiptCard;
