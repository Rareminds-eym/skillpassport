import { getRouteForRole, resolveRouteRole } from '@/features/auth';
import SubscriptionPlans from '@/features/subscription/ui/individual/SubscriptionPlans';
import { useUser } from '@/shared/model/authStore';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** After owner-confirmed payment, send the buyer to their role dashboard. The fromPayment
 * flag makes SubscriptionProtectedRoute re-read the subscription before deciding access. */
export default function SubscriptionPlansPage() {
    const navigate = useNavigate();
    const user = useUser();
    const onPaymentConfirmed = useCallback(() => {
        navigate(getRouteForRole(resolveRouteRole(user?.roles ?? [])), { replace: true, state: { fromPayment: true } });
    }, [navigate, user]);
    return <SubscriptionPlans onPaymentConfirmed={onPaymentConfirmed} />;
}
