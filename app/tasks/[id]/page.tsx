// app/tasks/[id]/page.tsx

"use client";

import { useState, useCallback, useMemo, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTask } from "@/hooks/useAsyncStore";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { formatDeadline, formatDateDisplay } from "@/lib/scheduleUtils";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";
import { StatusBadge } from "@/components/tasks/TaskCard";
import { LESSON_TIMES } from "@/types";

// ─── Кнопка действия ───────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant: "primary" | "danger" | "ghost";
  disabled?: boolean;
  icon: React.ReactNode;
}

const ActionButton = ({ label, onClick, variant, disabled, icon }: ActionButtonProps) => {
  const styles = {
    primary: "bg-gray-900 text-white active:bg-gray-800",
    danger: "bg-red-50 text-red-600 active:bg-red-100",
    ghost: "bg-gray-100 text-gray-600 active:bg-gray-200",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2
        w-full py-3.5 rounded-2xl
        text-[15px] font-semibold
        active:scale-[0.98] transition-all duration-150
        disabled:opacity-40 disabled:pointer-events-none
        ${styles[variant]}
      `}
    >
      {icon}
      {label}
    </button>
  );
};

// ─── Редактируемое поле ────────────────────────────────────────────────────

interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  disabled?: boolean;
}

const EditableField = ({ value, onChange, placeholder, multiline, className }: EditableFieldProps) => {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`
          w-full bg-transparent resize-none outline-none
          text-gray-600 text-[14px] leading-relaxed
          placeholder:text-gray-300
          ${className ?? ""}
        `}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full bg-transparent outline-none
        font-semibold text-gray-900 text-[20px] leading-snug
        placeholder:text-gray-300
        ${className ?? ""}
      `}
    />
  );
};

// ─── Строка инфо ───────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex flex-col gap-0.5 flex-1">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-[14px] text-gray-700 font-medium">{value}</span>
    </div>
  </div>
);

