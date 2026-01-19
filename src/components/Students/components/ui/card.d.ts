import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "orange" | "blue";
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardTitle: React.ForwardRefExoticComponent<CardTitleProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardDescription: React.ForwardRefExoticComponent<CardDescriptionProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardContent: React.ForwardRefExoticComponent<CardContentProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardFooter: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;