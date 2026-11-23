import type { FormEventHandler, ReactNode, RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  open: boolean;
  title: string;
  description: string;
  formLabel: string;
  pending: boolean;
  disabled?: boolean;
  error?: string;
  cancelLabel?: string;
  returnFocus: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  primaryAction?: ReactNode;
}

export function CurriculumFormDialog({ open, title, description, formLabel, pending, disabled, error, cancelLabel = 'Cancel', returnFocus, onClose, onSubmit, children, primaryAction }: Props) {
  return <Dialog.Root open={open} onOpenChange={value => { if (!value && !pending) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[60] bg-gray-900/50" />
      <Dialog.Content
        onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}
        onEscapeKeyDown={event => { if (pending) event.preventDefault(); }}
        onInteractOutside={event => event.preventDefault()}
        className="fixed left-1/2 top-1/2 z-[60] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-xl focus:outline-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <Dialog.Title className="!m-0 !text-lg !font-semibold !leading-7 text-gray-900">{title}</Dialog.Title>
            <Dialog.Description className="mt-1 !text-sm !leading-5 text-gray-500">{description}</Dialog.Description>
          </div>
          <Dialog.Close disabled={pending} aria-label="Close curriculum form" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50">
            <XMarkIcon aria-hidden="true" className="h-5 w-5" />
          </Dialog.Close>
        </div>
        <form aria-label={formLabel} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <fieldset disabled={pending} className="space-y-5">{children}</fieldset>
            <p className="!text-xs !leading-5 text-gray-500">Your administrator reviews this submission before it appears in the curriculum.</p>
            {error && <p role="alert" className="!text-sm !leading-5 text-red-700">{error}</p>}
          </div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
            <button type="button" disabled={pending} onClick={onClose} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50">{cancelLabel}</button>
            {primaryAction || <button type="submit" disabled={pending || disabled} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">{pending ? 'Submitting...' : 'Submit for approval'}</button>}
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
