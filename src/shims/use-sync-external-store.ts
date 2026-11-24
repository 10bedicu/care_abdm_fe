/*
 * `use-sync-external-store/shim` is a CommonJS module that `require`s React.
 * The federation plugin only shares React with ES imports, so that `require`
 * would bundle a second copy of React and its hooks would fail in the host.
 * React 18+ has the hook built in; re-export it from the shared React.
 * Aliased in vite.config.mjs.
 *
 * Keep the import and the export separate: the federation plugin rewrites
 * `import ... from "react"` but not `export ... from "react"`.
 */
import { useSyncExternalStore } from "react";

export { useSyncExternalStore };
