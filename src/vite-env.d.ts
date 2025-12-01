/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImportMetaEnv {}

declare global {
  const __CORE_ENV__: {
    readonly apiUrl: string;
  };
}
