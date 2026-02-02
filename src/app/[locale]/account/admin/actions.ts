"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient, createServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

type ProductInput = {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  active: boolean;
};

async function requireAdmin() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

export async function getAdminProducts() {
  await requireAdmin();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateProduct(input: ProductInput & { id: string }) {
  await requireAdmin();
  
  // Validate inputs
  if (!input.id || input.id.length > 100) {
    throw new Error("Invalid product ID");
  }
  if (!input.name || input.name.length > 200) {
    throw new Error("Invalid product name");
  }
  if (input.price < 0 || input.price > 1000000) {
    throw new Error("Price must be between 0 and 1,000,000");
  }
  if (input.stock < 0 || input.stock > 100000) {
    throw new Error("Stock must be between 0 and 100,000");
  }
  
  const supabase = createServerClient();
  const { id, ...rest } = input;
  const { error } = await supabase
    .from("products")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/[locale]/shop", "page");
  revalidatePath("/[locale]/account/admin", "page");
}

export async function createProduct(input: ProductInput) {
  await requireAdmin();
  
  // Validate inputs
  if (!input.name || input.name.length > 200) {
    throw new Error("Invalid product name");
  }
  if (input.price < 0 || input.price > 1000000) {
    throw new Error("Price must be between 0 and 1,000,000");
  }
  if (input.stock < 0 || input.stock > 100000) {
    throw new Error("Stock must be between 0 and 100,000");
  }
  
  const supabase = createServerClient();
  const id =
    input.id ??
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  
  if (!id || id.length > 100) {
    throw new Error("Invalid product ID");
  }
  
  const { error } = await supabase.from("products").insert({
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    image: input.image || "/images/hero-1.svg",
    stock: input.stock ?? 0,
    active: input.active ?? true,
  });
  if (error) throw error;
  revalidatePath("/[locale]/shop", "page");
  revalidatePath("/[locale]/account/admin", "page");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  
  // Validate input
  if (!id || id.length > 100) {
    throw new Error("Invalid product ID");
  }
  
  const supabase = createServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/[locale]/shop", "page");
  revalidatePath("/[locale]/account/admin", "page");
}
