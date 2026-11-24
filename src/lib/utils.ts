import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast as _toast, type ExternalToast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
 * sonner is shared with the host (vite.config.mjs), so these toasts are shown
 * by the host's <Toaster>, at its position and in its style.
 */
export const toast = {
  error: (message: string, options: ExternalToast = {}) =>
    _toast.error(message, options),
  warning: (message: string, options: ExternalToast = {}) =>
    _toast.warning(message, options),
  success: (message: string, options: ExternalToast = {}) =>
    _toast.success(message, options),
};
