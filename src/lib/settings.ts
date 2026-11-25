import { prisma } from "@/lib/prisma";

// Business settings are the owner-editable knobs in the admin console.
// Only the settings that something actually reads are listed here —
// company_name and default_currency were saved but never read, so they were
// removed rather than left as dead controls.
export const BUSINESS_SETTING_KEYS = ["maintenance_notice", "support_email"] as const;
export type BusinessSettingKey = (typeof BUSINESS_SETTING_KEYS)[number];

export async function getBusinessSetting(key: BusinessSettingKey): Promise<string | null> {
  try {
    const row = await prisma.businessSetting.findUnique({ where: { key } });
    const value = row?.value?.trim() || null;
    return value;
  } catch {
    return null;
  }
}

export async function getBusinessSettings(): Promise<Record<BusinessSettingKey, string | null>> {
  const [maintenance_notice, support_email] = await Promise.all([
    getBusinessSetting("maintenance_notice"),
    getBusinessSetting("support_email"),
  ]);
  return { maintenance_notice, support_email };
}
