import React from 'react';
import { ToastStack } from '../components/index.js';

// Host for the DS v1.1 Toast: owns the array + auto-dismiss timers, capped at 3.
const ToastCtx = React.createContext({ push: () => {} });
export const useToast = () => React.useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const idRef = React.useRef(1);
  const dismiss = React.useCallback((id) => setToasts((s) => s.filter((t) => t.id !== id)), []);
  const push = React.useCallback((t) => {
    const id = idRef.current++;
    setToasts((s) => s.slice(-2).concat([{ ...t, id }])); // newest last, never more than 3 deep
    const secs = t.duration ?? 4;
    if (secs > 0) setTimeout(() => dismiss(id), secs * 1000);
    return id;
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <div style={{ position: 'fixed', right: 'var(--space-5)', bottom: 'var(--space-5)', zIndex: 1000, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <ToastStack toasts={toasts} onDismiss={dismiss} />
        </div>
      </div>
    </ToastCtx.Provider>
  );
}

export default ToastProvider;
