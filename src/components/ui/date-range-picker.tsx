import { format, isBefore, isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface DatePickerWithRangeProps {
  value?: DateRange;
  onChange?: (date?: DateRange) => void;
  className?: string;
  placeholder?: string;
  disablePicker?: boolean;
}

function formatDateRange(value?: DateRange) {
  if (!value?.from) return null;

  if (value.to && !isSameDay(value.from, value.to)) {
    const needsYear = value.from.getFullYear() !== value.to.getFullYear();
    return [value.from, value.to]
      .map((date) => format(date, needsYear ? "d MMM yy" : "d MMM"))
      .join(" - ");
  }

  const presentDate = value.to ?? value.from;
  return format(presentDate, "d MMM yyyy");
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
  placeholder,
  disablePicker,
}: DatePickerWithRangeProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(value?.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(value?.to);

  useEffect(() => {
    setDateFrom(value?.from);
    setDateTo(value?.to);
  }, [value]);

  const handleDateChange = (date: DateRange | undefined) => {
    setDateFrom(date?.from);
    setDateTo(date?.to);
    onChange?.(date);
  };

  const formattedRange = formatDateRange(value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !formattedRange && "text-gray-500",
            "sm:w-auto",
            className,
          )}
          disabled={disablePicker}
        >
          <CalendarIcon className="mr-0 size-4 shrink-0" />
          <span className="truncate">
            {formattedRange ?? (
              <span>{placeholder ?? t("pick_a_date")}</span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div
          className="flex w-full max-h-[30vh] touch-pan-y flex-col overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Calendar
            mode="range"
            selected={{ from: dateFrom, to: dateTo }}
            onSelect={(date) => {
              if (date) {
                handleDateChange(date);
              }
            }}
            styles={{
              day: {
                width: "40px",
              },
              weekdays: {
                width: "100%",
                justifyContent: "space-between",
              },
              nav: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                padding: "0.5rem",
              },
            }}
            className="w-full"
            captionLayout="dropdown"
            endMonth={new Date(2100, 11, 31)}
            monthCaptionClassName="self-center"
            rangeMiddleClassName="bg-primary/10 [&>button]:rounded-md"
          />
          <div className="my-2">
            <Separator orientation="horizontal" className="h-px bg-gray-200" />
          </div>
          <div className="flex flex-col gap-2 p-3 pt-0">
            <div>
              <label className="mb-1 block text-sm text-gray-600 capitalize">
                {t("from")}
              </label>
              <Input
                type="date"
                value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const nextFrom = e.target.value
                    ? new Date(e.target.value)
                    : undefined;
                  setDateFrom(nextFrom);
                  onChange?.({ from: nextFrom, to: dateTo });
                }}
                placeholder={t("start_date")}
                className="flex flex-col justify-between text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600 capitalize">
                {t("to")}
              </label>
              <Input
                type="date"
                value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const nextTo = e.target.value
                    ? new Date(e.target.value)
                    : undefined;
                  setDateTo(nextTo);
                  onChange?.({ from: dateFrom, to: nextTo });
                }}
                placeholder={t("end_date")}
                className="flex flex-col justify-between text-sm"
              />
            </div>
          </div>
        </div>
        <div className="p-2 px-3">
          <Button
            type="button"
            variant="default"
            className="w-full justify-center"
            onClick={() => setOpen(false)}
            disabled={
              (!dateFrom && !dateTo) ||
              (!!dateFrom && !!dateTo && isBefore(dateTo, dateFrom))
            }
          >
            {t("confirm")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
