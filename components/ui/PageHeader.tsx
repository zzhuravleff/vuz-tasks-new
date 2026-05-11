// components/ui/PageHeader.tsx

"use client";

import { memo } from "react";
import { useWeekInfo } from "@/hooks/useSchedule";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showWeekInfo?: boolean;
  action?: React.ReactNode;
}

export const PageHeader = memo(({
  title,
  subtitle,
  showWeekInfo = false,
  action,
}: PageHeaderProps) => {
  const weekInfo = useWeekInfo();

  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-6 pb-2">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
          {title}
        </h1>

        {showWeekInfo && weekInfo && (
          <span className="text-sm text-gray-400 font-medium">
            {weekInfo.weekLabel}
          </span>
        )}

        {subtitle && !showWeekInfo && (
          <span className="text-sm text-gray-400">{subtitle}</span>
        )}
      </div>

      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  );
});

PageHeader.displayName = "PageHeader";