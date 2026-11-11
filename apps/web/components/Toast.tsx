"use client";

import clsx from "clsx";
import { create } from "zustand";

type Toast = { id: number; text: string; tone: "default" | "error" };

const useToasts = create<{ items: Toast[]; push: (t: Omit<Toast, "id">) => void; drop: (id: number) => void }>(
  (set) => ({
    items: [],
    push: (t) => {
      const id = Date.now() + Math.random();
      set((s) => ({ items: [...s.items.slice(-2), { ...t, id }] }));
      setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3500);
    },
    drop: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  }),
);

export const toast = (text: string, tone: Toast["tone"] = "default") => useToasts.getState().push({ text, tone });

export function Toaster() {
  const items = useToasts((s) => s.items);
  const drop = useToasts((s) => s.drop);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => drop(t.id)}
          className={clsx(
            "pointer-events-auto rounded px-4 py-3 text-sm text-white shadow-pop",
            t.tone === "error" ? "bg-cover-none-text" : "bg-dark",
          )}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
