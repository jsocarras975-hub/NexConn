// The ?next= parameter is honoured only when it is a same-origin path:
// it must start with "/" and not with "//" (protocol-relative) or a
// scheme. Anything else falls back to the portal.
export function safeNextParam(value: string | null): string {
  if (!value) return "/portal";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/portal";
  return value;
}
