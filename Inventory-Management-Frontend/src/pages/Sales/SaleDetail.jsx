import { useEffect, useState } from "react";
import { X, Download, Loader2, Receipt } from "lucide-react";
import jsPDF from "jspdf";
import { salesApi } from "../../services/service";

const currency = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num)
    : "—";
};

function generateInvoicePdf(sale) {
  const doc = new jsPDF();
  const marginX = 15;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("INVOICE", marginX, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Invoice #: SAL-${String(sale.sale_id).padStart(6, "0")}`,
    195,
    y - 4,
    { align: "right" },
  );
  doc.text(
    `Date: ${new Date(sale.sale_date).toLocaleDateString()}`,
    195,
    y + 2,
    { align: "right" },
  );

  y += 15;
  doc.setDrawColor(230);
  doc.line(marginX, y, 195, y);
  y += 10;

  // Left column: Bill to
  const leftStartY = y;
  doc.setFont("helvetica", "bold");
  doc.text("Bill to", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(
    sale.customer?.customer_name ?? sale.customer_name ?? "Walk-in Customer",
    marginX,
    y,
  );
  if (sale.customer?.phone) {
    y += 5;
    doc.text(sale.customer.phone, marginX, y);
  }
  if (sale.customer?.email) {
    y += 5;
    doc.text(sale.customer.email, marginX, y);
  }
  const leftEndY = y;

  // Right column: Payment / Status / Served by — independent y counter, no overlap
  let rightY = leftStartY;
  doc.text(`Payment: ${sale.payment_method}`, 195, rightY, { align: "right" });
  rightY += 6;
  doc.text(`Status: ${sale.status}`, 195, rightY, { align: "right" });
  rightY += 6;
  doc.text(`Served by: ${sale.user?.name ?? "—"}`, 195, rightY, {
    align: "right",
  });

  y = Math.max(leftEndY, rightY) + 12;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(marginX, y, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Product", marginX + 2, y + 5.5);
  doc.text("Qty", 120, y + 5.5);
  doc.text("Unit price", 145, y + 5.5);
  doc.text("Line total", 193, y + 5.5, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  (sale.details ?? []).forEach((line) => {
    y += 8;
    const lineTotal = Number(line.quantity) * Number(line.unit_price);
    doc.text(
      line.product?.product_name ?? `Product #${line.product_id}`,
      marginX + 2,
      y,
    );
    doc.text(String(line.quantity), 120, y);
    doc.text(currency(line.unit_price), 145, y);
    doc.text(currency(lineTotal), 193, y, { align: "right" });
  });

  y += 10;
  doc.setDrawColor(230);
  doc.line(marginX, y, 195, y);
  y += 8;

  const subtotal = (sale.details ?? []).reduce(
    (sum, l) => sum + Number(l.quantity) * Number(l.unit_price),
    0,
  );
  const discount = Number(sale.discount_amount ?? 0);
  const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;

  doc.setFontSize(10);
  doc.text("Total before discount", marginX, y);
  doc.text(currency(subtotal), 193, y, { align: "right" });

  if (discount > 0) {
    y += 6;
    doc.text(`Discount (${discountPercent.toFixed(1)}%)`, marginX, y);
    doc.text(`-${currency(discount)}`, 193, y, { align: "right" });
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total after discount", marginX, y);
  doc.text(currency(sale.total_amount), 193, y, { align: "right" });

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for your business.", marginX, y);

  doc.save(`invoice-SAL-${String(sale.sale_id).padStart(6, "0")}.pdf`);
}

export default function SaleDetail({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    salesApi
      .get(saleId)
      .then((res) => setSale(res.data.data ?? res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [saleId]);

  // Guard: only compute once sale actually exists
  const subtotal = sale
    ? (sale.details ?? []).reduce(
        (sum, l) => sum + Number(l.quantity) * Number(l.unit_price),
        0,
      )
    : 0;
  const discount = sale ? Number(sale.discount_amount ?? 0) : 0;
  const discountPercent =
    sale && subtotal > 0 ? (discount / subtotal) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF3FE] text-[#2F5FEA]">
              <Receipt size={16} />
            </div>
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              Sale details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#2F5FEA]" />
          </div>
        ) : error || !sale ? (
          <div className="px-5 py-10 text-center font-body text-[13.5px] text-[#6B7280]">
            Couldn't load this sale.
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                    Customer
                  </div>
                  <div className="font-body text-[14px] text-[#10151F]">
                    {sale.customer?.customer_name ??
                      sale.customer_name ??
                      "Walk-in"}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                    Served by
                  </div>
                  <div className="font-body text-[14px] text-[#10151F]">
                    {sale.user?.name ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                    Date
                  </div>
                  <div className="font-body text-[14px] text-[#10151F]">
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                    Payment
                  </div>
                  <div className="font-body text-[14px] text-[#10151F]">
                    {sale.payment_method}
                  </div>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF] mb-2">
                  Items
                </p>
                <div className="rounded-lg border border-[#F0F1F3] overflow-hidden">
                  <table className="w-full font-body text-[13px]">
                    <thead>
                      <tr className="bg-[#F9FAFB] text-[#9CA3AF] text-[11px] uppercase font-mono">
                        <th className="px-3 py-2 text-left font-medium">
                          Product
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Price
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sale.details ?? []).map((line, i) => (
                        <tr key={i} className="border-t border-[#F0F1F3]">
                          <td className="px-3 py-2 text-[#10151F]">
                            {line.product?.product_name ??
                              `#${line.product_id}`}
                          </td>
                          <td className="px-3 py-2 text-right text-[#6B7280]">
                            {line.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-[#6B7280]">
                            {currency(line.unit_price)}
                          </td>
                          <td className="px-3 py-2 text-right text-[#10151F] font-medium">
                            {currency(
                              Number(line.quantity) * Number(line.unit_price),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg bg-[#F9FAFB] border border-[#F0F1F3] px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-body text-[13px] text-[#6B7280]">
                    Total before discount
                  </span>
                  <span className="font-body text-[13.5px] text-[#10151F]">
                    {currency(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[13px] text-[#6B7280]">
                      Discount ({discountPercent.toFixed(1)}%)
                    </span>
                    <span className="font-body text-[13.5px] text-[#22C55E]">
                      -{currency(discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E7EB]">
                  <span className="font-body text-[13px] font-medium text-[#6B7280]">
                    Total after discount
                  </span>
                  <span className="font-display font-semibold text-[16px] text-[#10151F]">
                    {currency(sale.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[#F0F1F3] px-5 py-4">
              <button
                onClick={onClose}
                className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
              >
                Close
              </button>
              <button
                onClick={() => generateInvoicePdf(sale)}
                className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 flex items-center gap-1.5 hover:bg-[#1E3FA6] transition"
              >
                <Download size={14} />
                Export invoice PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
