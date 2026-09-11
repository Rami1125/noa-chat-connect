import { sendChatMessage } from "@/lib/chat.functions";

export const DEFAULT_SENDER = "ראמי מסארווה (סדרן ראשי)";

/**
 * שולחת הודעה מהממשק אל וואטסאפ דרך Make ומחזירה את תשובת נועה.
 */
export async function sendMessageToWhatsApp(
  message: string,
  options?: { conversationSlug?: string; recipientPhone?: string; senderName?: string },
) {
  return sendChatMessage({
    data: {
      conversationSlug: options?.conversationSlug ?? "noa",
      senderName: options?.senderName ?? DEFAULT_SENDER,
      messageBody: message,
      ...(options?.recipientPhone ? { recipientPhone: options.recipientPhone } : {}),
    },
  });
}
