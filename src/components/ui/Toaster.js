'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, variant = 'default', duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {/* Invisible container for children, but real output rendered globally */}
      <div className="fixed bottom-0 right-0 z-[100] flex flex-col p-4 gap-2 w-full max-w-[420px] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-md border p-4 shadow-lg transition-all 
              ${t.variant === 'destructive' ? 'bg-destructive text-destructive-foreground border-destructive' : 'glass-card'}`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col gap-1">
                {t.title && <h3 className="text-sm font-semibold">{t.title}</h3>}
                {t.description && <p className="text-sm opacity-90">{t.description}</p>}
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
