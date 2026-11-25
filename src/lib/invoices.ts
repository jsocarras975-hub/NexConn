// "Overdue" is computed from the due date, never stored as a status: no
// code writes an OVERDUE status, so a SENT invoice past its due date is
// overdue, and so is one already marked OVERDUE.
export function isOverdueInvoice(inv: { status: string; dueAt: Date | null }, now = new Date()): boolean {
  return inv.status === "OVERDUE" || (inv.status === "SENT" && inv.dueAt !== null && inv.dueAt.getTime() < now.getTime());
}
