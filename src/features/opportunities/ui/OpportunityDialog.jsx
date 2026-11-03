import * as Dialog from '@radix-ui/react-dialog';
import { useRef } from 'react';
import { AlertCircle, Briefcase, Check, ClipboardList, Factory, FileText, Lock, Send, SlidersHorizontal, User, X } from 'lucide-react';
import '@/shared/ui/workflow-dialog.css';

const appearances = {
  details: { icon: FileText, label: 'Opportunity details' },
  job: { icon: Briefcase, label: 'Explore the role' },
  filters: { icon: SlidersHorizontal, label: 'Refine your search' },
  visit: { icon: Factory, label: 'Industrial visit' },
  application: { icon: ClipboardList, label: 'Your submission' },
  profile: { icon: User, label: 'Profile setup' },
  confirmation: { icon: Send, label: 'Review your application' },
  success: { icon: Check, label: 'Application update' },
  danger: { icon: AlertCircle, label: 'Offer response' },
  access: { icon: Lock, label: 'Application access' },
};

/** Shared modal presentation; Radix retains focus trapping and dismissal behavior. */
export function OpportunityDialog({ open, onOpenChange, title, description, children, footer, wide = false, variant = 'details' }) {
  const returnFocus = useRef(null);
  const titleRef = useRef(null);
  const appearance = appearances[variant] || appearances.details;
  const Icon = appearance.icon;
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="workflow-dialog-overlay" />
      <Dialog.Content
        onOpenAutoFocus={event => { event.preventDefault(); returnFocus.current = document.activeElement; titleRef.current?.focus(); }}
        onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }}
        data-variant={variant}
        className={`workflow-dialog ${wide ? 'workflow-dialog--wide' : ''}`}>
        <header className="workflow-dialog-header">
          <span className="workflow-dialog-mark" aria-hidden="true"><Icon size={21} /></span>
          <div className="workflow-dialog-heading">
            <p className="workflow-dialog-eyebrow">{appearance.label}</p>
            <Dialog.Title ref={titleRef} tabIndex={-1} className="workflow-dialog-title">{title}</Dialog.Title>
            <Dialog.Description className={description ? 'workflow-dialog-description' : 'sr-only'}>{description || 'Review the information and available actions.'}</Dialog.Description>
          </div>
          <Dialog.Close aria-label="Close dialog" className="workflow-dialog-close"><X size={18} aria-hidden="true" /></Dialog.Close>
        </header>
        <div role="region" aria-label={`${title} content`} tabIndex={0} className="workflow-dialog-body">{children}</div>
        {footer && <footer className="workflow-dialog-footer">{footer}</footer>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
