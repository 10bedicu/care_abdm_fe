import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-9 items-center justify-center relative",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-gray-400",
        week: "flex w-full mt-2",
        day: "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
        ),
        range_start:
          "day-range-start rounded-l-md bg-gray-100 dark:bg-gray-800",
        range_end: "day-range-end rounded-r-md bg-gray-100 dark:bg-gray-800",
        range_middle:
          "rounded-none bg-gray-100 dark:bg-gray-800 [&>button]:!bg-transparent [&>button]:!text-gray-900 [&>button]:!rounded-none [&>button]:hover:!bg-transparent dark:[&>button]:!text-gray-50",
        selected:
          "[&>button]:bg-primary-500 [&>button]:text-gray-50 [&>button]:hover:bg-primary-500 [&>button]:hover:text-gray-50 [&>button]:focus:bg-primary-500 [&>button]:focus:text-gray-50 dark:[&>button]:bg-primary-900 dark:[&>button]:text-gray-50",
        today:
          "[&>button]:border [&>button]:border-primary-500 [&>button]:text-primary-600 dark:[&>button]:border-primary-400 dark:[&>button]:text-primary-400",
        outside:
          "day-outside text-gray-500 aria-selected:text-gray-500 dark:text-gray-400",
        disabled: "text-gray-500 opacity-50 dark:text-gray-400",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
