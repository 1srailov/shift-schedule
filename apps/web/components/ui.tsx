"use client";

import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { IconClose, IconSearch } from "./icons";

/* ------------------------------------------------------------------ Button */

type Variant = "primary" | "secondary" | "gray" | "dark";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-primary-soft text-primary-text hover:bg-primary-soft-hover active:bg-primary-soft-active",
  gray: "bg-gray text-ink hover:bg-gray-hover active:bg-gray-active",
  dark: "bg-ink text-white hover:bg-[#242426] active:bg-[#3C3C43]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode; loading?: boolean }
>(function Button({ variant = "primary", icon, loading, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex h-12 items-center justify-center gap-1 whitespace-nowrap rounded px-4 py-3 text-base font-semibold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:bg-gray disabled:text-gray-disabled",
        variants[variant],
        loading && "cursor-progress",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

/** Round white 40×40 icon button (back / period navigation). */
export function IconButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={clsx(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-gray-hover active:bg-gray-active",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ Search */

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск по ФИО",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label
      className={clsx(
        "group flex h-12 items-center gap-2.5 rounded-lg border border-transparent bg-surface px-3 transition-colors",
        "hover:border-[#BCBCC2] focus-within:border-[#BCBCC2]",
        className,
      )}
    >
      <IconSearch size={24} className="shrink-0 text-hint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("");
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Очистить поиск"
          className="shrink-0 rounded text-muted hover:text-ink"
        >
          <IconClose size={20} />
        </button>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ Segmented */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={clsx("flex h-12 items-center rounded-lg bg-surface p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              "flex h-11 flex-1 items-center justify-center rounded-md px-6 text-base font-semibold transition-colors",
              active ? "bg-dark text-white" : "text-ink hover:bg-gray-hover",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ TextField */

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }
>(function TextField({ label, error, className, id, ...rest }, ref) {
  const inputId = id ?? `f-${label}`;
  return (
    <div className={clsx("flex min-w-0 flex-1 flex-col gap-1", className)}>
      <label htmlFor={inputId} className="text-xs leading-[17px] text-muted">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={clsx(
          "h-12 w-full rounded border bg-surface py-2 pl-4 pr-2 text-base text-ink outline-none transition-colors placeholder:text-muted",
          error ? "border-cover-none-text" : "border-transparent hover:border-[#BCBCC2] focus:border-primary",
        )}
        {...rest}
      />
      {error && <span className="text-xs text-cover-none-text">{error}</span>}
    </div>
  );
});

/* ------------------------------------------------------------------ KeyBadge */

export function KeyBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex h-5 min-w-[22px] items-center justify-center rounded-sm bg-white px-2 text-xs font-semibold text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
