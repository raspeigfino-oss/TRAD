// src/services/telegram.service.ts

interface TelegramSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const autoSend = process.env.TELEGRAM_AUTO_SEND === "true";

  if (!autoSend || !token || !chatId) {
    return { success: false, error: "Telegram not configured or auto-send disabled" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    const data = await res.json() as { ok: boolean; result?: { message_id: number }; description?: string };
    if (data.ok && data.result) {
      return { success: true, messageId: String(data.result.message_id) };
    }
    return { success: false, error: data.description };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export function buildSignalMessage(code: string, rewardValue: number, expiresAt?: Date | null): string {
  const expiry = expiresAt
    ? `\n⏰ Expire le : ${expiresAt.toLocaleString("fr-FR")}`
    : "";
  return `🚀 <b>TRADION — Nouveau Signal</b>\n\n📡 Code : <code>${code}</code>\n💰 Gain : <b>${rewardValue}%</b>${expiry}\n\nCollez ce code dans votre dashboard TRADION pour recevoir votre gain.`;
}
