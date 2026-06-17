'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/useToastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`flex items-center gap-4 p-5 rounded-2xl shadow-xl min-w-[320px] backdrop-blur-md border ${
              toast.type === 'success' ? 'bg-green-50/90 text-green-700 border-green-100' :
              toast.type === 'error' ? 'bg-red-50/90 text-red-700 border-red-100' :
              'bg-blue-50/90 text-blue-700 border-blue-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="text-green-500" size={24} />}
            {toast.type === 'error' && <XCircle className="text-red-500" size={24} />}
            {toast.type === 'info' && <Info className="text-blue-500" size={24} />}
            
            <p className="flex-1 font-bold text-body leading-tight">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
