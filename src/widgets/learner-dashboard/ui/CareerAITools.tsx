/**
 * CareerAITools Widget Component
 * 
 * Displays a grid of 7 AI-powered career tools with premium indicators,
 * access control, and responsive layout.
 * 
 * @module widgets/learner-dashboard/ui/CareerAITools
 * 
 * **Validates Requirements**: 4.1-4.11
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Target,
    FileText,
    MessageSquare,
    Map,
    Users,
    Compass,
    Lightbulb,
    Lock,
    Crown,
    Clock,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/utils';
import { CareerAIToolsProps } from '../model/types';
import { CAREER_TOOLS } from '@/entities/opportunity/model/types';

// Icon mapping for career tools
const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    target: Target,
    document: FileText,
    chat: MessageSquare,
    path: Map,
    users: Users,
    compass: Compass,
    lightbulb: Lightbulb
};

// Category colors for badges
const CATEGORY_COLORS: Record<string, string> = {
    assessment: 'bg-blue-100 text-blue-700 border-blue-200',
    preparation: 'bg-purple-100 text-purple-700 border-purple-200',
    guidance: 'bg-indigo-100 text-indigo-700 border-indigo-200'
};

/**
 * CareerAITools Widget
 * 
 * Displays AI-powered career tools in a responsive grid layout.
 * Handles premium tool access control and upgrade prompts.
 * 
 * **Performance Optimization**: Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * **Requirements Fulfilled**:
 * - 4.1: Display grid of 7 AI-powered career tools ✓
 * - 4.2-4.8: Individual tool routes and functionality ✓
 * - 4.9: Navigate to corresponding tool page on click ✓
 * - 4.10: Display premium indicator for subscription tools ✓
 * - 4.11: Show upgrade prompt for premium tools without access ✓
 */
export const CareerAITools: React.FC<CareerAIToolsProps> = React.memo(({
    tools = CAREER_TOOLS,
    onToolSelect,
    userAccess
}) => {
    const navigate = useNavigate();
    const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
    const [selectedTool, setSelectedTool] = React.useState<string | null>(null);

    /**
     * Handle tool selection with access control
     * 
     * **Validates Requirements**: 4.9, 4.11
     */
    const handleToolClick = (toolId: string, toolPath: string, requiresSubscription: boolean) => {
        // Track analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'career_tool_click', {
                tool_id: toolId,
                tool_name: tools.find(t => t.id === toolId)?.name,
                has_access: !requiresSubscription || userAccess.hasAIAccess
            });
        }

        // Call callback
        onToolSelect(toolId);

        // Check access for premium tools (Requirement 4.11)
        if (requiresSubscription && !userAccess.hasAIAccess) {
            setSelectedTool(toolId);
            setShowUpgradePrompt(true);
            return;
        }

        // Navigate to tool (Requirement 4.9)
        navigate(toolPath);
    };

    /**
     * Close upgrade prompt
     */
    const handleClosePrompt = () => {
        setShowUpgradePrompt(false);
        setSelectedTool(null);
    };

    /**
     * Navigate to upgrade/subscription page
     */
    const handleUpgrade = () => {
        navigate('/learner/subscription');
        setShowUpgradePrompt(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">AI Career Tools</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Accelerate your career with AI-powered guidance
                    </p>
                </div>
                {userAccess.hasAIAccess && userAccess.remainingCredits !== undefined && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {userAccess.remainingCredits} credits
                    </Badge>
                )}
            </div>

            {/* Tool Grid - Responsive: 3 columns desktop, 2 tablet, 1 mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool, index) => {
                    const IconComponent = TOOL_ICONS[tool.icon] || Target;
                    const isLocked = tool.requiresSubscription && !userAccess.hasAIAccess;

                    return (
                        <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card
                                className={cn(
                                    "cursor-pointer transition-all duration-200 hover:shadow-lg relative overflow-hidden group",
                                    isLocked && "opacity-75"
                                )}
                                onClick={() => handleToolClick(tool.id, tool.path, tool.requiresSubscription)}
                            >
                                {/* Gradient background effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <CardContent className="p-6 relative z-10">
                                    {/* Icon and Premium Indicator */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn(
                                            "p-3 rounded-xl bg-gradient-to-br transition-all duration-200",
                                            tool.category === 'assessment' && "from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300",
                                            tool.category === 'preparation' && "from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300",
                                            tool.category === 'guidance' && "from-indigo-100 to-indigo-200 group-hover:from-indigo-200 group-hover:to-indigo-300"
                                        )}>
                                            <IconComponent className={cn(
                                                "w-6 h-6",
                                                tool.category === 'assessment' && "text-blue-700",
                                                tool.category === 'preparation' && "text-purple-700",
                                                tool.category === 'guidance' && "text-indigo-700"
                                            )} />
                                        </div>

                                        {/* Premium indicator (Requirement 4.10) */}
                                        {tool.requiresSubscription && (
                                            <div className="flex items-center gap-1">
                                                {isLocked ? (
                                                    <Lock className="w-4 h-4 text-amber-600" />
                                                ) : (
                                                    <Crown className="w-4 h-4 text-amber-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tool Name */}
                                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                                        {tool.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                        {tool.description}
                                    </p>

                                    {/* Footer with Category and Time */}
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs border",
                                                CATEGORY_COLORS[tool.category]
                                            )}
                                        >
                                            {tool.category}
                                        </Badge>

                                        {tool.estimatedTime && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                {tool.estimatedTime}
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow indicator on hover */}
                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Upgrade Prompt Modal (Requirement 4.11) */}
            {showUpgradePrompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={handleClosePrompt}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full">
                                <Crown className="w-8 h-8 text-amber-600" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">
                            Premium Feature
                        </h3>

                        {/* Description */}
                        <p className="text-center text-slate-600 mb-6">
                            {selectedTool && tools.find(t => t.id === selectedTool)?.name} is a premium feature.
                            Upgrade to {userAccess.planType === 'free' ? 'Pro' : 'Enterprise'} to unlock AI-powered
                            career tools and accelerate your professional growth.
                        </p>

                        {/* Benefits */}
                        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-indigo-900 mb-2">Premium includes:</h4>
                            <ul className="space-y-2 text-sm text-indigo-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 mt-0.5">✓</span>
                                    <span>Unlimited access to all 7 AI career tools</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 mt-0.5">✓</span>
                                    <span>Personalized career guidance and recommendations</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 mt-0.5">✓</span>
                                    <span>Priority support and faster processing</span>
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleClosePrompt}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={handleUpgrade}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
});

CareerAITools.displayName = 'CareerAITools';

export default CareerAITools;
