import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { productsApi, productService } from "../../services/service";
import api from "../../services/api";
import { extractPaginated } from "../../utils/extractPaginated";
import { useToast } from "../../components/Toastsystem";

const emptyForm = {
  category_id: "",
  product_name: "",
  product_code: "",
  unit_price: "",
  cost_price: "",
  quantity_in_stock: "",
  reorder_level: "",
  unit: "",
};

let categoriesCache = null;
let categoriesPromise = null;

function fetchCategoriesOnce() {
  if (categoriesCache) return Promise.resolve(categoriesCache);
  if (!categoriesPromise) {
    categoriesPromise = api
      .get("/categories", { params: { all: true } })
      .then((res) => {
        categoriesCache = extractPaginated(res).items ?? res.data.data;
        return categoriesCache;
      })
      .catch((err) => {
        categoriesPromise = null;
        throw err;
      });
  }
  return categoriesPromise;
}

export default function ProductForm({ open, productId, onClose, onSaved }) {
  const toast = useToast();
  const isEditing = !!productId;
  const isEdit = Boolean(productId);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setCategoriesLoading(true);
    fetchCategoriesOnce()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitError("");

    if (isEdit) {
      setLoading(true);
      productService
        .getProduct(productId)
        .then((p) => {
          setForm({
            category_id: p.category_id ?? "",
            product_name: p.product_name ?? "",
            product_code: p.product_code ?? "",
            unit_price: p.unit_price ?? "",
            cost_price: p.cost_price ?? "",
            quantity_in_stock: p.quantity_in_stock ?? "",
            reorder_level: p.reorder_level ?? "",
            unit: p.unit ?? "",
          });
        })
        .catch(() => setSubmitError("Couldn't load this product."))
        .finally(() => setLoading(false));
    } else {
      setForm(emptyForm);
    }
  }, [open, isEdit, productId]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.product_name.trim()) e.product_name = "Product name is required.";
    if (!form.product_code.trim()) e.product_code = "Product code is required.";
    if (!form.category_id) e.category_id = "Select a category.";
    if (form.unit_price === "" || isNaN(parseFloat(form.unit_price)))
      e.unit_price = "Enter a valid price.";
    if (form.cost_price === "" || isNaN(parseFloat(form.cost_price)))
      e.cost_price = "Enter a valid cost.";
    if (
      form.quantity_in_stock === "" ||
      isNaN(parseFloat(form.quantity_in_stock))
    )
      e.quantity_in_stock = "Enter a valid quantity.";
    if (form.reorder_level === "" || isNaN(parseFloat(form.reorder_level)))
      e.reorder_level = "Enter a valid reorder level.";
    if (!form.unit.trim()) e.unit = "Unit is required (e.g. pcs, kg).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError("");
    try {
      if (isEditing) {
        await productsApi.update(productId, form);
      } else {
        await productsApi.create(form);
      }
      toast.success(
        isEditing ? "Product updated" : "Product added",
        `"${form.product_name}" was ${isEditing ? "updated" : "added"} successfully.`,
      );
      onSaved(); // refresh the list in the parent
      onClose(); // close this modal
    } catch (err) {
      toast.error(
        isEditing ? "Failed to update product" : "Failed to add product",
        err?.response?.data?.message || "An error occurred. Please try again.",
      );
      setSubmitError(
        err?.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (name) =>
    `font-body w-full px-3 py-2.5 bg-white border rounded-lg text-[13.5px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition ${
      errors[name] ? "border-[#FDA29B]" : "border-[#E5E7EB]"
    }`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#10151F]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl border border-[#E5E7EB] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          .font-display { font-family: 'Space Grotesk', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'IBM Plex Mono', monospace; }
        `}</style>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F0F1F3] sticky top-0 bg-white z-10">
          <div>
            <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1">
              Inventory
            </div>
            <h2 className="font-display font-semibold text-[20px] text-[#10151F]">
              {isEdit ? "Edit product" : "Add product"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-[#2F5FEA]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {submitError && (
              <div className="font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Product name
                </label>
                <input
                  type="text"
                  value={form.product_name}
                  onChange={handleChange("product_name")}
                  placeholder="e.g. Bottled Water 500ml"
                  className={fieldClass("product_name")}
                />
                {errors.product_name && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.product_name}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Product code
                </label>
                <input
                  type="text"
                  value={form.product_code}
                  onChange={handleChange("product_code")}
                  placeholder="e.g. BEV-001"
                  className={fieldClass("product_code")}
                />
                {errors.product_code && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.product_code}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={handleChange("category_id")}
                  disabled={categoriesLoading}
                  className={fieldClass("category_id")}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "Select category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.category_id}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Cost price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost_price}
                  onChange={handleChange("cost_price")}
                  placeholder="0.00"
                  className={fieldClass("cost_price")}
                />
                {errors.cost_price && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.cost_price}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Unit price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.unit_price}
                  onChange={handleChange("unit_price")}
                  placeholder="0.00"
                  className={fieldClass("unit_price")}
                />
                {errors.unit_price && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.unit_price}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Quantity in stock
                </label>
                <input
                  type="number"
                  value={form.quantity_in_stock}
                  onChange={handleChange("quantity_in_stock")}
                  placeholder="0"
                  className={fieldClass("quantity_in_stock")}
                />
                {errors.quantity_in_stock && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.quantity_in_stock}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Reorder level
                </label>
                <input
                  type="number"
                  value={form.reorder_level}
                  onChange={handleChange("reorder_level")}
                  placeholder="0"
                  className={fieldClass("reorder_level")}
                />
                {errors.reorder_level && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.reorder_level}
                  </p>
                )}
              </div>

              <div>
                <label className="font-body text-[12.5px] font-medium text-[#374151] mb-1.5 block">
                  Unit
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={handleChange("unit")}
                  placeholder="e.g. pcs, kg, box"
                  className={fieldClass("unit")}
                />
                {errors.unit && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {errors.unit}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 sticky bottom-0 bg-white">
              <button
                type="submit"
                disabled={saving}
                className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? "Save changes" : "Add product"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-body text-[13px] font-medium text-[#6B7280] px-4 py-2.5 hover:text-[#374151] transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
