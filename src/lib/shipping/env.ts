/**
 * Server-only FlagShip / SmartShip configuration.
 * Token is sent as x-smartship-token (see https://docs.smartship.io/).
 */

export function getFlagshipApiBaseUrl(): string {
  const raw = process.env.FLAGSHIP_API_BASE_URL?.trim() || "https://api.smartship.io";
  return raw.replace(/\/$/, "");
}

/** SmartShip token — prefer FLAGSHIP_API_KEY; FLAGSHIP_API_SECRET supported as alias. */
export function getFlagshipToken(): string | null {
  const t =
    process.env.FLAGSHIP_API_KEY?.trim() ||
    process.env.FLAGSHIP_API_SECRET?.trim() ||
    process.env.FLAGSHIP_SMARTSHIP_TOKEN?.trim();
  return t || null;
}

export type ShipperProfile = {
  name: string;
  company: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

export function getShipperProfile(): ShipperProfile {
  return {
    name: process.env.SHIPPER_NAME?.trim() || "Shipper",
    company: process.env.SHIPPER_COMPANY?.trim() || "",
    phone: process.env.SHIPPER_PHONE?.trim() || "0000000000",
    email: process.env.SHIPPER_EMAIL?.trim() || "shipping@example.com",
    address1: process.env.SHIPPER_ADDRESS_1?.trim() || "",
    address2: process.env.SHIPPER_ADDRESS_2?.trim() || "",
    city: process.env.SHIPPER_CITY?.trim() || "",
    province: process.env.SHIPPER_PROVINCE?.trim() || "",
    postal_code: process.env.SHIPPER_POSTAL_CODE?.trim() || "",
    country: (process.env.SHIPPER_COUNTRY?.trim() || "CA").toUpperCase(),
  };
}
