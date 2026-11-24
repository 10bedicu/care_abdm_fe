import { ReactNode } from "react";

import { SCOPE_CLASS } from "@/lib/constants";

/**
 * Root of every plugin surface: plugin styles only apply beneath it.
 * `display: contents` keeps the wrapper out of the host's layout, so the
 * children sit exactly where the host placed the plugin.
 */
export function AbdmScope({ children }: { children: ReactNode }) {
  return (
    <div className={SCOPE_CLASS} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
