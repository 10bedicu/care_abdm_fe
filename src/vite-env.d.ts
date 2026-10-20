/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImportMetaEnv {}

interface CareAbdmFePluginConfig {
  faceAuthUrl?: string;
  enforceAbhaNumberLinking?: boolean;
  scanAndShareUrl?: string;
  enableScanPayMarkPaid?: boolean;
  enableScanPayCancelOrder?: boolean;
}

interface CarePluginRuntimeMeta {
  care_abdm_fe?: {
    config?: CareAbdmFePluginConfig;
  };
}

interface CarePluginRuntime {
  meta?: CarePluginRuntimeMeta;
}

interface CoreEnv {
  readonly apiUrl: string;
  /** Milliseconds. Set by the host from REACT_AUTO_REFRESH_INTERVAL. */
  readonly appointmentAndQueueRefreshInterval?: number;
  /** Host default when the page has no autoRefresh query param. */
  readonly enableAutoRefresh?: boolean;
}

declare global {
  const __CORE_ENV__: CoreEnv;

  interface Window {
    __CORE_ENV__?: CoreEnv;
    __CARE_PLUGIN_RUNTIME__?: CarePluginRuntime;
  }
}

export {};
