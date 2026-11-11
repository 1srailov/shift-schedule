"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { IconBell, IconCalendar, IconHome, IconSidebar } from "./icons";

const STORAGE_KEY = "sidebar-collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved != null) setCollapsed(saved === "1");
      else setCollapsed(window.innerWidth < 1280);
    } catch {
      /* storage unavailable — keep default */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  const item = (icon: React.ReactNode, label: string, active = false) => (
    <a
      href="#"
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={(e) => e.preventDefault()}
      className={clsx(
        "flex h-10 items-center gap-3 rounded p-2 text-base font-semibold text-ink transition-colors",
        active ? "bg-white" : "hover:bg-gray-hover",
        collapsed && "justify-center",
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </a>
  );

  return (
    <aside
      className={clsx(
        "sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-line bg-surface py-4 pl-3.5 pr-4 transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-[280px]",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className={clsx("flex h-10 items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <span className="text-xl font-semibold tracking-[-0.3px] text-black">CRM</span>}
          <button
            type="button"
            aria-label="Уведомления"
            className="flex h-10 w-10 items-center justify-center rounded bg-surface text-ink hover:bg-gray-hover"
          >
            <IconBell />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {item(<IconHome />, "Главная")}
          {item(<IconCalendar />, "Смены", true)}
        </nav>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={clsx(
          "flex h-10 items-center gap-3 rounded p-2 text-base font-semibold text-ink hover:bg-gray-hover",
          collapsed && "justify-center",
        )}
        aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
      >
        <IconSidebar />
        {!collapsed && "Свернуть меню"}
      </button>
    </aside>
  );
}
