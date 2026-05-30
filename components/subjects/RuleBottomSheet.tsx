// components/subjects/RuleBottomSheet.tsx

"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { ScheduleRule, WeeklyRule, CustomRule } from "@/types";

interface RuleBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (rules: ScheduleRule[]) => void;
}

const WEEK_TYPES = [
  { value: "Еженедельно", label: "Каждую неделю", bg: "#F3F4F6", active: "#111827", text: "#374151" },
  { value: "Чёт",         label: "Чётные недели",  bg: "#DBEAFE", active: "#1D4ED8", text: "#1D4ED8" },
  { value: "Нечёт",       label: "Нечётные недели",bg: "#FED7AA", active: "#C2410C", text: "#C2410C" },
  { value: "Кастом",      label: "Конкретная дата",bg: "#EDE9FE", active: "#6D28D9", text: "#6D28D9" },
] as const;

const DAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
];

const LESSONS = [1, 2, 3, 4, 5, 6];
const LESSON_TIMES: Record<number, string> = {
  1: "9:00", 2: "10:40", 3: "12:40", 4: "14:20", 5: "16:20", 6: "18:00"
};

// ─── Пилюля-кнопка ─────────────────────────────────────────────────────────

const Pill = memo(({
  label, sub, active, onClick, color
}: {
  label: string; sub?: string; active: boolean;
  onClick: () => void; color?: string;
}) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center
      px-3 py-2 rounded-2xl border-2 transition-all duration-150 active:scale-95
      ${active
        ? "border-gray-900 bg-gray-900 text-white"
        : "border-gray-100 bg-gray-50 text-gray-600"
      }
    `}
    style={active && color ? { borderColor: color, background: color } : {}}
  >
    <span className="text-[14px] font-semibold">{label}</span>
    {sub && <span className="text-[10px] opacity-70 mt-0.5">{sub}</span>}
  </button>
));
Pill.displayName = "Pill";

// ─── Шаги ──────────────────────────────────────────────────────────────────

type Step = "type" | "day" | "lessons";

export const RuleBottomSheet = memo(({ open, onClose, onAdd }: RuleBottomSheetProps) => {
  const [step, setStep] = useState<Step>("type");
  const [ruleType, setRuleType] = useState<"Еженедельно" | "Чёт" | "Нечёт" | "Кастом">("Еженедельно");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [customDate, setCustomDate] = useState("");
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      setStep("type");
      setRuleType("Еженедельно");
      setSelectedDays([]);
      setCustomDate("");
      setSelectedLessons([]);
    }
  }, [open]);

  const toggleDay = useCallback((v: number) => {
    setSelectedDays(prev =>
      prev.includes(v) ? prev.filter(d => d !== v) : [...prev, v]
    );
  }, []);

  const toggleLesson = useCallback((v: number) => {
    setSelectedLessons(prev =>
      prev.includes(v) ? prev.filter(l => l !== v) : [...prev, v].sort((a, b) => a - b)
    );
  }, []);

  const handleNext = useCallback(() => {
    if (step === "type") {
      setStep("day");
    } else if (step === "day") {
      setStep("lessons");
    }
  }, [step]);

  const handleAdd = useCallback(() => {
    if (selectedLessons.length === 0) return;

    const newRules: ScheduleRule[] = [];

    if (ruleType === "Кастом") {
      const rule: CustomRule = {
        id: crypto.randomUUID(),
        type: "Кастом",
        date: customDate,
        lesson: selectedLessons,
      };
      newRules.push(rule);
    } else {
      selectedDays.forEach(day => {
        const rule: WeeklyRule = {
          id: crypto.randomUUID(),
          type: ruleType,
          dayOfWeek: day,
          lesson: selectedLessons,
        };
        newRules.push(rule);
      });
    }

    onAdd(newRules);
    onClose();
  }, [ruleType, selectedDays, customDate, selectedLessons, onAdd, onClose]);

  const canNext = step === "type"
    ? true
    : step === "day"
      ? ruleType === "Кастом" ? customDate.length > 0 : selectedDays.length > 0
      : false;

  const canAdd = selectedLessons.length > 0;

  const stepLabel = {
    type: "Тип повторения",
    day: ruleType === "Кастом" ? "Дата" : "День недели",
    lessons: "Номера пар",
  }[step];

  const stepNum = { type: 1, day: 2, lessons: 3 }[step];

  if (!open) return null;

  return (
    <>
      {/* Оверлей */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Шит */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        {/* Ручка */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {/* Шаги */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: n === stepNum ? 20 : 6,
                    background: n === stepNum ? "#111827" : n < stepNum ? "#6B7280" : "#E5E7EB"
                  }}
                />
              ))}
            </div>
            <span className="text-[15px] font-bold text-gray-900">{stepLabel}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#6B7280" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-5">

          {/* ШАГ 1 — тип */}
          {step === "type" && (
            <div className="flex flex-col gap-3">
              {WEEK_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRuleType(value)}
                  className={`
                    w-full flex items-center justify-between
                    px-4 py-3.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]
                    ${ruleType === value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-100 bg-gray-50 text-gray-700"
                    }
                  `}
                >
                  <span className="text-[15px] font-medium">{label}</span>
                  {ruleType === value && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.5 9L7 12.5L14.5 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ШАГ 2 — день или дата */}
          {step === "day" && (
            <div className="flex flex-col gap-3">
              {ruleType === "Кастом" ? (
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-[15px] text-gray-900 font-medium outline-none border-2 border-transparent focus:border-gray-200 transition-colors"
                  autoFocus
                />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map(({ value, label }) => (
                    <Pill
                      key={value}
                      label={label}
                      active={selectedDays.includes(value)}
                      onClick={() => toggleDay(value)}
                    />
                  ))}
                </div>
              )}

              {/* Подсказка для множественного выбора */}
              {ruleType !== "Кастом" && (
                <p className="text-[12px] text-gray-400 px-1">
                  Можно выбрать несколько дней — для каждого создастся отдельное правило
                </p>
              )}
            </div>
          )}

          {/* ШАГ 3 — пары */}
          {step === "lessons" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {LESSONS.map(lesson => {
                  const active = selectedLessons.includes(lesson);
                  return (
                    <button
                      key={lesson}
                      onClick={() => toggleLesson(lesson)}
                      className={`
                        w-full flex items-center justify-between
                        px-4 py-3 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]
                        ${active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-100 bg-gray-50 text-gray-700"
                        }
                      `}
                    >
                      <span className="text-[15px] font-medium">{lesson} пара</span>
                      <span className={`text-[13px] ${active ? "text-gray-300" : "text-gray-400"}`}>
                        {LESSON_TIMES[lesson]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Кнопки навигации */}
          <div className="flex gap-2 mt-auto pt-2">
            {step !== "type" && (
              <button
                onClick={() => setStep(step === "lessons" ? "day" : "type")}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 text-[15px] font-semibold active:scale-[0.98] transition-transform"
              >
                Назад
              </button>
            )}
            {step !== "lessons" ? (
              <button
                onClick={handleNext}
                disabled={!canNext}
                className="flex-1 py-3.5 rounded-2xl bg-gray-900 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-30 disabled:pointer-events-none"
              >
                Далее
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className="flex-1 py-3.5 rounded-2xl bg-gray-900 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-30 disabled:pointer-events-none"
              >
                Добавить
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
});
RuleBottomSheet.displayName = "RuleBottomSheet";