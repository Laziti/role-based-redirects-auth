import { toast as sonnerToast } from "sonner";

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Helper function to get emoji based on variant
const getEmojiForVariant = (variant: ToastVariant): string => {
  switch (variant) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '';
  }
};

// Unified toast function
export const toast = ({
  title,
  description,
  variant = 'default',
  duration = 5000
}: ToastOptions) => {
  const emoji = getEmojiForVariant(variant);
  const formattedTitle = emoji ? `${emoji} ${title}` : title;
  
  // Using sonner toast with custom styling
  return sonnerToast(formattedTitle, {
    description,
    duration,
    className: `toast-${variant}`,
    // Custom styling based on variant
    style: {
      background: variant === 'error' ? 'rgba(220, 38, 38, 0.1)' : 
                 variant === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                 variant === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                 variant === 'info' ? 'rgba(14, 165, 233, 0.1)' : 
                 'rgba(255, 215, 0, 0.1)',
      border: variant === 'error' ? '1px solid rgba(220, 38, 38, 0.3)' : 
              variant === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : 
              variant === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : 
              variant === 'info' ? '1px solid rgba(14, 165, 233, 0.3)' : 
              '1px solid rgba(255, 215, 0, 0.3)',
      color: 'var(--portal-text)',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      fontSize: '0.9rem',
    }
  });
};

// Convenience methods
toast.success = (options: Omit<ToastOptions, 'variant'>) => 
  toast({ ...options, variant: 'success' });

toast.error = (options: Omit<ToastOptions, 'variant'>) => 
  toast({ ...options, variant: 'error' });

toast.warning = (options: Omit<ToastOptions, 'variant'>) => 
  toast({ ...options, variant: 'warning' });

toast.info = (options: Omit<ToastOptions, 'variant'>) => 
  toast({ ...options, variant: 'info' }); 