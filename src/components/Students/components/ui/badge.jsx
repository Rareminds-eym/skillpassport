import * as React from 'react';

const badgeVariants = (variant = 'default') => {
  const baseClass =
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variantClasses = {
    default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive:
      'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
    outline: 'text-foreground',
  };

  return `${baseClass} ${variantClasses[variant] || variantClasses.default}`;
};

function Badge({ className = '', variant = 'default', ...props }) {
  const variantClass = badgeVariants(variant);

  const combinedClass = `${variantClass} ${className}`.trim();

  return <div className={combinedClass} {...props} />;
}

export { Badge, badgeVariants };
