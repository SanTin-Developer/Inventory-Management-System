import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { purchasesApi } from "../../services/service";
import { Button } from "../../components/ui";

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  Received: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-red-700",
};

export default function PurchaseDetail({ purchaseId, onClose }) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await purchasesApi.get(purchaseId);
        // Support either { data: {...} } or a raw purchase object
        const data = res?.data ?? res;
        if (active) setPurchase(data);
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ?? "Failed to load purchase details.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [purchaseId]);

  const details = purchase?.details ?? [];

  const computedTotal = details.reduce((sum, d) => {
    const qty = Number(d.quantity ?? 0);
    const cost = Number(d.unit_cost ?? d.unit_price ?? 0);
    return sum + qty * cost;
  }, 0);

  const statusClass =
    STATUS_STYLES[purchase?.status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Purchase {purchase ? `#${purchase.purchase_id}` : ""}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {loading && (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading purchase details...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && purchase && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-medium text-slate-400">Supplier</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {purchase.supplier?.supplier_name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {purchase.supplier?.contact_person}
                  </p>
                  <p className="text-xs text-slate-500">
                    {purchase.supplier?.phone}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-medium text-slate-400">
                    Requested by
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {purchase.user?.name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {purchase.user?.role?.role_name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {purchase.user?.email}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Purchase date
                  </p>
                  <p className="text-sm text-slate-700">
                    {purchase.purchase_date?.slice(0, 10)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                >
                  {purchase.status}
                </span>
              </div>

              <p className="mb-2 text-xs font-medium text-slate-700">
                Products
              </p>

              {details.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  No line items available for this purchase.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs text-slate-500">
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Qty</th>
                        <th className="px-3 py-2 font-medium">Unit cost</th>
                        <th className="px-3 py-2 text-right font-medium">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d, i) => {
                        const qty = Number(d.quantity ?? 0);
                        const cost = Number(d.unit_cost ?? d.unit_price ?? 0);
                        return (
                          <tr
                            key={d.purchase_detail_id ?? i}
                            className="border-t border-slate-100"
                          >
                            <td className="px-3 py-2 text-slate-800">
                              {d.product?.product_name ??
                                d.product_name ??
                                `Product #${d.product_id}`}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{qty}</td>
                            <td className="px-3 py-2 text-slate-600">
                              ${cost.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-800">
                              ${(qty * cost).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">
                  Total
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  ${Number(purchase.total_amount ?? computedTotal).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
