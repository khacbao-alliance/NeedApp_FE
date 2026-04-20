/**
 * Minimal programmatic toast for one-off error/info notifications.
 * Shows a styled popup for 3.5 seconds without requiring a provider.
 */

let toastContainer: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

type ToastVariant = 'error' | 'info' | 'success';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error:   'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);color:#f87171',
  info:    'background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.35);color:#a5b4fc',
  success: 'background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);color:#34d399',
};

function showToast(message: string, variant: ToastVariant = 'error', durationMs = 3500) {
  const container = getContainer();

  const el = document.createElement('div');
  el.style.cssText = [
    'max-width:340px',
    'padding:10px 14px',
    'border-radius:12px',
    'font-size:13px',
    'font-weight:500',
    'line-height:1.4',
    'backdrop-filter:blur(12px)',
    'box-shadow:0 4px 24px rgba(0,0,0,0.3)',
    'pointer-events:auto',
    'opacity:0',
    'transform:translateY(8px)',
    'transition:opacity 200ms,transform 200ms',
    VARIANT_STYLES[variant],
  ].join(';');

  el.textContent = message;
  container.appendChild(el);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  // Auto-dismiss
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 220);
  }, durationMs);
}

export function showErrorToast(message: string) {
  showToast(message, 'error');
}

export function showInfoToast(message: string) {
  showToast(message, 'info');
}

export function showSuccessToast(message: string) {
  showToast(message, 'success');
}
