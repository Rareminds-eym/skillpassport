/**
 * Demo-mode guard
 *
 * Blocked actions call showDemoModal() instead of executing; a single
 * DemoModalHost mounted at the app root listens and renders the popup.
 */
import { useEffect, useState } from 'react';
import DemoModal from './DemoModal';

const DEMO_MODAL_EVENT = 'sp:show-demo-modal';

/** Trigger the global demo-mode popup (use inside blocked handlers). */
export function showDemoModal(message) {
  window.dispatchEvent(new CustomEvent(DEMO_MODAL_EVENT, { detail: { message } }));
}

/** Mount once near the app root; renders the popup when any blocked action fires. */
export function DemoModalHost() {
  const [state, setState] = useState({ open: false, message: undefined });

  useEffect(() => {
    const onShow = (e) => setState({ open: true, message: e.detail?.message });
    window.addEventListener(DEMO_MODAL_EVENT, onShow);
    return () => window.removeEventListener(DEMO_MODAL_EVENT, onShow);
  }, []);

  return (
    <DemoModal
      isOpen={state.open}
      onClose={() => setState({ open: false, message: undefined })}
      {...(state.message ? { message: state.message } : {})}
    />
  );
}

export default DemoModalHost;
