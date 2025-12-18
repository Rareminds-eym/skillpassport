import React from "react";
import { CardHeader, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BellIcon } from "@heroicons/react/24/outline";

const RecentUpdatesCard = React.forwardRef(
  (
    {
      title = "Recent Updates",
      icon: Icon = BellIcon,
      badgeContent = null,
      updates = [],
      loading = false,
      error = null,
      onRetry,
      emptyMessage = "No recent updates available",
      maxVisible = 5,
      isExpanded,
      onToggle,
      getUpdateClassName,
      getMessage,
      getDetails,
      getTimestamp,
      containerClassName = "bg-white rounded-xl border border-gray-200 shadow-sm",
      contentClassName = "pt-4 p-6",
      scrollClassName = "max-h-96 overflow-y-auto pr-2 scroll-smooth recent-updates-scroll",
      retryButtonClassName = "bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors",
      retryButtonText = "Retry",
      seeMoreLabel = "See More",
      seeLessLabel = "See Less",
      spinnerClassName = "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
    },
    ref
  ) => {
    const [internalExpanded, setInternalExpanded] = React.useState(false);

    const expanded =
      typeof isExpanded === "boolean" ? isExpanded : internalExpanded;

    const handleToggle = () => {
      if (onToggle) {
        onToggle(!expanded);
      } else {
        setInternalExpanded((prev) => !prev);
      }
    };

    const defaultClassName = (type) => {
      switch (type) {
        case "shortlist_added":
          return "bg-yellow-50 border-yellow-300";
        case "offer_extended":
          return "bg-green-50 border-green-300";
        case "offer_accepted":
          return "bg-emerald-50 border-emerald-300";
        case "placement_hired":
          return "bg-purple-50 border-purple-300";
        case "stage_change":
          return "bg-indigo-50 border-indigo-300";
        case "application_rejected":
          return "bg-red-50 border-red-300";
        default:
          return "bg-gray-50 border-gray-200";
      }
    };

    const defaultMessage = (update) => {
      // If update has a pre-formatted message only, use it directly
      if (update.message && !update.user && !update.action && !update.candidate) {
        return <span className="text-gray-700">{update.message}</span>;
      }
      
      // Build message from components
      return (
        <>
          {update.user && (
            <span className="text-blue-700">{update.user}</span>
          )}
          {update.action && (
            <span className="text-gray-700"> {update.action} </span>
          )}
          {update.candidate && (
            <span className="font-semibold">{update.candidate}</span>
          )}
          {update.message && (update.user || update.action || update.candidate) && (
            <span className="text-gray-700"> {update.message}</span>
          )}
        </>
      );
    };

    const defaultDetails = (update) => update.details;

    const defaultTimestamp = (update) => {
      // Priority 1: Use formattedTimestamp from hook (e.g., "2 mins ago")
      if (update.formattedTimestamp) {
        return update.formattedTimestamp;
      }

      // Priority 2: Use timestamp if it's already formatted (contains "ago")
      if (update.timestamp) {
        if (typeof update.timestamp === "string" && update.timestamp.includes("ago")) {
          return update.timestamp;
        }
        
        // Priority 3: Format timestamp as date/time
        const date = new Date(update.timestamp);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleString();
        }
        
        // Fallback: return as-is
        return update.timestamp;
      }

      // Priority 4: Use rawTimestamp if available
      if (update.rawTimestamp) {
        const date = new Date(update.rawTimestamp);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }

      return null;
    };

    const validUpdates = updates.filter((update) => {
      if (!update) {
        return false;
      }
      const messageContent = getMessage
        ? getMessage(update)
        : defaultMessage(update);
      const detailsContent = getDetails
        ? getDetails(update)
        : defaultDetails(update);
      const timestampContent = getTimestamp
        ? getTimestamp(update)
        : defaultTimestamp(update);
      
      // An update is valid if it has at least a message or details
      if (!messageContent && !detailsContent) {
        return false;
      }
      return true;
    });

    const visibleUpdates = expanded
      ? validUpdates
      : validUpdates.slice(0, maxVisible);

    const shouldShowToggle = validUpdates.length > maxVisible;

    return (
      <div ref={ref} className={containerClassName}>
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">{title}</span>
            </div>
            {badgeContent}
          </CardTitle>
        </CardHeader>
        <CardContent className={contentClassName}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className={spinnerClassName}></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-3 font-medium">{error}</p>
              {onRetry && (
                <Button onClick={onRetry} size="sm" className={retryButtonClassName}>
                  {retryButtonText}
                </Button>
              )}
            </div>
          ) : validUpdates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 font-medium">{emptyMessage}</p>
            </div>
          ) : (
            <>
              <div
                className={`space-y-2 ${
                  expanded ? scrollClassName : ""
                }`}
              >
                {visibleUpdates.map((update, idx) => {
                  const key = update.id || `${update.timestamp || update.rawTimestamp || "update"}-${idx}`;
                  const messageContent = getMessage
                    ? getMessage(update)
                    : defaultMessage(update);
                  const detailsContent = getDetails
                    ? getDetails(update)
                    : defaultDetails(update);
                  const timestampContent = getTimestamp
                    ? getTimestamp(update)
                    : defaultTimestamp(update);
                  const className = getUpdateClassName
                    ? getUpdateClassName(update)
                    : defaultClassName(update.type);
                  
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border hover:shadow-sm transition-all flex items-start gap-3 ${className}`}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        {messageContent && (
                          <p className="text-sm font-medium text-gray-900 mb-0.5">
                            {messageContent}
                          </p>
                        )}
                        {detailsContent && (
                          <p className="text-xs text-gray-600 mb-1">{detailsContent}</p>
                        )}
                        {timestampContent && (
                          <p className="text-xs text-gray-500">{timestampContent}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {shouldShowToggle && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
                    onClick={handleToggle}
                  >
                    {expanded ? seeLessLabel : seeMoreLabel}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>
    );
  }
);

RecentUpdatesCard.displayName = "RecentUpdatesCard";

export default RecentUpdatesCard;;
