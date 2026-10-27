/**
 * FeatureGate Component - Premium locked feature UI
 */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  X,
  AlertCircle,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import '@/shared/ui/workflow-dialog.css';
import { useUser } from '@/shared/model/authStore';
import { useNavigate } from 'react-router-dom';

import {
  clearFeatureAccessCache,
  useFeatureGate,
} from '@/features/subscription/model/useFeatureGate';
import { addOnPaymentService } from '../../api/addOnPaymentService';
import { loadRazorpayScript } from '../../api/razorpayService';

import { useSubscription } from '@/features/subscription/model/subscriptionStore';
export function FeatureGate({
  featureKey,
  children,
  fallback,
  showUpgradePrompt = true,
  blurContent = false,
  className = '',
  embedded = false,
  onUpgradeClick,
}) {
  const { hasAccess, isLoading, requiredAddOn, upgradePrice, error } =
    useFeatureGate(featureKey);
  const { purchaseAddOn, isPurchasing } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  const handleUpgradeClick = useCallback(() => {
    if (onUpgradeClick) {
      onUpgradeClick(featureKey, requiredAddOn);
    } else {
      setShowModal(true);
    }
  }, [onUpgradeClick, featureKey, requiredAddOn]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${embedded ? 'min-h-20' : 'min-h-[300px]'} ${className}`}
      >
        <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle errors - default to denying access with error message
  if (error) {
    return (
      <div
        className={`${embedded ? 'flex min-w-0 flex-col' : 'flex flex-col h-full min-h-[calc(100vh-200px)] p-8'} ${className}`}
      >
        {!embedded && (
          <div className="mb-4">
            <BackButton />
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <ErrorCard message="Unable to verify access. Please refresh the page." />
        </div>
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  if (blurContent) {
    return (
      <div className={`relative ${className}`}>
        {/* Render a static placeholder instead of actual children to prevent effects from running */}
        <div className="filter blur-lg pointer-events-none select-none opacity-30">
          <LockedContentPlaceholder />
        </div>
        <div className="absolute inset-0 flex flex-col bg-white/80">
          <div className="p-4">
            <BackButton />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <LockedCard
              featureKey={featureKey}
              addOn={requiredAddOn}
              upgradePrice={upgradePrice}
              showUpgradePrompt={showUpgradePrompt}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        </div>
        {showModal && (
          <PurchaseModal
            addOn={requiredAddOn}
            upgradePrice={upgradePrice}
            onClose={() => setShowModal(false)}
            onPurchase={purchaseAddOn}
            isPurchasing={isPurchasing}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${embedded ? 'flex min-w-0 flex-col' : 'flex flex-col h-full min-h-[calc(100vh-200px)] p-8'} ${className}`}
    >
      {/* Back button */}
      {!embedded && (
        <div className="mb-4">
          <BackButton />
        </div>
      )}
      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center">
        <LockedCard
          featureKey={featureKey}
          addOn={requiredAddOn}
          upgradePrice={upgradePrice}
          showUpgradePrompt={showUpgradePrompt}
          onUpgradeClick={handleUpgradeClick}
        />
      </div>
      {showModal && (
        <PurchaseModal
          addOn={requiredAddOn}
          upgradePrice={upgradePrice}
          onClose={() => setShowModal(false)}
          onPurchase={purchaseAddOn}
          isPurchasing={isPurchasing}
        />
      )}
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-colors text-sm font-semibold"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}

/**
 * Error card for feature access errors
 */
function ErrorCard({ message }) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 overflow-hidden">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          {/* Error icon */}
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>

          {/* Title & description */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Access Verification Failed
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors mb-3"
          >
            Refresh Page
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors border-2 border-gray-200"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Static placeholder for locked content - prevents actual feature from rendering/executing
 */
function LockedContentPlaceholder() {
  return (
    <div className="min-h-[400px] p-8">
      {/* Fake content blocks to simulate blurred content */}
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3 mt-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

function formatOfferPrice(offer) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: offer.currency,
    maximumFractionDigits: offer.minor_unit,
  }).format(Number(offer.amount_minor) / 10 ** offer.minor_unit);
}

function CatalogBenefits({ addOn }) {
  return addOn?.benefits?.length ? (
    <ul className="space-y-2.5">
      {addOn.benefits.map((benefit) => (
        <li
          key={benefit}
          className="flex items-start gap-2 text-sm leading-5 text-slate-600"
        >
          <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          {benefit}
        </li>
      ))}
    </ul>
  ) : null;
}

function LockedCard({ addOn, showUpgradePrompt, onUpgradeClick }) {
  const offer = addOn?.billing_options?.[0];
  return (
    <section
      aria-label={addOn?.feature_name || 'Purchase options'}
      className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="p-6">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Lock size={22} />
        </div>
        <h2 className="text-lg font-semibold leading-6 text-slate-900">
          {addOn?.feature_name || 'Purchase options unavailable'}
        </h2>
        {addOn?.description && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {addOn.description}
          </p>
        )}
      </div>
      {addOn?.benefits?.length > 0 && (
        <div className="border-y border-slate-100 bg-slate-50 px-6 py-4">
          <CatalogBenefits addOn={addOn} />
        </div>
      )}
      <div className="p-6">
        {offer ? (
          <div className="mb-4">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatOfferPrice(offer)}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {offer.display_name}
            </p>
          </div>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            No purchase options are currently available.
          </p>
        )}
        {showUpgradePrompt && offer && (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            View purchase options
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

function readPendingAddonOrder(key) {
  try {
    return sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function PurchaseModal({ addOn, onClose, onPurchase, isPurchasing }) {
  const options = addOn?.billing_options || [];
  const [selectedId, setSelectedId] = useState(options[0]?.id || '');
  const selected = options.find((option) => option.id === selectedId);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const inFlight = useRef(false);
  const user = useUser();
  const storageKey = `pending-addon-order:${user?.id}:${addOn?.feature_key}`;
  const [pendingOrder, setPendingOrder] = useState(() =>
    readPendingAddonOrder(storageKey),
  );
  const { refreshAccess, fetchUserEntitlements } = useSubscription();
  const remember = (orderId) => {
    try {
      sessionStorage.setItem(storageKey, orderId);
    } catch {
      /* Browser storage is optional; the database owns recovery. */
    }
    setPendingOrder(orderId);
  };
  const finish = async (result) => {
    if (!result.success) {
      setError(
        result.error ||
          'Payment was captured. Retry verification to finish activation.',
      );
      return;
    }
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* A storage failure must not undo a verified purchase. */
    }
    setPendingOrder('');
    clearFeatureAccessCache();
    await Promise.all([refreshAccess(), fetchUserEntitlements()]);
    onClose();
  };
  const retry = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await finish(
        await addOnPaymentService.reconcileAddonPayment(pendingOrder),
      );
    } catch {
      setError('Verification is unavailable. Retry without paying again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const purchase = async () => {
    if (pendingOrder) {
      await retry();
      return;
    }
    if (inFlight.current || !selected) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    let launched = false;
    try {
      if (!(await loadRazorpayScript()) || !window.Razorpay)
        throw new Error('Checkout is unavailable. Please try again.');
      const result = await onPurchase(
        addOn.feature_key,
        selected.billing_period,
      );
      if (!result?.success) {
        if (result?.recoveryOrderId) remember(result.recoveryOrderId);
        setError(result?.error || 'Unable to create purchase order.');
        return;
      }
      const data = result.data;
      const checkout = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: document.title,
        description: `${addOn.feature_name} · ${selected.display_name}`,
        prefill: { email: data.userEmail, name: data.userName },
        handler: async (response) => {
          remember(response.razorpay_order_id);
          setCheckoutOpen(false);
          setBusy(true);
          inFlight.current = true;
          try {
            await finish(
              await addOnPaymentService.verifyAddonPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                addOn.feature_key,
                undefined,
                selected.billing_period,
              ),
            );
          } catch {
            setError(
              'Payment confirmation is pending. Retry verification without paying again.',
            );
          } finally {
            setBusy(false);
            inFlight.current = false;
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutOpen(false);
            setBusy(false);
            inFlight.current = false;
          },
        },
      });
      checkout.on('payment.failed', () => {
        setError(
          'Payment was not completed. Check the payment status before trying again.',
        );
      });
      setCheckoutOpen(true);
      launched = true;
      checkout.open();
    } catch (caught) {
      launched = false;
      setCheckoutOpen(false);
      setError(caught.message || 'Unable to start checkout.');
    } finally {
      if (!launched) {
        setBusy(false);
        inFlight.current = false;
      }
    }
  };
  return (
    <Dialog.Root
      open={!checkoutOpen}
      onOpenChange={(open) => {
        if (!open && !busy && !checkoutOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="workflow-dialog-overlay" />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
          className="workflow-dialog workflow-dialog--purchase"
        >
          <div className="workflow-dialog-header">
            <span className="workflow-dialog-mark" aria-hidden="true"><Lock size={21} /></span>
            <div className="workflow-dialog-heading">
              <p className="workflow-dialog-eyebrow">Feature access</p>
              <Dialog.Title className="workflow-dialog-title">
                {addOn.feature_name}
              </Dialog.Title>
              <Dialog.Description className="workflow-dialog-description">
                {pendingOrder
                  ? 'Finish activating your existing payment.'
                  : 'Review the available purchase terms.'}
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              aria-label="Close purchase dialog"
              className="workflow-dialog-close"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <div role="region" aria-label="Purchase options content" tabIndex={0} className="workflow-dialog-body space-y-5">
            {!pendingOrder && (
              <fieldset disabled={busy || isPurchasing}>
                <legend className="mb-2 text-xs font-medium text-slate-600">
                  Billing option
                </legend>
                <div className="grid gap-2">
                  {options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm ${selectedId === option.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="addon-offer"
                          value={option.id}
                          checked={selectedId === option.id}
                          onChange={() => setSelectedId(option.id)}
                        />
                        {option.display_name}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatOfferPrice(option)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <CatalogBenefits addOn={addOn} />
            {pendingOrder && (
              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Order: {pendingOrder}. Retry verifies this payment; it does not
                start another checkout.
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
              >
                {error}
              </p>
            )}
          </div>
          <div className="workflow-dialog-footer">
            <button
              type="button"
              onClick={purchase}
              disabled={busy || isPurchasing || (!selected && !pendingOrder)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {busy
                ? 'Processing…'
                : pendingOrder
                  ? 'Retry verification'
                  : 'Purchase'}
              <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              Secure checkout · Razorpay
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function FeatureGateInline({
  featureKey,
  children,
  lockedText = 'Pro',
}) {
  const { hasAccess, isLoading } = useFeatureGate(featureKey);
  if (isLoading) return <span className="text-gray-400">...</span>;
  if (hasAccess) return <>{children}</>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
      <Lock className="w-3 h-3" /> {lockedText}
    </span>
  );
}

export default FeatureGate;
