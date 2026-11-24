import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  PaginationButton,
  PaginationContent,
  PaginationItem,
  Pagination as PaginationRoot,
} from "@/components/ui/pagination";
import { TooltipComponent } from "@/components/ui/tooltip";
import { I18NNAMESPACE } from "@/lib/constants";

interface PaginationProps {
  totalCount: number;
  perPage: number;
  /** 1-based. */
  page: number;
  onChange: (page: number) => void;
  className?: string;
}

/** The page numbers around `page`, as care_fe's Pagination shows them. */
function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  return [start, start + 1, start + 2].filter((p) => p <= totalPages);
}

/** Mirrors care_fe's `components/Common/Pagination`. */
export function Pagination({
  totalCount,
  perPage,
  page,
  onChange,
  className = "mx-auto my-4",
}: PaginationProps) {
  const { t } = useTranslation(I18NNAMESPACE);

  if (!totalCount || totalCount <= perPage) {
    return null;
  }
  const totalPages = Math.ceil(totalCount / perPage);

  const goToPage = (next: number) => {
    onChange(next);
    // The host scrolls its page container, not the window.
    document.getElementById("pages")?.scroll({ top: 0, left: 0 });
  };

  return (
    <PaginationRoot className={className}>
      <PaginationContent className="w-full justify-between sm:w-auto sm:justify-center">
        <PaginationItem className="hidden sm:block">
          <NavButton
            tooltip={t("pagination_first_page")}
            onClick={() => goToPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft />
          </NavButton>
        </PaginationItem>
        <PaginationItem>
          <NavButton
            tooltip={t("pagination_previous_page")}
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft />
          </NavButton>
        </PaginationItem>
        {visiblePages(page, totalPages).map((number) => (
          <PaginationItem key={number} className="hidden sm:block">
            <NavButton
              tooltip={t("pagination_go_to_page", { page: number })}
              onClick={() => goToPage(number)}
              selected={page === number}
            >
              {number}
            </NavButton>
          </PaginationItem>
        ))}
        <PaginationItem className="text-sm text-muted-foreground sm:hidden">
          {page} / {totalPages}
        </PaginationItem>
        <PaginationItem>
          <NavButton
            tooltip={t("pagination_next_page")}
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight />
          </NavButton>
        </PaginationItem>
        <PaginationItem className="hidden sm:block">
          <NavButton
            tooltip={t("pagination_last_page")}
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight />
          </NavButton>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}

interface NavButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
  selected?: boolean;
}

function NavButton({
  onClick,
  children,
  tooltip,
  disabled,
  selected,
}: NavButtonProps) {
  return (
    <TooltipComponent content={tooltip}>
      <PaginationButton
        disabled={disabled}
        onClick={onClick}
        isActive={selected}
        aria-label={tooltip}
      >
        {children}
      </PaginationButton>
    </TooltipComponent>
  );
}
