import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { apis } from "@/apis";
import type { MetaConfig } from "@/types/meta";

const CAN_UPDATE_ACCOUNT = "can_update_account";

const runtimeConfig = () =>
  window.__CARE_PLUGIN_RUNTIME__?.meta?.care_abdm_fe?.config;

const flagEnabled = (
  config: MetaConfig | undefined,
  key: "enableScanPayMarkPaid" | "enableScanPayCancelOrder",
) => {
  const value = config?.[key] ?? runtimeConfig()?.[key];
  return value === true;
};

/**
 * Each flag stays off until its plugin-config value is true.
 * Pluggable screens pass `__meta.config`; route pages fall back to the runtime.
 */
export const scanPayManualActions = (config?: MetaConfig) => ({
  markPaid: flagEnabled(config, "enableScanPayMarkPaid"),
  cancelOrder: flagEnabled(config, "enableScanPayCancelOrder"),
});

export const useScanPayManualActions = (
  facilityId?: string,
  config?: MetaConfig,
) => {
  const [flags, setFlags] = useState(() => scanPayManualActions(config));
  const { data: facility } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: () => apis.facility.get(facilityId!),
    enabled: !!facilityId,
  });
  const canUpdateAccount =
    facility?.permissions?.includes(CAN_UPDATE_ACCOUNT) ?? false;

  useEffect(() => {
    const read = () => setFlags(scanPayManualActions(config));
    read();
    // The host assigns the runtime after the first paint.
    const id = window.setTimeout(read, 0);
    return () => window.clearTimeout(id);
  }, [config]);

  return {
    markPaid: flags.markPaid && canUpdateAccount,
    cancelOrder: flags.cancelOrder && canUpdateAccount,
  };
};
