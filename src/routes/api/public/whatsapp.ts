import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const inboundSchema = z.object({
  senderPhone: z.string().min(1).max(40).optional(),
  senderName: z.string().min(1).max(120),
  message: z.string().min(1).max(4000),
  timestamp: z.union([z.number(), z.string()]).optional(),
  isGroup: z.boolean().optional(),
  chatId: z.string().max(80).optional(),
});

function slugFor(input: z.infer<typeof inboundSchema>) {
  if (input.chatId) return input.chatId;
  if (input.senderPhone) return `wa-${input.senderPhone.replace(/[^\d]/g, "")}`;
  return `wa-${input.senderName}`;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

export const Route = createFileRoute("/api/public/whatsapp")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),

      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ status: "invalid_json", success: false }, 400);
        }

        const parsed = inboundSchema.safeParse(raw);
        if (!parsed.success) {
          return json(
            { status: "invalid_payload", success: false, issues: parsed.error.issues },
            400,
          );
        }

        const input = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const slug = slugFor(input);
        const createdAt = (() => {
          const value = input.timestamp;
          if (typeof value === "number") return new Date(value * 1000).toISOString();
          if (typeof value === "string" && value) {
            const date = new Date(Number.isNaN(Number(value)) ? value : Number(value) * 1000);
            if (!Number.isNaN(date.getTime())) return date.toISOString();
          }
          return new Date().toISOString();
        })();

        const { data: existing } = await supabaseAdmin
          .from("conversations")
          .select("id, unread")
          .eq("slug", slug)
          .maybeSingle();

        let conversationId = existing?.id;

        if (!conversationId) {
          const { data: created, error } = await supabaseAdmin
            .from("conversations")
            .insert({
              slug,
              name: input.senderName,
              phone: input.senderPhone ?? null,
              is_group: input.isGroup ?? false,
              last_message: input.message,
              last_message_at: createdAt,
              unread: 1,
            })
            .select("id")
            .single();

          if (error || !created) {
            console.error("inbound conversation insert failed", error);
            return json({ status: "error", success: false }, 500);
          }
          conversationId = created.id;
        } else {
          await supabaseAdmin
            .from("conversations")
            .update({
              name: input.senderName,
              phone: input.senderPhone ?? null,
              last_message: input.message,
              last_message_at: createdAt,
              unread: (existing?.unread ?? 0) + 1,
            })
            .eq("id", conversationId);
        }

        const { error: messageError } = await supabaseAdmin.from("messages").insert({
          conversation_id: conversationId,
          author: "contact",
          sender_name: input.senderName,
          sender_phone: input.senderPhone ?? null,
          body: input.message,
          status: "delivered",
          created_at: createdAt,
        });

        if (messageError) {
          console.error("inbound message insert failed", messageError);
          return json({ status: "error", success: false }, 500);
        }

        return json({ status: "received", success: true });
      },
    },
  },
});
