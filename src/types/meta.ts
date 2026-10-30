export type MetaConfig = {
  enforceAbhaNumberLinking?: boolean;
  scanAndShareUrl?: string;
  /** Show Mark as paid on Scan & Pay and the invoice menu. */
  enableScanPayMarkPaid?: boolean;
  /** Show Cancel order on Scan & Pay and the invoice menu. */
  enableScanPayCancelOrder?: boolean;
};

export type Meta = {
  name?: string;
  url?: string;
  config?: MetaConfig;
};

export type WithMeta<T = unknown> = T & {
  __meta?: Meta;
};
