import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { productService } from "../../services/service";
import ProductForm from "./ProductForm";
import api from "../../services/api";

const COLORS = {
  danger: "#EF4444",
  signal: "#F4972B",
  success: "#22C55E",
};

const currency = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num)
    : "—";
};

function stockStatus(product) {
  const qty = parseFloat(product.quantity_in_stock) || 0;
  const reorder = parseFloat(product.reorder_level) || 0;
  if (qty <= 0)
    return { label: "Out of stock", color: COLORS.danger, bg: "#FEF3F2" };
  if (qty <= reorder)
    return { label: "Low stock", color: COLORS.signal, bg: "#FEF6EC" };
  return { label: "In stock", color: COLORS.success, bg: "#EFFBF3" };
}

function Field({ label, value }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.1em] text-[#9CA3AF] uppercase mb-1">
        {label}
      </div>
      <div className="font-body text-[14.5px] text-[#10151F]">{value}</div>
    </div>
  );
}

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    productService
      .getProduct(id)
      .then(setProduct)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (
      !window.confirm(`Delete "${product.product_name}"? This can't be undone.`)
    )
      return;
    try {
      await productService.deleteProduct(product.product_id);
      navigate("/products");
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete this product.");
    }
  };

  const openEditModal = (id) => {
    setEditingProductId(id);
    setModalOpen(true);
  };

  const handleModalSaved = () => {
    setModalOpen(false);
    productService.getProduct(id).then(setProduct);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-[#2F5FEA]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-body text-[13.5px] text-[#6B7280]">
          Couldn't load this product.
        </p>
        <Link
          to="/products"
          className="font-body text-[13px] text-[#2F5FEA] mt-2 inline-block"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const status = stockStatus(product);

  return (
    <div className="bg-[#F9FAFB] min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="flex items-start justify-between px-6 pt-8 pb-6">
        <div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 font-body text-[13px] text-[#6B7280] hover:text-[#2F5FEA] transition mb-4"
          >
            <ArrowLeft size={14} />
            Back to products
          </Link>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
            Inventory
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            {product.product_name}
          </h1>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium mt-2"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openEditModal(product.product_id)}
            className="font-body text-[13px] font-medium text-[#2F5FEA] bg-white border border-[#B6C6F7] rounded-lg px-3.5 py-2 flex items-center gap-1.5 hover:bg-[#EFF3FE] transition"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="font-body text-[13px] font-medium text-[#EF4444] bg-white border border-[#FDA29B] rounded-lg px-3.5 py-2 flex items-center gap-1.5 hover:bg-[#FEF3F2] transition"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <ProductForm
        open={modalOpen}
        productId={editingProductId}
        onClose={() => setModalOpen(false)}
        onSaved={handleModalSaved}
      />

      <div className="mx-6 bg-white rounded-xl border border-[#E5E7EB] p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6">
          <Field
            label="Product ID"
            value={product.display_id ?? product.product_id}
          />
          <Field label="Product code" value={product.product_code} />
          <Field
            label="Category"
            value={product.category?.category_name ?? "Uncategorized"}
          />
          <Field label="Cost price" value={currency(product.cost_price)} />
          <Field label="Unit price" value={currency(product.unit_price)} />
          <Field
            label="Quantity in stock"
            value={`${parseFloat(product.quantity_in_stock) || 0} ${product.unit}`}
          />
          <Field label="Reorder level" value={product.reorder_level} />
          <Field label="Unit" value={product.unit} />
          <Field
            label="Created"
            value={new Date(product.created_at).toLocaleDateString()}
          />
          <Field
            label="Last updated"
            value={new Date(product.updated_at).toLocaleDateString()}
          />
        </div>
      </div>
    </div>
  );
}
