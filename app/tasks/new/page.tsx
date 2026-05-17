// app/tasks/new/page.tsx

"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { useUpcomingSlots } from "@/hooks/useSchedule";
import { asyncStore } from "@/lib/asyncStore";
import { formatDateDisplay, formatDateToISO, getLessonSlots } from "@/lib/scheduleUtils";
import { LESSON_TIMES, CustomTask, ScheduleTask, LessonSlot } from "@/types";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";

// ─── Утилиты ───────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

// ─── Типы вкладок ──────────────────────────────────────────────────────────

type TabType = "Кастомная" | "По расписанию";

// ─── Компонент вкладок ─────────────────────────────────────────────────────

interface TabSwitcherProps {
  active: TabType;
  onChange: (tab: TabType) => void;
}

const TabSwitcher = ({ active, onChange }: TabSwitcherProps) => (
  <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
    {(["Кастомная", "По расписанию"] as TabType[]).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`
          flex-1 py-2 rounded-xl text-[13px] font-semibold
          transition-all duration-200 active:scale-[0.97]
          ${active === tab
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-400"
          }
        `}
      >
        {tab}
      </button>
    ))}
  </div>
);

// ─── Поле ввода ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field = ({ label, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide px-1">
      {label}
    </span>
    {children}
  </div>
);

const inputClass = `
  w-full bg-white rounded-2xl px-4 py-3.5
  text-[15px] text-gray-900 font-medium
  outline-none border-2 border-transparent
  focus:border-gray-200 transition-colors
  placeholder:text-gray-300
`;

// ─── Форма кастомной задачи ────────────────────────────────────────────────

interface CustomFormProps {
  onSubmit: (task: CustomTask) => void;
  isSubmitting: boolean;
}

const CustomForm = ({ onSubmit, isSubmitting }: CustomFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const isValid = title.trim().length > 0 && deadline.length > 0;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSubmit({
      id: generateId(),
      type: "Кастомная",
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: new Date(deadline).toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }, [title, description, deadline, isValid, onSubmit]);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Название">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          className={inputClass}
          autoFocus
        />
      </Field>

      <Field label="Описание">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Подробности (необязательно)"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Field label="Дедлайн">
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputClass}
        />
      </Field>

      <SubmitButton
        onSubmit={handleSubmit}
        disabled={!isValid || isSubmitting}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

// ─── Форма задачи по расписанию ────────────────────────────────────────────

interface ScheduleFormProps {
  onSubmit: (task: ScheduleTask) => void;
  isSubmitting: boolean;
}

const ScheduleForm = ({ onSubmit, isSubmitting }: ScheduleFormProps) => {
  const { data, isLoading } = useAsyncStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<LessonSlot | null>(null);
  const [description, setDescription] = useState("");

  // Пары выбранного предмета (ближайшие 60 дней)
  const subjectSlots = useMemo(() => {
    if (!data || !selectedSubjectId) return [];
    const subject = data.subjects.find((s) => s.id === selectedSubjectId);
    if (!subject) return [];

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return getLessonSlots(subject, from, to, data.semester) as LessonSlot[];
  }, [data, selectedSubjectId]);

  // Группируем слоты по дате
  const slotsByDate = useMemo(() => {
    const map = new Map<string, LessonSlot[]>();
    for (const slot of subjectSlots) {
      const existing = map.get(slot.lessonDate) ?? [];
      map.set(slot.lessonDate, [...existing, slot]);
    }
    return map;
  }, [subjectSlots]);

  const handleSubjectChange = useCallback((id: string) => {
    setSelectedSubjectId(id);
    setSelectedSlot(null);
  }, []);

  const isValid = selectedSlot !== null;

  const handleSubmit = useCallback(() => {
    if (!isValid || !selectedSlot) return;
    onSubmit({
      id: generateId(),
      type: "По расписанию",
      description: description.trim() || undefined,
      subjectId: selectedSlot.subjectId,
      ruleId: selectedSlot.ruleId,
      lessonDate: selectedSlot.lessonDate,
      lessonNumber: selectedSlot.lessonNumber,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }, [isValid, selectedSlot, description, onSubmit]);

  if (isLoading) return <TaskSkeleton count={2} />;

  if (!data?.subjects.length) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center">
        <p className="text-gray-400 text-[14px]">Нет предметов</p>
        <p className="text-gray-300 text-[13px] mt-1">
          Добавьте предметы в настройках
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      <Field label="Описание">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Подробности (необязательно)"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Выбор предмета */}
      <Field label="Предмет">
        <div className="flex flex-col gap-2">
          {data.subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectChange(subject.id)}
              className={`
                w-full text-left px-4 py-3.5 rounded-2xl
                text-[15px] font-medium transition-all duration-150
                active:scale-[0.98]
                ${selectedSubjectId === subject.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700"
                }
              `}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </Field>

      {/* Выбор пары */}
      {selectedSubjectId && (
        <Field label="Пара">
          {subjectSlots.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-3.5 text-[14px] text-gray-400">
              Нет предстоящих пар
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from(slotsByDate.entries()).map(([date, slots]) => (
                <div key={date} className="flex flex-col gap-1.5">
                  {/* Дата */}
                  <span className="text-[12px] font-semibold text-gray-400 px-1">
                    {formatDateDisplay(date)}
                  </span>
                  {/* Слоты этой даты */}
                  {slots.map((slot) => {
                    const time = LESSON_TIMES[slot.lessonNumber];
                    const isSelected =
                      selectedSlot?.lessonDate === slot.lessonDate &&
                      selectedSlot?.lessonNumber === slot.lessonNumber;

                    return (
                      <button
                        key={`${slot.lessonDate}-${slot.lessonNumber}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          w-full text-left px-4 py-3 rounded-2xl
                          transition-all duration-150 active:scale-[0.98]
                          ${isSelected
                            ? "bg-gray-900 text-white"
                            : "bg-white text-gray-700"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-medium">
                            {slot.lessonNumber} пара
                          </span>
                          <span className={`text-[13px] ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                            {time.start} – {time.end}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </Field>
      )}

      <SubmitButton
        onSubmit={handleSubmit}
        disabled={!isValid || isSubmitting}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

// ─── Кнопка сабмита ────────────────────────────────────────────────────────

interface SubmitButtonProps {
  onSubmit: () => void;
  disabled: boolean;
  isSubmitting: boolean;
}

const SubmitButton = ({ onSubmit, disabled, isSubmitting }: SubmitButtonProps) => (
  <button
    onClick={onSubmit}
    disabled={disabled}
    className={`
      w-full py-4 rounded-2xl
      text-[15px] font-semibold text-white
      bg-gray-900 active:bg-gray-800
      active:scale-[0.98] transition-all duration-150
      disabled:opacity-40 disabled:pointer-events-none
      mt-2
    `}
  >
    {isSubmitting ? "Сохранение..." : "Создать задачу"}
  </button>
);

// ─── Страница ──────────────────────────────────────────────────────────────

export default function NewTaskPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("Кастомная");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleBack = useCallback(() => {
    startTransition(() => router.back());
  }, [router]);

  const handleSubmit = useCallback(
    async (task: CustomTask | ScheduleTask) => {
      setIsSubmitting(true);
      try {
        await asyncStore.addTask(task);
        startTransition(() => router.back());
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">Новая задача</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 pb-10 flex flex-col gap-4">

        {/* Переключатель типа */}
        <TabSwitcher active={activeTab} onChange={setActiveTab} />

        {/* Форма */}
        {activeTab === "Кастомная" ? (
          <CustomForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <ScheduleForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

      </div>
    </div>
  );
}