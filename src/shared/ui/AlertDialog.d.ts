import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

export const AlertDialog: typeof AlertDialogPrimitive.Root;

export const AlertDialogTrigger: typeof AlertDialogPrimitive.Trigger;

export const AlertDialogPortal: typeof AlertDialogPrimitive.Portal;

export interface AlertDialogOverlayProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> {}

export const AlertDialogOverlay: React.ForwardRefExoticComponent<AlertDialogOverlayProps & React.RefAttributes<HTMLDivElement>>;

export interface AlertDialogContentProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {}

export const AlertDialogContent: React.ForwardRefExoticComponent<AlertDialogContentProps & React.RefAttributes<HTMLDivElement>>;

export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps>;

export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AlertDialogFooter: React.FC<AlertDialogFooterProps>;

export interface AlertDialogTitleProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> {}

export const AlertDialogTitle: React.ForwardRefExoticComponent<AlertDialogTitleProps & React.RefAttributes<HTMLHeadingElement>>;

export interface AlertDialogDescriptionProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> {}

export const AlertDialogDescription: React.ForwardRefExoticComponent<AlertDialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;

export interface AlertDialogActionProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {}

export const AlertDialogAction: React.ForwardRefExoticComponent<AlertDialogActionProps & React.RefAttributes<HTMLButtonElement>>;

export interface AlertDialogCancelProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> {}

export const AlertDialogCancel: React.ForwardRefExoticComponent<AlertDialogCancelProps & React.RefAttributes<HTMLButtonElement>>;
