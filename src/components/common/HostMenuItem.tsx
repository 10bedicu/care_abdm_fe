import { ComponentProps } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type HostMenuItemProps = ComponentProps<"button"> & {
  variant?: "default" | "destructive";
  loading?: boolean;
};

/**
 * A row for the host's dropdown menus. The plugin renders inside the host's
 * menu popup, where the host's own `DropdownMenuItem` is out of reach, so this
 * is a plain button that looks like one (care_fe `ui/dropdown-menu`).
 */
export function HostMenuItem({
  variant = "default",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: HostMenuItemProps) {
  return (
    <button
      type="button"
      data-variant={variant}
      disabled={disabled || loading}
      className={cn(
        "relative flex min-h-11 w-full cursor-default items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm whitespace-nowrap outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:focus-visible:bg-destructive/10 md:min-h-10 md:px-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {loading && <Spinner aria-hidden="true" />}
      {children}
    </button>
  );
}
