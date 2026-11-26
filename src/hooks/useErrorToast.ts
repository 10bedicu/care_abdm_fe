import { useEffect } from "react";

import { errorMessage } from "@/apis/request";
import { toast } from "@/lib/utils";

/**
 * Toasts a query's error. The host skips the plug's errors, so a query whose
 * failure should be seen has to report it itself.
 */
export const useErrorToast = (error: unknown, fallback: string) => {
  useEffect(() => {
    if (error) {
      toast.error(errorMessage(error, fallback));
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps
};
