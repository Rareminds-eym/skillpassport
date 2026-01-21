import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export declare const Badge: React.FC<BadgeProps>;
export declare const badgeVariants: (variant?: BadgeProps['variant']) => string;
