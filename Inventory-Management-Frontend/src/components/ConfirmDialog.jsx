import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#141A24] shadow-xl overflow-hidden">
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger
                ? "bg-[#FEF3F2] text-[#EF4444]"
                : "bg-[#EFF3FE] text-[#2F5FEA]"
            }`}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="font-display font-semibold text-[15px] text-[#10151F] dark:text-white">
              {title}
            </h2>
            {message && (
              <p className="font-body text-[13.5px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2331] hover:text-[#374151] dark:hover:text-[#D1D5DB] transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[#F0F1F3] dark:border-[#1C2331] px-5 py-3.5 bg-[#F9FAFB] dark:bg-[#0F141D]">
          <button
            onClick={onCancel}
            className="font-body text-[13px] font-medium text-[#374151] dark:text-[#D1D5DB] bg-white dark:bg-[#141A24] border border-[#E5E7EB] dark:border-[#242B38] rounded-lg px-4 py-2 hover:bg-[#F3F4F6] dark:hover:bg-[#1C2331] transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`font-body text-[13px] font-medium text-white rounded-lg px-4 py-2 transition ${
              danger
                ? "bg-[#EF4444] hover:bg-[#DC2626]"
                : "bg-[#2F5FEA] hover:bg-[#1E3FA6]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
