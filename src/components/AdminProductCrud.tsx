"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { PRODUCT_CATEGORIES } from "@/lib/pricing";

type FormState = {
  name: string;
  sku: string;
  category: string;
  setName: string;
  cardNumber: string;
  grade: string;
  baseOfferDollars: string;
  active: boolean;
};

const EMPTY: FormState = {
  name: "", sku: "", category: "Single Card", setName: "", cardNumber: "", grade: "",
  baseOfferDollars: "5.00", active: true,
};

function toForm(p: Product): FormState {
  return {
    name: p.name,
    sku: p.sku,
    category: p.category ?? "Single Card",
    setName: p.setName ?? "",
    cardNumber: p.cardNumber ?? "",
    grade: p.grade ?? "",
    baseOfferDollars: (p.baseOfferCents / 100).toFixed(2),
    active: p.active,
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminProductCrud({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  function openAdd() {
    setEditingId("new");
    setForm(EMPTY);
    setError(undefined);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm(toForm(p));
    setError(undefined);
  }

  function cancel() {
    setEditingId(null);
    setError(undefined);
  }

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Auto-generate SKU from name + set when adding
  function handleNameBlur() {
    if (editingId === "new" && !form.sku && form.name) {
      const parts = [form.name, form.setName, form.cardNumber].filter(Boolean);
      set("sku", slugify(parts.join("-")));
    }
  }

  async function save() {
    setSaving(true);
    setError(undefined);

    const baseOfferCents = Math.round(parseFloat(form.baseOfferDollars) * 100);
    if (isNaN(baseOfferCents) || baseOfferCents < 0) {
      setError("Base offer must be a valid dollar amount.");
      setSaving(false);
      return;
    }

    const body = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      setName: form.setName || null,
      cardNumber: form.cardNumber || null,
      grade: form.grade || null,
      baseOfferCents,
      active: form.active,
    };

    const isNew = editingId === "new";
    const url = isNew ? "/api/admin/products" : `/api/admin/products/${editingId}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      setSaving(false);
      return;
    }

    const saved: Product = data.product;
    setProducts((prev) =>
      isNew ? [...prev, saved] : prev.map((p) => (p.id === saved.id ? saved : p))
    );
    setEditingId(null);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? Products with existing orders cannot be deleted.")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Could not delete.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) setEditingId(null);
    router.refresh();
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    if (!res.ok) return;
    const { product: saved }: { product: Product } = await res.json();
    setProducts((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
    router.refresh();
  }

  return (
    <div className="card">
      <div className="row">
        <h2>Catalog pricing</h2>
        {editingId === null && (
          <button onClick={openAdd}>+ Add product</button>
        )}
      </div>

      {editingId !== null && (
        <div style={{ border: "1px solid #333", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{editingId === "new" ? "New product" : "Edit product"}</h3>

          {error && <p style={{ color: "#f87171", marginBottom: "0.75rem" }}>{error}</p>}

          <div className="grid">
            <label>
              Product name *
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Charizard ex, Scarlet & Violet Booster Box..."
              />
            </label>
            <label>
              Category *
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              SKU *
              <input
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="obsidian-flames-charizard-ex"
              />
            </label>
            <label>
              Set name
              <input
                value={form.setName}
                onChange={(e) => set("setName", e.target.value)}
                placeholder="Obsidian Flames"
              />
            </label>
            <label>
              Card #
              <input
                value={form.cardNumber}
                onChange={(e) => set("cardNumber", e.target.value)}
                placeholder="223/197"
              />
            </label>
            <label>
              Grade
              <input
                value={form.grade}
                onChange={(e) => set("grade", e.target.value)}
                placeholder="Raw NM"
              />
            </label>
            <label>
              Base offer price ($) *
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.baseOfferDollars}
                onChange={(e) => set("baseOfferDollars", e.target.value)}
              />
            </label>
          </div>

          <label className="row" style={{ gap: ".5rem", marginTop: ".5rem" }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Active (visible to sellers)
          </label>

          <div className="row" style={{ marginTop: "1rem", gap: ".5rem" }}>
            <button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save product"}
            </button>
            <button className="button secondary" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Card</th>
            <th>Base offer</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                No products yet — add one above.
              </td>
            </tr>
          )}
          {products.map((p) => (
            <tr key={p.id} style={{ opacity: p.active ? 1 : 0.45 }}>
              <td>
                <strong>{p.name}</strong>
                <br />
                <small className="muted">{p.category}</small>
                {(p.setName || p.cardNumber) && (
                  <>
                    <br />
                    <small>{[p.setName, p.cardNumber].filter(Boolean).join(" · ")}</small>
                  </>
                )}
                {p.grade && (
                  <>
                    <br />
                    <small className="muted">{p.grade}</small>
                  </>
                )}
              </td>
              <td>{formatMoney(p.baseOfferCents)}</td>
              <td>
                <button
                  className="button secondary"
                  style={{ padding: "2px 10px", fontSize: "0.75rem" }}
                  onClick={() => toggleActive(p)}
                >
                  {p.active ? "Active" : "Inactive"}
                </button>
              </td>
              <td>
                <div className="row" style={{ gap: ".5rem" }}>
                  <button className="button secondary" onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button
                    className="button secondary"
                    style={{ color: "#f87171" }}
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
