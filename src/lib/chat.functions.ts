import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr";

const payloadSchema = z.object({
  conversationSlug: z.string().min(1),
  senderName: z.string().min(1).default("ראמי מסארווה (סדרן ראשי)"),
  messageBody: z.string().min(1).max(4000),
  recipientPhone: z.string().max(40).optional(),
});

export type SendMessagePayload = z.infer<typeof payloadSchema>;

/**
 * שולחת הודעה יוצאת: שומרת אותה במסד הנתונים, משדרת ל-Make (וואטסאפ),
 * ושומרת את תשובת נועה כהודעה נכנסת. הכל בצד השרת.
 */
export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { askNoaBrain } = await import("./noa-brain.server");

    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("id, phone, name")
      .eq("slug", data.conversationSlug)
      .maybeSingle();

    if (convError || !conversation) {
      throw new Error("השיחה לא נמצאה");
    }

    const { data: outgoing, error: outError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        author: "me",
        sender_name: data.senderName,
        body: data.messageBody,
        status: "pending",
      })
      .select("id")
      .single();

    if (outError || !outgoing) throw new Error("שמירת ההודעה נכשלה");

    const recipient = data.recipientPhone ?? conversation.phone ?? "dispatch_group";

    let makeReply: string | null = null;
    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          source: "pwa_web_app",
          senderName: data.senderName,
          recipient,
          chat: data.conversationSlug,
          messageBody: data.messageBody,
          timestamp: Math.floor(Date.now() / 1000),
          isoTime: new Date().toISOString(),
        }),
      });

      const raw = (await response.text()).trim();
      if (response.ok && raw) {
        try {
          const parsed = JSON.parse(raw) as { reply?: unknown; message?: unknown };
          if (typeof parsed.reply === "string") makeReply = parsed.reply;
          else if (typeof parsed.message === "string") makeReply = parsed.message;
        } catch {
          makeReply = raw;
        }
      }
    } catch (error) {
      console.error("Make webhook failed", error);
    }

    if (makeReply && makeReply.toLowerCase() === "accepted") makeReply = null;

    const reply = makeReply ?? (await askNoaBrain(data.messageBody, data.senderName));

    await supabaseAdmin.from("messages").update({ status: "read" }).eq("id", outgoing.id);

    const { data: incoming } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        author: "noa",
        sender_name: "נועה AI",
        body: reply,
        status: "read",
      })
      .select("id")
      .single();

    await supabaseAdmin
      .from("conversations")
      .update({ last_message: reply, last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return {
      success: true as const,
      reply,
      outgoingId: outgoing.id,
      incomingId: incoming?.id ?? null,
    };
  });
