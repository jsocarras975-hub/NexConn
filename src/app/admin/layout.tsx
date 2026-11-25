import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Shared guard for every /admin page: the API routes enforce the role
// per-route (requireAdmin), and this layout enforces it once for the pages
// themselves, so a client who guesses an admin URL is bounced to login
// instead of seeing a half-rendered admin shell.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!["OWNER", "ADMIN"].includes(user.role)) redirect("/portal");
  return <>{children}</>;
}
