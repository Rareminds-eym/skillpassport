import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { useUser } from "@/shared/model/authStore";
import { useOrgContext } from "@/entities/recruitment/model/useOrgContext";
export const inputClass =
  "w-full min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50";
export const primaryClass =
  buttonClass +
  " border-primary-700 bg-primary-700 text-white hover:bg-primary-800";
export function useWorkspaceKey(name: string) {
  const user = useUser();
  const { organizationId } = useOrgContext();
  return [
    "recruitment",
    user?.id,
    organizationId || user?.orgId,
    name,
  ] as const;
}
export function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  explanation,
  compact = false,
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  explanation?: string;
  compact?: boolean;
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex ${compact ? "h-11 w-11 sm:h-9 sm:w-9" : "h-11 w-11"} shrink-0 items-center justify-center rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 ${danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
    >
      <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden="true" />
    </button>
  );
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {disabled ? (
            <span
              tabIndex={0}
              aria-label={`${label}: ${explanation || "Unavailable"}`}
              className="inline-flex rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {button}
            </span>
          ) : (
            button
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-[80] max-w-72 rounded-md bg-gray-950 px-3 py-2 text-xs text-white shadow-lg"
          >
            {explanation || label}
            <Tooltip.Arrow className="fill-gray-950" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
export function AccessibleModal({
  title,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const [returnFocus] = React.useState(
    () => document.activeElement as HTMLElement | null,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus?.isConnected) returnFocus.focus();
          }}
          onClickCapture={(event) => {
            if (busy) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          className="fixed inset-0 z-50 outline-none"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function LoadState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (loading)
    return (
      <p
        role="status"
        className="rounded-xl border border-gray-200 bg-white p-8 text-gray-600"
      >
        Loading workspace…
      </p>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <p className="text-red-800">
          {error instanceof Error
            ? error.message
            : "The workspace could not be loaded."}
        </p>
        <button
          type="button"
          className={buttonClass + " mt-4"}
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    );
  return null;
}
