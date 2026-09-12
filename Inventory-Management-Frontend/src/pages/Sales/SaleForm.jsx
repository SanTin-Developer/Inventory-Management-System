import { useState } from "react";
import { X, Plus, Trash2, ShoppingBag } from "lucide-react";
import { salesApi } from "../../services/service";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/Toastsystem";

function calculateDiscount(subtotal) {
  if (subtotal >= 500) return 50;
  if (subtotal >= 200) return 15;
  if (subtotal >= 100) return 5;
  return 0;
}

export default function SaleForm({
  sale,
  products,
  customers,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const isEditing = !!sale;

  const [customerId, setCustomerId] = useState(sale?.customer_id ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    sale?.payment_method ?? "Cash",
  );
  const [status, setStatus] = useState(sale?.status ?? "Completed");
  const [lines, setLines] = useState(
    sale?.details?.length
      ? sale.details.map((d) => ({
          product_id: d.product_id,
          quantity: d.quantity,
          unit_price: d.unit_price,
        }))
      : [
          {
            product_id: products[0]?.product_id ?? "",
            quantity: 1,
            unit_price: products[0]?.unit_price ?? "",
          },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addLine = () => {
    const firstProduct = products[0];
    setLines((prev) => [
      ...prev,
      {
        product_id: firstProduct?.product_id ?? "",
        quantity: 1,
        unit_price: firstProduct?.unit_price ?? "",
      },
    ]);
  };

  const removeLine = (index) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        if (field === "product_id") {
          const product = products.find(
            (p) => String(p.product_id) === String(value),
          );
          updated.unit_price = product?.unit_price ?? "";
        }
        return updated;
      }),
    );
  };

  const productStock = (id) =>
    products.find((p) => String(p.product_id) === String(id));

  // ── Totals & discount ──────────────────────────────
  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.unit_price || 0),
    0,
  );
  const discount = calculateDiscount(subtotal);
  const total = subtotal - discount;
  // ────────────────────────────────────────────────────

  const stockWarnings = lines
    .map((l) => {
      if (isEditing) return null;
      const product = productStock(l.product_id);
      if (!product) return null;
      const requested = Number(l.quantity || 0);
      const available = Number(product.quantity_in_stock);
      if (requested > available) {
        return `${product.product_name}: only ${available} in stock, but ${requested} requested.`;
      }
      return null;
    })
    .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (stockWarnings.length > 0) {
      setError(stockWarnings.join(" "));
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.user_id,
      customer_id: customerId || null,
      payment_method: paymentMethod,
      status,
      discount_amount: discount,
      total_amount: total,
      details: lines.map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
      })),
    };

    try {
      if (isEditing) {
        await salesApi.update(sale.sale_id, payload);
      } else {
        await salesApi.create(payload);
      }
      toast.success(
        isEditing ? "Sale updated" : "Sale created",
        `The sale was ${isEditing ? "updated" : "created"} successfully.`,
      );
      onSaved();
    } catch (err) {
      const message = err?.response?.data?.message ?? "Failed to save sale.";
      setError(message);
      toast.error(isEditing ? "Update failed" : "Create failed", message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "font-body w-full px-3 py-2 bg-[#F3F4F6] border border-transparent rounded-lg text-[13.5px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition";
  const labelClass =
    "block font-body font-medium text-[12.5px] text-[#374151] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
            {isEditing ? "Edit sale" : "New sale"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[75vh] overflow-y-auto px-5 py-4"
        >
          {error && (
            <div className="mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="mb-5 grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={inputClass}
              >
                <option value="">Walk-in customer</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputClass}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Payment">Mobile Payment</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                <option value="Completed">Completed</option>
                <option value="Refunded">Refunded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mb-2.5 flex items-center justify-between">
            <p className="font-mono text-[11px] tracking-[0.1em] text-[#8B92A3] uppercase">
              Products
            </p>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 font-body text-[12.5px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6] transition"
            >
              <Plus size={13} /> Add line
            </button>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E5E7EB] px-4 py-8 text-center">
              <ShoppingBag size={22} className="mx-auto text-[#D1D5DB] mb-2" />
              <p className="font-body text-[13px] text-[#9CA3AF]">
                No products available to sell yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lines.map((line, i) => {
                const product = productStock(line.product_id);
                const over =
                  !isEditing &&
                  product &&
                  Number(line.quantity || 0) >
                    Number(product.quantity_in_stock);
                return (
                  <div key={i}>
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E7EB] p-2">
                      <select
                        value={line.product_id}
                        onChange={(e) =>
                          updateLine(i, "product_id", e.target.value)
                        }
                        className="flex-1 font-body rounded-md border border-transparent bg-[#F3F4F6] px-2 py-1.5 text-[13px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
                      >
                        {products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.product_name} ({p.quantity_in_stock} in stock)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(i, "quantity", e.target.value)
                        }
                        className={`w-20 font-body rounded-md border px-2 py-1.5 text-[13px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition ${
                          over
                            ? "border-[#FDA29B] bg-[#FEF3F2]"
                            : "border-transparent bg-[#F3F4F6] focus:bg-white"
                        }`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit price"
                        value={line.unit_price}
                        readOnly
                        className="w-28 font-body rounded-md border border-transparent bg-[#F3F4F6] px-2 py-1.5 text-[13px] text-[#6B7280] cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                        className="p-1.5 rounded-md text-[#9CA3AF] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {over && (
                      <p className="mt-1 font-body text-[12px] text-[#EF4444]">
                        Only {product.quantity_in_stock} in stock — reduce
                        quantity.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Summary box: subtotal / discount / total ── */}
          <div className="mt-4 rounded-lg bg-[#F9FAFB] border border-[#F0F1F3] px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-body text-[13px] text-[#6B7280]">
                Subtotal
              </span>
              <span className="font-body text-[13.5px] text-[#10151F]">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] text-[#6B7280]">
                  Discount
                </span>
                <span className="font-body text-[13.5px] text-[#22C55E]">
                  -${discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E7EB]">
              <span className="font-body text-[13px] font-medium text-[#6B7280]">
                Total
              </span>
              <span className="font-display font-semibold text-[16px] text-[#10151F]">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || products.length === 0}
              className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Save changes" : "Create sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
