// app/settings/semester/page.tsx

"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { formatDateToISO } from "@/lib/scheduleUtils";
import { Button, Chip, IconChevronLeft } from "@heroui/react";

// ─── Константы ─────────────────────────────────────────────────────────────

const MIN_WEEKS = 8;
const MAX_WEEKS = 24;

// ─── Поле ввода ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  sub?: string;
  children: React.ReactNode;
}

const Field = ({ label, sub, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex flex-col gap-0.5 px-1">
      <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      {sub && <span className="text-[11px] text-gray-300">{sub}</span>}
    </div>
    {children}
  </div>
);

const inputClass = `
  w-full bg-white rounded-2xl px-4 py-3.5
  text-[15px] text-black font-medium
  outline-none border-2 border-transparent
  focus:border-gray-200 transition-colors
`;

// ─── Степпер (количество недель) ───────────────────────────────────────────

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

const Stepper = ({ value, min, max, onChange }: StepperProps) => (
  <div className="bg-white rounded-2xl flex items-center overflow-hidden">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="
        w-14 h-14 flex items-center justify-center
        text-black text-xl font-medium
        active:bg-gray-50 transition-colors
        disabled:opacity-30 disabled:pointer-events-none
      "
    >
      −
    </button>

    <div className="flex-1 flex flex-col items-center py-2">
      <span className="text-[26px] font-bold text-black leading-none">
        {value}
      </span>
      <span className="text-[12px] text-gray-400 font-medium mt-0.5">
        {value === 1 ? "неделя" : value < 5 ? "недели" : "недель"}
      </span>
    </div>

    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="
        w-14 h-14 flex items-center justify-center
        text-black text-xl font-medium
        active:bg-gray-50 transition-colors
        disabled:opacity-30 disabled:pointer-events-none
      "
    >
      +
    </button>
  </div>
);

// ─── Превью дат семестра ───────────────────────────────────────────────────

interface SemesterPreviewProps {
  startDate: string;
  weeks: number;
}

const SemesterPreview = ({ startDate, weeks }: SemesterPreviewProps) => {
  const endDate = (() => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + weeks * 7 - 1);
    return d;
  })();

  const formatShort = (d: Date) => {
    const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const now = new Date();
  const isActive = now >= start && now <= endDate;
  const isPast = now > endDate;

  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
          Период
        </span>
        <Chip color={isActive ? "success" : isPast ? "default" : "accent"} variant="soft">
          {isActive ? "Идёт сейчас" : isPast ? "Завершён" : "Предстоит"}
        </Chip>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col flex-1">
          <span className="text-[11px] text-gray-400">Начало</span>
          <span className="text-[14px] font-semibold text-black">
            {formatShort(start)}
          </span>
        </div>

        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10H16M16 10L11 5M16 10L11 15"
            stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="flex flex-col flex-1 items-end">
          <span className="text-[11px] text-gray-400">Конец</span>
          <span className="text-[14px] font-semibold text-black">
            {formatShort(endDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Страница ──────────────────────────────────────────────────────────────

export default function SemesterSettingsPage() {
  const router = useRouter();
  const { data, isLoading } = useAsyncStore();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [weeks, setWeeks] = useState(16);
  const [isDirty, setIsDirty] = useState(false);

  // Инициализируем из данных
  useEffect(() => {
    if (data && !isDirty) {
      setStartDate(data.semester.startDate);
      setWeeks(data.semester.weeks);
    }
  }, [data, isDirty]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
    setIsDirty(true);
  }, []);

  const handleWeeksChange = useCallback((value: number) => {
    setWeeks(value);
    setIsDirty(true);
  }, []);

  const isValid = startDate.length > 0 && weeks >= MIN_WEEKS && weeks <= MAX_WEEKS;

  const handleSave = useCallback(async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await asyncStore.updateSemester({ startDate, weeks });
      setIsDirty(false);
      startTransition(() => router.back());
    } finally {
      setIsSaving(false);
    }
  }, [isValid, startDate, weeks, router]);

  const handleBack = useCallback(() => {
    startTransition(() => router.back());
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">

      <Button variant="tertiary" className="fixed" onPress={handleBack}>
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      <Button
          onPress={handleSave}
          className="fixed right-4"
          variant="primary"
          isDisabled={!isDirty || !isValid || isSaving || isPending}
      >
        {isSaving ? "..." : "Сохранить"}
      </Button>
      
      <h1 className="text-2xl font-medium text-center mt-12">Семестр</h1>

      <div className="flex flex-col gap-4">

        {/* Дата начала */}
        <Field
          label="Дата начала"
          sub="Первый день первой недели семестра"
        >
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={inputClass}
          />
        </Field>

        {/* Количество недель */}
        <Field
          label="Количество недель"
          sub={`От ${MIN_WEEKS} до ${MAX_WEEKS} недель`}
        >
          <Stepper
            value={weeks}
            min={MIN_WEEKS}
            max={MAX_WEEKS}
            onChange={handleWeeksChange}
          />
        </Field>

        {/* Превью */}
        <Field label="Итого">
          <SemesterPreview startDate={startDate} weeks={weeks} />
        </Field>

      </div>
    </div>
  );
}