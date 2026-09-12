import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const ICON_WRAP = {
  success: "bg-emerald-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-blue-500 text-white",
  warning: "bg-amber-500 text-white",
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
      actionLabel,
      onAction,
    } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [
        ...prev,
        { id, type, title, message, actionLabel, onAction },
      ]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (title, message, opts = {}) =>
      showToast({ type: "success", title, message, ...opts }),
    [showToast],
  );
  const error = useCallback(
    (title, message, opts = {}) =>
      showToast({ type: "error", title, message, duration: 6000, ...opts }),
    [showToast],
  );
  const info = useCallback(
    (title, message, opts = {}) =>
      showToast({ type: "info", title, message, ...opts }),
    [showToast],
  );
  const warning = useCallback(
    (title, message, opts = {}) =>
      showToast({ type: "warning", title, message, ...opts }),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, info, warning, dismiss }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 inset-x-4 z-[100] flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const { type, title, message, actionLabel, onAction } = toast;
  const Icon = ICONS[type] || Info;

  return (
    <div
      role="status"
      className="pointer-events-auto w-full rounded-xl bg-white border border-[#E5E7EB] shadow-lg p-4"
      style={{ animation: "toastIn 0.2s ease-out" }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ICON_WRAP[type]}`}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-body font-semibold text-[14px] text-[#10151F]">
            {title}
          </p>
          {message && (
            <p className="mt-0.5 font-body text-[13px] leading-relaxed text-[#6B7280]">
              {message}
            </p>
          )}
          {actionLabel && (
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => {
                  onAction?.();
                  onDismiss();
                }}
                className="font-body text-[13px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
              >
                {actionLabel}
              </button>
              <button
                onClick={onDismiss}
                className="font-body text-[13px] font-medium text-[#9CA3AF] hover:text-[#6B7280]"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 text-[#9CA3AF] hover:text-[#374151] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
