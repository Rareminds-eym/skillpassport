import { CheckCircle } from 'lucide-react';

/**
 * SuccessHeader Component
 * Displays a success header with animated checkmark icon
 *
 * @param {Object} props
 * @param {string} props.title - Main heading text
 * @param {string} props.subtitle - Subheading text
 */
function SuccessHeader({
  title = 'Payment Success!',
  subtitle = 'Your payment has been successfully done',
}) {
  return (
    <header
      className="bg-gradient-to-r from-green-50 to-blue-50 p-8 text-center"
      role="banner"
      aria-label="Payment success confirmation"
    >
      <div
        className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 animate-scale-in"
        role="img"
        aria-label="Success checkmark icon"
      >
        <CheckCircle className="w-12 h-12 text-white animate-check-draw" aria-hidden="true" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2" id="success-title">
        {title}
      </h1>
      <p className="text-base sm:text-lg text-gray-600" aria-describedby="success-title">
        {subtitle}
      </p>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-check-draw {
          stroke-dasharray: 100;
          animation: check-draw 0.5s ease-out 0.3s forwards;
        }
      `}</style>
    </header>
  );
}

export default SuccessHeader;
