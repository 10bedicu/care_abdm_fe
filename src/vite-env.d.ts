/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImportMetaEnv {}

interface CareAbdmFePluginConfig {
  faceAuthUrl?: string;
  enforceAbhaNumberLinking?: boolean;
  scanAndShareUrl?: string;
}

interface CarePluginRuntimeMeta {
  care_abdm_fe?: {
    config?: CareAbdmFePluginConfig;
  };
}

interface CarePluginRuntime {
  meta?: CarePluginRuntimeMeta;
}

declare global {
  const __CORE_ENV__: {
    readonly apiUrl: string;
  };

  interface Window {
    __CARE_PLUGIN_RUNTIME__?: CarePluginRuntime;
  }
}

export {};
