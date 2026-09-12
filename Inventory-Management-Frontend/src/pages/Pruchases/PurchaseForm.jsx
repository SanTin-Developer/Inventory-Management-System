import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { purchasesApi } from "../../services/service";
import { useAuth } from "../../contexts/AuthContext";

export default function PurchaseForm({
  purchase,
  suppliers,
  products,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const isEdit = Boolean(purchase);
  const [supplierId, setSupplierId] = useState(
    purchase?.supplier_id ?? suppliers[0]?.supplier_id ?? "",
  );
  const [status, setStatus] = useState(purchase?.status ?? "Pending");
  const [lines, setLines] = useState(() =>
    purchase?.details?.length
      ? purchase.details.map((d) => ({
          product_id: String(d.product_id),
          quantity: d.quantity,
          unit_cost: d.unit_cost,
        }))
      : [
          {
            product_id: products[0]?.product_id ?? "",
            quantity: 1,
            unit_cost: "",
          },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { product_id: products[0]?.product_id ?? "", quantity: 1, unit_cost: "" },
    ]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  };

  const total = lines.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.unit_cost || 0),
    0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Add at least one product line.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier_id: supplierId,
        user_id: purchase?.user_id ?? user.user_id,
        status,
        details: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
          unit_cost: Number(l.unit_cost),
        })),
      };
      if (isEdit) {
        await purchasesApi.update(purchase.purchase_id, payload);
      } else {
        await purchasesApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          (isEdit ? "Failed to update purchase." : "Failed to create purchase."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {isEdit ? "Edit Purchase" : "New Purchase"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[75vh] overflow-y-auto px-5 py-4"
        >
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Supplier
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">Products</p>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <Plus size={13} /> Add line
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-slate-100 p-2"
              >
                <select
                  value={line.product_id}
                  onChange={(e) => updateLine(i, "product_id", e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit cost"
                  value={line.unit_cost}
                  onChange={(e) => updateLine(i, "unit_cost", e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">
              Estimated total
            </span>
            <span className="text-sm font-semibold text-slate-900">
              ${total.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Final total is calculated by the database once saved.
          </p>

          <div className="mt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
