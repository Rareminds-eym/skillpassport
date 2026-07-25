import { MapPin, Image, Loader2, CheckCircle, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';

interface Step3AddressLogoProps {
    onComplete: () => void;
    onSkip: () => void;
    isCompleted: boolean;
    isSkipped: boolean;
    initialData?: {
        address?: string;
        city?: string;
        country?: string;
        logoUrl?: string;
    };
}

export const Step3AddressLogo: React.FC<Step3AddressLogoProps> = ({
    onComplete,
    onSkip,
    isCompleted,
    isSkipped,
    initialData,
}) => {
    const [address, setAddress] = useState(initialData?.address || '');
    const [city, setCity] = useState(initialData?.city || '');
    const [country, setCountry] = useState(initialData?.country || '');
    const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
    const [loading, setLoading] = useState(false);
    const [skipping, setSkipping] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/recruitment/setup/step3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                },
                body: JSON.stringify({
                    address: address.trim() || null,
                    city: city.trim() || null,
                    country: country.trim() || null,
                    logoUrl: logoUrl.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update organization');
            }

            // Success - move to next step
            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setSkipping(true);
        setError('');

        try {
            const response = await fetch('/api/recruitment/setup/step3/skip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to skip step');
            }

            // Success - move to next step
            onSkip();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSkipping(false);
        }
    };

    if (isCompleted || isSkipped) {
        return (
            <div className="text-center py-8">
                <div
                    className={`inline-flex items-center justify-center w-16 h-16 ${isSkipped ? 'bg-gray-100' : 'bg-green-100'
                        } rounded-full mb-4`}
                >
                    {isSkipped ? (
                        <SkipForward className="w-8 h-8 text-gray-600" />
                    ) : (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isSkipped ? 'Step Skipped' : 'Address & Logo Added!'}
                </h3>
                <p className="text-gray-600 mb-4">
                    {isSkipped
                        ? 'You can add your address and logo later from settings.'
                        : 'Your organization location and branding have been saved.'}
                </p>
                {isCompleted && (
                    <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto space-y-2">
                        {initialData?.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Address</div>
                                    <div className="font-medium text-gray-900">
                                        {initialData.address}
                                        {initialData.city && `, ${initialData.city}`}
                                        {initialData.country && `, ${initialData.country}`}
                                    </div>
                                </div>
                            </div>
                        )}
                        {initialData?.logoUrl && (
                            <div className="flex items-center gap-3">
                                <Image className="w-5 h-5 text-gray-500" />
                                <div>
                                    <div className="text-xs text-gray-500">Logo</div>
                                    <img
                                        src={initialData.logoUrl}
                                        alt="Organization logo"
                                        className="w-16 h-16 object-contain mt-1 border border-gray-200 rounded"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                        Step 3: Address & Logo
                    </h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Optional
                    </span>
                </div>
                <p className="text-gray-600">
                    Add your company address and logo. You can skip this and add it later from settings.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Address
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street address, building number, floor..."
                            rows={2}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* City & Country */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                        </label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g., New York"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                        </label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g., United States"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Logo URL */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Logo URL
                    </label>
                    <div className="relative">
                        <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Enter a URL to your company logo image. PNG or JPG recommended.
                    </p>
                </div>

                {/* Logo Preview */}
                {logoUrl && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700 mb-2">Logo Preview:</p>
                        <img
                            src={logoUrl}
                            alt="Logo preview"
                            className="w-24 h-24 object-contain border border-gray-200 rounded bg-white"
                            onError={() => setError('Failed to load logo image. Please check the URL.')}
                        />
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={handleSkip}
                        disabled={loading || skipping}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {skipping && <Loader2 className="w-4 h-4 animate-spin" />}
                        {skipping ? 'Skipping...' : 'Skip This Step'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || skipping}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Save & Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
};
