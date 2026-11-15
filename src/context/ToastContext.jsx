import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);

// Small message at the bottom of the screen, e.g. "Subject deleted".
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, kind = 'info') => {
    clearTimeout(timer.current);
    setToast({ message, kind });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className={`toast toast-${toast.kind}`}>{toast.message}</div>}
      </div>
    </ToastContext.Provider>
  );
}
