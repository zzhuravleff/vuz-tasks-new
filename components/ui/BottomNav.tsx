// components/ui/BottomNav.tsx

"use client";

import { memo, useCallback, useMemo, useTransition } from "react";
import {ChartAreaStacked, Gear, House, Plus} from '@gravity-ui/icons';
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useTasks } from "@/hooks/useAsyncStore";
import { PetWidget } from "../pet/PetWidget";



export const BottomNav = memo(() => {
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { tasks, isLoading } = useTasks();

  const navigate = useCallback(
    (path: string) => {
      startTransition(() => router.push(path));
    },
    [router]
  );

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/";
      return pathname.startsWith(path);
    },
    [pathname]
  );

  const navTabs = useMemo (() => [
    {
      path: "/",
      label: "Главная",
      icon: <House className="relative z-10 size-6" />,
    },
    {
      path: "/stats",
      label: "Статистика",
      icon: isLoading ? <ChartAreaStacked className="relative z-10 size-6" /> : <PetWidget tasks={tasks} mini />,
    },
    {
      path: "/settings",
      label: "Настройки",
      icon: <Gear className="relative z-10 size-6" />,
    },
  ], [tasks, isLoading]);

  // Скрываем навбар на экранах создания/редактирования
  const isHidden =
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/settings/semester") ||
    pathname.startsWith("/settings/subjects");

  if (isHidden) return null;

  return (
    <nav className={`fixed bottom-0 z-50 flex justify-center w-full bg-white/20 backdrop-blur-xs border-t border-gray-200/50 py-2 pb-6`}>
      <div className="flex items-center gap-2">
        
        {navTabs.map((tab) => {
          const active = isActive(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`relative flex flex-col items-center justify-center px-4 py-2 transition active:scale-95 cursor-pointer
                ${active ? "text-accent" : "text-black/60 hover:text-black"}`}
            >
              {active && (
                <span className="absolute inset-0" />
              )}

              {tab.icon}
              <span className="text-[12px] relative z-10">{tab.label}</span>
            </button>
          );
        })}

        <Button
          className="shadow-blue-700 shadow-2xl"
          size="lg"
          variant="primary"
          isIconOnly
          onClick={() => navigate("/tasks/new")}
          isDisabled={isPending}
        >
          <Plus className="size-6" />
        </Button>
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";