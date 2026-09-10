import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr";

const payloadSchema = z.object({
  source: z.string().default("noa-web"),
  senderName: z.string().min(1),
  messageBody: z.string().min(1),
  timestamp: z.string(),
});

export type MakePayload = z.infer<typeof payloadSchema>;

/**
 * Sends the outgoing chat message to the Make.com scenario and returns the
 * assistant reply. Runs on the server so the browser never hits the webhook
 * directly (avoids CORS and hides the endpoint from the client bundle).
 */
export const sendMessageToMake = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });

      const raw = await response.text();

      if (!response.ok) {
        return {
          ok: false as const,
          reply: "לא הצלחתי להתחבר לשרת כרגע. נסה/י שוב בעוד רגע 🙏",
        };
      }

      let reply = raw.trim();
      try {
        const parsed = JSON.parse(raw) as { reply?: unknown; message?: unknown };
        if (typeof parsed?.reply === "string") reply = parsed.reply;
        else if (typeof parsed?.message === "string") reply = parsed.message;
      } catch {
        // Make can answer with plain text — keep the raw body in that case.
      }

      if (!reply || reply.toLowerCase() === "accepted") {
        reply = "קיבלתי! אני מטפלת בזה ואחזור אליך עם עדכון ✅";
      }

      return { ok: true as const, reply };
    } catch {
      return {
        ok: false as const,
        reply: "אירעה תקלה בשליחה. בדוק/י את החיבור לאינטרנט ונסה/י שוב.",
      };
    }
  });