// ─── Страница ──────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useAsyncStore();
  const { task, isLoading } = useTask(id);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Инициализируем поля когда задача загрузилась
  useEffect(() => {
    if (task && !isDirty) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task, isDirty]);

  const handleTitleChange = useCallback((v: string) => {
    setTitle(v);
    setIsDirty(true);
  }, []);

  const handleDescriptionChange = useCallback((v: string) => {
    setDescription(v);
    setIsDirty(true);
  }, []);

  // Автосохранение при уходе со страницы
  const saveIfDirty = useCallback(async () => {
    if (!isDirty || !task || !title.trim()) return;
    setIsSaving(true);
    await asyncStore.updateTask({
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
    });
    setIsDirty(false);
    setIsSaving(false);
  }, [isDirty, task, title, description]);

  // Сохраняем при размонтировании
  useEffect(() => {
    return () => {
      if (isDirty && task && title.trim()) {
        asyncStore.updateTask({
          ...task,
          title: title.trim(),
          description: description.trim() || undefined,
        });
      }
    };
  }, [isDirty, task, title, description]);

  const handleBack = useCallback(async () => {
    await saveIfDirty();
    startTransition(() => router.back());
  }, [saveIfDirty, router]);

  const handleComplete = useCallback(async () => {
    await saveIfDirty();
    await asyncStore.completeTask(id);
    startTransition(() => router.back());
  }, [id, saveIfDirty, router]);

  const handleCancel = useCallback(async () => {
    await saveIfDirty();
    await asyncStore.cancelTask(id);
    startTransition(() => router.back());
  }, [id, saveIfDirty, router]);

  const handleDelete = useCallback(async () => {
    await asyncStore.deleteTask(id);
    startTransition(() => router.back());
  }, [id, router]);

  // Название предмета для задачи по расписанию
  const subjectName = useMemo(() => {
    if (!task || task.type !== "По расписанию" || !data) return null;
    return data.subjects.find((s) => s.id === task.subjectId)?.name ?? null;
  }, [task, data]);

  // Время пары для задачи по расписанию
  const lessonTime = useMemo(() => {
    if (!task || task.type !== "По расписанию") return null;
    const time = LESSON_TIMES[task.lessonNumber];
    return `${task.lessonNumber} пара · ${time.start} – ${time.end}`;
  }, [task]);

  const isInactive = task?.computedStatus === "completed" || task?.computedStatus === "cancelled";

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="px-4 pt-6 pb-2">
          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="px-4 pt-2">
          <TaskSkeleton count={1} />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center gap-3">
        <p className="text-gray-400 text-[15px]">Задача не найдена</p>
        <button
          onClick={() => router.back()}
          className="text-gray-900 font-semibold text-[15px]"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-[12px] text-gray-400 font-medium">Сохранение...</span>
          )}
          {isDirty && !isSaving && (
            <button
              onClick={saveIfDirty}
              className="text-[13px] text-gray-900 font-semibold px-3 py-1.5 bg-white rounded-xl active:scale-95 transition-transform shadow-sm"
            >
              Сохранить
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-10 flex flex-col gap-3">

        {/* Основная карточка */}
        <div className="bg-white rounded-3xl p-4 flex flex-col gap-3">

          {/* Статус + тип */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-gray-400 font-medium">
              {task.type === "По расписанию" ? "По расписанию" : "Кастомная задача"}
            </span>
            <StatusBadge status={task.computedStatus} />
          </div>

          {/* Заголовок — редактируемый */}
          <EditableField
            value={title}
            onChange={handleTitleChange}
            placeholder="Название задачи"
            disabled={isInactive}
          />

          {/* Разделитель */}
          <div className="border-t border-gray-50" />

          {/* Описание — редактируемое */}
          <EditableField
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Добавить описание..."
            multiline
            disabled={isInactive}
          />
        </div>

        {/* Инфо карточка */}
        <div className="bg-white rounded-3xl px-4 py-1">
          <InfoRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.25" />
                <path d="M8 5V8.5L10 10" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label="Дедлайн"
            value={formatDeadline(task.deadline)}
          />

          {task.type === "По расписанию" && subjectName && (
            <InfoRow
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="#9CA3AF" strokeWidth="1.25" />
                  <path d="M5 2V4M11 2V4" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" />
                  <path d="M2 6.5H14" stroke="#9CA3AF" strokeWidth="1.25" />
                </svg>
              }
              label="Предмет"
              value={subjectName}
            />
          )}

          {task.type === "По расписанию" && lessonTime && (
            <InfoRow
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="9" rx="2" stroke="#9CA3AF" strokeWidth="1.25" />
                  <path d="M5 2V5M11 2V5" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              }
              label="Пара"
              value={lessonTime}
            />
          )}

          <InfoRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L9.8 6.2L14 6.9L11 9.8L11.7 14L8 11.9L4.3 14L5 9.8L2 6.9L6.2 6.2L8 2Z"
                  stroke="#9CA3AF" strokeWidth="1.25" strokeLinejoin="round" />
              </svg>
            }
            label="Создана"
            value={formatDateDisplay(task.createdAt)}
          />
        </div>

        {/* Действия */}
        {!isInactive && (
          <div className="flex flex-col gap-2">
            <ActionButton
              label="Выполнить"
              onClick={handleComplete}
              variant="primary"
              disabled={isPending}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.5 9L7.5 13L14.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <ActionButton
              label="Отменить"
              onClick={handleCancel}
              variant="ghost"
              disabled={isPending}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M5 5L13 13M13 5L5 13" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        )}

        {/* Удалить — всегда доступно */}
        <ActionButton
          label="Удалить задачу"
          onClick={handleDelete}
          variant="danger"
          disabled={isPending}
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5H15M7 5V3H11V5M6 5V14C6 14.6 6.4 15 7 15H11C11.6 15 12 14.6 12 14V5"
                stroke="#DC2626" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />

      </div>
    </div>
  );
}