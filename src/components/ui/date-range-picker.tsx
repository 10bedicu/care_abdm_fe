import { format, isBefore, isSameDay, isToday } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

function normalizeToDate(date: Date | undefined): Date | undefined {
  if (!date) return undefined;
  return isToday(date) ? new Date() : date;
}

function normalizeDateRange(date: DateRange | undefined): DateRange | undefined {
  if (!date) return date;
  return {
    ...date,
    to: normalizeToDate(date.to),
  };
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
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(value?.from);
  const [dateTo, setDateTo] = useState<Date | undefined>(value?.to);
  const fromInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDateFrom(value?.from);
    setDateTo(value?.to);
  }, [value]);

  useEffect(() => {
    if (showManualInputs) {
      fromInputRef.current?.focus();
    }
  }, [showManualInputs]);

  const handleDateChange = (date: DateRange | undefined) => {
    const normalized = normalizeDateRange(date);
    setDateFrom(normalized?.from);
    setDateTo(normalized?.to);
    onChange?.(normalized);
  };

  const formattedRange = formatDateRange(value);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setShowManualInputs(false);
        }
      }}
      modal={!showManualInputs}
    >
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
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          if (showManualInputs) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          if (showManualInputs) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (showManualInputs) {
            e.preventDefault();
          }
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {!showManualInputs ? (
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
        ) : (
          <div
            className="flex flex-col gap-2 p-3"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div>
              <label className="mb-1 block text-sm text-gray-600 capitalize">
                {t("from")}
              </label>
              <Input
                ref={fromInputRef}
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
                className="text-sm"
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
                  const nextTo = normalizeToDate(
                    e.target.value ? new Date(e.target.value) : undefined,
                  );
                  setDateTo(nextTo);
                  onChange?.({ from: dateFrom, to: nextTo });
                }}
                placeholder={t("end_date")}
                className="text-sm"
              />
            </div>
          </div>
        )}

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

        <Separator orientation="horizontal" className="h-px bg-gray-200" />

        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => setShowManualInputs((prev) => !prev)}
        >
          <span>
            {showManualInputs
              ? t("use_calendar", { defaultValue: "Use calendar" })
              : t("enter_dates_manually", {
                  defaultValue: "Enter dates manually",
                })}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              showManualInputs && "rotate-180",
            )}
          />
        </button>
      </PopoverContent>
    </Popover>
  );
}
