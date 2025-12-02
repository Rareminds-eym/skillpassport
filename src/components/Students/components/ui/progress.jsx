import * as React from "react";

import { cn } from "../../lib/utils";

const Progress = React.forwardRef(({ className, indicatorClassName, value = 0, ...props }, ref) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <div
        className={cn("h-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress };
