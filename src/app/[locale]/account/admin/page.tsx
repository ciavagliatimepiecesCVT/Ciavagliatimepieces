"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  getAdminProducts,
  updateProduct,
  createProduct,
  deleteProduct,
} from "./actions";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number | null;
  active: boolean | null;
};

export default function AdminProductsPage() {
  const params = useParams<{ locale?: string | string[] }>();
  const router = useRouter();
  const locale = Array.isArray(params.locale) ? params.locale[0] : params.locale ?? "en";
  const isFr = locale === "fr";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<Partial<Product> & { stock?: number }>({});

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(`/${locale}/account/login`);
        return;
      }

      try {
        const data = await getAdminProducts();
        setProducts(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unauthorized");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [locale, router]);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      image: p.image ?? "",
      stock: p.stock ?? 0,
      active: p.active ?? true,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    setError(null);
    try {
      await updateProduct({
        id: editingId,
        name: formData.name ?? "",
        description: formData.description ?? "",
        price: Number(formData.price) ?? 0,
        image: formData.image ?? "",
        stock: Number(formData.stock) ?? 0,
        active: formData.active ?? true,
      });
      const data = await getAdminProducts();
      setProducts(data);
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleAdd = async () => {
    if (!formData.name) return;
    setError(null);
    try {
      await createProduct({
        name: formData.name,
        description: formData.description ?? "",
        price: Number(formData.price) ?? 0,
        image: formData.image ?? "/images/hero-1.svg",
        stock: Number(formData.stock) ?? 0,
        active: formData.active ?? true,
      });
      const data = await getAdminProducts();
      setProducts(data);
      setShowAdd(false);
      setFormData({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isFr ? "Supprimer ce produit ?" : "Delete this product?")) return;
    setError(null);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <section className="px-6">
        <div className="mx-auto max-w-6xl py-12">
          <p className="text-foreground/70">{isFr ? "Chargement..." : "Loading..."}</p>
        </div>
      </section>
    );
  }

  if (error && !products.length) {
    return (
      <section className="px-6">
        <div className="mx-auto max-w-6xl py-12">
          <p className="text-red-600">{error}</p>
          <a href={`/${locale}/account/manage`} className="mt-4 inline-block text-sm underline">
            {isFr ? "Retour au compte" : "Back to account"}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6">
      <div className="mx-auto max-w-6xl space-y-10 py-10">
        <ScrollReveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">Admin</p>
              <h1 className="mt-2 text-4xl">{isFr ? "Gestion des produits" : "Product management"}</h1>
              <p className="mt-2 text-foreground/70">
                {isFr ? "Modifiez les prix, le stock et les produits." : "Edit prices, stock, and products."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAdd(true);
                setFormData({
                  name: "",
                  description: "",
                  price: 0,
                  image: "/images/hero-1.svg",
                  stock: 0,
                  active: true,
                });
                setError(null);
              }}
              className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.3em] text-white"
            >
              {isFr ? "Nouveau produit" : "Add product"}
            </button>
          </div>
        </ScrollReveal>

        {error && products.length > 0 && (
          <p className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {showAdd && (
          <ScrollReveal>
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
              <h2 className="text-xl">{isFr ? "Nouveau produit" : "New product"}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {isFr ? "Nom" : "Name"}
                  </label>
                  <input
                    value={formData.name ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="mt-2 w-full rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {isFr ? "Prix ($)" : "Price ($)"}
                  </label>
                  <input
                    type="number"
                    value={formData.price ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {isFr ? "Description" : "Description"}
                  </label>
                  <input
                    value={formData.description ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="mt-2 w-full rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {isFr ? "Image (chemin)" : "Image (path)"}
                  </label>
                  <input
                    value={formData.image ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                    placeholder="/images/hero-1.svg"
                    className="mt-2 w-full rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {isFr ? "Stock" : "Stock"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, stock: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-full border border-foreground/20 bg-white px-4 py-2"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded-full bg-foreground px-6 py-2 text-xs uppercase tracking-[0.2em] text-white"
                >
                  {isFr ? "Créer" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-full border border-foreground/20 px-6 py-2 text-xs uppercase tracking-[0.2em]"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
              </div>
            </div>
          </ScrollReveal>
        )}

        <div className="space-y-6">
          {products.map((p) => (
            <ScrollReveal key={p.id}>
              <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(15,20,23,0.1)]">
                <div className="flex flex-wrap gap-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[16px] bg-foreground/5">
                    <Image
                      src={p.image ?? "/images/hero-1.svg"}
                      alt={p.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {editingId === p.id ? (
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                            Name
                          </label>
                          <input
                            value={formData.name ?? ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            value={formData.price ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
                            }
                            className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                            Description
                          </label>
                          <input
                            value={formData.description ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                            Stock
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formData.stock ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, stock: Number(e.target.value) }))
                            }
                            className="mt-1 w-full rounded-full border border-foreground/20 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id={`active-${p.id}`}
                            checked={formData.active ?? true}
                            onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                            className="h-4 w-4 rounded"
                          />
                          <label htmlFor={`active-${p.id}`} className="text-sm">
                            {isFr ? "Visible en boutique" : "Visible in shop"}
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSave}
                          className="rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                        >
                          {isFr ? "Enregistrer" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                        >
                          {isFr ? "Annuler" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold">{p.name}</h3>
                        <p className="mt-1 text-sm text-foreground/70">{p.description}</p>
                        <p className="mt-2 text-lg font-semibold">${Number(p.price).toLocaleString()}</p>
                        <p className="mt-1 text-xs text-foreground/60">
                          {isFr ? "Stock" : "Stock"}: {p.stock ?? 0}
                          {!p.active && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                              {isFr ? "Masqué" : "Hidden"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em]"
                        >
                          {isFr ? "Modifier" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-600"
                        >
                          {isFr ? "Supprimer" : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
