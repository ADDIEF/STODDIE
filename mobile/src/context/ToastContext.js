import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const showError = (message) => setToast({ message, type: 'error' });
  const showSuccess = (message) => setToast({ message, type: 'success' });
  const showWarning = (message) => setToast({ message, type: 'warning' });
  const showInfo = (message) => setToast({ message, type: 'info' });

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning, showInfo, toast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} visible={true} onHide={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);