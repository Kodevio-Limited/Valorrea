"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

// ---- Button ----

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-pill px-4 py-2 font-manrope text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-gradient text-white shadow-card hover:opacity-90",
    secondary: "bg-primary/10 text-primary hover:bg-primary/20",
    ghost: "text-text-muted hover:bg-surface-bg",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ---- Badge ----

export function Badge({
  children,
  tone = "bg-text-faint/20 text-text-muted",
  className = "",
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill px-2.5 py-0.5 font-manrope text-xs font-semibold ${tone} ${className}`}
    >
      {children}
    </span>
  );
}

// ---- Card ----

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card bg-surface-card p-6 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

// ---- StatCard ----

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-card p-6 shadow-card ${
        accent
          ? "bg-primary-gradient text-white"
          : "bg-surface-card text-text-primary"
      }`}
    >
      <div className="flex items-start justify-between">
        <p
          className={`font-manrope text-xs font-semibold uppercase tracking-wide ${
            accent ? "text-accent-blue" : "text-text-muted"
          }`}
        >
          {label}
        </p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="mt-3 font-urbanist text-3xl font-bold">{value}</p>
      {sub && (
        <p
          className={`mt-1 font-manrope text-xs ${
            accent ? "text-accent-blue" : "text-text-muted"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---- Modal ----

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary-dark/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[85vh] w-full overflow-y-auto rounded-card bg-surface-card p-6 shadow-raised ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-urbanist text-lg font-semibold text-text-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-pill p-1.5 text-text-muted hover:bg-surface-bg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- Form fields ----

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-manrope text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-light">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-card border border-text-faint/40 bg-white px-3 py-2 font-manrope text-sm text-text-body outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---- Empty / loading ----

export function EmptyState({ icon = "🕊️", message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-3 font-manrope text-sm text-text-muted">{message}</p>
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <span className="ml-3 font-manrope text-sm text-text-muted">{label}</span>
    </div>
  );
}

// ---- Pagination ----

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="font-manrope text-xs text-text-muted">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          ← Prev
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
