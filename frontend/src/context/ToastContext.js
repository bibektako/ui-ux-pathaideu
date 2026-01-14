import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '../components/Snackbar';
import LoadingOverlay from '../components/LoadingOverlay';

const ToastContext = createContext();
const LoadingContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ visible: true, message, type, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, hideToast }}>
      <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading: loading }}>
        {children}
        <Snackbar
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
        />
        <LoadingOverlay visible={loading} message={loadingMessage} />
      </LoadingContext.Provider>
    </ToastContext.Provider>
  );
};


