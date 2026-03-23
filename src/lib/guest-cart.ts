/**
 * Guest cart stored in localStorage. Used when the user is not logged in.
 * Run only on client (typeof window !== "undefined").
 */

const GUEST_CART_KEY = "ciavaglia_guest_cart";
const GUEST_CART_TTL_MS = 2 * 60 * 60 * 1000;

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
    return v as T;
  } catch {
    return fallback;
  }
}

type GuestCartStorage = {
  items: GuestCartItem[];
  updatedAt: number;
};

function normalizeGuestCartItems(value: unknown): GuestCartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (x): x is GuestCartItem =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as GuestCartItem).id === "string" &&
        typeof (x as GuestCartItem).product_id === "string" &&
        typeof (x as GuestCartItem).quantity === "number" &&
        typeof (x as GuestCartItem).price === "number"
    )
    .map((x) => ({
      ...x,
      title: x.title ?? null,
      image_url: x.image_url ?? null,
    }));
}

function readGuestCartStorage(): GuestCartStorage {
  if (typeof window === "undefined") return { items: [], updatedAt: Date.now() };
  const raw = localStorage.getItem(GUEST_CART_KEY);
  if (!raw) return { items: [], updatedAt: Date.now() };

  // Backward-compatible with legacy array-only storage.
  const parsed = safeParse<unknown>(raw, []);
  if (Array.isArray(parsed)) {
    return { items: normalizeGuestCartItems(parsed), updatedAt: Date.now() };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { items: [], updatedAt: Date.now() };
  }

  const obj = parsed as { items?: unknown; updatedAt?: unknown };
  const updatedAt =
    typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt)
      ? obj.updatedAt
      : Date.now();

  return {
    items: normalizeGuestCartItems(obj.items),
    updatedAt,
  };
}

function writeGuestCartStorage(items: GuestCartItem[]): void {
  if (typeof window === "undefined") return;
  const payload: GuestCartStorage = {
    items,
    updatedAt: Date.now(),
  };
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(payload));
}

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  const { items, updatedAt } = readGuestCartStorage();
  if (Date.now() - updatedAt > GUEST_CART_TTL_MS) {
    localStorage.removeItem(GUEST_CART_KEY);
    return [];
  }
  return items;
}

export function setGuestCart(items: GuestCartItem[]): void {
  writeGuestCartStorage(items);
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
