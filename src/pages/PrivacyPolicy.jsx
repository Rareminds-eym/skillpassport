import { Calendar, RotateCcw } from "lucide-react";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-blue-100 mb-2">Rareminds Private Limited</p>
                        <p className="text-blue-200">DPDP Act, IT Act & Global Compliance</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 text-sm text-blue-100">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Effective: 1 January 2026</span>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                <span>Last Updated: 1 January 2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Content */}
                <div className="text-center">
                    <p className="text-lg text-gray-600 italic leading-relaxed">
                        Privacy Policy, Skill Passport Consent, Grievance Redressal, Cookie Policy, and Internal Compliance sections are grammatically sound and legally consistent. No corrections required beyond formatting alignment, which is already clean.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
