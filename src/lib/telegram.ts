// Telegram owner alerts via the studio bot (@N3xUsKonc3ptzBot).
// No-ops unless TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_ID are set.
// Never throws: an alert must never break the request that triggered it.
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Alerts are best-effort only.
  }
}

export function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  return currency.toLowerCase() === "usd" ? `$${amount}` : `${amount} ${currency.toUpperCase()}`;
}
