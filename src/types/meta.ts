export type MetaConfig = {
  enforceAbhaNumberLinking?: boolean;
  scanAndShareUrl?: string;
};

export type Meta = {
  name?: string;
  url?: string;
  config?: MetaConfig;
};

export type WithMeta<T = unknown> = T & {
  __meta?: Meta;
};
