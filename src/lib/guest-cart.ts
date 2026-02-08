/**
 * Guest cart stored in localStorage. Used when the user is not logged in.
 * Run only on client (typeof window !== "undefined").
 */

const GUEST_CART_KEY = "ciavaglia_guest_cart";

export type GuestCartItem = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  title: string | null;
  image_url: string | null;
  configuration?: unknown;
};

function safeParse<T>(json: string, fallback: T): T {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(GUEST_CART_KEY);
  if (!raw) return [];
  const arr = safeParse<unknown[]>(raw, []);
  return arr.filter(
    (x): x is GuestCartItem =>
      typeof x === "object" &&
      x !== null &&
      typeof (x as GuestCartItem).id === "string" &&
      typeof (x as GuestCartItem).product_id === "string" &&
      typeof (x as GuestCartItem).quantity === "number" &&
      typeof (x as GuestCartItem).price === "number"
  ).map((x) => ({
    ...x,
    title: x.title ?? null,
    image_url: x.image_url ?? null,
  }));
}

export function setGuestCart(items: GuestCartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function configEqual(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function addGuestCartItem(
  item: Omit<GuestCartItem, "id">
): GuestCartItem[] {
  const cart = getGuestCart();
  const isCustom = item.product_id.startsWith("custom-");
  if (!isCustom) {
    const existing = cart.find(
      (i) => i.product_id === item.product_id && configEqual(i.configuration, item.configuration)
    );
    if (existing) {
      existing.quantity += item.quantity;
      setGuestCart(cart);
      return cart;
    }
  }
  const newItem: GuestCartItem = {
    ...item,
    id: `guest-${crypto.randomUUID()}`,
  };
  cart.push(newItem);
  setGuestCart(cart);
  return cart;
}

export function updateGuestCartQuantity(
  id: string,
  quantity: number
): GuestCartItem[] {
  const cart = getGuestCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return cart;
  if (quantity < 1) {
    setGuestCart(cart.filter((i) => i.id !== id));
    return cart.filter((i) => i.id !== id);
  }
  item.quantity = quantity;
  setGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(id: string): GuestCartItem[] {
  const cart = getGuestCart().filter((i) => i.id !== id);
  setGuestCart(cart);
  return cart;
}

export function getGuestCartCount(): number {
  return getGuestCart().reduce((sum, i) => sum + i.quantity, 0);
}
