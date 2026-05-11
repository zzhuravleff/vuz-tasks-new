// components/ui/BottomNav.tsx

"use client";

import { memo, useCallback, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavTab {
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_TABS: NavTab[] = [
  {
    path: "/",
    label: "Главная",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v11c0 1.38-1.12 2.5-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.75}
          opacity={active ? 1 : 0.45}
        />
        {active ? (
          <>
            <rect x="7.5" y="8" width="9" height="1.75" rx="0.875" fill="white" opacity="0.9" />
            <rect x="7.5" y="11.1" width="6" height="1.75" rx="0.875" fill="white" opacity="0.9" />
            <rect x="7.5" y="14.2" width="7.5" height="1.75" rx="0.875" fill="white" opacity="0.9" />
          </>
        ) : (
          <>
            <rect x="7.5" y="8" width="9" height="1.75" rx="0.875" fill="currentColor" opacity="0.35" />
            <rect x="7.5" y="11.1" width="6" height="1.75" rx="0.875" fill="currentColor" opacity="0.35" />
            <rect x="7.5" y="14.2" width="7.5" height="1.75" rx="0.875" fill="currentColor" opacity="0.35" />
          </>
        )}
      </svg>
    ),
  },
  {
    path: "/stats",
    label: "Статистика",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="4" y="12" width="4" height="8" rx="1.25"
          fill={active ? "currentColor" : "none"}
          stroke={active ? "none" : "currentColor"}
          strokeWidth="1.75"
          opacity={active ? 1 : 0.45}
        />
        <rect
          x="10" y="7" width="4" height="13" rx="1.25"
          fill={active ? "currentColor" : "none"}
          stroke={active ? "none" : "currentColor"}
          strokeWidth="1.75"
          opacity={active ? 0.7 : 0.45}
        />
        <rect
          x="16" y="4" width="4" height="16" rx="1.25"
          fill={active ? "currentColor" : "none"}
          stroke={active ? "none" : "currentColor"}
          strokeWidth="1.75"
          opacity={active ? 0.45 : 0.45}
        />
      </svg>
    ),
  },
  {
    path: "/settings",
    label: "Настройки",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="3"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 0 : 1.75}
          opacity={active ? 1 : 0.45}
        />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          opacity={active ? 1 : 0.45}
        />
      </svg>
    ),
  },
];

export const BottomNav = memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  // Скрываем навбар на экранах создания/редактирования
  const isHidden =
    pathname.startsWith("/tasks/") ||
    pathname.startsWith("/settings/semester") ||
    pathname.startsWith("/settings/subjects");

  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100">
      <div className="flex items-center px-4 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">

        {/* Вкладки */}
        <div className="flex items-center gap-1 flex-1">
          {NAV_TABS.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                disabled={isPending}
                className={`
                  flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl
                  transition-all duration-200 active:scale-95
                  ${active ? "text-gray-900" : "text-gray-400"}
                `}
              >
                {tab.icon(active)}
                <span className={`
                  text-[10px] font-semibold tracking-wide
                  ${active ? "opacity-100" : "opacity-50"}
                `}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Кнопка создания задачи */}
        <button
          onClick={() => navigate("/tasks/new")}
          disabled={isPending}
          className="
            w-12 h-12 rounded-2xl bg-gray-900 text-white
            flex items-center justify-center
            active:scale-95 transition-all duration-200
            shadow-lg shadow-gray-900/20
          "
          aria-label="Создать задачу"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 4v14M4 11h14"
              stroke="white"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
        </button>

      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";