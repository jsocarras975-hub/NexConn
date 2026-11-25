import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountProfile } from "@/components/account-profile";
import { DataControls } from "@/components/data-controls";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/portal/settings");

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-cyan-300">Customer portal</p>
        <h1 className="mt-2 text-3xl font-semibold">Account settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Keep your contact details current. Your password is required before changing your sign-in email.
        </p>
      </div>
      <AccountProfile initialName={user.name} initialEmail={user.email} role={user.role}/>
      <DataControls/>
    </main>
  );
}
