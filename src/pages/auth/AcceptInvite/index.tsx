/**
 * AcceptInvite Page - Refactored
 * 
 * Handles invitation acceptance with proper separation of concerns:
 * - Validation logic → useInvitationValidation hook
 * - Form state → useInvitationForm hook
 * - Acceptance logic → useInvitationAcceptance hook
 * - UI components → Separate components for each state
 * 
 * This refactoring reduces complexity from 544 lines to ~100 lines per module
 * and improves testability, maintainability, and reusability.
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInvitationValidation } from './hooks/useInvitationValidation';
import { useInvitationForm } from './hooks/useInvitationForm';
import { useInvitationAcceptance } from './hooks/useInvitationAcceptance';
import { InvitationHeader } from './components/InvitationHeader';
import { InvitationValidating } from './components/InvitationValidating';
import { InvitationSuccess } from './components/InvitationSuccess';
import { InvitationError } from './components/InvitationError';
import { RecruitmentInvitationForm } from './components/RecruitmentInvitationForm';
import { StandardInvitationForm } from './components/StandardInvitationForm';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Hook: Invitation acceptance logic
    const {
        state: acceptanceState,
        error: acceptanceError,
        acceptInvitation,
        autoAcceptInvitation,
        requestResend,
        handleSignOut,
    } = useInvitationAcceptance();

    // Hook: Token validation and session conflict detection
    const {
        state: validationState,
        validationData,
        error: validationError,
        requiresSignOut,
        isRecruitmentInvite,
    } = useInvitationValidation(token, async (data) => {
        await autoAcceptInvitation(token!, data);
    });

    // Hook: Form state and validation
    const formState = useInvitationForm();

    // Handle form submission
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token || !validationData) return;

        // Validate form
        const validationError = formState.validate(isRecruitmentInvite);
        if (validationError) {
            formState.clearError();
            // Set error via formState
            return;
        }

        try {
            await acceptInvitation(token, formState.password, validationData, isRecruitmentInvite);
        } catch (err) {
            // Error handled in hook
        }
    };

    // Determine current UI state
    const isValidating = validationState === 'validating' || validationState === 'auto-accepting';
    const showForm = validationState === 'validated' && acceptanceState === 'idle';
    const showSuccess = acceptanceState === 'success';
    const showError =
        validationState === 'error' ||
        validationState === 'conflict' ||
        acceptanceState === 'error';

    const displayError = acceptanceError || validationError || formState.error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Validating state */}
                {isValidating && <InvitationValidating />}

                {/* Header (not shown during validation) */}
                {!isValidating && validationData && (
                    <InvitationHeader isRecruitmentInvite={isRecruitmentInvite} />
                )}

                {/* Main card */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    {/* Form state */}
                    {showForm && validationData && (
                        <>
                            {isRecruitmentInvite ? (
                                <RecruitmentInvitationForm
                                    validationData={validationData}
                                    password={formState.password}
                                    onPasswordChange={formState.setPassword}
                                    confirmPassword={formState.confirmPassword}
                                    onConfirmPasswordChange={formState.setConfirmPassword}
                                    termsAccepted={formState.termsAccepted}
                                    onTermsChange={formState.setTermsAccepted}
                                    showPassword={formState.showPassword}
                                    onToggleShowPassword={formState.toggleShowPassword}
                                    showConfirmPassword={formState.showConfirmPassword}
                                    onToggleShowConfirmPassword={formState.toggleShowConfirmPassword}
                                    passwordStrength={formState.passwordStrength}
                                    loading={formState.loading}
                                    error={displayError}
                                    onClearError={formState.clearError}
                                    onSubmit={handleFormSubmit}
                                />
                            ) : (
                                <StandardInvitationForm
                                    password={formState.password}
                                    onPasswordChange={formState.setPassword}
                                    showPassword={formState.showPassword}
                                    onToggleShowPassword={formState.toggleShowPassword}
                                    loading={formState.loading}
                                    error={displayError}
                                    onClearError={formState.clearError}
                                    onSubmit={handleFormSubmit}
                                />
                            )}
                        </>
                    )}

                    {/* Success state */}
                    {showSuccess && (
                        <InvitationSuccess
                            organizationName={validationData?.organizationName}
                            isRecruitmentInvite={isRecruitmentInvite}
                            onNavigate={() =>
                                navigate(isRecruitmentInvite ? '/recruitment/overview' : '/')
                            }
                        />
                    )}

                    {/* Error state */}
                    {showError && (
                        <InvitationError
                            error={displayError}
                            token={token}
                            requiresSignOut={requiresSignOut}
                            loading={formState.loading}
                            onSignOut={handleSignOut}
                            onRequestResend={() => token && requestResend(token)}
                            onNavigateToLogin={() => navigate('/login')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcceptInvite;
