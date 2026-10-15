"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckIcon, SpinnerIcon, XIcon } from "./icons";

export type ToastVariant = "loading" | "success" | "error";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  /** ms before auto-dismiss; 0 keeps it until updated or dismissed. */
  duration: number;
}

interface ToastInput {
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  notify: (input: ToastInput) => string;
  update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: string) => void;
}

const NOOP: ToastContextValue = {
  notify: () => "",
  update: () => {},
  dismiss: () => {},
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Falls back to a no-op so callers work outside a provider. */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? NOOP;
}

const DEFAULT_DURATION = 4000;

const VARIANT_BORDER: Record<ToastVariant, string> = {
  loading: "border-zinc-200 dark:border-zinc-800",
  success: "border-accent-border",
  error: "border-red-200 dark:border-red-900",
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  loading: "text-zinc-500 dark:text-zinc-400",
  success: "text-accent",
  error: "text-red-600 dark:text-red-400",
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "loading") return <SpinnerIcon className="size-4" />;
  if (variant === "success") return <CheckIcon className="size-4" />;
  return <XIcon className="size-4" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [clearTimer],
  );

  // A toast's timer is always cleared before a new one is armed, so an updated
  // toast can never be dismissed by the timer from its previous state.
  const arm = useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
    },
    [clearTimer, dismiss],
  );

  const notify = useCallback(
    ({ variant, message, duration = DEFAULT_DURATION }: ToastInput) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      setToasts((current) => [...current, { id, variant, message, duration }]);
      arm(id, duration);
      return id;
    },
    [arm],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, ...patch } : toast,
        ),
      );
      if (patch.duration !== undefined) arm(id, patch.duration);
    },
    [arm],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ notify, update, dismiss }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border bg-background p-3 shadow-lg ${VARIANT_BORDER[toast.variant]}`}
          >
            <span
              className={`mt-0.5 shrink-0 ${VARIANT_ICON_COLOR[toast.variant]}`}
            >
              <VariantIcon variant={toast.variant} />
            </span>

            <p className="flex-1 text-sm text-zinc-900 dark:text-zinc-50">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
