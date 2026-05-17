// app/tasks/[id]/page.tsx

"use client";

import { useState, useCallback, useMemo, useTransition, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { computeTask } from "@/lib/scheduleUtils";
import { formatDeadline, formatDateDisplay } from "@/lib/scheduleUtils";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";
import { LESSON_TIMES, ComputedTask } from "@/types";
import { Button, Chip, IconChevronLeft } from "@heroui/react";
import { Calendar, Clock, Star, TrashBin } from "@gravity-ui/icons";

// ─── Кнопка действия ───────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant: "primary" | "danger-soft";
  disabled?: boolean;
  icon?: React.ReactNode;
}

const ActionButton = ({ label, onClick, variant, disabled, icon }: ActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      isDisabled={disabled}
      variant={variant}
      className="w-full"
    >
      {label}
    </Button>
  );
};

// ─── Редактируемое поле ────────────────────────────────────────────────────

interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

const EditableField = ({ value, onChange, placeholder, multiline, disabled }: EditableFieldProps) => {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="
          w-full bg-transparent resize-none outline-none
          text-gray-600 text-[16px] leading-relaxed
          placeholder:text-gray-300
          disabled:opacity-50
        "
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="
        w-full bg-transparent outline-none
        font-semibold text-black text-[20px] leading-snug
        placeholder:text-gray-300
        disabled:opacity-50
      "
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
      <span className="text-[14px] text-black font-medium">{value}</span>
    </div>
  </div>
);

// ─── Страница ──────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Загружаем задачу ОДИН РАЗ из asyncStore напрямую ──────────────────
  const [task, setTask] = useState<ComputedTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    asyncStore.getData().then((data) => {
      const found = data.tasks.find((t) => t.id === id);
      setTask(found ? computeTask(found) : null);
      setIsLoading(false);
    });
    // НЕ подписываемся на store — поля не будут сбрасываться
  }, [id]);

  const { data } = useAsyncStore(); // только для subjectName

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (task && !initialized.current) {
      initialized.current = true;
      if (task.type === "Кастомная") setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task]);

  const handleTitleChange = useCallback((v: string) => {
    setTitle(v);
    setIsDirty(true);
  }, []);

  const handleDescriptionChange = useCallback((v: string) => {
    setDescription(v);
    setIsDirty(true);
  }, []);

  const saveIfDirty = useCallback(async () => {
    if (!isDirty || !task) return;
    setIsSaving(true);
    try {
      if (task.type === "Кастомная") {
        if (!title.trim()) return;
        await asyncStore.updateTask({
          ...task,
          title: title.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await asyncStore.updateTask({
          ...task,
          description: description.trim() || undefined,
        });
      }
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, task, title, description]);

  // Сохраняем при размонтировании
  const saveRef = useRef(saveIfDirty);
  useEffect(() => { saveRef.current = saveIfDirty; }, [saveIfDirty]);
  useEffect(() => {
    return () => { saveRef.current(); };
  }, []);

  const handleBack = useCallback(async () => {
    await saveIfDirty();
    startTransition(() => router.back());
  }, [saveIfDirty, router]);

  const handleComplete = useCallback(async () => {
    await saveIfDirty();
    await asyncStore.completeTask(id);
    startTransition(() => router.back());
  }, [id, saveIfDirty, router]);

  const handleDelete = useCallback(async () => {
    await asyncStore.deleteTask(id);
    startTransition(() => router.back());
  }, [id, router]);

  const subjectName = useMemo(() => {
    if (!task || task.type !== "По расписанию" || !data) return null;
    return data.subjects.find((s) => s.id === task.subjectId)?.name ?? null;
  }, [task, data]);

  const lessonTime = useMemo(() => {
    if (!task || task.type !== "По расписанию") return null;
    const time = LESSON_TIMES[task.lessonNumber];
    return `${task.lessonNumber} пара · ${time.start} – ${time.end}`;
  }, [task]);

  const isInactive = task?.computedStatus === "completed";

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="px-4 pt-6 pb-2">
          <div className="h-8 w-8 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="px-4 pt-2"><TaskSkeleton count={1} /></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center gap-3">
        <p className="text-gray-400 text-[15px]">Задача не найдена</p>
        <Button onClick={handleBack} variant="tertiary" >
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">

      <Button variant="tertiary" className="fixed" onPress={() => router.back()}>
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      <h1 className="text-2xl font-medium text-center mt-12">Редактирование задачи</h1>

      <div className="flex-1 flex flex-col gap-2">

        {/* Основная карточка */}
        <div className={`bg-white rounded-3xl p-4 flex flex-col gap-3 ${task.computedStatus === "overdue" ? "border-danger/16 border-2" : ""}`}>
          <div className="w-full flex justify-start">
            <Chip color="danger" size="lg" variant="soft">
              Просрочено
            </Chip>
          </div>

          {task.type === "По расписанию" ? (
            <p className="text-[20px] font-semibold text-black leading-snug">
              {subjectName}
            </p>
          ) : (
            <EditableField
              value={title}
              onChange={handleTitleChange}
              placeholder="Название задачи"
              disabled={isInactive}
            />
          )}

          <div className="border-t border-gray-50" />

          <EditableField
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Добавить описание..."
            multiline
            disabled={isInactive}
          />

          {isDirty && !isSaving && (
          <Button
            variant="primary"
            onPress={saveIfDirty}
            className="w-full"
          >
            Сохранить
          </Button>
          )}

        </div>

        {/* Инфо */}
        <div className="bg-white rounded-3xl px-4 py-1">
          <InfoRow
            icon={<Clock className="text-gray-700 " />}
            label="Дедлайн"
            value={formatDeadline(task.deadline)}
          />

          {task.type === "По расписанию" && lessonTime && (
            <InfoRow
              icon={<Calendar className="text-gray-700 " />}
              label="Пара"
              value={lessonTime}
            />
          )}

          <InfoRow
            icon={<Star className="text-gray-700 " />}
            label="Создана"
            value={formatDateDisplay(task.createdAt)}
          />
        </div>

        {!isInactive && (
          <ActionButton
            label="Выполнить"
            onClick={handleComplete}
            variant="primary"
            disabled={isPending}
          />
        )}

        <ActionButton
          label="Удалить задачу"
          onClick={handleDelete}
          variant="danger-soft"
          disabled={isPending}
        />

      </div>
    </div>
  );
}