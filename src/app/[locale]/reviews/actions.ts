"use server";

import { createServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export type Review = {
  id: string;
  product_id: string | null;
  reviewer_name: string;
  rating: number;
  message: string | null;
  watch_purchased: string | null;
  approved: boolean;
  created_at: string;
};

export async function submitReview(data: {
  reviewer_name: string;
  rating: number;
  message?: string;
  product_id?: string;
  watch_purchased?: string;
}): Promise<{ success: boolean }> {
  if (!data.reviewer_name || data.reviewer_name.trim().length < 2) {
    throw new Error("Name is required (min 2 characters).");
  }
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("reviews").insert({
    reviewer_name: data.reviewer_name.trim().slice(0, 100),
    rating: data.rating,
    message: data.message?.trim().slice(0, 1000) || null,
    product_id: data.product_id || null,
    watch_purchased: data.watch_purchased?.trim().slice(0, 200) || null,
    approved: false,
  });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getApprovedReviews(productId?: string): Promise<Review[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("reviews")
    .select("id, product_id, reviewer_name, rating, message, watch_purchased, approved, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function getAdminReviews(): Promise<Review[]> {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user || !isAdmin(user.id)) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, reviewer_name, rating, message, watch_purchased, approved, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function approveReview(id: string): Promise<void> {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user || !isAdmin(user.id)) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

export async function disapproveReview(id: string): Promise<void> {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user || !isAdmin(user.id)) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const { error } = await supabase.from("reviews").update({ approved: false }).eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

export async function deleteReview(id: string): Promise<void> {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user || !isAdmin(user.id)) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}
