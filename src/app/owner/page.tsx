import { redirect } from "next/navigation";

// The studio's /owner area maps to the N3xUs Konc3pt'z owner console.
// Coupons (the studio's owner-coupons flow) are not yet rebuilt here —
// the admin covers orders, products, finance, CRM and settings.
export default function Owner() {
  redirect("/admin");
}
