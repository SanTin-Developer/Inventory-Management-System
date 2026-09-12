import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from "lucide-react";

const AlertContext = createContext(null);

const ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const ACCENTS = {
  error: {
    iconWrap: "bg-red-500/10 text-red-500",
    ring: "ring-red-500/20",
    confirmBtn: "bg-red-500 hover:bg-red-600 text-white",
  },
  warning: {
    iconWrap: "bg-amber-500/10 text-amber-600",
    ring: "ring-amber-500/20",
    confirmBtn: "bg-amber-400 hover:bg-amber-500 text-black",
  },
  success: {
    iconWrap: "bg-emerald-500/10 text-emerald-600",
    ring: "ring-emerald-500/20",
    confirmBtn: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  info: {
    iconWrap: "bg-blue-500/10 text-blue-600",
    ring: "ring-blue-500/20",
    confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white",
  },
};

let idCounter = 0;

export function AlertProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const close = useCallback((result) => {
    setDialog((current) => {
      if (current?.resolve) current.resolve(result);
      return null;
    });
  }, []);

  const alert = useCallback(
    ({ type = "info", title, message, okText = "OK" } = {}) => {
      return new Promise((resolve) => {
        setDialog({
          id: ++idCounter,
          mode: "alert",
          type,
          title,
          message,
          okText,
          resolve,
        });
      });
    },
    [],
  );

  const confirm = useCallback(
    ({
      type = "warning",
      title,
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
    } = {}) => {
      return new Promise((resolve) => {
        setDialog({
          id: ++idCounter,
          mode: "confirm",
          type,
          title,
          message,
          confirmText,
          cancelText,
          resolve,
        });
      });
    },
    [],
  );

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      {dialog && <AlertModal dialog={dialog} onClose={close} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within an <AlertProvider>");
  return ctx;
}

function AlertModal({ dialog, onClose }) {
  const { mode, type, title, message, okText, confirmText, cancelText } =
    dialog;
  const Icon = ICONS[type] || Info;
  const accent = ACCENTS[type] || ACCENTS.info;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget)
      onClose(mode === "confirm" ? false : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        className={`relative w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-2xl ring-1 ${accent.ring}`}
      >
        <button
          onClick={() => onClose(mode === "confirm" ? false : undefined)}
          className="absolute right-4 top-4 text-[#9CA3AF] hover:text-[#374151] transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent.iconWrap}`}
          >
            <Icon size={22} />
          </div>
          <div className="pt-1">
            <h2
              id="alert-modal-title"
              className="text-lg font-semibold text-[#10151F]"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {mode === "confirm" && (
            <button
              onClick={() => onClose(false)}
              className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            autoFocus
            onClick={() => onClose(mode === "confirm" ? true : undefined)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${accent.confirmBtn}`}
          >
            {mode === "confirm" ? confirmText : okText}
          </button>
        </div>
      </div>
    </div>
  );
}
