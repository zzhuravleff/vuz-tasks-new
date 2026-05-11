// hooks/useAsyncStore.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import { AppData, ComputedTask } from "@/types";
import { asyncStore } from "@/lib/asyncStore";
import { computeAndSortTasks, computeTask } from "@/lib/scheduleUtils";

// ─── Базовый хук — сырые данные ────────────────────────────────────────────

interface UseAsyncStoreResult {
  data: AppData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAsyncStore(): UseAsyncStoreResult {
  const [data, setData] = useState<AppData | null>(
    () => asyncStore.getCache() // мгновенно если кэш есть
  );
  const [isLoading, setIsLoading] = useState<boolean>(!asyncStore.getCache());
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await asyncStore.getData();
      setData(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Если кэш уже есть — не показываем лоадер
    if (!asyncStore.getCache()) {
      reload();
    }

    // Подписываемся на изменения store
    const unsubscribe = asyncStore.subscribe((updated) => {
      setData(updated);
    });

    return unsubscribe;
  }, [reload]);

  return { data, isLoading, error, reload };
}

// ─── Хук для задач ─────────────────────────────────────────────────────────

interface UseTasksResult {
  tasks: ComputedTask[];
  isLoading: boolean;
  error: string | null;
}

export function useTasks(): UseTasksResult {
  const { data, isLoading, error } = useAsyncStore();

  const tasks = data ? computeAndSortTasks(data.tasks) : [];

  return { tasks, isLoading, error };
}

// ─── Хук для одной задачи ──────────────────────────────────────────────────

interface UseTaskResult {
  task: ComputedTask | null;
  isLoading: boolean;
  error: string | null;
}

export function useTask(id: string): UseTaskResult {
  const { data, isLoading, error } = useAsyncStore();

  const task = useMemo(() => {
    if (!data) return null;
    const found = data.tasks.find((t) => t.id === id);
    return found ? computeTask(found) : null;
  }, [data, id]);

  return { task, isLoading, error };
}