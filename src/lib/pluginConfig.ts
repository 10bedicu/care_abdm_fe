import { useEffect, useState } from "react";

import type { MetaConfig } from "@/types/meta";

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
 * Each action stays hidden until its own plugin-config flag is true.
 * Pluggable screens pass `__meta.config`; route pages fall back to the runtime.
 */
export const scanPayManualActions = (config?: MetaConfig) => ({
  markPaid: flagEnabled(config, "enableScanPayMarkPaid"),
  cancelOrder: flagEnabled(config, "enableScanPayCancelOrder"),
});

export const useScanPayManualActions = (config?: MetaConfig) => {
  const [actions, setActions] = useState(() => scanPayManualActions(config));

  useEffect(() => {
    const read = () => setActions(scanPayManualActions(config));
    read();
    // The host assigns the runtime after the first paint.
    const id = window.setTimeout(read, 0);
    return () => window.clearTimeout(id);
  }, [config]);

  return actions;
};
