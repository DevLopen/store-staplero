import apiFetch from "./http";
import { Product, ProductLocation } from "@/types/product.types";

const base = "/products";

// ── Public endpoints ────────────────────────────────────────────────────────────

export const getProducts = (params?: { type?: "online" | "normal"; featured?: boolean }): Promise<{ products: Product[] }> => {
  const search = new URLSearchParams();
  if (params?.type) search.set("type", params.type);
  if (params?.featured) search.set("featured", "true");
  const qs = search.toString();
  return apiFetch(`${base}${qs ? `?${qs}` : ""}`);
};

export const getProductBySlug = (slug: string): Promise<{ product: Product; locations: ProductLocation[] }> =>
  apiFetch(`${base}/${slug}`);

// ── Admin endpoints ──────────────────────────────────────────────────────────────

export const adminGetProducts = (): Promise<{ products: Product[] }> =>
  apiFetch(`${base}/admin`);

export const adminGetProduct = (productId: string): Promise<Product> =>
  apiFetch(`${base}/admin/${productId}`);

export const adminCreateProduct = (data: Partial<Product>): Promise<Product> =>
  apiFetch(`${base}/admin`, { method: "POST", body: JSON.stringify(data) });

export const adminUpdateProduct = (productId: string, data: Partial<Product>): Promise<Product> =>
  apiFetch(`${base}/admin/${productId}`, { method: "PUT", body: JSON.stringify(data) });

export const adminDeleteProduct = (productId: string): Promise<void> =>
  apiFetch(`${base}/admin/${productId}`, { method: "DELETE" });

// ── Notify requests ──────────────────────────────────────────────────────────────

export const createNotifyRequest = (
  slug: string,
  data: { email: string; locationId?: string; locationCity?: string }
): Promise<{ success: boolean; alreadyExists?: boolean }> =>
  apiFetch(`${base}/${slug}/notify`, { method: "POST", body: JSON.stringify(data) });

export interface NotifyRequestItem {
  _id: string;
  email: string;
  productId: string;
  productTitle: string;
  locationId?: string;
  locationCity?: string;
  notified: boolean;
  createdAt: string;
}

export const adminGetNotifyRequests = (): Promise<{ requests: NotifyRequestItem[] }> =>
  apiFetch(`${base}/admin/notify-requests`);

export const adminMarkNotifyRequestDone = (id: string): Promise<NotifyRequestItem> =>
  apiFetch(`${base}/admin/notify-requests/${id}/notified`, { method: "PUT" });

export const adminDeleteNotifyRequest = (id: string): Promise<void> =>
  apiFetch(`${base}/admin/notify-requests/${id}`, { method: "DELETE" });
